import { attendanceRepository } from "./attendance.repository";
import { NotFoundError, ConflictError } from "@/lib/api/errors";
import { logActivity } from "@/lib/audit/logger";
import { AuthContext } from "@/lib/auth/session";
import { z } from "zod";
import {
  manualAttendanceSchema,
  updateAttendanceSchema,
  createCorrectionSchema,
  updateCorrectionSchema,
} from "./attendance.schemas";

export class AttendanceService {
  private resolveUserId(authContext: AuthContext, explicitUserId?: string): string {
    if (explicitUserId && explicitUserId.trim()) {
      return explicitUserId.trim();
    }
    if (authContext.employee?.id) {
      return authContext.employee.id.toString();
    }
    return authContext.user.id;
  }

  async checkIn(authContext: AuthContext, explicitUserId?: string) {
    const userId = this.resolveUserId(authContext, explicitUserId);
    const now = new Date();

    // Concurrency guard: Check for active open check-in
    const openRecord = await attendanceRepository.findOpenAttendance(userId);
    if (openRecord) {
      throw new ConflictError(
        "You are already checked in. Please check out before checking in again.",
        "ALREADY_CHECKED_IN"
      );
    }

    const created = await attendanceRepository.createAttendance({
      userId,
      date: now,
      checkInTime: now,
      status: "present",
    });

    await logActivity({
      action: "ATTENDANCE_CHECKED_IN",
      description: `User #${userId} checked in at ${now.toLocaleTimeString()}`,
    });

    return created;
  }

  async checkOut(authContext: AuthContext, explicitUserId?: string) {
    const userId = this.resolveUserId(authContext, explicitUserId);
    const now = new Date();

    const openRecord = await attendanceRepository.findOpenAttendance(userId);
    if (!openRecord) {
      // If no open check-in, check if there's any record today
      throw new ConflictError(
        "No active check-in record found to check out from.",
        "NOT_CHECKED_IN"
      );
    }

    const updated = await attendanceRepository.updateAttendance(openRecord.id, {
      checkOutTime: now,
    });

    await logActivity({
      action: "ATTENDANCE_CHECKED_OUT",
      description: `User #${userId} checked out at ${now.toLocaleTimeString()}`,
    });

    return updated!;
  }

  async getCheckInStatus(userId: string) {
    return await attendanceRepository.findLatestAttendance(userId);
  }

  async listAttendances(limit = 20, offset = 0, userId?: string, status?: string) {
    const [items, total] = await Promise.all([
      attendanceRepository.findAttendances(limit, offset, userId, status),
      attendanceRepository.countAttendances(userId, status),
    ]);
    return { items, total };
  }

  async getAttendance(id: number) {
    const record = await attendanceRepository.findAttendanceById(id);
    if (!record) {
      throw new NotFoundError(`Attendance record with ID ${id} not found`, "ATTENDANCE_NOT_FOUND");
    }
    return record;
  }

  async createManualAttendance(data: z.infer<typeof manualAttendanceSchema>) {
    const now = new Date();
    const created = await attendanceRepository.createAttendance({
      userId: data.userId,
      date: data.date ?? now,
      checkInTime: data.checkInTime ?? null,
      checkOutTime: data.checkOutTime ?? null,
      status: data.status ?? "present",
    });

    await logActivity({
      action: "ATTENDANCE_MANUAL_ENTRY",
      description: `Manual attendance logged for User #${data.userId}`,
    });

    return created;
  }

  async updateAttendance(id: number, data: z.infer<typeof updateAttendanceSchema>) {
    await this.getAttendance(id);
    const updated = await attendanceRepository.updateAttendance(id, data);

    await logActivity({
      action: "ATTENDANCE_UPDATED",
      description: `Updated attendance record #${id}`,
    });

    return updated!;
  }

  async deleteAttendance(id: number) {
    await this.getAttendance(id);
    const deleted = await attendanceRepository.deleteAttendance(id);

    await logActivity({
      action: "ATTENDANCE_DELETED",
      description: `Deleted attendance record #${id}`,
    });

    return deleted!;
  }

  // Corrections
  async listCorrections(limit = 20, offset = 0, userId?: string) {
    const [items, total] = await Promise.all([
      attendanceRepository.findCorrections(limit, offset, userId),
      attendanceRepository.countCorrections(userId),
    ]);
    return { items, total };
  }

  async getCorrection(id: number) {
    const item = await attendanceRepository.findCorrectionById(id);
    if (!item) {
      throw new NotFoundError(`Attendance correction with ID ${id} not found`, "NOT_FOUND");
    }
    return item;
  }

  async requestCorrection(authContext: AuthContext, data: z.infer<typeof createCorrectionSchema>) {
    const userId = data.userId || this.resolveUserId(authContext);

    const created = await attendanceRepository.createCorrection({
      userId,
      correctionDate: data.correctionDate,
      reason: data.reason,
    });

    await logActivity({
      action: "ATTENDANCE_CORRECTION_REQUESTED",
      description: `Correction requested for User #${userId} on ${new Date(data.correctionDate).toLocaleDateString()}`,
    });

    return created;
  }

  async updateCorrection(id: number, data: z.infer<typeof updateCorrectionSchema>) {
    await this.getCorrection(id);
    const updated = await attendanceRepository.updateCorrection(id, data);

    await logActivity({
      action: "ATTENDANCE_CORRECTION_UPDATED",
      description: `Updated correction request #${id}`,
    });

    return updated!;
  }

  async deleteCorrection(id: number) {
    await this.getCorrection(id);
    const deleted = await attendanceRepository.deleteCorrection(id);

    await logActivity({
      action: "ATTENDANCE_CORRECTION_DELETED",
      description: `Deleted correction request #${id}`,
    });

    return deleted!;
  }
}

export const attendanceService = new AttendanceService();
