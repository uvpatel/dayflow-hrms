import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getPaginatedData } from "@/lib/api/client";
import type { Organization } from "@/db/schema/organizations";
import type { Department } from "@/db/schema/departments";
import type { Designation } from "@/db/schema/designations";
import type { Location } from "@/db/schema/locations";
import type { Holiday } from "@/db/schema/holidays";
import type { WorkSchedule } from "@/db/schema/work-schedules";

export const orgKeys = {
  all: ["organization"] as const,
  info: () => [...orgKeys.all, "info"] as const,
  departments: () => [...orgKeys.all, "departments"] as const,
  designations: () => [...orgKeys.all, "designations"] as const,
  locations: () => [...orgKeys.all, "locations"] as const,
  holidays: () => [...orgKeys.all, "holidays"] as const,
  workSchedules: (employeeId?: number) =>
    [...orgKeys.all, "workSchedules", employeeId] as const,
};

export function useOrganization() {
  return useQuery({
    queryKey: orgKeys.info(),
    queryFn: async () => {
      const res = await apiClient<Organization[]>("/api/v1/organizations");
      return res.data?.[0] ?? null;
    },
  });
}

/**
 * Updates the current actor's organization. The API derives the organization
 * from the server-side session, so callers never send or choose an ID.
 */
export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name?: string;
      description?: string | null;
    }) => {
      const res = await apiClient<Organization>("/api/v1/organizations", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.info() });
    },
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: orgKeys.departments(),
    queryFn: async () => {
      const res = await apiClient<
        Department[] | { items: Department[]; total: number }
      >("/api/v1/departments");
      return getPaginatedData(res).items;
    },
  });
}

export function useDesignations() {
  return useQuery({
    queryKey: orgKeys.designations(),
    queryFn: async () => {
      const res = await apiClient<
        Designation[] | { items: Designation[]; total: number }
      >("/api/v1/designations");
      return getPaginatedData(res).items;
    },
  });
}

export function useLocations() {
  return useQuery({
    queryKey: orgKeys.locations(),
    queryFn: async () => {
      const res = await apiClient<Location[] | { items: Location[]; total: number }>(
        "/api/v1/locations"
      );
      return getPaginatedData(res).items;
    },
  });
}

export function useHolidays() {
  return useQuery({
    queryKey: orgKeys.holidays(),
    queryFn: async () => {
      const res = await apiClient<Holiday[] | { items: Holiday[]; total: number }>(
        "/api/v1/holidays"
      );
      return getPaginatedData(res).items;
    },
  });
}

export function useWorkSchedules(
  employeeId?: number,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: orgKeys.workSchedules(employeeId),
    queryFn: async () => {
      const query = employeeId ? `?employeeId=${employeeId}` : "";
      const res = await apiClient<
        WorkSchedule[] | { items: WorkSchedule[]; total: number }
      >(`/api/v1/work-schedules${query}`);
      return getPaginatedData(res).items;
    },
    enabled: options?.enabled,
  });
}

export type WorkScheduleInput = {
  employeeId: number;
  scheduleName: string;
  startDate: string | Date;
  endDate?: string | Date | null;
};

export function useCreateWorkSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: WorkScheduleInput) => {
      const res = await apiClient<WorkSchedule>("/api/v1/work-schedules", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.all });
    },
  });
}

export function useUpdateWorkSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<Omit<WorkScheduleInput, "employeeId">> & { id: number }) => {
      const res = await apiClient<WorkSchedule>(`/api/v1/work-schedules/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.all });
    },
  });
}

export function useDeleteWorkSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient<WorkSchedule>(`/api/v1/work-schedules/${id}`, {
        method: "DELETE",
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.all });
    },
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const res = await apiClient<Department>("/api/v1/departments", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.departments() });
    },
  });
}

export function useCreateDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string;
      departmentId?: number;
    }) => {
      const res = await apiClient<Designation>("/api/v1/designations", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.designations() });
    },
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string;
      address?: string;
      city?: string;
      country?: string;
    }) => {
      const res = await apiClient<Location>("/api/v1/locations", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.locations() });
    },
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      holidayDate: string | Date;
      description?: string;
    }) => {
      const res = await apiClient<Holiday>("/api/v1/holidays", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.holidays() });
    },
  });
}
