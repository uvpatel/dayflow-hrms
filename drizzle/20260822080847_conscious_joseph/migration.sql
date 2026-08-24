ALTER TABLE "designations" ADD COLUMN IF NOT EXISTS "department_id" integer;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "designations_department_id_idx" ON "designations" ("department_id");--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "designations" ADD CONSTRAINT "designations_department_id_departments_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;