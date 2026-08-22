# Dayflow implementation plan

## Repository audit — 2026-08-22

Dayflow is a Next.js 16 App Router application using TypeScript strict mode, Tailwind CSS 4, shadcn/ui, Better Auth, Drizzle and Neon HTTP, TanStack Query, Zod, Recharts, and Bun. The application already has a domain-oriented structure under `src/features` for employees, attendance, time off, payroll, approvals, and organization management. API work is being consolidated under `src/app/api/v1`.

The workspace is deliberately **not clean**. The existing changes include API route consolidation, dashboard-route moves, payroll work, new query-provider work, and documentation updates. This plan treats those changes as protected and avoids overwriting or reverting them.

## Existing architecture

- **Routing:** App Router route groups for auth and dashboard. Dashboard pages currently live beneath `/dashboard`; old paths are being replaced by more consistently named routes.
- **Frontend:** shadcn components, responsive sidebar/header, theme provider, and TanStack Query provider already exist. Several dashboard pages still use imperative `useEffect` + local state instead of the query layer.
- **Authentication:** Better Auth uses the Drizzle adapter and supports email/password plus optional GitHub credentials. The auth route is present at `/api/auth/[...all]`.
- **Authorization:** `src/lib/permissions.ts` contains the centralized role-to-permission map, while two overlapping auth-context modules currently expose incompatible guards.
- **Data:** Drizzle schemas cover the primary HR domains and generated migrations are present. The checked-in seed files are empty.
- **API:** Most core APIs are present in `/api/v1` with services and repositories, but standards and authorization patterns are not yet consistently applied.

## Problems found

1. `bun run lint` currently fails (15 errors, plus warnings), including React state-in-effect violations, unescaped entities, and two explicit `any` uses.
2. Type checking currently fails because `.next` retains removed route entries and because of select/chart type mismatches in active dashboard components.
3. Route renames/moves are in progress. The generated route manifest still references removed `approvels`, `regularize`, and old payroll paths.
4. `src/lib/auth-context.ts` and `src/lib/auth/session.ts` both resolve sessions/permissions but use different APIs. Some attendance routes call the `session.ts` guard with the `auth-context.ts` calling convention, which needs a single authoritative guard.
5. Current automatic employee provisioning makes the first unseeded authenticated user an admin. Public signup must never assign elevated access.
6. Attendance check-in/out accepts a caller-provided user identifier without enforcing self-or-privileged access, and uses an employee id as a user id in parts of the flow.
7. Leave approval, balance updates, approval records, notification creation, and audit logging are not yet performed as one transaction. Rejection comments are optional despite the product rule.
8. `errorResponse` does not yet use the documented nested error contract and can expose arbitrary internal error messages.
9. Better Auth has no configured verification/reset email callbacks or development-only mail adapter. GitHub can be configured, but its callback and environment setup need documentation.
10. No idempotent development seed implementation or `db:seed` script exists. The current empty seed files must be replaced only alongside a deliberate, migration-backed schema review.
11. Some nav links and header actions remain placeholders (`#` links or empty click handlers).

## Decisions and constraints

- Keep the existing numeric primary-key strategy in HR schemas; do not introduce a second identity system.
- Retain Better Auth as the authentication authority and the existing Drizzle/Neon setup.
- Treat employee role values as server-owned. Signup produces an `employee` account; elevated roles come only from seeded admin bootstrap or an authorized role-change flow.
- Consolidate on one auth-context guard module before adding new protected endpoints.
- Make every destructive migration opt-in and generate a migration rather than using `db:push` for production-like environments.
- Use transactions for business actions that change leave, payroll, approval, notification, or audit state together.

## Implementation phases

### 1. Stabilize the active refactor

- Reconcile moved routes and regenerate Next route types.
- Fix existing lint/type failures without suppressions.
- Replace dead navigation/actions while preserving the existing dashboard shell.

### 2. Authentication and authorization foundation

- Consolidate session resolution, permission checks, self-or-privileged resource access, and safe auth errors.
- Remove public role escalation and first-user automatic admin elevation.
- Add Better Auth verification/reset mail callbacks with a development-only URL logger.
- Add explicit session/rate-limit/cookie security configuration and document GitHub OAuth setup.

### 3. Data integrity and migrations

- Audit each schema against its service requirements before altering it.
- Add missing constraints/indexes, including employee identity uniqueness and attendance uniqueness/open-session protection where supported.
- Create non-destructive Drizzle migrations and an idempotent development seed script.

### 4. API consolidation

- Standardize `/api/v1` request validation, response envelopes, pagination, and service-layer boundaries.
- Migrate remaining consumers from legacy APIs before deleting compatibility endpoints.
- Implement server-side tenant/resource ownership checks and safe transactions for attendance, leave, approvals, payroll, and organization management.

### 5. Query-driven UI completion

- Add typed query-key factories and feature hooks.
- Convert active dashboard, employee, attendance, leave, approval, payroll, notifications, and organization screens incrementally to real APIs.
- Add complete loading, error, empty, confirmation, and mutation-feedback states.

### 6. Quality, documentation, and verification

- Add focused unit/integration tests for permission checks, attendance transitions, leave calculations/transitions, and payroll access control.
- Complete API and database documentation and expand the README with verified setup instructions.
- Run lint, typecheck, tests, build, migration generation, and development seed only when a development database is explicitly configured.

## Risks and assumptions

- No development `DATABASE_URL` was supplied, so migrations and seed data cannot be applied or verified in this audit.
- Email and GitHub OAuth credentials are intentionally absent; those integrations can only be code-verified until configured.
- Existing uncommitted route/API changes may be in the middle of a rename. Route deletions will not be restored unless a missing consumer requires them.
- The Excalidraw reference was not fetched during this local code audit; it should guide UX only and must not override working product behavior.

## Verification checklist

- [ ] `bun run lint` passes
- [ ] `bun run typecheck` passes
- [ ] `bun run test` passes
- [ ] `bun run build` passes
- [ ] Better Auth email/password and GitHub callback paths are verified with configured development credentials
- [ ] Unauthenticated, employee-self, cross-employee, and privileged API paths are covered
- [ ] Attendance and leave state transitions are transactionally verified
- [ ] Development migration generation and idempotent seed are verified against an explicit development database
- [ ] Navigation contains no dead primary actions
