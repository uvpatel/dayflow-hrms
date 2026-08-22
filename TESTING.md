# Testing Dayflow

Dayflow uses Bun's test runner, TypeScript, ESLint, and the Next.js production compiler. Tests are intentionally divided between pure authorization/domain tests, which run without a database, and database-backed workflow checks, which require a disposable development database.

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

## Database verification

Never run migrations or the seed against an unconfirmed shared or production database. After setting `DATABASE_URL` to a disposable development branch:

```bash
bun run db:generate
bun run db:migrate
bun run db:seed
```

Run `db:generate` before `db:migrate` when a Drizzle schema changed, inspect the generated SQL, and keep every existing migration intact.

## Test coverage

The automated suite covers:

- Role normalization and route/permission policy.
- Employee isolation from other employees' payroll and private records.
- Manager team access without organization-wide payroll permission.
- HR and administrator management boundaries.
- Better Auth account columns required by GitHub OAuth.
- Post-authentication routing for known and unknown roles.
- Attendance transition and duration rules.
- Employee-manager self/cycle validation.
- Leave date, overlap, balance, and decision rules.

Database route handlers should additionally be exercised against a disposable branch for concurrent check-in uniqueness and transaction rollback behavior. Those checks are not claimed as executed unless the test report explicitly names the database environment.

## Manual workflow checklist

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

A change is ready only when all four non-mutating commands exit successfully and generated migration SQL has been reviewed. Warnings must be resolved rather than hidden with `any`, `@ts-ignore`, disabled lint rules, or fake responses.
