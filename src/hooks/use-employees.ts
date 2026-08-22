import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getPaginatedData } from "@/lib/api/client";
import type { Employee } from "@/db/schema/employees";
import { employeeKeys, teamKeys } from "@/lib/query-keys";

export { employeeKeys, teamKeys } from "@/lib/query-keys";

export interface EmployeeFilterParams {
  page?: number;
  limit?: number;
  offset?: number;
  search?: string;
  departmentId?: number;
  designationId?: number;
  managerId?: number;
  locationId?: number;
  status?: string;
  sort?: string;
}

export function useEmployees(params?: EmployeeFilterParams) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.offset) searchParams.set("offset", params.offset.toString());
      if (params?.search) searchParams.set("search", params.search);
      if (params?.departmentId) searchParams.set("departmentId", params.departmentId.toString());
      if (params?.designationId) searchParams.set("designationId", params.designationId.toString());
      if (params?.managerId) searchParams.set("managerId", params.managerId.toString());
      if (params?.locationId) searchParams.set("locationId", params.locationId.toString());
      if (params?.status) searchParams.set("status", params.status);
      if (params?.sort) searchParams.set("sort", params.sort);

      const qs = searchParams.toString();
      const res = await apiClient<Employee[] | { items: Employee[]; total: number }>(
        `/api/v1/employees${qs ? `?${qs}` : ""}`
      );
      return getPaginatedData(res);
    },
  });
}

export function useMyTeam(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: teamKeys.mine(),
    queryFn: async () => {
      const res = await apiClient<
        Employee[] | { items: Employee[]; total: number }
      >("/api/v1/managers/me/team");
      return getPaginatedData(res);
    },
    enabled: options?.enabled,
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
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
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
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
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
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
    },
  });
}
