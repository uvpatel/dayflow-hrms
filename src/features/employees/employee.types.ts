import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  employees,
  employeeAddresses,
  emergencyContacts,
  employeeDocuments,
} from "@/db/schema";

export type Employee = InferSelectModel<typeof employees>;
export type NewEmployee = InferInsertModel<typeof employees>;

export type EmployeeAddress = InferSelectModel<typeof employeeAddresses>;
export type NewEmployeeAddress = InferInsertModel<typeof employeeAddresses>;

export type EmergencyContact = InferSelectModel<typeof emergencyContacts>;
export type NewEmergencyContact = InferInsertModel<typeof emergencyContacts>;

export type EmployeeDocument = InferSelectModel<typeof employeeDocuments>;
export type NewEmployeeDocument = InferInsertModel<typeof employeeDocuments>;

export interface FullEmployeeProfile extends Employee {
  addresses: EmployeeAddress[];
  emergencyContacts: EmergencyContact[];
  documents: EmployeeDocument[];
}
