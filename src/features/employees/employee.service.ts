import { employeeRepository } from "./employee.repository";
import {
  AuthorizationError,
  BusinessRuleError,
  NotFoundError,
  ConflictError,
} from "@/lib/api/errors";
import { logActivity } from "@/lib/audit/logger";
import { AuthContext } from "@/lib/auth/session";
import { z } from "zod";
import { createEmployeeSchema, updateEmployeeSchema } from "./employee.schemas";
import { validateManagerAssignment } from "./employee.domain";
import type { NewEmployee } from "@/db/schema/employees";

export interface EmployeeListFilters {
  departmentId?: number;
  status?: string;
}

export class EmployeeService {
  async listEmployees(
    limit = 20,
    offset = 0,
    search?: string,
    scope?: Parameters<typeof employeeRepository.findEmployees>[3],
  ) {
    const [items, total] = await Promise.all([
      employeeRepository.findEmployees(limit, offset, search, scope),
      employeeRepository.countEmployees(search, scope),
    ]);
    return { items, total };
  }

  async listEmployeesForActor(
    authContext: AuthContext,
    limit = 20,
    offset = 0,
    search?: string,
    filters: EmployeeListFilters = {},
  ) {
    if (!authContext.employee?.id) {
      throw new NotFoundError(
        "No employee profile is linked to your user account",
        "EMPLOYEE_NOT_FOUND",
      );
    }

    const base = {
      organizationId: authContext.organizationId,
      departmentId: filters.departmentId,
      status: filters.status,
    };

    if (authContext.role === "admin" || authContext.role === "hr") {
      return this.listEmployees(limit, offset, search, base);
    }
    if (authContext.role === "manager") {
      const directReports = await employeeRepository.findDirectReports(
        authContext.employee.id,
        authContext.organizationId,
      );
      return this.listEmployees(limit, offset, search, {
        ...base,
        employeeIds: [authContext.employee.id, ...directReports.map((item) => item.id)],
      });
    }

    return this.listEmployees(limit, offset, search, {
      ...base,
      employeeIds: [authContext.employee.id],
    });
  }

  async getEmployee(id: number) {
    const employee = await employeeRepository.findEmployeeWithRelations(id);
    if (!employee) {
      throw new NotFoundError(`Employee with ID ${id} not found`, "EMPLOYEE_NOT_FOUND");
    }
    return employee;
  }

  async assertCanReadEmployee(authContext: AuthContext, id: number) {
    const employee = await employeeRepository.findEmployeeById(id);
    if (!employee || employee.organizationId !== authContext.organizationId) {
      throw new NotFoundError(`Employee with ID ${id} not found`, "EMPLOYEE_NOT_FOUND");
    }

    const isSelf = authContext.employee?.id === id;
    const canReadOrganization = authContext.role === "admin" || authContext.role === "hr";
    const isDirectReport =
      authContext.role === "manager" && employee.managerId === authContext.employee?.id;
    if (!isSelf && !canReadOrganization && !isDirectReport) {
      throw new AuthorizationError("You can only access yourself or an assigned direct report");
    }
    return employee;
  }

  async getEmployeeForActor(authContext: AuthContext, id: number) {
    await this.assertCanReadEmployee(authContext, id);
    return this.getEmployee(id);
  }

  async getDirectReports(authContext: AuthContext) {
    if (!authContext.employee?.id) {
      throw new NotFoundError("No employee profile is linked to your user account", "EMPLOYEE_NOT_FOUND");
    }
    if (authContext.role !== "manager" && authContext.role !== "hr" && authContext.role !== "admin") {
      throw new AuthorizationError("Only managers, HR, and administrators can view a team");
    }
    return employeeRepository.findDirectReports(
      authContext.employee.id,
      authContext.organizationId,
    );
  }

