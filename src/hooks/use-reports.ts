import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export interface DashboardReportData {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  pendingApprovals: number;
  attendanceTrend: { date: string; present: number; absent: number; leave: number }[];
  departmentDistribution: { department: string; count: number }[];
  recentActivities: { id: number; action: string; description: string | null; createdAt: string }[];
}

export interface AttendanceReportData {
  summary: { totalLogs: number; onTime: number; late: number; halfDay: number };
  dailyBreakdown: { date: string; present: number; late: number; absent: number }[];
}

export interface LeaveReportData {
  summary: { totalRequests: number; pending: number; approved: number; rejected: number };
  byType: { type: string; count: number; days: number }[];
}

export interface PayrollReportData {
  summary: { totalDisbursed: number; activePeriods: number; payslipsGenerated: number };
  costByDepartment: { department: string; totalPay: number }[];
}

export const reportKeys = {
  all: ["reports"] as const,
  dashboard: () => [...reportKeys.all, "dashboard"] as const,
  attendance: (range?: string) => [...reportKeys.all, "attendance", range] as const,
  leave: (range?: string) => [...reportKeys.all, "leave", range] as const,
  payroll: (range?: string) => [...reportKeys.all, "payroll", range] as const,
};

export function useDashboardReports() {
  return useQuery({
    queryKey: reportKeys.dashboard(),
    queryFn: async () => {
      const res = await apiClient<DashboardReportData>("/api/v1/reports/dashboard");
      return res.data;
    },
    staleTime: 1000 * 60, // 1 min
  });
}

export function useAttendanceReports(range?: string) {
  return useQuery({
    queryKey: reportKeys.attendance(range),
    queryFn: async () => {
      const qs = range ? `?range=${range}` : "";
      const res = await apiClient<AttendanceReportData>(`/api/v1/reports/attendance${qs}`);
      return res.data;
    },
  });
}

export function useLeaveReports(range?: string) {
  return useQuery({
    queryKey: reportKeys.leave(range),
    queryFn: async () => {
      const qs = range ? `?range=${range}` : "";
      const res = await apiClient<LeaveReportData>(`/api/v1/reports/leave${qs}`);
      return res.data;
    },
  });
}

export function usePayrollReports(range?: string) {
  return useQuery({
    queryKey: reportKeys.payroll(range),
    queryFn: async () => {
      const qs = range ? `?range=${range}` : "";
      const res = await apiClient<PayrollReportData>(`/api/v1/reports/payroll${qs}`);
      return res.data;
    },
  });
}
