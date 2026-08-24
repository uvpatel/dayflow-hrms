import "dotenv/config";

import { neon } from "@neondatabase/serverless";

type TableState = {
  accountTable: string | null;
  accountIdColumn: string | null;
  accountIdNullable: boolean | null;
  issuerColumn: string | null;
  issuerNullable: boolean | null;
};

type IndexState = { definition: string | null };

type AccountState = {
  accounts: number;
  missingAccountId: number;
  missingNonCredentialAccountId: number;
  missingIssuer: number;
  credentialIssuerMismatch: number;
  credentialKeyMismatch: number;
  githubIssuerMismatch: number;
};

type VerifiedAccountState = Omit<AccountState, "accounts">;

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

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  const target = new URL(databaseUrl);
  const targetLabel = `${target.hostname}${target.pathname}`;
  const sql = neon(databaseUrl);

  const tableRows = (await sql`
    select
      to_regclass('public.account')::text as "accountTable",
      (
        select column_name
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'account'
          and column_name = 'account_id'
      ) as "accountIdColumn",
      (
        select is_nullable = 'YES'
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'account'
          and column_name = 'account_id'
      ) as "accountIdNullable",
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

  if (!tableState?.accountTable) {
    throw new Error(
      `Refusing to repair ${targetLabel}: public.account is missing. Inspect the Drizzle migration ledger and create the Better Auth tables with a reviewed, data-preserving migration; do not replay destructive migration history against a populated database.`,
    );
  }

  if (!tableState.issuerColumn) {
    throw new Error(
      `Refusing to repair ${targetLabel}: public.account.issuer is missing. On a verified Neon backup or branch, first apply "ALTER TABLE public.account ADD COLUMN issuer text;" and leave it nullable. Then rerun this preflight; do not set NOT NULL or add the unique index until the issuer backfill passes.`,
    );
  }

  if (!tableState.accountIdColumn) {
    throw new Error(
      `Refusing to repair ${targetLabel}: public.account.account_id is missing. Inspect the legacy account identity columns and create a reviewed, data-preserving mapping; this script cannot safely infer OAuth account IDs from another column name.`,
    );
  }

  const beforeRows = (await sql`
    select
      count(*)::int as accounts,
      count(*) filter (
        where account_id is null or btrim(account_id) = ''
      )::int as "missingAccountId",
      count(*) filter (
        where (account_id is null or btrim(account_id) = '')
          and provider_id <> 'credential'
      )::int as "missingNonCredentialAccountId",
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

  if ((before?.missingNonCredentialAccountId ?? 0) > 0) {
    throw new Error(
      `Refusing to repair ${targetLabel}: ${before?.missingNonCredentialAccountId ?? 0} non-credential account(s) have no stable account_id and require manual provider-identity reconciliation.`,
    );
  }

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
  const hasValidCompoundUniqueIndex =
    hasExpectedAccountIdentityIndex(indexState);

  if (indexState && !hasValidCompoundUniqueIndex) {
    throw new Error(
      `Refusing to repair ${targetLabel}: account_issuer_account_id_uidx exists with an unexpected definition.`,
    );
  }

  console.log("Better Auth account repair preflight", {
    target: targetLabel,
    accounts: before?.accounts ?? 0,
    missingAccountId: before?.missingAccountId ?? 0,
    missingIssuer: before?.missingIssuer ?? 0,
    credentialIssuerMismatch: before?.credentialIssuerMismatch ?? 0,
    credentialKeyMismatch: before?.credentialKeyMismatch ?? 0,
    githubIssuerMismatch: before?.githubIssuerMismatch ?? 0,
    accountIdNullable: tableState.accountIdNullable,
    issuerNullable: tableState.issuerNullable,
    compoundUniqueIndex: hasValidCompoundUniqueIndex,
  });

  const requiresRepair =
    (before?.missingAccountId ?? 0) > 0 ||
    (before?.missingIssuer ?? 0) > 0 ||
    (before?.credentialIssuerMismatch ?? 0) > 0 ||
    (before?.credentialKeyMismatch ?? 0) > 0 ||
    (before?.githubIssuerMismatch ?? 0) > 0 ||
    tableState.accountIdNullable !== false ||
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
        and account_id is distinct from user_id
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
    tx`alter table public.account alter column account_id set not null`,
    tx`alter table public.account alter column issuer set not null`,
    tx`
      create unique index if not exists account_issuer_account_id_uidx
      on public.account (issuer, account_id)
    `,
  ]);

  const afterRows = (await sql`
    select
      count(*) filter (
        where account_id is null or btrim(account_id) = ''
      )::int as "missingAccountId",
      count(*) filter (
        where (account_id is null or btrim(account_id) = '')
          and provider_id <> 'credential'
      )::int as "missingNonCredentialAccountId",
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
    after.missingAccountId !== 0 ||
    after.missingNonCredentialAccountId !== 0 ||
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
