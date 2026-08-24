ALTER TABLE "activity_logs" ADD COLUMN IF NOT EXISTS "organization_id" integer;--> statement-breakpoint
DO $$
DECLARE
	organization_count integer;
	sole_organization_id integer;
BEGIN
	SELECT count(*), min("id")
	INTO organization_count, sole_organization_id
	FROM "organizations";

	IF organization_count = 1 THEN
		IF EXISTS (
			SELECT 1
			FROM "salary_structures"
			GROUP BY coalesce("organization_id", sole_organization_id), "name"
			HAVING count(*) > 1
		) THEN
			RAISE EXCEPTION 'Dayflow migration preflight: duplicate salary structure names must be reconciled before organization backfill';
		END IF;

		UPDATE "activity_logs"
		SET "organization_id" = sole_organization_id
		WHERE "organization_id" IS NULL;

		UPDATE "leave_policies"
		SET "organization_id" = sole_organization_id
		WHERE "organization_id" IS NULL;

		UPDATE "salary_components"
		SET "organization_id" = sole_organization_id
		WHERE "organization_id" IS NULL;

		UPDATE "salary_structures"
		SET "organization_id" = sole_organization_id
		WHERE "organization_id" IS NULL;
	ELSIF EXISTS (
		SELECT 1 FROM "leave_policies" WHERE "organization_id" IS NULL
		UNION ALL
		SELECT 1 FROM "salary_components" WHERE "organization_id" IS NULL
		UNION ALL
		SELECT 1 FROM "salary_structures" WHERE "organization_id" IS NULL
	) THEN
		RAISE EXCEPTION 'Dayflow migration preflight: assign organization_id on legacy leave/payroll configuration rows before continuing a multi-organization migration';
	END IF;
END $$;--> statement-breakpoint
ALTER TABLE "leave_policies" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "salary_components" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "salary_structures" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_logs_org_id_idx" ON "activity_logs" ("organization_id");--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
