ALTER TABLE "activity_logs" DROP CONSTRAINT IF EXISTS "activity_logs_organization_id_organizations_id_fkey";--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;