  async getDirectReportsForManager(authContext: AuthContext, managerId: number) {
    const manager = await employeeRepository.findEmployeeById(managerId);
    if (!manager || manager.organizationId !== authContext.organizationId) {
      throw new NotFoundError(`Manager with ID ${managerId} not found`, "EMPLOYEE_NOT_FOUND");
    }
    const isSelf = authContext.employee?.id === managerId;
    if (!isSelf && authContext.role !== "hr" && authContext.role !== "admin") {
      throw new AuthorizationError("Managers can only view their own direct reports");
    }
    if (manager.role !== "manager") {
      throw new BusinessRuleError(`Employee #${managerId} is not a manager`);
    }
    return employeeRepository.findDirectReports(managerId, authContext.organizationId);
  }

  async assignManager(
    authContext: AuthContext,
    employeeId: number,
    managerId: number | null,
  ) {
    if (authContext.role !== "admin" && authContext.role !== "hr") {
      throw new AuthorizationError("Only HR or administrators can assign reporting managers");
    }

    const employee = await employeeRepository.findEmployeeById(employeeId);
    if (!employee || employee.organizationId !== authContext.organizationId) {
      throw new NotFoundError(`Employee with ID ${employeeId} not found`, "EMPLOYEE_NOT_FOUND");
    }

    if (managerId === null) {
      const updated = await employeeRepository.updateEmployee(employeeId, { managerId: null });
      await logActivity({
        action: "EMPLOYEE_MANAGER_REMOVED",
        description: `Removed reporting manager from employee #${employeeId}`,
      });
      return updated!;
    }

    const manager = await employeeRepository.findEmployeeById(managerId);
    if (!manager) {
      throw new NotFoundError(`Manager with ID ${managerId} not found`, "EMPLOYEE_NOT_FOUND");
    }

    const ancestors = await employeeRepository.getManagerAncestorIds(managerId);
    try {
      validateManagerAssignment(employee, manager, ancestors);
    } catch (error) {
      throw new BusinessRuleError(
        error instanceof Error ? error.message : "Invalid manager assignment",
      );
    }

    const updated = await employeeRepository.updateEmployee(employeeId, { managerId });
    await logActivity({
      action: "EMPLOYEE_MANAGER_ASSIGNED",
      description: `Assigned manager #${managerId} to employee #${employeeId}`,
    });
    return updated!;
  }

  async createEmployee(
    data: z.infer<typeof createEmployeeSchema>,
    organizationId?: number,
  ) {
    // Check if email is already taken
    const existing = await employeeRepository.findEmployeeByEmail(data.email);
    if (existing) {
      throw new ConflictError(`An employee with email ${data.email} already exists`);
    }

    const employee = await employeeRepository.createEmployee({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      organizationId: organizationId ?? null,
      phoneNumber: data.phoneNumber ?? null,
      employeeNumber: data.employeeNumber ?? null,
      departmentId: data.departmentId ?? null,
      designationId: data.designationId ?? null,
      managerId: data.managerId ?? null,
      locationId: data.locationId ?? null,
      workScheduleId: data.workScheduleId ?? null,
      role: data.role,
      employmentStatus: data.employmentStatus,
      employmentType: data.employmentType,
      joiningDate: data.joiningDate ?? null,
    });

    if (data.address) {
      await employeeRepository.createAddress({
        employeeId: employee.id,
        addressLine1: data.address.addressLine1,
        addressLine2: data.address.addressLine2 ?? null,
        city: data.address.city,
        state: data.address.state,
        postalCode: data.address.postalCode,
        country: data.address.country,
      });
    }

    if (data.emergencyContact) {
      await employeeRepository.createEmergencyContact({
        employeeId: employee.id,
        name: data.emergencyContact.name,
        relationship: data.emergencyContact.relationship,
        phoneNumber: data.emergencyContact.phoneNumber,
      });
    }

    if (data.document) {
      await employeeRepository.createDocument({
        employeeId: employee.id,
        documentType: data.document.documentType,
        documentUrl: data.document.documentUrl,
      });
    }

    await logActivity({
      action: "EMPLOYEE_CREATED",
      description: `Created employee ${employee.firstName} ${employee.lastName} (${employee.email})`,
    });

    return await this.getEmployee(employee.id);
  }

