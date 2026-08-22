import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getPaginatedData } from "@/lib/api/client";
import type { Notification } from "@/db/schema/notifications";
import { notificationKeys } from "@/lib/query-keys";

export { notificationKeys } from "@/lib/query-keys";

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: async () => {
      const res = await apiClient<
        Notification[] | { items: Notification[]; total: number }
      >("/api/v1/notifications");
      return getPaginatedData(res).items;
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
