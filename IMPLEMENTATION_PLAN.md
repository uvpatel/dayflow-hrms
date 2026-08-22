# Dayflow HRMS — Implementation Plan

Last audited: 2026-08-22

## Goal and constraints

Dayflow is being consolidated into one Next.js 16 App Router HRMS with four lowercase roles: `employee`, `manager`, `hr`, and `admin`. The target is secure employee self-service, direct-report workflows, organization operations, attendance, leave, payroll visibility, reports, notifications, and auditability without introducing a second auth system, ORM, or database.

Database safety is a hard boundary for this pass:

- `bun run db:generate` produced an append-only migration.
- `bun run db:migrate` was **not** run.
- `bun run db:seed` was **not** run.
- No database-backed integration or concurrency test was run.

## Architecture retained

- Next.js 16.3 App Router and React 19 under `src/app`.
- Better Auth 1.7.1 with the Drizzle adapter and Neon PostgreSQL.
- Drizzle schema modules under `src/db/schema` and append-only artifacts under `drizzle`.
- API route handlers under `/api/v1`, with Better Auth under `/api/auth`.
- Zod validation, repository/service domain modules, and TanStack Query hooks/key factories.
- Tailwind CSS 4 with shadcn/Base UI components and the existing warm neutral dashboard visual language.

## Initial audit findings

The audit found a broad existing HRMS surface, but also inconsistent role sources, cookie-only route protection, unsafe self-service identity parameters, missing manager constraints, duplicate/open-attendance race exposure, text money/day fields, non-idempotent seed sections, duplicate route families, mock report data, and uneven API envelopes/scoping.

The work was therefore organized around shared authorization first, database/domain integrity second, then frontend integration and documentation. Existing migration history and unrelated design choices were preserved.

## Implemented in this pass

### Authentication and authorization foundation

- Centralized role normalization, permission mapping, employee-resource scope decisions, and page policies in `src/lib/permissions.ts`.
- Kept `src/lib/auth/permissions.ts` as a compatibility re-export rather than a competing policy source.
- Public signup defaults to employee; unknown/legacy roles fall back to least privilege.
- Added safe callback/landing resolution to reject external and auth-loop destinations.
- Hardened production secret/base-URL requirements, trusted origins, CSRF/origin checks, secure cookies, password length, reset-session revocation, verification settings, and Better Auth endpoint rate limits.
- Added real transactional-email HTTP delivery hooks with development-only local link logging and production failure when delivery is not configured.
- Updated the Better Auth account schema for non-null `issuer` and unique `(issuer, account_id)` lookup.

Remaining auth limitation: session resolution can still create/link an employee and create a default organization. That mutation should move to an explicit verified onboarding flow. In-memory rate limiting also needs a shared production store for horizontally scaled deployments.

### Employees and manager hierarchy

- Added server-scoped employee lists for self, direct reports, or the organization.
- Added canonical direct-report and manager-report endpoints and My Team pages.
- Added manager assignment/removal for HR/admin with same-organization, active-manager, role, self, and cycle validation.
- Added employee uniqueness, reporting-line, status/type, and relationship constraints/indexes to the schema and generated migration.
- Employee deletion remains a soft deactivation operation.

### Attendance

- Self check-in/out now derives employee identity and timestamps from the authenticated server context.
- Added server-derived today/open state, employee/organization timezone work dates, schedule/grace lateness, break/work/overtime calculation, and present/half-day results.
- Added role-scoped list/detail access and actor-scoped correction reads/requests.
- Added generated database checks for timestamp order, non-negative durations, valid statuses, one row per employee/workday, and one open row per employee.
- Updated attendance pages and hooks to use the today endpoint, disable invalid actions, and invalidate related query data.

The concurrency guarantees depend on applying the generated migration and remain unverified against a database.

### Database schema and seed definition

- Generated `drizzle/20260822083351_worthless_mister_fear` without altering older migrations.
- Added/backfilled Better Auth issuer data and generated foreign keys, indexes, unique constraints, state checks, timestamp conversions, and decimal-safe `numeric` leave/payroll columns.
- Expanded attendance corrections, employee hierarchy, work schedules, leave types/allocations/requests, payroll periods, and payslips.
- Reworked the development seed definition to avoid duplicate logical records and define one admin, two HR users, three managers, twenty employees, direct-report assignments, schedules, leave, attendance, payroll, notifications, and audit examples.

