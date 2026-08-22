import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { ApprovalRequest } from "@/db/schema/approval-requests";

export interface ApprovalsFilterParams {
  limit?: number;
  offset?: number;
  status?: string;
  approverId?: number;
}

export const approvalKeys = {
  all: ["approvals"] as const,
  lists: () => [...approvalKeys.all, "list"] as const,
  list: (params?: ApprovalsFilterParams) => [...approvalKeys.lists(), params] as const,
};

export function useApprovals(params?: ApprovalsFilterParams) {
  return useQuery({
    queryKey: approvalKeys.list(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.offset) searchParams.set("offset", params.offset.toString());
      if (params?.status) searchParams.set("status", params.status);
      if (params?.approverId) searchParams.set("approverId", params.approverId.toString());

      const qs = searchParams.toString();
      const res = await apiClient<{ items: ApprovalRequest[]; total: number }>(
        `/api/v1/approvals${qs ? `?${qs}` : ""}`
      );
      return res.data ?? { items: [], total: 0 };
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.all });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.all });
    },
  });
}
