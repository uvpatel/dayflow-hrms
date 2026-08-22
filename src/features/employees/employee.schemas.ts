import { z } from "zod";

export const createAddressSchema = z.object({
  addressLine1: z.string().min(2, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(2, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
});

export const createEmergencyContactSchema = z.object({
  name: z.string().min(2, "Contact name is required"),
  relationship: z.string().min(2, "Relationship is required"),
  phoneNumber: z.string().min(5, "Valid phone number is required"),
});

export const createDocumentSchema = z.object({
  documentType: z.string().min(2, "Document type is required"),
  documentUrl: z.string().url("Valid document URL is required"),
});

export const createEmployeeSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Valid email address is required"),
  phoneNumber: z.string().min(5, "Valid phone number is required"),
  address: createAddressSchema.optional(),
  emergencyContact: createEmergencyContactSchema.optional(),
  document: createDocumentSchema.optional(),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().min(5).optional(),
});

export const employeeQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
});
