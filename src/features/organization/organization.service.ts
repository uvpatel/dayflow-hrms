import { organizationRepository } from "./organization.repository";
import { NotFoundError } from "@/lib/api/errors";
import { logActivity } from "@/lib/audit/logger";
import { employeeRepository } from "@/features/employees/employee.repository";
import {
  NewOrganization,
  NewDepartment,
  NewDesignation,
  NewLocation,
  NewHoliday,
  NewWorkSchedule,
} from "./organization.types";

type DepartmentInput = Omit<NewDepartment, "organizationId">;
type DesignationInput = Omit<NewDesignation, "organizationId">;
type LocationInput = Omit<NewLocation, "organizationId">;
type HolidayInput = Omit<NewHoliday, "organizationId">;
type WorkScheduleUpdate = Partial<Omit<NewWorkSchedule, "employeeId">>;

export class OrganizationService {
  // Organizations
  async listOrganizations(limit = 20, offset = 0, search?: string) {
    return await organizationRepository.findOrganizations(limit, offset, search);
  }

  async getOrganization(id: number) {
    const org = await organizationRepository.findOrganizationById(id);
    if (!org) throw new NotFoundError(`Organization with ID ${id} not found`);
    return org;
  }

  async createOrganization(data: NewOrganization) {
    const created = await organizationRepository.createOrganization(data);
    await logActivity({
      action: "ORGANIZATION_CREATED",
      description: `Created organization ${created.name}`,
    });
    return created;
  }

  async updateOrganization(id: number, data: Partial<NewOrganization>) {
    await this.getOrganization(id);
    const updated = await organizationRepository.updateOrganization(id, data);
    await logActivity({
      action: "ORGANIZATION_UPDATED",
      description: `Updated organization ${id}`,
    });
    return updated!;
  }

  // Departments
  async listDepartments(organizationId: number, limit = 50, offset = 0, search?: string) {
    return await organizationRepository.findDepartments(organizationId, limit, offset, search);
  }

  async getDepartment(organizationId: number, id: number) {
    const dept = await organizationRepository.findDepartmentById(organizationId, id);
    if (!dept) throw new NotFoundError(`Department with ID ${id} not found`, "DEPARTMENT_NOT_FOUND");
    return dept;
  }

  async createDepartment(organizationId: number, data: DepartmentInput) {
    await this.assertEmployeeInOrganization(organizationId, data.managerId);
    const created = await organizationRepository.createDepartment(organizationId, data);
    await logActivity({
      action: "DEPARTMENT_CREATED",
      description: `Created department ${created.name}`,
    });
    return created;
  }

  async updateDepartment(organizationId: number, id: number, data: Partial<DepartmentInput>) {
    await this.getDepartment(organizationId, id);
    await this.assertEmployeeInOrganization(organizationId, data.managerId);
    const updated = await organizationRepository.updateDepartment(organizationId, id, data);
    if (!updated) {
      throw new NotFoundError(`Department with ID ${id} not found`, "DEPARTMENT_NOT_FOUND");
    }
    await logActivity({
      action: "DEPARTMENT_UPDATED",
      description: `Updated department ${id}`,
    });
    return updated;
  }

  async deleteDepartment(organizationId: number, id: number) {
    await this.getDepartment(organizationId, id);
    const deleted = await organizationRepository.deleteDepartment(organizationId, id);
    if (!deleted) {
      throw new NotFoundError(`Department with ID ${id} not found`, "DEPARTMENT_NOT_FOUND");
    }
    await logActivity({
      action: "DEPARTMENT_DELETED",
      description: `Deleted department ${id}`,
    });
    return deleted;
  }

  // Designations
  async listDesignations(organizationId: number, limit = 50, offset = 0, search?: string) {
    return await organizationRepository.findDesignations(organizationId, limit, offset, search);
  }

  async getDesignation(organizationId: number, id: number) {
    const des = await organizationRepository.findDesignationById(organizationId, id);
    if (!des) throw new NotFoundError(`Designation with ID ${id} not found`, "DESIGNATION_NOT_FOUND");
    return des;
  }

  async createDesignation(organizationId: number, data: DesignationInput) {
    if (data.departmentId != null) {
      await this.getDepartment(organizationId, data.departmentId);
    }
    const created = await organizationRepository.createDesignation(organizationId, data);
    await logActivity({
      action: "DESIGNATION_CREATED",
      description: `Created designation ${created.name}`,
    });
    return created;
  }

  async updateDesignation(
    organizationId: number,
    id: number,
    data: Partial<DesignationInput>,
  ) {
    await this.getDesignation(organizationId, id);
    if (data.departmentId != null) {
      await this.getDepartment(organizationId, data.departmentId);
    }
    const updated = await organizationRepository.updateDesignation(organizationId, id, data);
    if (!updated) {
      throw new NotFoundError(`Designation with ID ${id} not found`, "DESIGNATION_NOT_FOUND");
    }
    await logActivity({
      action: "DESIGNATION_UPDATED",
      description: `Updated designation ${id}`,
    });
    return updated;
  }

  async deleteDesignation(organizationId: number, id: number) {
    await this.getDesignation(organizationId, id);
    const deleted = await organizationRepository.deleteDesignation(organizationId, id);
    if (!deleted) {
      throw new NotFoundError(`Designation with ID ${id} not found`, "DESIGNATION_NOT_FOUND");
    }
    await logActivity({
      action: "DESIGNATION_DELETED",
      description: `Deleted designation ${id}`,
    });
    return deleted;
  }

  // Locations
  async listLocations(organizationId: number, limit = 50, offset = 0, search?: string) {
    return await organizationRepository.findLocations(organizationId, limit, offset, search);
  }

