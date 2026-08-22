"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLeaveTypes, useSubmitLeaveRequest } from "@/hooks/use-leave";

export default function ApplyPage() {
  const router = useRouter();
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const leaveTypesQuery = useLeaveTypes();
  const submitLeaveRequest = useSubmitLeaveRequest();
  const leaveTypes = (leaveTypesQuery.data ?? []).filter((type) => type.active);
  const isSubmitting = submitLeaveRequest.isPending;

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!leaveType || !startDate || !endDate) {
      toast.error("Choose a leave type and select both dates.");
      return;
    }
    if (endDate < startDate) {
      toast.error("The end date cannot be before the start date.");
      return;
    }

    try {
      await submitLeaveRequest.mutateAsync({
        leaveType,
        startDate,
        endDate,
        reason: reason.trim() || undefined,
      });
      toast.success("Leave request submitted for approval.");
      router.push("/dashboard/time-off");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to submit the leave request. Please try again.",
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <CalendarPlus className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Apply for leave</h1>
        </div>
        <p className="text-sm text-muted-foreground">Send a time-off request to your manager for approval.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave details</CardTitle>
          <CardDescription>Review your dates before sending the request.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5" onSubmit={submitRequest}>
            <div className="grid gap-2">
              <Label htmlFor="leave-type">Leave type</Label>
              <Select value={leaveType} onValueChange={(value) => setLeaveType(value ?? "")} disabled={leaveTypesQuery.isLoading || leaveTypes.length === 0}>
                <SelectTrigger id="leave-type"><SelectValue placeholder={leaveTypesQuery.isLoading ? "Loading leave types…" : "Choose a leave type"} /></SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {leaveTypesQuery.isError ? (
                <p className="text-sm text-destructive">Unable to load leave types. Refresh the page and try again.</p>
              ) : leaveTypesQuery.isSuccess && leaveTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No leave types are currently available. Contact HR for assistance.</p>
              ) : null}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="start-date">Start date</Label>
                <Input id="start-date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end-date">End date</Label>
                <Input id="end-date" type="date" min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} required />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea id="reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Briefly explain your request" rows={4} />
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => router.push("/dashboard/time-off")} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || leaveTypesQuery.isLoading || leaveTypes.length === 0}>
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Submit request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
