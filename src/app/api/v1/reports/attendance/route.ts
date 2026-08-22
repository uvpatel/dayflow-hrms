import type { NextRequest } from "next/server";

import { attendanceService } from "@/features/attendance/attendance.service";
import { AuthorizationError } from "@/lib/api/errors";
import { errorResponse, successResponse } from "@/lib/api";
import { getAuthContext } from "@/lib/auth/session";

interface DailyAttendance {
  date: string;
  present: number;
  late: number;
  absent: number;
}

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    if (authContext.role === "employee") {
      throw new AuthorizationError("Attendance reports are available to managers, HR, and administrators");
    }

    const { items } = await attendanceService.listAttendancesForActor(
      authContext,
      5_000,
      0,
    );
    const byDate = new Map<string, DailyAttendance>();

    for (const record of items) {
      const date = record.workDate ?? record.date.toISOString().slice(0, 10);
      const current = byDate.get(date) ?? {
        date,
        present: 0,
        late: 0,
        absent: 0,
      };
      if (record.status === "absent") current.absent += 1;
      if (record.status === "present" || record.status === "half_day") {
        current.present += 1;
      }
      if (record.isLate) current.late += 1;
      byDate.set(date, current);
    }

    const late = items.filter((record) => record.isLate).length;
    const halfDay = items.filter((record) => record.status === "half_day").length;
    const present = items.filter(
      (record) => record.status === "present" || record.status === "half_day",
    ).length;

    return successResponse({
      summary: {
        totalLogs: items.length,
        onTime: Math.max(0, present - late),
        late,
        halfDay,
      },
      dailyBreakdown: [...byDate.values()]
        .sort((left, right) => left.date.localeCompare(right.date))
        .slice(-31),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
