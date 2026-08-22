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

const LEAVE_TYPES = [
  { value: "paid", label: "Paid Time Off" },
  { value: "sick", label: "Sick Leave" },
  { value: "casual", label: "Casual Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
] as const;

type ApiResponse = { success: boolean; error?: string };

export default function ApplyPage() {
  const router = useRouter();
  const [leaveType, setLeaveType] = useState<string>("paid");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!startDate || !endDate) {
      toast.error("Select a start and end date.");
      return;
    }
    if (endDate < startDate) {
      toast.error("The end date cannot be before the start date.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/v1/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveType, startDate, endDate, reason: reason.trim() || undefined }),
      });
      const result = (await response.json()) as ApiResponse;
      if (!response.ok || !result.success) {
        toast.error(result.error ?? "Unable to submit the leave request.");
        return;
      }

      toast.success("Leave request submitted for approval.");
      router.push("/dashboard/time-off");
      router.refresh();
    } catch {
      toast.error("Unable to submit the leave request. Please try again.");
    } finally {
      setIsSubmitting(false);
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
              <Select value={leaveType} onValueChange={(value) => setLeaveType(value ?? "paid")}>
                <SelectTrigger id="leave-type"><SelectValue placeholder="Choose a leave type" /></SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                </SelectContent>
              </Select>
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
              <Button type="submit" disabled={isSubmitting}>
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
