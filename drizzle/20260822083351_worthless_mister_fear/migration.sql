ALTER TABLE "attendance_corrections" ADD COLUMN "employee_id" integer;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD COLUMN "attendance_id" integer;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD COLUMN "requested_check_in_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD COLUMN "requested_check_out_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD COLUMN "reviewed_by" integer;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD COLUMN "review_comment" text;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "attendances" ADD COLUMN "work_date" date;--> statement-breakpoint
ALTER TABLE "attendances" ADD COLUMN "break_minutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "attendances" ADD COLUMN "work_minutes" integer;--> statement-breakpoint
ALTER TABLE "attendances" ADD COLUMN "overtime_minutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "attendances" ADD COLUMN "scheduled_start_minutes" integer;--> statement-breakpoint
ALTER TABLE "attendances" ADD COLUMN "scheduled_end_minutes" integer;--> statement-breakpoint
ALTER TABLE "attendances" ADD COLUMN "schedule_timezone" text DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "attendances" ADD COLUMN "is_late" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "unit" text DEFAULT 'full_day' NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "decision_comment" text;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "decided_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leave_types" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "leave_types" ADD COLUMN "requires_balance" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_types" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "timezone" text DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "payslips" ADD COLUMN "payroll_period_id" integer;--> statement-breakpoint
ALTER TABLE "payslips" ADD COLUMN "gross_salary" numeric(14,2);--> statement-breakpoint
ALTER TABLE "payslips" ADD COLUMN "deductions" numeric(14,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "payslips" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "work_schedules" ADD COLUMN "timezone" text DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "work_schedules" ADD COLUMN "shift_start_minutes" integer DEFAULT 540 NOT NULL;--> statement-breakpoint
ALTER TABLE "work_schedules" ADD COLUMN "shift_end_minutes" integer DEFAULT 1020 NOT NULL;--> statement-breakpoint
ALTER TABLE "work_schedules" ADD COLUMN "break_minutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "work_schedules" ADD COLUMN "full_day_minutes" integer DEFAULT 480 NOT NULL;--> statement-breakpoint
ALTER TABLE "work_schedules" ADD COLUMN "half_day_minutes" integer DEFAULT 240 NOT NULL;--> statement-breakpoint
ALTER TABLE "work_schedules" ADD COLUMN "grace_minutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "work_schedules" ADD COLUMN "weekdays" text DEFAULT '1,2,3,4,5' NOT NULL;--> statement-breakpoint
UPDATE "account"
SET "account_id" = "user_id"
WHERE "provider_id" = 'credential';--> statement-breakpoint
UPDATE "account"
SET "issuer" = CASE
	WHEN "provider_id" = 'credential' THEN 'local:credential'
	ELSE 'local:oauth:' || "provider_id"
END
WHERE "issuer" IS NULL OR btrim("issuer") = '';--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ALTER COLUMN "correction_date" SET DATA TYPE timestamp with time zone USING "correction_date" AT TIME ZONE 'UTC';--> statement-breakpoint
UPDATE "attendance_corrections"
SET "reason" = 'No reason provided'
WHERE "reason" IS NULL OR btrim("reason") = '';--> statement-breakpoint
ALTER TABLE "attendance_corrections" ALTER COLUMN "reason" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "attendances" ALTER COLUMN "date" SET DATA TYPE timestamp with time zone USING "date" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "attendances" ALTER COLUMN "check_in_time" SET DATA TYPE timestamp with time zone USING "check_in_time" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "attendances" ALTER COLUMN "check_out_time" SET DATA TYPE timestamp with time zone USING "check_out_time" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "attendances" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "attendances" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leave_allocations" ALTER COLUMN "allocated_days" SET DATA TYPE numeric(7,2) USING "allocated_days"::numeric(7,2);--> statement-breakpoint
ALTER TABLE "leave_allocations" ALTER COLUMN "used_days" SET DATA TYPE numeric(7,2) USING "used_days"::numeric(7,2);--> statement-breakpoint
ALTER TABLE "leave_allocations" ALTER COLUMN "used_days" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "leave_allocations" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leave_allocations" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "start_date" SET DATA TYPE timestamp with time zone USING "start_date" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "end_date" SET DATA TYPE timestamp with time zone USING "end_date" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "days" SET DATA TYPE numeric(7,2) USING "days"::numeric(7,2);--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "days" SET DEFAULT '1';--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "days" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leave_types" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leave_types" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payroll_periods" ALTER COLUMN "start_date" SET DATA TYPE timestamp with time zone USING "start_date" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "payroll_periods" ALTER COLUMN "end_date" SET DATA TYPE timestamp with time zone USING "end_date" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "payroll_periods" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payroll_periods" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payslips" ALTER COLUMN "basic_salary" SET DATA TYPE numeric(14,2) USING "basic_salary"::numeric(14,2);--> statement-breakpoint
ALTER TABLE "payslips" ALTER COLUMN "net_salary" SET DATA TYPE numeric(14,2) USING "net_salary"::numeric(14,2);--> statement-breakpoint
ALTER TABLE "payslips" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payslips" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "work_schedules" ALTER COLUMN "start_date" SET DATA TYPE timestamp with time zone USING "start_date" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "work_schedules" ALTER COLUMN "end_date" SET DATA TYPE timestamp with time zone USING "end_date" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "work_schedules" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "work_schedules" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
WITH attendance_work_dates AS (
	SELECT
		"id",
		("date" AT TIME ZONE 'UTC')::date AS "resolved_work_date",
		count(*) OVER (
			PARTITION BY "employee_id", ("date" AT TIME ZONE 'UTC')::date
		) AS "records_for_day"
	FROM "attendances"
	WHERE "employee_id" IS NOT NULL
)
UPDATE "attendances" AS attendance
SET "work_date" = attendance_work_dates."resolved_work_date"
FROM attendance_work_dates
WHERE attendance."id" = attendance_work_dates."id"
	AND attendance_work_dates."records_for_day" = 1;--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_account_id_uidx" ON "account" ("issuer","account_id");--> statement-breakpoint
CREATE INDEX "attendance_corrections_user_id_idx" ON "attendance_corrections" ("user_id");--> statement-breakpoint
CREATE INDEX "attendance_corrections_employee_id_idx" ON "attendance_corrections" ("employee_id");--> statement-breakpoint
CREATE INDEX "attendance_corrections_org_status_idx" ON "attendance_corrections" ("organization_id","status");--> statement-breakpoint
CREATE INDEX "attendance_corrections_attendance_id_idx" ON "attendance_corrections" ("attendance_id");--> statement-breakpoint
CREATE INDEX "attendance_corrections_reviewed_by_idx" ON "attendance_corrections" ("reviewed_by");--> statement-breakpoint
CREATE INDEX "attendances_org_work_date_idx" ON "attendances" ("organization_id","work_date");--> statement-breakpoint
CREATE INDEX "attendances_employee_work_date_idx" ON "attendances" ("employee_id","work_date");--> statement-breakpoint
CREATE UNIQUE INDEX "attendances_employee_work_date_uidx" ON "attendances" ("employee_id","work_date") WHERE "employee_id" is not null and "work_date" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "attendances_one_open_per_employee_uidx" ON "attendances" ("employee_id") WHERE "employee_id" is not null and "check_in_time" is not null and "check_out_time" is null;--> statement-breakpoint
CREATE INDEX "employees_manager_id_idx" ON "employees" ("manager_id");--> statement-breakpoint
CREATE INDEX "employees_org_manager_id_idx" ON "employees" ("organization_id","manager_id");--> statement-breakpoint
CREATE INDEX "employees_department_id_idx" ON "employees" ("department_id");--> statement-breakpoint
CREATE INDEX "employees_designation_id_idx" ON "employees" ("designation_id");--> statement-breakpoint
CREATE INDEX "employees_location_id_idx" ON "employees" ("location_id");--> statement-breakpoint
CREATE INDEX "employees_work_schedule_id_idx" ON "employees" ("work_schedule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_email_uidx" ON "employees" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_employee_number_uidx" ON "employees" ("employee_number") WHERE "employee_number" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "leave_allocations_employee_type_uidx" ON "leave_allocations" ("employee_id","leave_type");--> statement-breakpoint
CREATE INDEX "leave_allocations_employee_id_idx" ON "leave_allocations" ("employee_id");--> statement-breakpoint
CREATE INDEX "leave_requests_employee_dates_idx" ON "leave_requests" ("employee_id","start_date","end_date");--> statement-breakpoint
CREATE INDEX "leave_requests_org_status_created_idx" ON "leave_requests" ("organization_id","status","created_at");--> statement-breakpoint
CREATE INDEX "leave_requests_approved_by_idx" ON "leave_requests" ("approved_by");--> statement-breakpoint
CREATE INDEX "leave_types_organization_id_idx" ON "leave_types" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "leave_types_organization_name_uidx" ON "leave_types" ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_periods_org_dates_uidx" ON "payroll_periods" ("organization_id","start_date","end_date") WHERE "organization_id" is not null and "start_date" is not null and "end_date" is not null;--> statement-breakpoint
CREATE INDEX "payslips_payroll_period_id_idx" ON "payslips" ("payroll_period_id");--> statement-breakpoint
CREATE INDEX "payslips_org_status_idx" ON "payslips" ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "payslips_employee_period_uidx" ON "payslips" ("employee_id","payroll_period_id") WHERE "employee_id" is not null and "payroll_period_id" is not null;--> statement-breakpoint
CREATE INDEX "work_schedules_employee_id_idx" ON "work_schedules" ("employee_id");--> statement-breakpoint
CREATE INDEX "work_schedules_employee_dates_idx" ON "work_schedules" ("employee_id","start_date","end_date");--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_attendance_id_attendances_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "attendances"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_reviewed_by_employees_id_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "employees"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_departments_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_designation_id_designations_id_fkey" FOREIGN KEY ("designation_id") REFERENCES "designations"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_id_employees_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "leave_allocations" ADD CONSTRAINT "leave_allocations_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approved_by_employees_id_fkey" FOREIGN KEY ("approved_by") REFERENCES "employees"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "leave_types" ADD CONSTRAINT "leave_types_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payroll_period_id_payroll_periods_id_fkey" FOREIGN KEY ("payroll_period_id") REFERENCES "payroll_periods"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_status_check" CHECK ("status" in ('pending', 'approved', 'rejected', 'cancelled'));--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_requested_times_check" CHECK ("requested_check_out_time" is null or ("requested_check_in_time" is not null and "requested_check_out_time" >= "requested_check_in_time"));--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_checkout_after_checkin_check" CHECK ("check_out_time" is null or ("check_in_time" is not null and "check_out_time" >= "check_in_time"));--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_duration_nonnegative_check" CHECK ("break_minutes" >= 0 and ("work_minutes" is null or "work_minutes" >= 0) and "overtime_minutes" >= 0);--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_status_check" CHECK ("status" in ('present', 'absent', 'half_day', 'leave', 'holiday'));--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_not_self_check" CHECK ("manager_id" is null or "manager_id" <> "id");--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_role_check" CHECK ("role" in ('admin', 'hr', 'manager', 'employee'));--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_status_check" CHECK ("employment_status" in ('active', 'onboarding', 'notice_period', 'inactive'));--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_type_check" CHECK ("employment_type" is null or "employment_type" in ('full_time', 'part_time', 'contract', 'intern'));--> statement-breakpoint
ALTER TABLE "leave_allocations" ADD CONSTRAINT "leave_allocations_values_check" CHECK ("allocated_days" >= 0 and "used_days" >= 0 and "used_days" <= "allocated_days");--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_dates_check" CHECK ("end_date" >= "start_date");--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_days_check" CHECK ("days" > 0);--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_unit_check" CHECK ("unit" in ('full_day', 'half_day'));--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_status_check" CHECK ("status" in ('pending', 'approved', 'rejected', 'cancelled'));--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_rejection_reason_check" CHECK ("status" <> 'rejected' or nullif(btrim("rejection_reason"), '') is not null);--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_dates_check" CHECK ("start_date" is null or "end_date" is null or "end_date" >= "start_date");--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_status_check" CHECK ("status" in ('draft', 'calculating', 'review', 'finalized', 'published'));--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_status_check" CHECK ("status" in ('draft', 'calculated', 'reviewed', 'published', 'void'));--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_money_nonnegative_check" CHECK (("basic_salary" is null or "basic_salary" >= 0) and ("gross_salary" is null or "gross_salary" >= 0) and ("deductions" is null or "deductions" >= 0) and ("net_salary" is null or "net_salary" >= 0));--> statement-breakpoint
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_shift_minutes_check" CHECK ("shift_start_minutes" between 0 and 1439 and "shift_end_minutes" between 1 and 1440 and "shift_end_minutes" > "shift_start_minutes");--> statement-breakpoint
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_duration_minutes_check" CHECK ("break_minutes" >= 0 and "half_day_minutes" > 0 and "full_day_minutes" >= "half_day_minutes" and "grace_minutes" >= 0);--> statement-breakpoint
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_dates_check" CHECK ("end_date" is null or "end_date" >= "start_date");
