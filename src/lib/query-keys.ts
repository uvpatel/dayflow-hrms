export type QueryFilters = object | undefined;

export const dashboardKeys = {
  all: ["dashboard"] as const,
  byRole: (role?: string) => [...dashboardKeys.all, role ?? "employee"] as const,
};

export const employeeKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeKeys.all, "list"] as const,
  list: (filters?: QueryFilters) => [...employeeKeys.lists(), filters] as const,
  details: () => [...employeeKeys.all, "detail"] as const,
  detail: (employeeId: number) => [...employeeKeys.details(), employeeId] as const,
};

export const teamKeys = {
  all: ["teams"] as const,
  mine: () => [...teamKeys.all, "me"] as const,
  byManager: (managerId?: number | string) =>
    [...teamKeys.all, "manager", managerId ?? "me"] as const,
};

export const attendanceKeys = {
  all: ["attendance"] as const,
  today: () => [...attendanceKeys.all, "today"] as const,
  lists: () => [...attendanceKeys.all, "list"] as const,
  list: (filters?: QueryFilters) => [...attendanceKeys.lists(), filters] as const,
  employee: (employeeId: number) =>
    [...attendanceKeys.all, "employee", employeeId] as const,
  myHistory: () => [...attendanceKeys.all, "me", "history"] as const,
  correctionLists: () => [...attendanceKeys.all, "corrections"] as const,
  corrections: (filters?: QueryFilters) =>
    [...attendanceKeys.correctionLists(), filters] as const,
};

export const leaveKeys = {
  all: ["leave"] as const,
  mine: () => [...leaveKeys.all, "me"] as const,
  requests: (filters?: QueryFilters) =>
    [...leaveKeys.all, "requests", filters] as const,
  myRequests: () => [...leaveKeys.mine(), "requests"] as const,
  employeeTimeOff: (employeeId: number) =>
    [...leaveKeys.all, "employee", employeeId, "time-off"] as const,
  types: () => [...leaveKeys.all, "types"] as const,
  balances: (employeeId?: number) =>
    [...leaveKeys.all, "balances", employeeId ?? "me"] as const,
};

export const approvalKeys = {
  all: ["approvals"] as const,
  lists: () => [...approvalKeys.all, "list"] as const,
  list: (filters?: QueryFilters) => [...approvalKeys.lists(), filters] as const,
};

export const payrollKeys = {
  all: ["payroll"] as const,
  periods: (filters?: QueryFilters) =>
    [...payrollKeys.all, "periods", filters] as const,
  structures: () => [...payrollKeys.all, "structures"] as const,
  payslips: (filters?: QueryFilters) =>
    [...payrollKeys.all, "payslips", filters] as const,
  myPayslips: () => [...payrollKeys.all, "me", "payslips"] as const,
  employeePayslips: (employeeId: number) =>
    [...payrollKeys.all, "employee", employeeId, "payslips"] as const,
};

export const notificationKeys = {
  all: ["notifications"] as const,
};

export const reportKeys = {
  all: ["reports"] as const,
  attendance: (range?: string) => [...reportKeys.all, "attendance", range] as const,
  leave: (range?: string) => [...reportKeys.all, "leave", range] as const,
  payroll: (range?: string) => [...reportKeys.all, "payroll", range] as const,
};