  async createEmployeeForActor(
    authContext: AuthContext,
    data: z.infer<typeof createEmployeeSchema>,
  ) {
    if (authContext.role !== "admin" && authContext.role !== "hr") {
      throw new AuthorizationError("Only HR or administrators can create employees");
    }
    if (data.role === "admin" && authContext.role !== "admin") {
      throw new AuthorizationError("Only administrators can create an admin employee");
    }
    if (!authContext.organizationId) {
      throw new BusinessRuleError("An organization is required to create an employee");
    }

    if (data.managerId) {
      const manager = await employeeRepository.findEmployeeById(data.managerId);
      if (!manager) {
        throw new NotFoundError(`Manager with ID ${data.managerId} not found`, "EMPLOYEE_NOT_FOUND");
      }
      try {
        validateManagerAssignment(
          {
            id: -1,
            organizationId: authContext.organizationId,
            role: data.role,
            employmentStatus: data.employmentStatus,
          },
          manager,
          [],
        );
      } catch (error) {
        throw new BusinessRuleError(
          error instanceof Error ? error.message : "Invalid manager assignment",
        );
      }
    }

    return this.createEmployee(data, authContext.organizationId);
  }

  async updateEmployee(id: number, data: Partial<NewEmployee>) {
    const existing = await employeeRepository.findEmployeeById(id);
    if (!existing) {
      throw new NotFoundError(`Employee with ID ${id} not found`, "EMPLOYEE_NOT_FOUND");
    }

    if (data.email && data.email !== existing.email) {
      const emailTaken = await employeeRepository.findEmployeeByEmail(data.email);
      if (emailTaken) {
        throw new ConflictError(`Email ${data.email} is already in use by another employee`);
      }
    }

    const updated = await employeeRepository.updateEmployee(id, data);

    await logActivity({
      action: "EMPLOYEE_UPDATED",
      description: `Updated employee profile for ID ${id}`,
    });

    return updated!;
  }

  async updateEmployeeForActor(
    authContext: AuthContext,
    id: number,
    data: z.infer<typeof updateEmployeeSchema>,
  ) {
    if (authContext.role !== "admin" && authContext.role !== "hr") {
      throw new AuthorizationError("Only HR or administrators can update employment details");
    }

    const existing = await employeeRepository.findEmployeeById(id);
    if (
      !existing ||
      authContext.organizationId == null ||
      existing.organizationId !== authContext.organizationId
    ) {
      throw new NotFoundError(`Employee with ID ${id} not found`, "EMPLOYEE_NOT_FOUND");
    }

    if (data.role !== undefined && authContext.role !== "admin") {
      throw new AuthorizationError("Only administrators can change employee roles");
    }

    const { managerId, ...employeeData } = data;
    let updated = existing;
    if (Object.keys(employeeData).length > 0) {
      updated = await this.updateEmployee(id, employeeData);
    }
    if (managerId !== undefined) {
      updated = await this.assignManager(authContext, id, managerId);
    }
    return updated;
  }

  async deleteEmployee(id: number) {
    const existing = await employeeRepository.findEmployeeById(id);
    if (!existing) {
      throw new NotFoundError(`Employee with ID ${id} not found`, "EMPLOYEE_NOT_FOUND");
    }

    const deleted = await employeeRepository.deleteEmployee(id);

    await logActivity({
      action: "EMPLOYEE_DELETED",
      description: `Deleted employee ${existing.firstName} ${existing.lastName} (#${id})`,
    });

    return deleted!;
  }

  async getMe(authContext: AuthContext) {
    let employeeProfile = null;
    if (authContext.employee?.id) {
      employeeProfile = await employeeRepository.findEmployeeWithRelations(authContext.employee.id);
    }

    return {
      user: authContext.user,
      employee: employeeProfile,
    };
  }

  async updateMe(
    authContext: AuthContext,
    data: { phoneNumber: string | null },
  ) {
    if (!authContext.employee?.id) {
      throw new NotFoundError("No employee profile is linked to your user account", "EMPLOYEE_NOT_FOUND");
    }

    return await this.updateEmployee(authContext.employee.id, {
      phoneNumber: data.phoneNumber,
    });
  }
}

export const employeeService = new EmployeeService();
