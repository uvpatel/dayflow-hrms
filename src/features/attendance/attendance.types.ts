import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { attendances, attendanceCorrections } from "@/db/schema";

export type Attendance = InferSelectModel<typeof attendances>;
export type NewAttendance = InferInsertModel<typeof attendances>;

export type AttendanceCorrection = InferSelectModel<typeof attendanceCorrections>;
export type NewAttendanceCorrection = InferInsertModel<typeof attendanceCorrections>;
