# Dayflow HRMS — Implementation Plan

Last audited: 2026-08-22

## Goal and constraints

Dayflow is being consolidated into one Next.js 16 App Router HRMS with four lowercase roles: `employee`, `manager`, `hr`, and `admin`. The target is secure employee self-service, direct-report workflows, organization operations, attendance, leave, payroll visibility, reports, notifications, and auditability without introducing a second auth system, ORM, or database.

Database safety is a hard boundary for this pass:

- `bun run db:generate` produced two append-only migrations; a final generation check reported no further schema changes.
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
- Scoped employee department, designation, location, and work-schedule references to the actor's organization.
- Employee deletion remains a soft deactivation operation.

### Attendance

- Self check-in/out now derives employee identity and timestamps from the authenticated server context.
- Added server-derived today/open state, employee/organization timezone work dates, schedule/grace lateness, break/work/overtime calculation, and present/half-day results.
- Added role-scoped list/detail access and actor-scoped correction reads/requests.
- Added assigned-manager/HR/admin correction decisions with required rejection comments and atomic attendance, correction, notification, and activity writes.
- Added generated database checks for timestamp order, non-negative durations, valid statuses, one row per employee/workday, and one open row per employee.
- Updated attendance pages and hooks to use the today endpoint, disable invalid actions, and invalidate related query data.

The concurrency guarantees depend on applying the generated migration and remain unverified against a database.

### Leave and approvals

- Scoped leave types, policies, allocations, requests, and item reads to self, assigned direct reports, or the organization as appropriate.
- Made request submission and pending edits schedule-aware, holiday-aware, overlap-safe, balance-safe, and serialized per employee with a PostgreSQL advisory transaction lock.
- Added owner-only pending cancellation and assigned-manager/HR/admin decisions with required rejection comments.
- Applied decisions atomically across allocation balance, request metadata, employee notification, activity record, and approved-day attendance rows.
- Scoped the generic approval queue to a manager's assigned reports or the HR/admin organization and required rejection reasons.

### Payroll, reports, and notifications

- Scoped payroll periods, payslips, salary structures, and salary components to the actor's organization; managers retain self-only payroll visibility.
- Added exact-cent money helpers, server-derived net pay, invalid-deduction rejection, draft-only edits, and an atomic `draft` -> `review` -> `finalized` -> `published` lifecycle.
- Limited employee payslip views to published records.
- Replaced fixed dashboard/report values with persisted team- or organization-scoped attendance, leave, payroll, and employee aggregates.
- Scoped notification reads, read-all, item updates, and deletion to the current employee; HR/admin sends validate the recipient's organization.

### Database schema and seed definition

- Generated `drizzle/20260822083351_worthless_mister_fear` and the follow-up `drizzle/20260822092821_mysterious_zemo` without altering older migrations.
- Added/backfilled Better Auth issuer data and generated foreign keys, indexes, unique constraints, state checks, timestamp conversions, and decimal-safe `numeric` leave/payroll columns.
- Expanded attendance corrections, employee hierarchy, work schedules, leave types/policies/allocations/requests, payroll periods/payslips, salary catalog organization scope, and the Better Auth employee-number link.
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
- Added exact-cent payroll tests plus leave schedule/holiday and actor-decision coverage.
- `bun test` currently passes 26 tests with 0 failures and 77 assertions across two files.
- Updated `README.md` and `.env.example` and created `API_DOCUMENTATION.md`, `DATABASE_SCHEMA.md`, and `TESTING.md`.

## Remaining implementation work

### Priority 0 — production and database proof

- Take a verified backup or database branch, run duplicate/orphan/numeric-cast preflight queries, and rehearse both generated migrations on representative legacy data.
- Apply the migrations only to a named disposable environment first, then verify every generated foreign key, check, unique index, and timestamp/numeric conversion.
- Add database-backed route and concurrency tests for tenant isolation, attendance uniqueness, transactional leave decisions, payroll locks/publication, and rollback behavior.
- Run the repeat-safe seed twice only on a disposable database and exercise employee, manager, HR, and admin browser workflows with distinct accounts.
- Move employee/default-organization creation out of read-time auth-context resolution into an explicit verified onboarding flow, and replace in-memory rate limits with a shared production store.

### Priority 1 — schema normalization

- Add missing organization foreign keys for department/designation/location/holiday reference tables.
- Add the missing `employees.work_schedule_id` relationship or remodel schedules so the relationship has one owner.
- Add foreign keys for employee address/contact/document records.
- Add relational tenant/owner keys to notifications, approval requests, activity logs, and payslip items. Link generic approvals to their source workflow record.
- Backfill and eventually make the new nullable `organization_id` columns on leave policies and salary structures/components non-null if global rows are not required.
- Replace CSV weekdays and remaining compatibility text fields with normalized or constrained representations when backward compatibility permits.

### Priority 1 — product and API depth

- Connect salary structures, salary components, and payslip items to an explicit compensation model; add tax, benefits, statutory deductions, and jurisdictional rules before calling Dayflow a full payroll engine.
- Normalize the remaining compatibility route families, response envelopes, pagination totals, and duplicate legacy pages after their consumers migrate.
- Add end-to-end signup, email verification, password reset, OAuth, session expiry, and delivery-provider tests.

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
- [x] Leave decisions/cancellation implemented with actor scope and atomic database statements.
- [x] Payroll lifecycle and persisted report aggregates completed without fixed values.
- [x] Notification ownership and organization-reference service scoping implemented.
- [x] Pure unit suite passes: 26 tests, 0 failures, 77 assertions.
- [ ] Remaining support-table relationships and tenant scope normalized.
- [ ] Lint, typecheck, and production build final results recorded.
- [ ] Generated migration applied and verified on a named disposable database.
- [ ] Seed run twice and database/API/browser workflows verified.
