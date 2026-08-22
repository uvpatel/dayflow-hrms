import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { Notification } from "@/db/schema/notifications";

export const notificationKeys = {
  all: ["notifications"] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: async () => {
      const res = await apiClient<Notification[]>("/api/v1/notifications");
      return res.data ?? [];
    },
    refetchInterval: 30000, // background refresh every 30s
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient<Notification>(`/api/v1/notifications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ read: 1 }),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient<{ count: number }>("/api/v1/notifications/read-all", {
        method: "POST",
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
