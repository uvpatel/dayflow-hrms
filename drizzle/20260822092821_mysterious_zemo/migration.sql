ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "employee_number" text;--> statement-breakpoint
ALTER TABLE "leave_policies" ADD COLUMN IF NOT EXISTS "organization_id" integer;--> statement-breakpoint
ALTER TABLE "salary_components" ADD COLUMN IF NOT EXISTS "organization_id" integer;--> statement-breakpoint
ALTER TABLE "salary_structures" ADD COLUMN IF NOT EXISTS "organization_id" integer;--> statement-breakpoint
ALTER TABLE "leave_policies" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leave_policies" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "salary_components" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "salary_components" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "salary_structures" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "salary_structures" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user" ADD CONSTRAINT "user_employee_number_key" UNIQUE("employee_number");
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leave_policies_org_id_idx" ON "leave_policies" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "salary_components_org_id_idx" ON "salary_components" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "salary_structures_org_id_idx" ON "salary_structures" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "salary_structures_org_name_uidx" ON "salary_structures" ("organization_id","name") WHERE "organization_id" is not null;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "leave_policies" ADD CONSTRAINT "leave_policies_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "salary_components" ADD CONSTRAINT "salary_components_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;