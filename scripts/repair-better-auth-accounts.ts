import "dotenv/config";

import { neon } from "@neondatabase/serverless";

async function main() {
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const target = new URL(databaseUrl);
const targetLabel = `${target.hostname}${target.pathname}`;
const sql = neon(databaseUrl);

type TableState = {
  accountTable: string | null;
  issuerColumn: string | null;
  issuerNullable: boolean | null;
};

type IndexState = { definition: string | null };

function hasExpectedAccountIdentityIndex(indexState?: IndexState): boolean {
  const normalizedDefinition = indexState?.definition
    ?.replaceAll('"', "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return Boolean(
    normalizedDefinition?.includes("create unique index") &&
      normalizedDefinition.includes(" on public.account ") &&
      normalizedDefinition.endsWith("(issuer, account_id)"),
  );
}

const tableRows = (await sql`
  select
    to_regclass('public.account')::text as "accountTable",
    (
      select column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'account'
        and column_name = 'issuer'
    ) as "issuerColumn",
    (
      select is_nullable = 'YES'
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'account'
        and column_name = 'issuer'
    ) as "issuerNullable"
`) as TableState[];
const [tableState] = tableRows;

if (!tableState?.accountTable || !tableState.issuerColumn) {
  throw new Error(
    `Refusing to repair ${targetLabel}: public.account or account.issuer is missing.`,
  );
}

type AccountState = {
  accounts: number;
  missingIssuer: number;
  credentialIssuerMismatch: number;
  credentialKeyMismatch: number;
  githubIssuerMismatch: number;
};

const beforeRows = (await sql`
  select
    count(*)::int as accounts,
    count(*) filter (
      where issuer is null or btrim(issuer) = ''
    )::int as "missingIssuer",
    count(*) filter (
      where provider_id = 'credential'
        and issuer is distinct from 'local:credential'
    )::int as "credentialIssuerMismatch",
    count(*) filter (
      where provider_id = 'credential'
        and account_id is distinct from user_id
    )::int as "credentialKeyMismatch",
    count(*) filter (
      where provider_id = 'github'
        and issuer is distinct from 'local:oauth:github'
    )::int as "githubIssuerMismatch"
  from public.account
`) as AccountState[];
const [before] = beforeRows;

const unsupportedProviders = await sql`
  select distinct provider_id
  from public.account
  where (issuer is null or btrim(issuer) = '')
    and provider_id not in ('credential', 'github')
  order by provider_id
`;

if (unsupportedProviders.length > 0) {
  throw new Error(
    `Refusing to infer issuers for unsupported provider(s): ${unsupportedProviders
      .map(({ provider_id }) => String(provider_id))
      .join(", ")}. Add an explicit trusted issuer mapping first.`,
  );
}

const duplicateGroups = await sql`
  select resolved_issuer, resolved_account_id
  from (
    select
      case
        when provider_id = 'credential' then 'local:credential'
        when provider_id = 'github' then 'local:oauth:github'
        else issuer
      end as resolved_issuer,
      case
        when provider_id = 'credential' then user_id
        else account_id
      end as resolved_account_id
    from public.account
  ) as resolved_account
  group by resolved_issuer, resolved_account_id
  having count(*) > 1
`;

if (duplicateGroups.length > 0) {
  throw new Error(
    `Refusing to repair ${targetLabel}: ${duplicateGroups.length} duplicate account identity group(s) require manual reconciliation.`,
  );
}

const indexRows = (await sql`
  select indexdef as definition
  from pg_indexes
  where schemaname = 'public'
    and tablename = 'account'
    and indexname = 'account_issuer_account_id_uidx'
`) as IndexState[];
const [indexState] = indexRows;
const hasValidCompoundUniqueIndex = hasExpectedAccountIdentityIndex(indexState);

if (indexState && !hasValidCompoundUniqueIndex) {
  throw new Error(
    `Refusing to repair ${targetLabel}: account_issuer_account_id_uidx exists with an unexpected definition.`,
  );
}

console.log("Better Auth account repair preflight", {
  target: targetLabel,
  accounts: before?.accounts ?? 0,
  missingIssuer: before?.missingIssuer ?? 0,
  credentialIssuerMismatch: before?.credentialIssuerMismatch ?? 0,
  credentialKeyMismatch: before?.credentialKeyMismatch ?? 0,
  githubIssuerMismatch: before?.githubIssuerMismatch ?? 0,
  issuerNullable: tableState.issuerNullable,
  compoundUniqueIndex: hasValidCompoundUniqueIndex,
});

const requiresRepair =
  (before?.missingIssuer ?? 0) > 0 ||
  (before?.credentialIssuerMismatch ?? 0) > 0 ||
  (before?.credentialKeyMismatch ?? 0) > 0 ||
  (before?.githubIssuerMismatch ?? 0) > 0 ||
  tableState.issuerNullable !== false ||
  !hasValidCompoundUniqueIndex;

if (!requiresRepair) {
  console.log("Better Auth account identities already satisfy the 1.7 schema.");
  process.exit(0);
}

if (process.env.CONFIRM_AUTH_DB_REPAIR !== "1") {
  throw new Error(
    "Preflight only. Back up or branch this database, then rerun with CONFIRM_AUTH_DB_REPAIR=1.",
  );
}

const [, , credentialUpdates, issuerUpdates] = await sql.transaction((tx) => [
  tx`set local lock_timeout = '5s'`,
  tx`set local statement_timeout = '30s'`,
  tx`
    update public.account
    set account_id = user_id
    where provider_id = 'credential'
      and account_id <> user_id
    returning id
  `,
  tx`
    update public.account
    set issuer = case
      when provider_id = 'credential' then 'local:credential'
      when provider_id = 'github' then 'local:oauth:github'
      else issuer
    end
    where (provider_id = 'credential'
        and issuer is distinct from 'local:credential')
      or (provider_id = 'github'
        and issuer is distinct from 'local:oauth:github')
    returning id
  `,
  tx`alter table public.account alter column issuer set not null`,
  tx`
    create unique index if not exists account_issuer_account_id_uidx
    on public.account (issuer, account_id)
  `,
]);

type VerifiedAccountState = {
  missingIssuer: number;
  credentialIssuerMismatch: number;
  credentialKeyMismatch: number;
  githubIssuerMismatch: number;
};

const afterRows = (await sql`
  select
    count(*) filter (
      where issuer is null or btrim(issuer) = ''
    )::int as "missingIssuer",
    count(*) filter (
      where provider_id = 'credential'
        and issuer is distinct from 'local:credential'
    )::int as "credentialIssuerMismatch",
    count(*) filter (
      where provider_id = 'credential'
        and account_id is distinct from user_id
    )::int as "credentialKeyMismatch",
    count(*) filter (
      where provider_id = 'github'
        and issuer is distinct from 'local:oauth:github'
    )::int as "githubIssuerMismatch"
  from public.account
`) as VerifiedAccountState[];
const [after] = afterRows;

const repairedIndexRows = (await sql`
  select indexdef as definition
  from pg_indexes
  where schemaname = 'public'
    and tablename = 'account'
    and indexname = 'account_issuer_account_id_uidx'
`) as IndexState[];
const hasRepairedCompoundUniqueIndex = hasExpectedAccountIdentityIndex(
  repairedIndexRows[0],
);

if (
  !after ||
  after.missingIssuer !== 0 ||
  after.credentialIssuerMismatch !== 0 ||
  after.credentialKeyMismatch !== 0 ||
  after.githubIssuerMismatch !== 0 ||
  !hasRepairedCompoundUniqueIndex
) {
  throw new Error("Better Auth account repair verification failed.");
}

console.log("Better Auth account repair complete", {
  target: targetLabel,
  credentialAccountsUpdated: credentialUpdates.length,
  issuersUpdated: issuerUpdates.length,
  compoundUniqueIndex: true,
});
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
