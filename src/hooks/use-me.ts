import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { Employee } from "@/db/schema/employees";

export const meKeys = {
  all: ["me"] as const,
  attendance: ["me", "attendance"] as const,
  timeOff: ["me", "time-off"] as const,
  payslips: ["me", "payslips"] as const,
};

export interface MeData {
  user: {
    id: string;
    name: string;
    email: string;
    role?: string;
    image?: string | null;
  };
  employee: Employee | null;
}

export function useMe() {
  return useQuery({
    queryKey: meKeys.all,
    queryFn: async () => {
      const res = await apiClient<MeData>("/api/v1/me");
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Employee>) => {
      const res = await apiClient<Employee>("/api/v1/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meKeys.all });
    },
  });
}
