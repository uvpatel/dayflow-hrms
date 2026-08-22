# Dayflow

Human Resource Management System — every workday, perfectly aligned.

Dayflow is a Next.js HRMS for employee self-service, manager team workflows, attendance, leave, payroll visibility, HR operations, organization configuration, notifications, reports, and auditing. The repository currently combines completed role/attendance/team foundations with older leave, payroll, reporting, and support-table scaffolding; see [Implementation status](#implementation-status) before treating it as production-ready.

## Stack

- Next.js 16.3 App Router and React 19
- TypeScript, Tailwind CSS 4, shadcn/Base UI
- Better Auth 1.7 with email/password and optional GitHub OAuth
- Drizzle ORM and Neon PostgreSQL
- TanStack Query, Zod, Recharts, and Bun

The project deliberately uses one authentication system, one ORM, and one PostgreSQL database. Business endpoints live under `/api/v1`; Better Auth owns `/api/auth`.

## Implementation status

Implemented and covered by focused tests:

- Central lowercase role normalization, permission mapping, employee resource scopes, page policies, and safe post-authentication redirects.
- Better Auth email/password configuration, optional GitHub OAuth, password-reset and verification delivery hooks, trusted-origin/CSRF checks, and endpoint rate limits.
- Employee organization scoping, direct-report lists, manager assignment validation, and manager/self/HR/admin resource rules.
- Server-timestamped attendance check-in/out, timezone-derived work dates, schedule-aware lateness/duration, today state, and generated uniqueness/check constraints.
- Role-aware dashboard/sidebar integration and canonical profile, team, attendance, organization, payroll, notification, report, and settings pages.
- A generated append-only schema migration and a repeat-safe development seed definition for one admin, two HR users, three managers, and twenty employees.

Known incomplete or unverified areas:

- Leave detail/update/delete and decision handlers still need consistent row-level actor scoping, transactional balance updates, persisted decision metadata, and cancellation semantics.
- Several report endpoints still return sample trend/breakdown values, and payroll calculate/finalize behavior is scaffold-level rather than a complete locked payroll engine.
- Some legacy support tables and identifiers do not yet have tenant columns or foreign keys; these are listed in [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md).
- Authentication context resolution can create/link employee and default-organization records during a read and should be separated into an explicit onboarding flow.
- Rate limiting uses in-process memory, so a shared store is still needed for consistent limits across multiple production instances.
- The latest migration and the seed were generated/updated but were not executed against a database during this implementation pass.

## Roles

Dayflow stores lowercase roles consistently:

- `employee`: self profile, personal attendance, leave, payslips, and notifications.
- `manager`: employee access plus direct-report attendance, leave, availability, and reviews. Managers do not receive organization-wide payroll access.
- `hr`: organization-wide employee, attendance, leave, onboarding, payroll, report, and notification operations according to the permission map.
- `admin`: HR capabilities plus roles, organization settings, sensitive audit access, and full configuration.

Public signup always creates an employee-level account. Elevated roles are assigned only through an authorized administrative workflow or the explicit development seed.

Server-side authorization is mandatory. Hiding a sidebar entry is only presentation and never grants or removes API access.

## Local setup

Requirements:

- Bun 1.3 or newer
- A disposable Neon development branch or PostgreSQL development database
- Node.js 20+ where required by local tooling

Install dependencies and create a local environment file:

```bash
bun install
cp .env.example .env
```

Required configuration:

```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="a-random-secret-with-at-least-32-characters"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"
AUTH_REQUIRE_EMAIL_VERIFICATION="false"
BETTER_AUTH_TRUSTED_ORIGINS="http://localhost:3000"
```

`AUTH_REQUIRE_EMAIL_VERIFICATION` defaults to `false` in development and `true` in production. Passwords must contain 12–128 characters. Use a comma-separated trusted-origin list for additional first-party deployment origins.

Optional GitHub OAuth:

```env
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

Production email delivery uses a JSON HTTP provider endpoint:

```env
EMAIL_PROVIDER_API_URL="https://provider.example/v1/email"
EMAIL_PROVIDER_API_KEY=""
EMAIL_FROM="notifications@example.com"
```

When the provider values are omitted in development, verification and reset links are written to the local server console. Production fails closed instead of logging tokens or pretending delivery succeeded.

For local GitHub OAuth, configure the callback URL as:

```text
http://localhost:3000/api/auth/callback/github
```

Production must use an HTTPS `BETTER_AUTH_URL`, a unique high-entropy secret, and an explicit trusted origin. Never commit `.env`.

## Database workflow

Schema definitions are in `src/db/schema`; append-only migrations and snapshots are in `drizzle`. The latest generated artifact is `drizzle/20260822083351_worthless_mister_fear`. It has not been applied to a database, and the seed has not been run in this implementation pass.

Generate and inspect a migration:

```bash
bun run db:generate
```

Only after confirming `DATABASE_URL` points to a disposable development database:

```bash
bun run db:migrate
bun run db:seed
```

Do not use `db:push` against production, reset migration history, or run the seed against shared data.

## Run the application

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). Authentication routes are `/sign-in`, `/sign-up`, and `/verify-email`; authenticated work starts at `/dashboard`.

## Primary routes

```text
/
├── sign-in
├── sign-up
├── verify-email
└── dashboard
    ├── profile
    ├── people
    │   └── [employeeId]
    ├── my-team
    │   └── [employeeId]
    ├── attendance
    │   ├── daily
    │   ├── weekly
    │   └── corrections
    ├── time-off
    │   ├── apply
    │   └── balance
    ├── approvals
    │   ├── attendance
    │   └── leave
    ├── payroll
    │   ├── periods
    │   └── salary-structures
    ├── reports
    ├── notifications
    ├── organization
    ├── departments
    ├── designations
    ├── office-locations
    ├── work-schedules
    ├── holidays
    ├── audit-logs
    └── settings
```

Role-aware navigation shows the canonical destinations. Older nested organization/people routes and the `/admin`, `/employee`, `/hr`, and `/manager` surfaces still exist for compatibility; not all of them are simple redirects yet. Page policy is broad authorization only, so route handlers and services must still enforce tenant and row scope.

## Architecture

```text
src/
├── app/
│   ├── (auth)/              # Authentication UI
│   ├── (dashboard)/         # Protected HRMS workspace
│   └── api/
│       ├── auth/            # Better Auth handler
│       └── v1/              # Business API
├── components/              # Product and shadcn/Base UI components
├── db/
│   ├── schema/              # Drizzle table definitions
│   └── seed/                # Development-only repeat-safe seed
├── features/                # Domain schemas, repositories, and services
├── hooks/                   # TanStack Query hooks/key factories
├── lib/                     # Auth, permissions, API, audit, and email utilities
└── providers/               # Query and theme providers
```

Newer employee/team and attendance handlers authenticate first, validate input, authorize the resolved server identity, call domain services, and return the common response envelope. Some older leave, payroll, organization, notification, approval, and report handlers still use legacy response/authorization patterns; [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) calls out those boundaries. Attendance timestamps and duration calculations are server-authoritative.

## Verification

The normal non-mutating quality gate is:

```bash
bun run lint
bun run typecheck
bun test
bun run build
```

See [TESTING.md](./TESTING.md) for focused and manual workflow coverage.

At the documentation checkpoint on 2026-08-22, `bun test` passed all 20 unit tests across `tests/permissions.test.ts` and `tests/business-domain.test.ts`. No database-backed migration, seed, route, concurrency, or rollback test was run. Lint, typecheck, and production-build results should be taken from the final verification run rather than inferred from the unit-test result.

## Documentation

- [Implementation plan](./IMPLEMENTATION_PLAN.md)
- [API reference](./API_DOCUMENTATION.md)
- [Database schema](./DATABASE_SCHEMA.md)
- [Testing guide](./TESTING.md)
- [Workflow reference](https://link.excalidraw.com/l/65VNwvy7c4X/58RLEJ4oOwh)

## Deployment checklist

Do not deploy this branch as a complete production HR/payroll system until the known incomplete areas above are resolved and the generated migration is validated on representative data.

- Use a production Neon branch and apply reviewed migrations once.
- Set `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and all provider secrets in the deployment environment.
- Configure GitHub's production callback URL as `<origin>/api/auth/callback/github`.
- Confirm email delivery before requiring verification in production.
- Run lint, typecheck, tests, and the production build.
- Verify employee, manager, HR, and admin accounts against the route-access matrix.
- Confirm that payroll, audit logs, and cross-employee URLs return no unauthorized data.

Development seed credentials are printed only by the seed command and use fictional `@dayflow.dev` identities. The seed was not executed during this implementation pass, and its fixed credentials must never be deployed as production accounts.
