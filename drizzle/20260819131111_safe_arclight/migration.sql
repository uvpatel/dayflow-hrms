CREATE TYPE "attendance_status" AS ENUM('present', 'absent', 'half_day', 'leave', 'holiday');--> statement-breakpoint
CREATE TYPE "employee_status" AS ENUM('onboarding', 'active', 'notice_period', 'inactive');--> statement-breakpoint
CREATE TYPE "employment_type" AS ENUM('full_time', 'part_time', 'contract', 'intern');--> statement-breakpoint
CREATE TYPE "leave_request_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "leave_unit" AS ENUM('full_day', 'half_day');--> statement-breakpoint
DROP TABLE "users";