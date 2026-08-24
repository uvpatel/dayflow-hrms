DO $$ BEGIN
    CREATE TYPE "attendance_status" AS ENUM('present', 'absent', 'half_day', 'leave', 'holiday');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "employee_status" AS ENUM('onboarding', 'active', 'notice_period', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "employment_type" AS ENUM('full_time', 'part_time', 'contract', 'intern');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "leave_request_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "leave_unit" AS ENUM('full_day', 'half_day');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DROP TABLE IF EXISTS "users";