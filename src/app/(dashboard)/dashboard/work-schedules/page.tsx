"use client";

import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  CalendarClock,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployees } from "@/hooks/use-employees";
import { useMe } from "@/hooks/use-me";
import {
  useCreateWorkSchedule,
  useDeleteWorkSchedule,
  useUpdateWorkSchedule,
  useWorkSchedules,
} from "@/hooks/use-organization";
import { normalizeRole } from "@/lib/permissions";

const NO_EMPLOYEE = "__no_employee__";

type ScheduleForm = {
  employeeId: string;
  scheduleName: string;
  startDate: string;
  endDate: string;
};

function formatMinutes(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60,
  ).padStart(2, "0")}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function dateInputValue(value: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function emptyForm(): ScheduleForm {
  return {
    employeeId: NO_EMPLOYEE,
    scheduleName: "",
    startDate: today(),
    endDate: "",
  };
}

export default function WorkSchedulesPage() {
  const meQuery = useMe();
  const role = normalizeRole(
    meQuery.data?.employee?.role ?? meQuery.data?.user.role,
  );
  const canManage = role === "hr" || role === "admin";
  const schedulesQuery = useWorkSchedules(undefined, { enabled: canManage });
  const employeesQuery = useEmployees({ limit: 500, status: "active" });
  const createSchedule = useCreateWorkSchedule();
  const updateSchedule = useUpdateWorkSchedule();
  const deleteSchedule = useDeleteWorkSchedule();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [form, setForm] = useState<ScheduleForm>(emptyForm);

  const schedules = schedulesQuery.data ?? [];
  const employees = employeesQuery.data?.items ?? [];
  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));
  const isSaving = createSchedule.isPending || updateSchedule.isPending;

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingScheduleId(null);
    setForm(emptyForm());
  };

  const openCreateDialog = () => {
    setEditingScheduleId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEditDialog = (schedule: (typeof schedules)[number]) => {
    setEditingScheduleId(schedule.id);
    setForm({
      employeeId: String(schedule.employeeId),
      scheduleName: schedule.scheduleName,
      startDate: dateInputValue(schedule.startDate),
      endDate: dateInputValue(schedule.endDate),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const scheduleName = form.scheduleName.trim();

    if (scheduleName.length < 2) {
      toast.error("Schedule name must contain at least two characters.");
      return;
    }
    if (!form.startDate) {
      toast.error("Choose a schedule start date.");
      return;
    }
    if (!editingScheduleId && form.employeeId === NO_EMPLOYEE) {
      toast.error("Choose the employee receiving this schedule.");
      return;
    }
    if (form.endDate && form.endDate < form.startDate) {
      toast.error("The end date cannot precede the start date.");
      return;
    }

    try {
      if (editingScheduleId) {
        await updateSchedule.mutateAsync({
          id: editingScheduleId,
          scheduleName,
          startDate: form.startDate,
          endDate: form.endDate || null,
        });
        toast.success("Work schedule updated.");
      } else {
        await createSchedule.mutateAsync({
          employeeId: Number(form.employeeId),
          scheduleName,
          startDate: form.startDate,
          ...(form.endDate ? { endDate: form.endDate } : {}),
        });
        toast.success("Work schedule created.");
      }
      closeDialog();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save the work schedule.",
      );
    }
  };

  const handleDelete = async (schedule: (typeof schedules)[number]) => {
    if (!window.confirm(`Delete the '${schedule.scheduleName}' schedule?`)) {
      return;
    }

    try {
      await deleteSchedule.mutateAsync(schedule.id);
      toast.success("Work schedule deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete the work schedule.",
      );
    }
  };

  if (meQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 md:p-8">
        <Card className="border-destructive/30">
          <CardContent className="flex gap-3 p-6">
            <AlertCircle className="size-5 text-destructive" />
            <div>
              <h1 className="font-semibold">Work schedule management is restricted</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                HR or an administrator can manage organization schedules.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <CalendarClock className="size-7 text-primary" />
            Work schedules
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Assign live schedules to employees. Shift thresholds shown below are
            applied by the attendance service.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void schedulesQuery.refetch()}
            disabled={schedulesQuery.isFetching}
          >
            <RefreshCw
              className={`size-4 ${schedulesQuery.isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
          >
            <DialogTrigger render={<Button size="sm" onClick={openCreateDialog} />}>
              <Plus className="size-4" />
              Assign schedule
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingScheduleId ? "Edit work schedule" : "Assign work schedule"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingScheduleId
                      ? "Update this schedule's name or active dates."
                      : "Create a schedule assignment for an active employee."}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="schedule-employee">Employee</Label>
                    <Select
                      value={form.employeeId}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          employeeId: value ?? NO_EMPLOYEE,
                        }))
                      }
                      disabled={Boolean(editingScheduleId) || employeesQuery.isLoading || isSaving}
                    >
                      <SelectTrigger id="schedule-employee">
                        <SelectValue placeholder="Choose employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {!editingScheduleId ? (
                          <SelectItem value={NO_EMPLOYEE}>Choose employee</SelectItem>
                        ) : null}
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={String(employee.id)}>
                            {employee.firstName} {employee.lastName}
                            {employee.employeeNumber ? ` · ${employee.employeeNumber}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="schedule-name">Schedule name</Label>
                    <Input
                      id="schedule-name"
                      value={form.scheduleName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          scheduleName: event.target.value,
                        }))
                      }
                      placeholder="e.g. Standard weekday shift"
                      disabled={isSaving}
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="schedule-start">Starts</Label>
                      <Input
                        id="schedule-start"
                        type="date"
                        value={form.startDate}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            startDate: event.target.value,
                          }))
                        }
                        disabled={isSaving}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="schedule-end">Ends</Label>
                      <Input
                        id="schedule-end"
                        type="date"
                        value={form.endDate}
                        min={form.startDate || undefined}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            endDate: event.target.value,
                          }))
                        }
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving…" : editingScheduleId ? "Save changes" : "Assign schedule"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule assignments</CardTitle>
          <CardDescription>
            Real organization schedule records. Deleting an assignment is permanent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {schedulesQuery.isLoading ? (
            <Skeleton className="h-48" />
          ) : schedulesQuery.isError ? (
            <button
              type="button"
              onClick={() => void schedulesQuery.refetch()}
              className="w-full rounded-lg border border-destructive/30 p-5 text-left text-sm text-destructive"
            >
              Schedules could not be loaded. Select to retry.
            </button>
          ) : schedules.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              No work schedules have been configured.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {schedules.map((schedule) => {
                const employee = employeesById.get(schedule.employeeId);
                return (
                  <div key={schedule.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{schedule.scheduleName}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {employee
                            ? `${employee.firstName} ${employee.lastName}`
                            : `Employee #${schedule.employeeId}`}
                        </p>
                      </div>
                      <Badge variant="outline">{schedule.timezone}</Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Shift</p>
                        <p className="font-medium tabular-nums">
                          {formatMinutes(schedule.shiftStartMinutes)}–
                          {formatMinutes(schedule.shiftEndMinutes)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Break</p>
                        <p className="font-medium tabular-nums">{schedule.breakMinutes} min</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Starts</p>
                        <p className="font-medium">{dateInputValue(schedule.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ends</p>
                        <p className="font-medium">
                          {dateInputValue(schedule.endDate) || "Open-ended"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2 border-t pt-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(schedule)}
                        disabled={deleteSchedule.isPending}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => void handleDelete(schedule)}
                        disabled={deleteSchedule.isPending}
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </Button>
                    </div>
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
