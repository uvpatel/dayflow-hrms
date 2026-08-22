# Dayflow HRMS — Production Implementation Plan

## Executive Summary & Architecture Overview

**Product**: Dayflow — Human Resource Management System
**Tagline**: *Every workday, perfectly aligned.*

Dayflow is an enterprise-grade full-stack HRMS built with:
- **Framework**: Next.js 16 (App Router, Server Components & Route Handlers)
- **Language**: TypeScript with strict mode
- **UI & Styling**: Tailwind CSS 4, shadcn/ui components, Lucide icons, Motion, Sonner toasts
- **Charts**: Recharts
- **State & Data Fetching**: TanStack React Query v5 with optimistic updates and caching
- **Auth**: Better Auth (Email/Password, GitHub OAuth, Role plugins, Secure session cookies)
- **Database & ORM**: Neon Serverless PostgreSQL with Drizzle ORM
- **Validation**: Zod 4 & React Hook Form
- **Runtime**: Bun

---

## 1. Repository Audit & Problems Found

### 1.1 Code Quality & Linting Failures
1. **ESLint `react-hooks/set-state-in-effect` violations**: Multiple dashboard pages (`payroll`, `time-off`, `attendance`, `approvals`, `people`, `dashboard`) execute synchronous state updates inside `useEffect`.
2. **Unescaped JSX Entities**: Single and double quotes in `dashboard/page.tsx`, `payroll/page.tsx`, and `settings/page.tsx` causing build/lint warnings.
3. **Explicit `any` Types**: Found in `api/v1/employees/[employeeId]/route.ts` and `api/v1/organizations/route.ts`.
4. **Unused Variables & Dead Imports**: Across various components and route handlers.

### 1.2 Authentication & Authorization Security
1. **Unprotected Public Roles**: Need to ensure public registration never grants Admin/HR roles. Elevated permissions must only be granted via seed bootstrap or authorized administrator updates.
2. **Session & Auth Guards**: Unify `auth-context.ts` and `auth/session.ts` into a seamless, high-performance server guard with full RBAC enforcement.
3. **Missing Auth Flow Pages**: Missing dedicated `/verify-email` and `/auth-error` pages.
4. **Email Fallback**: Need development email verification/logging fallback in Better Auth.

### 1.3 Database & Data Integrity
1. **Empty Seed Scripts**: `src/db/seed/` files are empty placeholders. No idempotent development seed script exists.
2. **Missing Constraints & Indexes**: Attendance and leave requests require transaction protection and overlap guards.
3. **Audit Logging & Notifications**: Need end-to-end integration with business transactions (leave approval, attendance correction, payroll finalization, profile updates).

### 1.4 API Surface & Completeness
1. Consolidate all RESTful endpoints under `/api/v1/` with typed schemas, Zod validation, pagination, standard error format, and transaction safety.
2. Add missing endpoints: `/api/v1/reports/*` (dashboard, attendance, leave, payroll), `/api/v1/audit-logs`, `/api/v1/documents`, organization sub-resources (`designations`, `locations`, `work-schedules`).

### 1.5 Frontend Completeness & Polish
1. Convert all dashboard pages to TanStack Query for optimal performance, zero hydration errors, and clean effect lifecycle.
2. Complete all remaining subpages:
   - `/dashboard/people/[employeeId]` (full multi-tab employee profile)
   - `/dashboard/reports` (with attendance, leave, payroll analytics)
   - `/dashboard/notifications` (inbox with mark as read & filters)
   - `/dashboard/audit-logs` (admin audit log viewer)
   - `/dashboard/organization/designations`, `/locations`, `/work-schedules`
3. Connect all search filters, pagination, interactive dialogs, sheets, and action buttons.

---

