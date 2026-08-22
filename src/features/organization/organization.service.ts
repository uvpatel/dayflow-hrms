import { organizationRepository } from "./organization.repository";
import { NotFoundError } from "@/lib/api/errors";
import { logActivity } from "@/lib/audit/logger";
import {
  NewOrganization,
  NewDepartment,
  NewDesignation,
  NewLocation,
  NewHoliday,
  NewWorkSchedule,
} from "./organization.types";

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
  async listDepartments(limit = 50, offset = 0, search?: string) {
    return await organizationRepository.findDepartments(limit, offset, search);
  }

  async getDepartment(id: number) {
    const dept = await organizationRepository.findDepartmentById(id);
    if (!dept) throw new NotFoundError(`Department with ID ${id} not found`, "DEPARTMENT_NOT_FOUND");
    return dept;
  }

  async createDepartment(data: NewDepartment) {
    const created = await organizationRepository.createDepartment(data);
    await logActivity({
      action: "DEPARTMENT_CREATED",
      description: `Created department ${created.name}`,
    });
    return created;
  }

  async updateDepartment(id: number, data: Partial<NewDepartment>) {
    await this.getDepartment(id);
    const updated = await organizationRepository.updateDepartment(id, data);
    await logActivity({
      action: "DEPARTMENT_UPDATED",
      description: `Updated department ${id}`,
    });
    return updated!;
  }

  async deleteDepartment(id: number) {
    await this.getDepartment(id);
    const deleted = await organizationRepository.deleteDepartment(id);
    await logActivity({
      action: "DEPARTMENT_DELETED",
      description: `Deleted department ${id}`,
    });
    return deleted!;
  }

  // Designations
  async listDesignations(limit = 50, offset = 0, search?: string) {
    return await organizationRepository.findDesignations(limit, offset, search);
  }

  async getDesignation(id: number) {
    const des = await organizationRepository.findDesignationById(id);
    if (!des) throw new NotFoundError(`Designation with ID ${id} not found`, "DESIGNATION_NOT_FOUND");
    return des;
  }

  async createDesignation(data: NewDesignation) {
    const created = await organizationRepository.createDesignation(data);
    await logActivity({
      action: "DESIGNATION_CREATED",
      description: `Created designation ${created.name}`,
    });
    return created;
  }

  async updateDesignation(id: number, data: Partial<NewDesignation>) {
    await this.getDesignation(id);
    const updated = await organizationRepository.updateDesignation(id, data);
    await logActivity({
      action: "DESIGNATION_UPDATED",
      description: `Updated designation ${id}`,
    });
    return updated!;
  }

  async deleteDesignation(id: number) {
    await this.getDesignation(id);
    const deleted = await organizationRepository.deleteDesignation(id);
    await logActivity({
      action: "DESIGNATION_DELETED",
      description: `Deleted designation ${id}`,
    });
    return deleted!;
  }

  // Locations
  async listLocations(limit = 50, offset = 0, search?: string) {
    return await organizationRepository.findLocations(limit, offset, search);
  }

  async getLocation(id: number) {
    const loc = await organizationRepository.findLocationById(id);
    if (!loc) throw new NotFoundError(`Location with ID ${id} not found`, "LOCATION_NOT_FOUND");
    return loc;
  }

  async createLocation(data: NewLocation) {
    const created = await organizationRepository.createLocation(data);
    await logActivity({
      action: "LOCATION_CREATED",
      description: `Created location ${created.name}`,
    });
    return created;
  }

  async updateLocation(id: number, data: Partial<NewLocation>) {
    await this.getLocation(id);
    const updated = await organizationRepository.updateLocation(id, data);
    await logActivity({
      action: "LOCATION_UPDATED",
      description: `Updated location ${id}`,
    });
    return updated!;
  }

  async deleteLocation(id: number) {
    await this.getLocation(id);
    const deleted = await organizationRepository.deleteLocation(id);
    await logActivity({
      action: "LOCATION_DELETED",
      description: `Deleted location ${id}`,
    });
    return deleted!;
  }

  // Holidays
  async listHolidays(limit = 50, offset = 0, search?: string) {
    return await organizationRepository.findHolidays(limit, offset, search);
  }

  async getHoliday(id: number) {
    const hol = await organizationRepository.findHolidayById(id);
    if (!hol) throw new NotFoundError(`Holiday with ID ${id} not found`, "HOLIDAY_NOT_FOUND");
    return hol;
  }

  async createHoliday(data: NewHoliday) {
    const created = await organizationRepository.createHoliday(data);
    await logActivity({
      action: "HOLIDAY_CREATED",
      description: `Created holiday ${created.name}`,
    });
    return created;
  }

  async updateHoliday(id: number, data: Partial<NewHoliday>) {
    await this.getHoliday(id);
    const updated = await organizationRepository.updateHoliday(id, data);
    await logActivity({
      action: "HOLIDAY_UPDATED",
      description: `Updated holiday ${id}`,
    });
    return updated!;
  }

  async deleteHoliday(id: number) {
    await this.getHoliday(id);
    const deleted = await organizationRepository.deleteHoliday(id);
    await logActivity({
      action: "HOLIDAY_DELETED",
      description: `Deleted holiday ${id}`,
    });
    return deleted!;
  }

  // Work Schedules
  async listWorkSchedules(limit = 50, offset = 0, employeeId?: number) {
    return await organizationRepository.findWorkSchedules(limit, offset, employeeId);
  }

  async getWorkSchedule(id: number) {
    const sched = await organizationRepository.findWorkScheduleById(id);
    if (!sched) throw new NotFoundError(`Work schedule with ID ${id} not found`, "SCHEDULE_NOT_FOUND");
    return sched;
  }

  async createWorkSchedule(data: NewWorkSchedule) {
    const created = await organizationRepository.createWorkSchedule(data);
    await logActivity({
      action: "WORK_SCHEDULE_CREATED",
      description: `Created schedule ${created.scheduleName} for employee #${created.employeeId}`,
    });
    return created;
  }

  async updateWorkSchedule(id: number, data: Partial<NewWorkSchedule>) {
    await this.getWorkSchedule(id);
    const updated = await organizationRepository.updateWorkSchedule(id, data);
    await logActivity({
      action: "WORK_SCHEDULE_UPDATED",
      description: `Updated schedule ${id}`,
    });
    return updated!;
  }

  async deleteWorkSchedule(id: number) {
    await this.getWorkSchedule(id);
    const deleted = await organizationRepository.deleteWorkSchedule(id);
    await logActivity({
      action: "WORK_SCHEDULE_DELETED",
      description: `Deleted schedule ${id}`,
    });
    return deleted!;
  }
}

export const organizationService = new OrganizationService();