The migration and seed definitions have not been executed. Existing data must be preflighted for duplicates, orphaned references, and failed numeric casts before migration application.

### Frontend and routing

- Added canonical `/dashboard/profile`, `/dashboard/my-team`, team detail, departments, designations, office locations, work schedules, and holidays routes.
- Made the dashboard and sidebar role-aware and connected their active state to canonical routes.
- Added loading/error boundaries and improved attendance/dashboard data integration.
- Centralized query-key factories and normalized pagination invalidation across hooks.

Legacy `/admin` and `/employee` surfaces and older nested people/organization routes still exist; `/hr` and `/manager` redirect to `/dashboard`. Compatibility routes should be removed only after their remaining consumers are migrated.

### Tests and documentation

- Added pure tests for attendance calculations, manager assignment rules, leave calculations/decisions, permissions, auth schema shape, route policies, and safe redirects.
- `bun test` currently passes 20 tests with 0 failures and 56 assertions across two files.
- Updated `README.md` and `.env.example` and created `API_DOCUMENTATION.md`, `DATABASE_SCHEMA.md`, and `TESTING.md`.

## Remaining implementation work

### Priority 0 — workflow and data isolation

- Complete and verify leave single-resource row scoping, pending-only cancellation, required rejection comments, decision metadata, and one-transaction request/balance/notification/audit behavior.
- Complete and verify payroll period calculation/finalization state changes, locking, publication visibility, decimal calculations, and organization scope.
- Replace every fixed dashboard/report trend, total, type breakdown, and department-cost fallback with persisted, actor-scoped aggregates.
- Verify notification item ownership and generic approval queue scoping; link generic approvals to their source resource or replace the parallel workflow.
- Prevent employee self-service updates from changing privileged identity/employment fields and keep auth-user/employee role changes synchronized through one authorized action.

### Priority 1 — schema normalization

- Add missing organization foreign keys for department/designation/location/holiday reference tables.
- Add the missing `employees.work_schedule_id` relationship or remodel schedules so the relationship has one owner.
- Add foreign keys for employee address/contact/document records.
- Make notifications, approval requests, activity logs, leave policies, salary structures/components, and payslip items tenant-aware and relationally explicit.
- Replace CSV weekdays and remaining compatibility text fields with normalized or constrained representations when backward compatibility permits.

### Priority 1 — database-backed verification

- Run migration preflight queries on a disposable branch with representative legacy data.
- Apply the generated migration and run the seed twice to verify logical idempotence.
- Add route/integration tests for auth, tenant isolation, manager scope, concurrent attendance, transactional leave decisions, payroll locks, and rollback behavior.
- Exercise employee, manager, HR, and admin browser workflows with distinct seeded accounts.

## Verification strategy

Safe, non-database quality gates:

```bash
bun run lint
bun run typecheck
bun test
bun run build
```

Database mutation only after confirming a disposable development target:

```bash
bun run db:migrate
bun run db:seed
```

The unit-test result above is verified. Lint, typecheck, and build results must be reported from their final commands; they are not inferred here. Migration/seed/integration results must remain “not run” until a disposable database is explicitly confirmed and named.

## Definition-of-done tracking

- [x] Repository, routes, auth, schema, hooks, seed, tests, and current UI audited.
- [x] Shared lowercase roles, permissions, resource scopes, and redirect policy added.
- [x] Better Auth production configuration and account schema hardened.
- [x] Manager assignment/direct-report foundation and canonical team routes added.
- [x] Server-authoritative attendance domain and generated database constraints added.
- [x] Role-aware dashboard/navigation and canonical missing routes added.
- [x] Development seed definition expanded to the requested staffing mix and made repeat-safe by logical keys.
- [x] Required top-level documentation created or reconciled.
- [x] Pure unit suite passes: 20 tests, 0 failures.
- [ ] Leave decisions/cancellation proven actor-scoped and transactional.
- [ ] Payroll lifecycle and report aggregates completed without fixed values.
- [ ] Remaining support-table relationships and tenant scope normalized.
- [ ] Lint, typecheck, and production build final results recorded.
- [ ] Generated migration applied and verified on a named disposable database.
- [ ] Seed run twice and database/API/browser workflows verified.