## 2. Target Route & Architecture Structure

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   ├── verify-email/page.tsx
│   │   └── auth-error/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   └── dashboard/
│   │       ├── page.tsx
│   │       ├── people/
│   │       │   ├── page.tsx
│   │       │   ├── [employeeId]/page.tsx
│   │       │   ├── onboarding/page.tsx
│   │       │   └── profile/page.tsx
│   │       ├── attendance/
│   │       │   ├── page.tsx
│   │       │   ├── daily/page.tsx
│   │       │   ├── weekly/page.tsx
│   │       │   └── corrections/page.tsx
│   │       ├── time-off/
│   │       │   ├── page.tsx
│   │       │   ├── apply/page.tsx
│   │       │   └── balance/page.tsx
│   │       ├── approvals/
│   │       │   ├── page.tsx
│   │       │   ├── leave/page.tsx
│   │       │   └── attendance/page.tsx
│   │       ├── payroll/
│   │       │   ├── page.tsx
│   │       │   ├── periods/page.tsx
│   │       │   └── salary-structures/page.tsx
│   │       ├── organization/
│   │       │   ├── page.tsx
│   │       │   ├── departments/page.tsx
│   │       │   ├── designations/page.tsx
│   │       │   ├── locations/page.tsx
│   │       │   ├── holidays/page.tsx
│   │       │   └── work-schedules/page.tsx
│   │       ├── reports/
│   │       │   ├── page.tsx
│   │       │   ├── attendance/page.tsx
│   │       │   ├── leave/page.tsx
│   │       │   └── payroll/page.tsx
│   │       ├── notifications/page.tsx
│   │       ├── audit-logs/page.tsx
│   │       └── settings/
│   │           ├── page.tsx
│   │           ├── profile/page.tsx
│   │           ├── roles/page.tsx
│   │           └── billing/page.tsx
│   └── api/
│       ├── auth/[...all]/route.ts
│       └── v1/
│           ├── me/
│           ├── employees/
│           ├── attendance/
│           ├── leave-requests/
│           ├── leave-types/
│           ├── leave-allocations/
│           ├── approvals/
│           ├── payroll/
│           ├── salary-structures/
│           ├── organizations/
│           ├── departments/
│           ├── designations/
│           ├── locations/
│           ├── holidays/
│           ├── work-schedules/
│           ├── reports/
│           ├── notifications/
│           └── audit-logs/
├── db/
│   ├── index.ts
│   ├── schema/
│   └── seed/
│       ├── index.ts
│       ├── organization.seed.ts
│       └── employees.seed.ts
├── features/
├── hooks/
├── lib/
│   ├── auth.ts
│   ├── permissions.ts
│   ├── auth-context.ts
│   └── api/
└── tests/
```

---

## 3. Detailed Implementation Phases

### Phase 1: Security, Auth & RBAC Hardening
- Configure Better Auth with email verification fallback, password hashing, GitHub OAuth callback handling, and session validation.
- Centralize server-side permission checks with `requireAuth` and `requirePermission`.
- Create `/verify-email` and `/auth-error` pages with smooth UX and error recovery.

### Phase 2: Core Services & Database Integrity
- Review all Drizzle schemas, foreign keys, and relations.
- Implement comprehensive service logic with transactional guarantees:
  - Attendance: Concurrency-safe check-in/out, duration calculation, manual regularization.
  - Leave: Balance validation, overlap rejection, transactional balance deductions on approval.
  - Payroll: Numeric-safe currency calculations, payslip generation, immutable finalized periods.
  - Approvals: Multi-queue inbox with required comments for rejections.
  - Reports: Aggregated real-time analytics for headcount, attendance rates, leave burn, and payroll costs.
  - Notifications & Audit: Automated triggers on every critical business action.

### Phase 3: Comprehensive Development Seed
- Write an idempotent `db:seed` script in `src/db/seed/index.ts`:
  - Fictional organization: Dayflow Technologies
  - Super Admin, 2 HR, 2 Managers, 15+ Employees
  - Departments, Designations, Locations, Work Schedules, Holidays
  - Leave Types & Allocations, Leave Requests (Pending/Approved/Rejected)
  - Multi-week Attendance records with check-in/out timestamps and corrections
  - Salary Structures, Payroll Periods, Payslips
  - Notifications & Audit log entries
  - Output clearly labeled development credentials.

### Phase 4: Frontend Productionization with TanStack Query
- Build clean custom query hooks for all domains (`useEmployees`, `useAttendance`, `useLeave`, `usePayroll`, `useApprovals`, `useReports`, `useNotifications`, `useAuditLogs`).
- Refactor all dashboard pages to TanStack Query, resolving all ESLint `react-hooks/set-state-in-effect` errors.
- Implement rich, animated, responsive UI with:
  - Loading skeletons & error retry banners
  - Search, multi-criteria filtering, sorting, pagination
  - Interactive modal dialogs, slide-over sheets, and confirmation steps
  - Recharts visualizations for analytics
  - Accessible keyboard navigation and ARIA attributes.

### Phase 5: Verification & Quality Assurance
- Implement unit and integration tests in `tests/`:
  - Permission rules & role authorization
  - Attendance check-in/out logic & state validation
  - Leave balance calculation, duration arithmetic, and overlap checks
  - Payroll calculation and locking
  - Schema and Zod validation checks
- Execute full test and build suite:
  - `bun run typecheck` (0 errors)
  - `bun run lint` (0 errors)
  - `bun test` (all tests passing)
  - `bun run build` (successful production build)

### Phase 6: Documentation
- Update `README.md` with complete architecture, setup instructions, env vars, test/build commands, and seeded credentials.
- Create `.env.example`, `API_DOCUMENTATION.md`, `DATABASE_SCHEMA.md`, and `TESTING.md`.

---

## 4. Verification Checklist
- [x] Phase 1: Comprehensive repository audit complete
- [ ] Phase 2: Auth and RBAC hardened (email/password, GitHub OAuth, safe registration)
- [ ] Phase 3: All API routes in `/api/v1/` completed with Zod validation and transactional services
- [ ] Phase 4: Idempotent development seed script implemented and verified
- [ ] Phase 5: All frontend pages implemented with TanStack Query and zero lint/type errors
- [ ] Phase 6: Full automated test suite added and passing
- [ ] Phase 7: `bun run lint`, `bun run typecheck`, `bun test`, and `bun run build` passing cleanly
- [ ] Phase 8: Documentation (`README.md`, `.env.example`, `API_DOCUMENTATION.md`, `DATABASE_SCHEMA.md`, `TESTING.md`) complete
