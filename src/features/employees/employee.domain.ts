export interface ManagerAssignmentSubject {
  id: number;
  organizationId: number | null;
  role: string;
  employmentStatus: string;
}

export function validateManagerAssignment(
  employee: ManagerAssignmentSubject,
  manager: ManagerAssignmentSubject,
  managerAncestorIds: readonly number[],
): void {
  if (employee.id === manager.id) {
    throw new Error("An employee cannot manage themselves");
  }
  if (
    employee.organizationId === null ||
    manager.organizationId !== employee.organizationId
  ) {
    throw new Error("Manager must belong to the same organization");
  }
  if (manager.role !== "manager") {
    throw new Error("Reporting manager must have the manager role");
  }
  if (manager.employmentStatus !== "active") {
    throw new Error("Reporting manager must be active");
  }
  if (managerAncestorIds.includes(employee.id)) {
    throw new Error("Manager assignment would create a reporting cycle");
  }
}
