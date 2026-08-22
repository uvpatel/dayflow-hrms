ALTER TABLE "session" ADD COLUMN "impersonated_by" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_expires" timestamp;--> statement-breakpoint
ALTER TABLE "attendances" ADD COLUMN "employee_id" integer;--> statement-breakpoint
ALTER TABLE "attendances" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "attendances" ADD COLUMN "work_hours" text;--> statement-breakpoint
ALTER TABLE "departments" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "departments" ADD COLUMN "manager_id" integer;--> statement-breakpoint
ALTER TABLE "designations" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "employee_number" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "department_id" integer;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "designation_id" integer;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "manager_id" integer;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "location_id" integer;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "work_schedule_id" integer;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "role" text DEFAULT 'employee' NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "employment_status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "employment_type" text DEFAULT 'full_time';--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "joining_date" timestamp;--> statement-breakpoint
ALTER TABLE "holidays" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "days" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "approved_by" integer;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD COLUMN "start_date" timestamp;--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD COLUMN "end_date" timestamp;--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "payslips" ADD COLUMN "employee_id" integer;--> statement-breakpoint
ALTER TABLE "payslips" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "payslips" ADD COLUMN "month" text;--> statement-breakpoint
ALTER TABLE "payslips" ADD COLUMN "year" integer;--> statement-breakpoint
ALTER TABLE "payslips" ADD COLUMN "basic_salary" text;--> statement-breakpoint
ALTER TABLE "payslips" ADD COLUMN "net_salary" text;--> statement-breakpoint
ALTER TABLE "payslips" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "phone_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payslips" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_key" UNIQUE("user_id");--> statement-breakpoint
CREATE INDEX "attendances_user_id_idx" ON "attendances" ("user_id");--> statement-breakpoint
CREATE INDEX "attendances_employee_id_idx" ON "attendances" ("employee_id");--> statement-breakpoint
CREATE INDEX "attendances_org_id_idx" ON "attendances" ("organization_id");--> statement-breakpoint
CREATE INDEX "attendances_date_idx" ON "attendances" ("date");--> statement-breakpoint
CREATE INDEX "departments_org_id_idx" ON "departments" ("organization_id");--> statement-breakpoint
CREATE INDEX "designations_org_id_idx" ON "designations" ("organization_id");--> statement-breakpoint
CREATE INDEX "employees_user_id_idx" ON "employees" ("user_id");--> statement-breakpoint
CREATE INDEX "employees_org_id_idx" ON "employees" ("organization_id");--> statement-breakpoint
CREATE INDEX "employees_email_idx" ON "employees" ("email");--> statement-breakpoint
CREATE INDEX "holidays_org_id_idx" ON "holidays" ("organization_id");--> statement-breakpoint
CREATE INDEX "holidays_date_idx" ON "holidays" ("holiday_date");--> statement-breakpoint
CREATE INDEX "leave_requests_employee_id_idx" ON "leave_requests" ("employee_id");--> statement-breakpoint
CREATE INDEX "leave_requests_org_id_idx" ON "leave_requests" ("organization_id");--> statement-breakpoint
CREATE INDEX "leave_requests_status_idx" ON "leave_requests" ("status");--> statement-breakpoint
CREATE INDEX "locations_org_id_idx" ON "locations" ("organization_id");--> statement-breakpoint
CREATE INDEX "payroll_periods_org_id_idx" ON "payroll_periods" ("organization_id");--> statement-breakpoint
CREATE INDEX "payslips_employee_id_idx" ON "payslips" ("employee_id");--> statement-breakpoint
CREATE INDEX "payslips_org_id_idx" ON "payslips" ("organization_id");--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;