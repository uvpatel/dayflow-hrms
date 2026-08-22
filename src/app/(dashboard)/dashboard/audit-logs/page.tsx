"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Clock,
  Activity,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuditLogs } from "@/hooks/use-audit-logs";

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const { data: logsData, isLoading, refetch } = useAuditLogs({ limit: 50 });

  const logs = logsData ?? [];

  const filteredLogs = logs.filter((log) => {
    const term = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      (log.description && log.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
            <ShieldAlert className="size-7 text-primary" />
            Audit &amp; Security Activity Logs
          </h1>
          <p className="text-sm text-muted-foreground">
            Immutable trace of system events, security state transitions, and administrative operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              toast.success("Audit log trail refreshed");
            }}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search action or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="size-4 text-emerald-500" />
            System Activity Log Stream
          </CardTitle>
          <CardDescription>Security and administrative audit history</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Action Event</TableHead>
                <TableHead>Event Description</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading audit trail...
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No audit records match your query.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{log.id}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs uppercase bg-muted/50">
                        <Terminal className="size-3 mr-1 text-primary" />
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      {log.description || "Administrative event processed"}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                      <span className="flex items-center justify-end gap-1">
                        <Clock className="size-3 text-muted-foreground" />
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : "Just now"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
