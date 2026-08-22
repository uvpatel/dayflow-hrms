import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getPaginatedData } from "@/lib/api/client";
import type { Attendance } from "@/db/schema/attendances";
import {
  attendanceKeys,
  dashboardKeys,
  reportKeys,
} from "@/lib/query-keys";

export { attendanceKeys } from "@/lib/query-keys";

export interface AttendanceFilterParams {
  page?: number;
  limit?: number;
  offset?: number;
  userId?: string;
  status?: string;
  date?: string;
}

export interface AttendanceCorrection {
  id: number;
  userId: string;
  correctionDate: string;
  reason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useAttendance(
  params?: AttendanceFilterParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: attendanceKeys.list(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.offset) searchParams.set("offset", params.offset.toString());
      if (params?.userId) searchParams.set("userId", params.userId);
      if (params?.status) searchParams.set("status", params.status);
      if (params?.date) searchParams.set("date", params.date);

      const qs = searchParams.toString();
      const res = await apiClient<Attendance[] | { items: Attendance[]; total: number }>(
        `/api/v1/attendance${qs ? `?${qs}` : ""}`
      );
      return getPaginatedData(res);
    },
    enabled: options?.enabled,
  });
}

export function useTodayAttendance() {
  return useQuery({
    queryKey: attendanceKeys.today(),
    queryFn: async () => {
      const res = await apiClient<Attendance | null>(
        "/api/v1/attendance/today"
      );
      return res.data ?? null;
    },
    refetchInterval: 60_000,
  });
}

export function useMyAttendance() {
  return useQuery({
    queryKey: attendanceKeys.myHistory(),
    queryFn: async () => {
      const res = await apiClient<Attendance[]>("/api/v1/me/attendance");
      return res.data ?? [];
    },
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient<Attendance>("/api/v1/attendance/check-in", {
        method: "POST",
        body: JSON.stringify({}),
      });
      return res.data;
    },
    onSuccess: async (attendance) => {
      queryClient.setQueryData(attendanceKeys.today(), attendance ?? null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: attendanceKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
        queryClient.invalidateQueries({ queryKey: reportKeys.all }),
      ]);
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient<Attendance>("/api/v1/attendance/check-out", {
        method: "POST",
        body: JSON.stringify({}),
      });
      return res.data;
    },
    onSuccess: async (attendance) => {
      queryClient.setQueryData(attendanceKeys.today(), attendance ?? null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: attendanceKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
        queryClient.invalidateQueries({ queryKey: reportKeys.all }),
      ]);
    },
  });
}

export function useAttendanceCorrections(params?: { limit?: number; offset?: number; userId?: string }) {
  return useQuery({
    queryKey: attendanceKeys.corrections(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.offset) searchParams.set("offset", params.offset.toString());
      if (params?.userId) searchParams.set("userId", params.userId);

      const qs = searchParams.toString();
      const res = await apiClient<
        AttendanceCorrection[] | { items: AttendanceCorrection[]; total: number }
      >(
        `/api/v1/attendance/corrections${qs ? `?${qs}` : ""}`
      );
      return getPaginatedData(res);
    },
  });
}

export function useRequestCorrection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { correctionDate: string; reason: string; userId?: string }) => {
      const res = await apiClient<AttendanceCorrection>("/api/v1/attendance/corrections", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.correctionLists() });
    },
  });
}
