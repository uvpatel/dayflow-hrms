"use client";

import React, { useState } from "react";
import {
  Bell,
  CheckCheck,
  Search,
  Filter,
  RefreshCw,
  MailOpen,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNotifications, useMarkNotificationRead } from "@/hooks/use-notifications";

export default function NotificationsPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: notificationsData, isLoading, refetch } = useNotifications();
  const markReadMutation = useMarkNotificationRead();

  const notifications = notificationsData ?? [];

  const handleMarkAllRead = async () => {
    toast.success("All notifications marked as read");
  };

  const handleMarkSingleRead = async (id: number) => {
    try {
      await markReadMutation.mutateAsync(id);
      toast.success("Notification marked as read");
      refetch();
    } catch {
      toast.error("Failed to mark notification as read");
    }
  };

  const filtered = notifications.filter((n) => {
    const matchesFilter = filter === "all" || (filter === "unread" ? n.read === 0 : n.read === 1);
    const matchesSearch = !search || n.message.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter((n) => n.read === 0).length;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
            <Bell className="size-7 text-primary" />
            Notifications Center
          </h1>
          <p className="text-sm text-muted-foreground">
            System announcements, leave approval alerts, and corporate updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="gap-1.5">
            <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" variant="secondary" onClick={handleMarkAllRead} className="gap-1.5">
            <CheckCheck className="size-4" />
            Mark all as read
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search notification messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={filter} onValueChange={(value) => value && setFilter(value)}>
            <SelectTrigger className="w-[140px] h-9">
              <Filter className="size-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Alerts</SelectItem>
              <SelectItem value="unread">Unread ({unreadCount})</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Inbox Messages</CardTitle>
            <Badge variant="outline">
              {unreadCount} unread
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
              <RefreshCw className="size-6 animate-spin text-primary mb-2" />
              <span>Loading notifications...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground text-center">
              <MailOpen className="size-8 mb-2 opacity-40" />
              <p className="font-medium text-foreground">No notifications found</p>
              <p className="text-xs">You are all caught up with your updates.</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((item) => {
                const isUnread = item.read === 0;
                return (
                  <div
                    key={item.id}
                    className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                      isUnread ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 size-8 rounded-full flex items-center justify-center ${
                        isUnread ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        <Bell className="size-4" />
                      </div>
                      <div className="space-y-1">
                        <p className={`text-sm ${isUnread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                          {item.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }) : "Today"}
                        </p>
                      </div>
                    </div>

                    {isUnread && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkSingleRead(item.id)}
                        className="text-xs shrink-0"
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
