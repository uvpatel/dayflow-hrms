import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { LeaveRequest } from "@/db/schema/leave-requests";
import type { LeaveType } from "@/db/schema/leave-types";
import type { LeaveAllocation } from "@/db/schema/leave-allocations";

export interface LeaveRequestFilterParams {
  limit?: number;
  offset?: number;
  employeeId?: number;
  status?: string;
}

export const leaveKeys = {
  all: ["leave"] as const,
  requests: (params?: LeaveRequestFilterParams) => [...leaveKeys.all, "requests", params] as const,
  myRequests: () => [...leaveKeys.all, "me", "requests"] as const,
  types: () => [...leaveKeys.all, "types"] as const,
  allocations: (employeeId?: number) => [...leaveKeys.all, "allocations", employeeId] as const,
};

export function useLeaveRequests(params?: LeaveRequestFilterParams) {
  return useQuery({
    queryKey: leaveKeys.requests(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.offset) searchParams.set("offset", params.offset.toString());
      if (params?.employeeId) searchParams.set("employeeId", params.employeeId.toString());
      if (params?.status) searchParams.set("status", params.status);

      const qs = searchParams.toString();
      const res = await apiClient<{ items: LeaveRequest[]; total: number }>(
        `/api/v1/leave-requests${qs ? `?${qs}` : ""}`
      );
      return res.data ?? { items: [], total: 0 };
    },
  });
}

export function useMyLeaveRequests() {
  return useQuery({
    queryKey: leaveKeys.myRequests(),
    queryFn: async () => {
      const res = await apiClient<LeaveRequest[]>("/api/v1/me/time-off");
      return res.data ?? [];
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
    queryKey: leaveKeys.allocations(employeeId),
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
    }) => {
      const res = await apiClient<LeaveRequest>("/api/v1/leave-requests", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.all });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.all });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.all });
    },
  });
}
