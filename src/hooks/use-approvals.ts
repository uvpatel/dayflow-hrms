import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getPaginatedData } from "@/lib/api/client";
import type { ApprovalRequest } from "@/db/schema/approval-requests";
import {
  approvalKeys,
  attendanceKeys,
  dashboardKeys,
  leaveKeys,
  notificationKeys,
} from "@/lib/query-keys";

export { approvalKeys } from "@/lib/query-keys";

export interface ApprovalsFilterParams {
  page?: number;
  limit?: number;
  offset?: number;
  status?: string;
  approverId?: number;
}

export function useApprovals(params?: ApprovalsFilterParams) {
  return useQuery({
    queryKey: approvalKeys.list(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.offset) searchParams.set("offset", params.offset.toString());
      if (params?.status) searchParams.set("status", params.status);
      if (params?.approverId) searchParams.set("approverId", params.approverId.toString());

      const qs = searchParams.toString();
      const res = await apiClient<
        ApprovalRequest[] | { items: ApprovalRequest[]; total: number }
      >(
        `/api/v1/approvals${qs ? `?${qs}` : ""}`
      );
      return getPaginatedData(res);
    },
  });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient<ApprovalRequest>(`/api/v1/approvals/${id}/approve`, {
        method: "POST",
      });
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: approvalKeys.all }),
        queryClient.invalidateQueries({ queryKey: leaveKeys.all }),
        queryClient.invalidateQueries({ queryKey: attendanceKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
      ]);
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await apiClient<ApprovalRequest>(`/api/v1/approvals/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: approvalKeys.all }),
        queryClient.invalidateQueries({ queryKey: leaveKeys.all }),
        queryClient.invalidateQueries({ queryKey: attendanceKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
      ]);
    },
  });
}
