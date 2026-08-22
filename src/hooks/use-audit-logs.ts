import { useQuery } from "@tanstack/react-query";
import { apiClient, getPaginatedData } from "@/lib/api/client";
import type { ActivityLog } from "@/db/schema/activity-logs";

export interface AuditLogFilterParams {
  limit?: number;
  offset?: number;
}

export const auditLogKeys = {
  all: ["auditLogs"] as const,
  list: (params?: AuditLogFilterParams) => [...auditLogKeys.all, "list", params] as const,
};

export function useAuditLogs(params?: AuditLogFilterParams) {
  return useQuery({
    queryKey: auditLogKeys.list(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.offset) searchParams.set("offset", params.offset.toString());

      const qs = searchParams.toString();
      const res = await apiClient<
        ActivityLog[] | { items: ActivityLog[]; total: number }
      >(
        `/api/v1/activity-logs${qs ? `?${qs}` : ""}`
      );
      return getPaginatedData(res);
    },
  });
}