  async getLocation(organizationId: number, id: number) {
    const loc = await organizationRepository.findLocationById(organizationId, id);
    if (!loc) throw new NotFoundError(`Location with ID ${id} not found`, "LOCATION_NOT_FOUND");
    return loc;
  }

  async createLocation(organizationId: number, data: LocationInput) {
    const created = await organizationRepository.createLocation(organizationId, data);
    await logActivity({
      action: "LOCATION_CREATED",
      description: `Created location ${created.name}`,
    });
    return created;
  }

  async updateLocation(organizationId: number, id: number, data: Partial<LocationInput>) {
    await this.getLocation(organizationId, id);
    const updated = await organizationRepository.updateLocation(organizationId, id, data);
    if (!updated) {
      throw new NotFoundError(`Location with ID ${id} not found`, "LOCATION_NOT_FOUND");
    }
    await logActivity({
      action: "LOCATION_UPDATED",
      description: `Updated location ${id}`,
    });
    return updated;
  }

  async deleteLocation(organizationId: number, id: number) {
    await this.getLocation(organizationId, id);
    const deleted = await organizationRepository.deleteLocation(organizationId, id);
    if (!deleted) {
      throw new NotFoundError(`Location with ID ${id} not found`, "LOCATION_NOT_FOUND");
    }
    await logActivity({
      action: "LOCATION_DELETED",
      description: `Deleted location ${id}`,
    });
    return deleted;
  }

  // Holidays
  async listHolidays(organizationId: number, limit = 50, offset = 0, search?: string) {
    return await organizationRepository.findHolidays(organizationId, limit, offset, search);
  }

  async getHoliday(organizationId: number, id: number) {
    const hol = await organizationRepository.findHolidayById(organizationId, id);
    if (!hol) throw new NotFoundError(`Holiday with ID ${id} not found`, "HOLIDAY_NOT_FOUND");
    return hol;
  }

  async createHoliday(organizationId: number, data: HolidayInput) {
    const created = await organizationRepository.createHoliday(organizationId, data);
    await logActivity({
      action: "HOLIDAY_CREATED",
      description: `Created holiday ${created.name}`,
    });
    return created;
  }

  async updateHoliday(organizationId: number, id: number, data: Partial<HolidayInput>) {
    await this.getHoliday(organizationId, id);
    const updated = await organizationRepository.updateHoliday(organizationId, id, data);
    if (!updated) {
      throw new NotFoundError(`Holiday with ID ${id} not found`, "HOLIDAY_NOT_FOUND");
    }
    await logActivity({
      action: "HOLIDAY_UPDATED",
      description: `Updated holiday ${id}`,
    });
    return updated;
  }

  async deleteHoliday(organizationId: number, id: number) {
    await this.getHoliday(organizationId, id);
    const deleted = await organizationRepository.deleteHoliday(organizationId, id);
    if (!deleted) {
      throw new NotFoundError(`Holiday with ID ${id} not found`, "HOLIDAY_NOT_FOUND");
    }
    await logActivity({
      action: "HOLIDAY_DELETED",
      description: `Deleted holiday ${id}`,
    });
    return deleted;
  }

  // Work Schedules
  async listWorkSchedules(
    organizationId: number,
    limit = 50,
    offset = 0,
    employeeIds?: number[],
  ) {
    return await organizationRepository.findWorkSchedules(
      organizationId,
      limit,
      offset,
      employeeIds,
    );
  }

  async getWorkSchedule(organizationId: number, id: number) {
    const sched = await organizationRepository.findWorkScheduleById(organizationId, id);
    if (!sched) throw new NotFoundError(`Work schedule with ID ${id} not found`, "SCHEDULE_NOT_FOUND");
    return sched;
  }

  async createWorkSchedule(organizationId: number, data: NewWorkSchedule) {
    await this.assertEmployeeInOrganization(organizationId, data.employeeId);
    const created = await organizationRepository.createWorkSchedule(organizationId, data);
    if (!created) {
      throw new NotFoundError(
        `Employee with ID ${data.employeeId} not found`,
        "EMPLOYEE_NOT_FOUND",
      );
    }
    await logActivity({
      action: "WORK_SCHEDULE_CREATED",
      description: `Created schedule ${created.scheduleName} for employee #${created.employeeId}`,
    });
    return created;
  }

  async updateWorkSchedule(organizationId: number, id: number, data: WorkScheduleUpdate) {
    await this.getWorkSchedule(organizationId, id);
    const updated = await organizationRepository.updateWorkSchedule(organizationId, id, data);
    if (!updated) {
      throw new NotFoundError(`Work schedule with ID ${id} not found`, "SCHEDULE_NOT_FOUND");
    }
    await logActivity({
      action: "WORK_SCHEDULE_UPDATED",
      description: `Updated schedule ${id}`,
    });
    return updated;
  }

  async deleteWorkSchedule(organizationId: number, id: number) {
    await this.getWorkSchedule(organizationId, id);
    const deleted = await organizationRepository.deleteWorkSchedule(organizationId, id);
    if (!deleted) {
      throw new NotFoundError(`Work schedule with ID ${id} not found`, "SCHEDULE_NOT_FOUND");
    }
    await logActivity({
      action: "WORK_SCHEDULE_DELETED",
      description: `Deleted schedule ${id}`,
    });
    return deleted;
  }

  private async assertEmployeeInOrganization(
    organizationId: number,
    employeeId: number | null | undefined,
  ) {
    if (employeeId == null) return;

    const employee = await employeeRepository.findEmployeeById(employeeId);
    if (!employee || employee.organizationId !== organizationId) {
      throw new NotFoundError(`Employee with ID ${employeeId} not found`, "EMPLOYEE_NOT_FOUND");
    }
  }
}

export const organizationService = new OrganizationService();
