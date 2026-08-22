import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { Attendance } from "@/db/schema/attendances";

export interface AttendanceFilterParams {
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

export const attendanceKeys = {
  all: ["attendance"] as const,
  lists: () => [...attendanceKeys.all, "list"] as const,
  list: (params?: AttendanceFilterParams) => [...attendanceKeys.lists(), params] as const,
  myToday: () => [...attendanceKeys.all, "me", "today"] as const,
  myHistory: () => [...attendanceKeys.all, "me", "history"] as const,
  corrections: () => [...attendanceKeys.all, "corrections"] as const,
};

export function useAttendance(params?: AttendanceFilterParams) {
  return useQuery({
    queryKey: attendanceKeys.list(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.offset) searchParams.set("offset", params.offset.toString());
      if (params?.userId) searchParams.set("userId", params.userId);
      if (params?.status) searchParams.set("status", params.status);
      if (params?.date) searchParams.set("date", params.date);

      const qs = searchParams.toString();
      const res = await apiClient<{ items: Attendance[]; total: number }>(
        `/api/v1/attendance${qs ? `?${qs}` : ""}`
      );
      return res.data ?? { items: [], total: 0 };
    },
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
    mutationFn: async (payload?: { userId?: string }) => {
      const res = await apiClient<Attendance>("/api/v1/attendance/check-in", {
        method: "POST",
        body: JSON.stringify(payload || {}),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload?: { userId?: string }) => {
      const res = await apiClient<Attendance>("/api/v1/attendance/check-out", {
        method: "POST",
        body: JSON.stringify(payload || {}),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

export function useAttendanceCorrections(params?: { limit?: number; offset?: number; userId?: string }) {
  return useQuery({
    queryKey: [...attendanceKeys.corrections(), params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.offset) searchParams.set("offset", params.offset.toString());
      if (params?.userId) searchParams.set("userId", params.userId);

      const qs = searchParams.toString();
      const res = await apiClient<{ items: AttendanceCorrection[]; total: number }>(
        `/api/v1/attendance/corrections${qs ? `?${qs}` : ""}`
      );
      return res.data ?? { items: [], total: 0 };
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
      queryClient.invalidateQueries({ queryKey: attendanceKeys.corrections() });
    },
  });
}
