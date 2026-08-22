import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  organizations,
  departments,
  designations,
  locations,
  holidays,
  workSchedules,
} from "@/db/schema";

export type Organization = InferSelectModel<typeof organizations>;
export type NewOrganization = InferInsertModel<typeof organizations>;

export type Department = InferSelectModel<typeof departments>;
export type NewDepartment = InferInsertModel<typeof departments>;

export type Designation = InferSelectModel<typeof designations>;
export type NewDesignation = InferInsertModel<typeof designations>;

export type Location = InferSelectModel<typeof locations>;
export type NewLocation = InferInsertModel<typeof locations>;

export type Holiday = InferSelectModel<typeof holidays>;
export type NewHoliday = InferInsertModel<typeof holidays>;

export type WorkSchedule = InferSelectModel<typeof workSchedules>;
export type NewWorkSchedule = InferInsertModel<typeof workSchedules>;
