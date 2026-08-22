import { employeeRepository } from "./employee.repository";
import { NotFoundError, ConflictError } from "@/lib/api/errors";
import { logActivity } from "@/lib/audit/logger";
import { AuthContext } from "@/lib/auth/session";
import { z } from "zod";
import { createEmployeeSchema, updateEmployeeSchema } from "./employee.schemas";

export class EmployeeService {
  async listEmployees(limit = 20, offset = 0, search?: string) {
    const [items, total] = await Promise.all([
      employeeRepository.findEmployees(limit, offset, search),
      employeeRepository.countEmployees(search),
    ]);
    return { items, total };
  }

  async getEmployee(id: number) {
    const employee = await employeeRepository.findEmployeeWithRelations(id);
    if (!employee) {
      throw new NotFoundError(`Employee with ID ${id} not found`, "EMPLOYEE_NOT_FOUND");
    }
    return employee;
  }

  async createEmployee(data: z.infer<typeof createEmployeeSchema>) {
    // Check if email is already taken
    const existing = await employeeRepository.findEmployeeByEmail(data.email);
    if (existing) {
      throw new ConflictError(`An employee with email ${data.email} already exists`);
    }

    const employee = await employeeRepository.createEmployee({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
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

  async updateEmployee(id: number, data: z.infer<typeof updateEmployeeSchema>) {
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

  async updateMe(authContext: AuthContext, data: z.infer<typeof updateEmployeeSchema>) {
    if (!authContext.employee?.id) {
      throw new NotFoundError("No employee profile is linked to your user account", "EMPLOYEE_NOT_FOUND");
    }

    return await this.updateEmployee(authContext.employee.id, data);
  }
}

export const employeeService = new EmployeeService();
