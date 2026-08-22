ALTER TABLE "designations" ADD COLUMN "department_id" integer;--> statement-breakpoint
CREATE INDEX "designations_department_id_idx" ON "designations" ("department_id");--> statement-breakpoint
ALTER TABLE "designations" ADD CONSTRAINT "designations_department_id_departments_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL;