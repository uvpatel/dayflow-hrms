# Testing Dayflow

Dayflow uses Bun's test runner, TypeScript, ESLint, and the Next.js production compiler. Tests are intentionally divided between pure authorization/domain tests, which run without a database, and database-backed workflow checks, which require a disposable development database.

## Current verification status

At the 2026-08-24 authentication audit checkpoint:

- `bun test` passed **32 tests, 0 failed, 109 assertions** across four files.
- `tests/auth-url.test.ts` covers canonical URL resolution, strict production
  validation, exact origins, scoped wildcard rules, and the dynamic request-host
  allowlist.
- `tests/auth-access.test.ts` covers the employee access boundary and safe OAuth
  callback paths.
- `tests/auth-routing.test.ts` proves there is one Better Auth handler and no
  business API beneath `/api/auth`.
- `tests/auth-config.test.ts` exercises production startup guards for GitHub
  credentials and verification-email delivery.
- `drizzle-kit check` succeeded and `drizzle-kit generate --explain --output
  json` reported `no_changes`.
- A production-configured `bun run build --webpack` completed all compilation,
  TypeScript, page-generation, and trace-collection stages. The default
  Turbopack build was also attempted, but this execution sandbox denied the
  CSS worker's internal port with `EPERM`; no application diagnostic preceded
  that environment-level failure.
- No migration, seed, database-backed route test, concurrent workflow test, or rollback test was executed.
- Lint, typecheck, and production-build results are separate quality gates and are not implied by the unit-test result.

## Safe local verification

These commands do not mutate the database:

```bash
bun run lint
bun run typecheck
bun test
```

`next build` runs with `NODE_ENV=production`, and Dayflow deliberately rejects
the localhost development URL, disabled verification, or missing production
providers in that mode. Load the Vercel Production environment (or an
equivalent safe production-like environment) before running the exact build
command:

```bash
bun run build
```

A bare build using the recommended localhost `.env` is expected to stop with
`AUTH_CONFIGURATION_ERROR`; that fail-fast behavior is the production guard,
not a compiler failure.

Run a focused test file with:

```bash
bun test tests/auth-url.test.ts
```

The complete focused authentication suite is:

```bash
bun test tests/auth-url.test.ts tests/auth-config.test.ts tests/auth-access.test.ts tests/auth-routing.test.ts
```

## Database verification

Never run migrations or the seed against an unconfirmed shared or production database. Generation is non-mutating and has already produced the latest artifact; application and seed execution remain pending. After setting `DATABASE_URL` to a disposable development branch:

```bash
bun run db:generate
bun run db:migrate
bun run db:seed
```

Run `db:generate` before `db:migrate` when a Drizzle schema changed, inspect the generated SQL, and keep every existing migration intact.

## Test coverage

The current pure unit suite covers:

- Canonical Better Auth URL normalization and priority.
- Production rejection of missing, HTTP, or loopback auth origins.
- Exact custom, Vercel production, branch, and deployment origins.
- Rejection of universal, broad Vercel, insecure, and scheme-less production wildcards.
- Request-host allowlist derivation.
- Valid-session, linked-employee, and active-employment access states.
- Safe same-application OAuth callback paths and open-redirect rejection.
- Better Auth handler uniqueness and `/api/auth` namespace ownership.

These are pure-function and static routing tests. They do not issue authenticated HTTP requests or SQL and therefore do not prove route-handler guards, foreign keys, generated migration compatibility, transaction rollback, or concurrent uniqueness.

Database route handlers should additionally be exercised against a disposable branch for:

- Auth signup, verification, signin, reset, session expiry, rate limits, and OAuth callback/error handling.
- Tenant and row isolation for employee, manager, HR, and administrator accounts.
- Concurrent check-in uniqueness and competing check-out behavior.
- Attendance correction ownership and review transitions.
- Leave overlap, pending-only cancellation, required rejection comments, atomic balance updates, notification/audit writes, and rollback on failure.
- Payroll period state transitions, publication visibility, locking, decimal accuracy, and cross-organization isolation.
- Migration preflight with representative duplicate, orphaned, and malformed legacy data.
- Repeat seed execution without duplicate logical records.

None of those database-backed checks is claimed as executed unless a test report names the disposable database environment.

## Manual workflow checklist

This checklist is a recommended verification run, not a record of completed testing.

Use separate employee, manager, HR, and administrator development accounts.

1. Sign in and verify the canonical redirect reaches `/dashboard` without a loop.
2. Confirm each role sees only its permitted navigation.
3. As an employee, check in once and verify a duplicate check-in is rejected.
4. Check out and confirm the attendance history displays the server-calculated duration.
5. Submit a leave request and verify it appears as pending.
6. As that employee's manager or HR, approve or reject it with a comment.
7. Return to the employee account and verify the status, balance, and notification.
8. As HR, create an onboarding employee and assign organization fields.
9. As the assigned manager, verify the employee appears in My Team.
10. Attempt cross-employee payroll and attendance URLs as an employee and expect `403` or `404` without sensitive data.

## Release gate

A release candidate is ready for database staging only when lint, typecheck,
tests, and a production-configured build exit successfully and generated
migration SQL has been reviewed. Production release additionally requires the
disposable-database workflow checks above, representative-data migration
validation, and closure of the known limitations in `README.md` and
`IMPLEMENTATION_PLAN.md`. Warnings must be resolved rather than hidden with
`any`, `@ts-ignore`, disabled lint rules, or fake responses.
