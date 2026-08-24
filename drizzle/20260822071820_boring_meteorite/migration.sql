ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "impersonated_by" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'user';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "ban_expires" timestamp;--> statement-breakpoint
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "employee_id" integer;--> statement-breakpoint
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "organization_id" integer;--> statement-breakpoint
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "work_hours" text;--> statement-breakpoint
ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "organization_id" integer;--> statement-breakpoint
ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "manager_id" integer;--> statement-breakpoint
ALTER TABLE "designations" ADD COLUMN IF NOT EXISTS "organization_id" integer;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "user_id" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "organization_id" integer;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "employee_number" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "department_id" integer;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "designation_id" integer;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "manager_id" integer;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "location_id" integer;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "work_schedule_id" integer;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'employee' NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "employment_status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "employment_type" text DEFAULT 'full_time';--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "joining_date" timestamp;--> statement-breakpoint
ALTER TABLE "holidays" ADD COLUMN IF NOT EXISTS "organization_id" integer;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "organization_id" integer;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "days" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "approved_by" integer;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "organization_id" integer;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "address" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "city" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "country" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "slug" text;--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD COLUMN IF NOT EXISTS "organization_id" integer;--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD COLUMN IF NOT EXISTS "start_date" timestamp;--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD COLUMN IF NOT EXISTS "end_date" timestamp;--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "payslips" ADD COLUMN IF NOT EXISTS "employee_id" integer;--> statement-breakpoint
ALTER TABLE "payslips" ADD COLUMN IF NOT EXISTS "organization_id" integer;--> statement-breakpoint
ALTER TABLE "payslips" ADD COLUMN IF NOT EXISTS "month" text;--> statement-breakpoint
ALTER TABLE "payslips" ADD COLUMN IF NOT EXISTS "year" integer;--> statement-breakpoint
ALTER TABLE "payslips" ADD COLUMN IF NOT EXISTS "basic_salary" text;--> statement-breakpoint
ALTER TABLE "payslips" ADD COLUMN IF NOT EXISTS "net_salary" text;--> statement-breakpoint
ALTER TABLE "payslips" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "phone_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payslips" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_key" UNIQUE("user_id");
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attendances_user_id_idx" ON "attendances" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attendances_employee_id_idx" ON "attendances" ("employee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attendances_org_id_idx" ON "attendances" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attendances_date_idx" ON "attendances" ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "departments_org_id_idx" ON "departments" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "designations_org_id_idx" ON "designations" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "employees_user_id_idx" ON "employees" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "employees_org_id_idx" ON "employees" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "employees_email_idx" ON "employees" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "holidays_org_id_idx" ON "holidays" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "holidays_date_idx" ON "holidays" ("holiday_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leave_requests_employee_id_idx" ON "leave_requests" ("employee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leave_requests_org_id_idx" ON "leave_requests" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leave_requests_status_idx" ON "leave_requests" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "locations_org_id_idx" ON "locations" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payroll_periods_org_id_idx" ON "payroll_periods" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payslips_employee_id_idx" ON "payslips" ("employee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payslips_org_id_idx" ON "payslips" ("organization_id");--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;