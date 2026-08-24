import { getHostFromSource, matchesHostPattern } from "better-auth";
import { type NextRequest, NextResponse } from "next/server";

import {
  isSecureProductionAuthOrigin,
  normalizeAuthOrigin,
  resolveAllowedAuthHosts,
  resolveCanonicalAuthUrl,
  resolveTrustedOrigins,
} from "@/lib/auth/url";
import { logAuthDiagnostic } from "@/lib/auth/diagnostics";

export const dynamic = "force-dynamic";

type HealthState = "ok" | "error";

function deploymentEnvironment(): "development" | "preview" | "production" {
  if (process.env.VERCEL_ENV === "preview") return "preview";
  if (process.env.VERCEL_ENV === "production") return "production";
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

function isBooleanSetting(value?: string): boolean {
  if (value == null || value.trim() === "") return true;
  return [
    "1",
    "true",
    "yes",
    "on",
    "0",
    "false",
    "no",
    "off",
  ].includes(value.trim().toLowerCase());
}

function booleanSetting(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value.trim() === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function isDatabaseUrl(value?: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return ["postgres:", "postgresql:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function hasValidEmailConfiguration(
  isProduction: boolean,
  requireVerification: boolean,
): boolean {
  const providerUrl = process.env.EMAIL_PROVIDER_API_URL?.trim();
  const providerKey = process.env.EMAIL_PROVIDER_API_KEY?.trim();

  if (Boolean(providerUrl) !== Boolean(providerKey)) return false;
  if (isProduction && requireVerification) {
    if (!providerUrl || !providerKey || !process.env.EMAIL_FROM?.trim()) {
      return false;
    }
  }
  if (!providerUrl) return true;

  try {
    const url = new URL(providerUrl);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      (!isProduction || url.protocol === "https:")
    );
  } catch {
    return false;
  }
}

function configurationIsValid(request: NextRequest): boolean {
  const isProduction = process.env.NODE_ENV === "production";
  const canonicalUrl = resolveCanonicalAuthUrl();
  const githubClientId = process.env.GITHUB_CLIENT_ID?.trim();
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
  const explicitAuthUrl = process.env.BETTER_AUTH_URL?.trim();
  const authSecret = process.env.BETTER_AUTH_SECRET?.trim();

  if (explicitAuthUrl && !normalizeAuthOrigin(explicitAuthUrl)) return false;
  if (!canonicalUrl) return false;
  if (isProduction && !isSecureProductionAuthOrigin(canonicalUrl)) return false;
  if (authSecret && authSecret.length < 32) return false;
  if (isProduction && !authSecret) return false;
  if (!isDatabaseUrl(process.env.DATABASE_URL)) return false;
  if (Boolean(githubClientId) !== Boolean(githubClientSecret)) return false;
  if (
    isProduction &&
    process.env.VERCEL_ENV !== "preview" &&
    (!githubClientId || !githubClientSecret)
  ) {
    return false;
  }
  if (!isBooleanSetting(process.env.AUTH_REQUIRE_EMAIL_VERIFICATION)) {
    return false;
  }
  const requireEmailVerification = booleanSetting(
    process.env.AUTH_REQUIRE_EMAIL_VERIFICATION,
    true,
  );
  if (isProduction && !requireEmailVerification) return false;
  if (!isBooleanSetting(process.env.AUTH_TRUST_PROXY_HEADERS)) return false;
  if (
    !hasValidEmailConfiguration(isProduction, requireEmailVerification)
  ) {
    return false;
  }

  // These functions also validate every explicit origin and Vercel system URL.
  const trustedOrigins = resolveTrustedOrigins();
  const allowedHosts = resolveAllowedAuthHosts();
  const trustProxyHeaders = booleanSetting(
    process.env.AUTH_TRUST_PROXY_HEADERS,
    process.env.VERCEL === "1",
  );
  const requestHost = getHostFromSource(request, trustProxyHeaders);

  return (
    trustedOrigins.length > 0 &&
    allowedHosts.length > 0 &&
    Boolean(
      requestHost &&
        allowedHosts.some((pattern) =>
          matchesHostPattern(requestHost, pattern),
        ),
    )
  );
}

async function inspectDatabase(): Promise<{
  database: HealthState;
  authSchema: HealthState;
}> {
  try {
    const { sql } = await import("@/db");
    const rows = (await sql`
      with required_columns(table_name, column_name, data_type, is_nullable) as (
        values
          ('user', 'id', 'text', 'NO'),
          ('user', 'name', 'text', 'NO'),
          ('user', 'email', 'text', 'NO'),
          ('user', 'email_verified', 'boolean', 'NO'),
          ('user', 'image', 'text', 'ANY'),
          ('user', 'employee_number', 'text', 'ANY'),
          ('user', 'role', 'text', 'ANY'),
          ('user', 'banned', 'boolean', 'ANY'),
          ('user', 'ban_reason', 'text', 'ANY'),
          ('user', 'ban_expires', 'timestamp without time zone', 'ANY'),
          ('user', 'created_at', 'timestamp without time zone', 'NO'),
          ('user', 'updated_at', 'timestamp without time zone', 'NO'),
          ('session', 'id', 'text', 'NO'),
          ('session', 'token', 'text', 'NO'),
          ('session', 'expires_at', 'timestamp without time zone', 'NO'),
          ('session', 'user_id', 'text', 'NO'),
          ('session', 'impersonated_by', 'text', 'ANY'),
          ('session', 'ip_address', 'text', 'ANY'),
          ('session', 'user_agent', 'text', 'ANY'),
          ('session', 'created_at', 'timestamp without time zone', 'NO'),
          ('session', 'updated_at', 'timestamp without time zone', 'NO'),
          ('account', 'id', 'text', 'NO'),
          ('account', 'account_id', 'text', 'NO'),
          ('account', 'provider_id', 'text', 'NO'),
          ('account', 'issuer', 'text', 'NO'),
          ('account', 'user_id', 'text', 'NO'),
          ('account', 'password', 'text', 'ANY'),
          ('account', 'access_token', 'text', 'ANY'),
          ('account', 'refresh_token', 'text', 'ANY'),
          ('account', 'id_token', 'text', 'ANY'),
          ('account', 'access_token_expires_at', 'timestamp without time zone', 'ANY'),
          ('account', 'refresh_token_expires_at', 'timestamp without time zone', 'ANY'),
          ('account', 'scope', 'text', 'ANY'),
          ('account', 'created_at', 'timestamp without time zone', 'NO'),
          ('account', 'updated_at', 'timestamp without time zone', 'NO'),
          ('verification', 'id', 'text', 'NO'),
          ('verification', 'identifier', 'text', 'NO'),
          ('verification', 'value', 'text', 'NO'),
          ('verification', 'expires_at', 'timestamp without time zone', 'NO'),
          ('verification', 'created_at', 'timestamp without time zone', 'NO'),
          ('verification', 'updated_at', 'timestamp without time zone', 'NO')
      ),
      required_indexes(index_name, unique_required, column_fragment) as (
        values
          ('user_email_key', true, '(email)'),
          ('user_employee_number_key', true, '(employee_number)'),
          ('session_token_key', true, '(token)'),
          ('session_userId_idx', false, '(user_id)'),
          ('account_userId_idx', false, '(user_id)'),
          ('account_issuer_account_id_uidx', true, '(issuer, account_id)'),
          ('verification_identifier_idx', false, '(identifier)')
      ),
      required_foreign_keys(
        constraint_name,
        table_name,
        column_name,
        target_table,
        target_column
      ) as (
        values
          ('session_user_id_user_id_fkey', 'session', 'user_id', 'user', 'id'),
          ('account_user_id_user_id_fkey', 'account', 'user_id', 'user', 'id')
      )
      select
        not exists (
          select 1
          from required_columns required
          where not exists (
            select 1
            from information_schema.columns actual
            where actual.table_schema = 'public'
              and actual.table_name = required.table_name
              and actual.column_name = required.column_name
              and actual.data_type = required.data_type
              and (
                required.is_nullable = 'ANY'
                or actual.is_nullable = required.is_nullable
              )
          )
        )
        and not exists (
          select 1
          from required_indexes required
          where not exists (
            select 1
            from pg_indexes actual
            where actual.schemaname = 'public'
              and actual.indexname = required.index_name
              and (
                not required.unique_required
                or lower(actual.indexdef) like '%create unique index%'
              )
              and lower(replace(actual.indexdef, '"', ''))
                like '%' || required.column_fragment || '%'
          )
        )
        and not exists (
          select 1
          from required_foreign_keys required
          where not exists (
            select 1
            from information_schema.table_constraints constraint_info
            join information_schema.key_column_usage key_info
              on key_info.constraint_schema = constraint_info.constraint_schema
              and key_info.constraint_name = constraint_info.constraint_name
            join information_schema.constraint_column_usage target_info
              on target_info.constraint_schema = constraint_info.constraint_schema
              and target_info.constraint_name = constraint_info.constraint_name
            join information_schema.referential_constraints reference_info
              on reference_info.constraint_schema = constraint_info.constraint_schema
              and reference_info.constraint_name = constraint_info.constraint_name
            where constraint_info.constraint_schema = 'public'
              and constraint_info.constraint_type = 'FOREIGN KEY'
              and constraint_info.constraint_name = required.constraint_name
              and constraint_info.table_name = required.table_name
              and key_info.column_name = required.column_name
              and target_info.table_name = required.target_table
              and target_info.column_name = required.target_column
              and reference_info.delete_rule = 'CASCADE'
          )
        ) as "schemaReady"
    `) as Array<{ schemaReady: boolean }>;

    return {
      database: "ok",
      authSchema: rows[0]?.schemaReady ? "ok" : "error",
    };
  } catch (error) {
    logAuthDiagnostic("AUTH_DATABASE_ERROR", {
      stage: "health-check",
      error,
    });
    return { database: "error", authSchema: "error" };
  }
}

export async function GET(request: NextRequest) {
  let configuration: HealthState = "ok";
  let configurationError: unknown;
  try {
    if (!configurationIsValid(request)) configuration = "error";
  } catch (error) {
    configuration = "error";
    configurationError = error;
  }

  if (configuration === "error") {
    logAuthDiagnostic("AUTH_CONFIGURATION_ERROR", {
      stage: "health-check",
      error: configurationError,
    });
  }

  const databaseChecks = await inspectDatabase();
  const status =
    configuration === "ok" &&
    databaseChecks.database === "ok" &&
    databaseChecks.authSchema === "ok"
      ? "ok"
      : "degraded";

  return NextResponse.json(
    {
      status,
      environment: deploymentEnvironment(),
      checks: {
        configuration,
        database: databaseChecks.database,
        authSchema: databaseChecks.authSchema,
      },
    },
    {
      status: status === "ok" ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
