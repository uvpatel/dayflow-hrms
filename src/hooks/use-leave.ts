import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getPaginatedData } from "@/lib/api/client";
import type { LeaveRequest } from "@/db/schema/leave-requests";
import type { LeaveType } from "@/db/schema/leave-types";
import type { LeaveAllocation } from "@/db/schema/leave-allocations";
import {
  approvalKeys,
  attendanceKeys,
  dashboardKeys,
  leaveKeys,
  notificationKeys,
} from "@/lib/query-keys";

export { leaveKeys } from "@/lib/query-keys";

export interface LeaveRequestFilterParams {
  page?: number;
  limit?: number;
  offset?: number;
  employeeId?: number;
  status?: string;
}

export interface MyTimeOffData {
  allocations: LeaveAllocation[];
  requests: LeaveRequest[];
}

export function useMyTimeOff() {
  return useQuery({
    queryKey: leaveKeys.mine(),
    queryFn: async () => {
      const res = await apiClient<MyTimeOffData | LeaveRequest[]>(
        "/api/v1/me/time-off"
      );
      if (Array.isArray(res.data)) {
        return { allocations: [], requests: res.data };
      }
      return res.data ?? { allocations: [], requests: [] };
    },
  });
}

/** Time-off history for one employee, authorized by the server per actor. */
export function useEmployeeTimeOff(
  employeeId: number,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: leaveKeys.employeeTimeOff(employeeId),
    queryFn: async () => {
      const res = await apiClient<MyTimeOffData>(
        `/api/v1/employees/${employeeId}/time-off`,
      );
      return res.data ?? { allocations: [], requests: [] };
    },
    enabled: Boolean(employeeId) && options?.enabled !== false,
  });
}

export function useLeaveRequests(params?: LeaveRequestFilterParams) {
  return useQuery({
    queryKey: leaveKeys.requests(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.offset) searchParams.set("offset", params.offset.toString());
      if (params?.employeeId) searchParams.set("employeeId", params.employeeId.toString());
      if (params?.status) searchParams.set("status", params.status);

      const qs = searchParams.toString();
      const res = await apiClient<
        LeaveRequest[] | { items: LeaveRequest[]; total: number }
      >(
        `/api/v1/leave-requests${qs ? `?${qs}` : ""}`
      );
      return getPaginatedData(res);
    },
  });
}

export function useMyLeaveRequests() {
  return useQuery({
    queryKey: leaveKeys.myRequests(),
    queryFn: async () => {
      const res = await apiClient<MyTimeOffData | LeaveRequest[]>(
        "/api/v1/me/time-off"
      );
      return Array.isArray(res.data) ? res.data : res.data?.requests ?? [];
    },
  });
}

export function useLeaveTypes() {
  return useQuery({
    queryKey: leaveKeys.types(),
    queryFn: async () => {
      const res = await apiClient<LeaveType[]>("/api/v1/leave-types");
      return res.data ?? [];
    },
  });
}

export function useLeaveAllocations(employeeId?: number) {
  return useQuery({
    queryKey: leaveKeys.balances(employeeId),
    queryFn: async () => {
      const qs = employeeId ? `?employeeId=${employeeId}` : "";
      const res = await apiClient<LeaveAllocation[]>(`/api/v1/leave-allocations${qs}`);
      return res.data ?? [];
    },
  });
}

export function useSubmitLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      leaveType: string;
      startDate: string;
      endDate: string;
      reason?: string;
      employeeId?: number;
      unit?: "full_day" | "half_day";
    }) => {
      const res = await apiClient<LeaveRequest>("/api/v1/leave-requests", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: leaveKeys.all }),
        queryClient.invalidateQueries({ queryKey: approvalKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
      ]);
    },
  });
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient<LeaveRequest>(`/api/v1/leave-requests/${id}/approve`, {
        method: "POST",
      });
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: leaveKeys.all }),
        queryClient.invalidateQueries({ queryKey: approvalKeys.all }),
        queryClient.invalidateQueries({ queryKey: attendanceKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
      ]);
    },
  });
}

export function useRejectLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await apiClient<LeaveRequest>(`/api/v1/leave-requests/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: leaveKeys.all }),
        queryClient.invalidateQueries({ queryKey: approvalKeys.all }),
        queryClient.invalidateQueries({ queryKey: attendanceKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
      ]);
    },
  });
}
