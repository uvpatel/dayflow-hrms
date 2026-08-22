import { ZodError } from "zod";

export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE_ENTITY"
  | "INTERNAL_SERVER_ERROR"
  | "VALIDATION_ERROR"
  | "EMPLOYEE_NOT_FOUND"
  | "DEPARTMENT_NOT_FOUND"
  | "DESIGNATION_NOT_FOUND"
  | "LOCATION_NOT_FOUND"
  | "HOLIDAY_NOT_FOUND"
  | "SCHEDULE_NOT_FOUND"
  | "ATTENDANCE_NOT_FOUND"
  | "ALREADY_CHECKED_IN"
  | "NOT_CHECKED_IN"
  | "LEAVE_REQUEST_NOT_FOUND"
  | "INSUFFICIENT_LEAVE_BALANCE"
  | "LEAVE_REQUEST_OVERLAP"
  | "LEAVE_ALREADY_RESOLVED"
  | "APPROVAL_NOT_FOUND"
  | "APPROVAL_ALREADY_RESOLVED"
  | "PAYROLL_PERIOD_NOT_FOUND"
  | "PAYROLL_ALREADY_FINALIZED"
  | "PAYSLIP_NOT_FOUND"
  | "NOTIFICATION_NOT_FOUND";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code: ErrorCode = "INTERNAL_SERVER_ERROR", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403, "FORBIDDEN");
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", code: ErrorCode = "NOT_FOUND") {
    super(message, 404, code);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict", code: ErrorCode = "CONFLICT") {
    super(message, 409, code);
    this.name = "ConflictError";
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, code: ErrorCode = "UNPROCESSABLE_ENTITY", details?: unknown) {
    super(message, 422, code, details);
    this.name = "BusinessRuleError";
  }
}

export function formatZodError(error: ZodError): { path: string; message: string }[] {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}
