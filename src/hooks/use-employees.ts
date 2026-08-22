import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { Employee } from "@/db/schema/employees";

export interface EmployeeFilterParams {
  limit?: number;
  offset?: number;
  search?: string;
  departmentId?: number;
  status?: string;
}

export const employeeKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeKeys.all, "list"] as const,
  list: (params?: EmployeeFilterParams) => [...employeeKeys.lists(), params] as const,
  details: () => [...employeeKeys.all, "detail"] as const,
  detail: (id: number) => [...employeeKeys.details(), id] as const,
};

export function useEmployees(params?: EmployeeFilterParams) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.offset) searchParams.set("offset", params.offset.toString());
      if (params?.search) searchParams.set("search", params.search);
      if (params?.departmentId) searchParams.set("departmentId", params.departmentId.toString());
      if (params?.status) searchParams.set("status", params.status);

      const qs = searchParams.toString();
      const res = await apiClient<{ items: Employee[]; total: number }>(
        `/api/v1/employees${qs ? `?${qs}` : ""}`
      );
      return res.data ?? { items: [], total: 0 };
    },
  });
}

export function useEmployee(id: number) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient<Employee>(`/api/v1/employees/${id}`);
      return res.data;
    },
    enabled: !!id && !isNaN(id),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Employee>) => {
      const res = await apiClient<Employee>("/api/v1/employees", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Employee> }) => {
      const res = await apiClient<Employee>(`/api/v1/employees/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(id) });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient<Employee>(`/api/v1/employees/${id}`, {
        method: "DELETE",
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}
