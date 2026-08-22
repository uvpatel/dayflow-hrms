# Testing Dayflow

Dayflow uses Bun's test runner, TypeScript, ESLint, and the Next.js production compiler. Tests are intentionally divided between pure authorization/domain tests, which run without a database, and database-backed workflow checks, which require a disposable development database.

## Current verification status

At the 2026-08-22 documentation checkpoint:

- `bun test` passed **26 tests, 0 failed, 77 assertions** across two files.
- `tests/permissions.test.ts` contains 12 permission, auth-schema, page-policy, and redirect tests.
- `tests/business-domain.test.ts` contains 14 attendance, manager-assignment, leave, and payroll-money tests.
- This pass generated `drizzle/20260822083351_worthless_mister_fear` and the final follow-up `drizzle/20260822092821_mysterious_zemo`; a subsequent `db:generate` reported no additional schema changes.
- No migration, seed, database-backed route test, concurrent workflow test, or rollback test was executed.
- Lint, typecheck, and production-build results are separate quality gates and are not implied by the unit-test result.

## Safe local verification

These commands do not mutate the database:

```bash
bun run lint
bun run typecheck
bun test
bun run build
```

Run a focused test file with:

```bash
bun test tests/permissions.test.ts
```

The focused domain suite is:

```bash
bun test tests/business-domain.test.ts
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

- Role normalization and route/permission policy.
- Employee-resource scope decisions, including payroll isolation.
- Manager team scope without organization-wide payroll permission.
- HR and administrator management boundaries.
- The Better Auth `account.issuer` schema mapping required by the installed adapter.
- Post-authentication routing for known and unknown roles.
- Attendance transition and duration rules.
- Employee-manager self/cycle validation.
- Leave date, scheduled-workday/holiday duration, overlap, balance, actor scope, and decision rules.
- Exact-cent payroll parsing/formatting, server-derived net pay, and invalid deduction rejection.

These are pure-function and schema-shape tests. They do not issue HTTP requests or SQL and therefore do not prove route-handler guards, foreign keys, generated migration compatibility, transaction rollback, or concurrent uniqueness.

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

A release candidate is ready for database staging only when all four non-mutating commands exit successfully and generated migration SQL has been reviewed. Production release additionally requires the disposable-database workflow checks above, representative-data migration validation, and closure of the known limitations in `README.md` and `IMPLEMENTATION_PLAN.md`. Warnings must be resolved rather than hidden with `any`, `@ts-ignore`, disabled lint rules, or fake responses.
