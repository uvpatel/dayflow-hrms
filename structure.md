# Dayflow HRMS - Directory Structure

## Overview & Architecture

**Dayflow** is an enterprise-ready Human Resource Management System (HRMS) built using Next.js (App Router), TypeScript, Tailwind CSS, Drizzle ORM (PostgreSQL), Better Auth, and TanStack Query.

The project follows a clean, feature-driven and layered architecture:

- **Presentation Layer (`src/app/`, `src/components/`)**:
  - `src/app/(auth)`: Authentication flows (Sign in, Sign up, Email verification).
  - `src/app/(dashboard)`: Core administrative and operational modules (Attendance, Approvals, Organization, Payroll, People, Time-off, Settings).
  - `src/app/(marketing)`: Public pages (About, Privacy, Terms).
  - `src/app/(user)`: Role-tailored user portals (Admin, Employee, HR, Manager).
  - `src/app/api/v1/`: Modular, RESTful API endpoints for backend operations.
  - `src/components/ui/`: Accessible UI primitive components built with Radix UI & Tailwind CSS.
  - `src/components/main/` & `src/components/sidebar/`: Dynamic navigation, layout, and dashboard widgets.

- **Domain & Business Logic Layer (`src/features/`)**:
  - Encapsulated business features: `approvals`, `attendance`, `employees`, `organization`, `payroll`, `time-off`.
  - Each feature adheres to the repository-service-domain pattern:
    - `*.domain.ts`: Pure domain logic, computations, and business rules.
    - `*.repository.ts`: Data access layer querying Drizzle ORM.
    - `*.schemas.ts`: Zod validation schemas for requests and payloads.
    - `*.service.ts`: Orchestration, transaction management, and workflow execution.
    - `*.types.ts`: TypeScript type declarations and interfaces.

- **Database & Data Access (`src/db/`, `drizzle/`)**:
  - `src/db/schema/`: Normalized relational schema definitions (employees, attendances, leave requests, payroll, etc.).
  - `src/db/seed/`: Development and staging seed scripts.
  - `drizzle/`: Database migration SQL files and schema snapshots.

- **Utilities, Security & Cross-Cutting Concerns (`src/lib/`)**:
  - `src/lib/auth/`: Better Auth configuration, session handling, RBAC permissions, role definitions, and access guards.
  - `src/lib/api/`: Standardized JSON response formatting, error handling, pagination, and validation wrappers.
  - `src/lib/audit/`: Audit logging mechanism for tracking system activities.
  - `src/lib/email/` & `src/lib/notifications/`: Notification dispatch and email services.

- **Client State & Data Fetching (`src/hooks/`, `src/providers/`)**:
  - `src/hooks/`: Typed React Query hooks for seamless server state synchronization.
  - `src/providers/`: Global QueryClient and theme providers.

- **Testing & Scripts (`tests/`, `scripts/`)**:
  - `tests/`: Automated test suites covering auth access, business domain rules, and RBAC permissions.
  - `scripts/`: Operational tools and database repair utilities.

---

## Directory Breakdown

| Directory / File | Description |
| :--- | :--- |
| `drizzle/` | Auto-generated Drizzle ORM migration scripts and schema snapshots |
| `public/` | Static media, icons, and branding assets |
| `scripts/` | Maintenance, migration, and CLI utility scripts |
| `src/app/` | Next.js App Router root containing page routes, layouts, and REST APIs |
| `src/app/(auth)/` | Authentication pages (Sign-in, Sign-up, Email Verification) |
| `src/app/(dashboard)/` | Internal HRMS management dashboard with sub-routes for HR, Attendance, Payroll, Leave, etc. |
| `src/app/(marketing)/` | Public-facing marketing pages (About, Privacy, Terms) |
| `src/app/(user)/` | Dedicated role dashboards (Admin, Employee, HR, Manager) |
| `src/app/api/v1/` | RESTful API endpoints for backend services |
| `src/components/` | Reusable React UI components, layouts, and feature widgets |
| `src/components/ui/` | Core shadcn / Radix UI design system primitives |
| `src/db/` | Drizzle ORM database client, schema definitions, and seed data |
| `src/features/` | Domain-driven business logic modules (Repository / Service / Domain pattern) |
| `src/hooks/` | Custom React hooks wrapping TanStack React Query for data fetching |
| `src/lib/` | Shared libraries, auth security, RBAC helpers, audit loggers, and API utilities |
| `src/providers/` | Context providers (Theme, TanStack Query) |
| `tests/` | Unit and integration test suites |

---

## Complete Project Tree

```plaintext
dayflow/
├── docs/
│   ├── api-inventory.md
│   ├── auth-analysis.md
│   ├── backend-analysis.md
│   ├── backend.md
│   ├── final-refactor-analysis.md
│   ├── frontend-routing-analysis.md
│   └── frontend.md
├── drizzle/
│   ├── 20260818172948_productive_dexter_bennett/
│   │   ├── migration.sql
│   │   └── snapshot.json
│   ├── 20260819131111_safe_arclight/
│   │   ├── migration.sql
│   │   └── snapshot.json
│   ├── 20260819140616_overconfident_scarecrow/
│   │   ├── migration.sql
│   │   └── snapshot.json
│   ├── 20260822041208_public_rogue/
│   │   ├── migration.sql
│   │   └── snapshot.json
│   ├── 20260822071820_boring_meteorite/
│   │   ├── migration.sql
│   │   └── snapshot.json
│   ├── 20260822080847_conscious_joseph/
│   │   ├── migration.sql
│   │   └── snapshot.json
│   ├── 20260822083351_worthless_mister_fear/
│   │   ├── migration.sql
│   │   └── snapshot.json
│   ├── 20260822092821_mysterious_zemo/
│   │   ├── migration.sql
│   │   └── snapshot.json
│   ├── 20260822093609_volatile_vanisher/
│   │   ├── migration.sql
│   │   └── snapshot.json
│   └── 20260822094132_bright_lila_cheney/
│       ├── migration.sql
│       └── snapshot.json
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── hrms.png
│   ├── next.svg
│   ├── notfound.png
│   ├── vercel.svg
│   └── window.svg
├── scripts/
│   └── repair-better-auth-accounts.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── auth/
│   │   │   │   ├── access-denied/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── redirect/
│   │   │   │       └── page.tsx
│   │   │   ├── sign-in/
│   │   │   │   └── page.tsx
│   │   │   ├── sign-up/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── verify-email/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   ├── (approvels)/
│   │   │   │   │   └── approvals/
│   │   │   │   │       ├── attendance/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       ├── leave/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── (attendence)/
│   │   │   │   │   └── attendance/
│   │   │   │   │       ├── corrections/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       ├── daily/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       ├── weekly/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── (organization)/
│   │   │   │   │   ├── office-locations/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── organization/
│   │   │   │   │   │   ├── departments/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   ├── holidays/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   ├── error.tsx
│   │   │   │   │   │   ├── loading.tsx
│   │   │   │   │   │   ├── not-found.tsx
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── roles/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── (people)/
│   │   │   │   │   └── people/
│   │   │   │   │       ├── [employeeId]/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       ├── billing/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       ├── onboarding/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       ├── profile/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       ├── settings/
│   │   │   │   │       │   ├── billing/
│   │   │   │   │       │   │   └── page.tsx
│   │   │   │   │       │   ├── team/
│   │   │   │   │       │   │   └── page.tsx
│   │   │   │   │       │   ├── error.tsx
│   │   │   │   │       │   ├── loading.tsx
│   │   │   │   │       │   ├── not-found.tsx
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── (timeoff)/
│   │   │   │   │   └── time-off/
│   │   │   │   │       ├── apply/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       ├── balance/
│   │   │   │   │       │   ├── error.tsx
│   │   │   │   │       │   ├── loading.tsx
│   │   │   │   │       │   ├── not-found.tsx
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       ├── error.tsx
│   │   │   │   │       ├── loading.tsx
│   │   │   │   │       ├── not-found.tsx
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── audit-logs/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── departments/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── designations/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── holidays/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── my-team/
│   │   │   │   │   ├── [employeeId]/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── notifications/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── payroll/
│   │   │   │   │   ├── periods/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── salary-structures/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── profile/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── reports/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── settings/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── work-schedules/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── data.json
│   │   │   │   ├── error.tsx
│   │   │   │   ├── loading.tsx
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (marketing)/
│   │   │   ├── about/
│   │   │   │   └── page.tsx
│   │   │   ├── privacy/
│   │   │   │   └── page.tsx
│   │   │   └── terms/
│   │   │       └── page.tsx
│   │   ├── (user)/
│   │   │   ├── _components/
│   │   │   │   └── portal-header.tsx
│   │   │   ├── admin/
│   │   │   │   ├── SearchUser.tsx
│   │   │   │   ├── _actions.ts
│   │   │   │   └── page.tsx
│   │   │   ├── employee/
│   │   │   │   ├── employee-client.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── hr/
│   │   │   │   ├── hr-client.tsx
│   │   │   │   └── page.tsx
│   │   │   └── manager/
│   │   │       ├── manager-client.tsx
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...all]/
│   │   │   │       └── route.ts
│   │   │   ├── notifications/
│   │   │   │   └── route.ts
│   │   │   ├── payroll/
│   │   │   │   ├── payslips/
│   │   │   │   │   └── route.ts
│   │   │   │   └── periods/
│   │   │   │       └── route.ts
│   │   │   └── v1/
│   │   │       ├── activity-logs/
│   │   │       │   └── route.ts
│   │   │       ├── approvals/
│   │   │       │   ├── [approvalId]/
│   │   │       │   │   ├── approve/
│   │   │       │   │   │   └── route.ts
│   │   │       │   │   ├── reject/
│   │   │       │   │   │   └── route.ts
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       ├── attendance/
│   │   │       │   ├── [attendanceId]/
│   │   │       │   │   └── route.ts
│   │   │       │   ├── check-in/
│   │   │       │   │   └── route.ts
│   │   │       │   ├── check-out/
│   │   │       │   │   └── route.ts
│   │   │       │   ├── corrections/
│   │   │       │   │   ├── [correctionId]/
│   │   │       │   │   │   ├── decision/
│   │   │       │   │   │   │   └── route.ts
│   │   │       │   │   │   └── route.ts
│   │   │       │   │   └── route.ts
│   │   │       │   ├── today/
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       ├── departments/
│   │   │       │   ├── [departmentId]/
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       ├── designations/
│   │   │       │   ├── [designationId]/
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       ├── employees/
│   │   │       │   ├── [employeeId]/
│   │   │       │   │   ├── attendance/
│   │   │       │   │   │   └── route.ts
│   │   │       │   │   ├── manager/
│   │   │       │   │   │   └── route.ts
│   │   │       │   │   ├── payslips/
│   │   │       │   │   │   └── route.ts
│   │   │       │   │   ├── time-off/
│   │   │       │   │   │   └── route.ts
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       ├── holidays/
│   │   │       │   ├── [holidayId]/
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       ├── leave-allocations/
│   │   │       │   ├── [allocationId]/
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       ├── leave-policies/
│   │   │       │   ├── [policyId]/
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       ├── leave-requests/
│   │   │       │   ├── [requestId]/
│   │   │       │   │   ├── approve/
│   │   │       │   │   │   └── route.ts
│   │   │       │   │   ├── cancel/
│   │   │       │   │   │   └── route.ts
│   │   │       │   │   ├── decision/
│   │   │       │   │   │   └── route.ts
│   │   │       │   │   ├── reject/
│   │   │       │   │   │   └── route.ts
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       ├── leave-types/
│   │   │       │   ├── [leaveTypeId]/
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       ├── locations/
│   │   │       │   ├── [locationId]/
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       ├── managers/
│   │   │       │   ├── [managerId]/
│   │   │       │   │   └── reports/
│   │   │       │   │       └── route.ts
│   │   │       │   └── me/
│   │   │       │       └── team/
│   │   │       │           └── route.ts
│   │   │       ├── me/
│   │   │       │   ├── attendance/
│   │   │       │   │   └── route.ts
│   │   │       │   ├── payslips/
│   │   │       │   │   └── route.ts
│   │   │       │   ├── time-off/
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       ├── notifications/
│   │   │       │   ├── [notificationId]/
│   │   │       │   │   └── route.ts
│   │   │       │   ├── read-all/
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       ├── organizations/
│   │   │       │   ├── [id]/
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       ├── payroll/
│   │   │       │   ├── payslips/
│   │   │       │   │   ├── [payslipId]/
│   │   │       │   │   │   └── route.ts
│   │   │       │   │   └── route.ts
│   │   │       │   └── periods/
│   │   │       │       ├── [periodId]/
│   │   │       │       │   ├── calculate/
│   │   │       │       │   │   └── route.ts
│   │   │       │       │   ├── finalize/
│   │   │       │       │   │   └── route.ts
│   │   │       │       │   ├── publish/
│   │   │       │       │   │   └── route.ts
│   │   │       │       │   └── route.ts
│   │   │       │       └── route.ts
│   │   │       ├── reports/
│   │   │       │   ├── attendance/
│   │   │       │   │   └── route.ts
│   │   │       │   ├── dashboard/
│   │   │       │   │   └── route.ts
│   │   │       │   ├── leave/
│   │   │       │   │   └── route.ts
│   │   │       │   └── payroll/
│   │   │       │       └── route.ts
│   │   │       ├── salary-structures/
│   │   │       │   ├── [salaryStructureId]/
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       └── work-schedules/
│   │   │           ├── [scheduleId]/
│   │   │           │   └── route.ts
│   │   │           └── route.ts
│   │   ├── features/
│   │   │   ├── attendance/
│   │   │   │   └── page.tsx
│   │   │   └── employees/
│   │   ├── get-help/
│   │   │   └── page.tsx
│   │   ├── types/
│   │   │   └── globals.d.ts
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── main/
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── chart-area-interactive.tsx
│   │   │   ├── data-table.tsx
│   │   │   ├── nav-documents.tsx
│   │   │   ├── nav-main.tsx
│   │   │   ├── nav-secondary.tsx
│   │   │   ├── nav-user.tsx
│   │   │   ├── section-cards.tsx
│   │   │   └── site-header.tsx
│   │   ├── sidebar/
│   │   │   ├── nav-project.tsx
│   │   │   ├── nav-user.tsx
│   │   │   ├── navmain.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── team-switcher.tsx
│   │   ├── ui/
│   │   │   ├── avatar.tsx
│   │   │   ├── background-lines.tsx
│   │   │   ├── background-ripple-effect.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── drawer.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── field.tsx
│   │   │   ├── hover-border-gradient.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── sonner.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toggle-group.tsx
│   │   │   ├── toggle.tsx
│   │   │   └── tooltip.tsx
│   │   ├── auth-access-actions.tsx
│   │   ├── background-lines-demo.tsx
│   │   ├── background-ripple-effect-demo.tsx
│   │   ├── features-section-demo-1.tsx
│   │   ├── hover-border-gradient-demo.tsx
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   └── toggler.tsx
│   ├── db/
│   │   ├── schema/
│   │   │   ├── activity-logs.ts
│   │   │   ├── approval-requests.ts
│   │   │   ├── attendance-corrections.ts
│   │   │   ├── attendances.ts
│   │   │   ├── auth-schema.ts
│   │   │   ├── departments.ts
│   │   │   ├── designations.ts
│   │   │   ├── emergency-contacts.ts
│   │   │   ├── employee-addresses.ts
│   │   │   ├── employee-documents.ts
│   │   │   ├── employees.ts
│   │   │   ├── enums.ts
│   │   │   ├── holidays.ts
│   │   │   ├── index.ts
│   │   │   ├── leave-allocations.ts
│   │   │   ├── leave-policies.ts
│   │   │   ├── leave-requests.ts
│   │   │   ├── leave-types.ts
│   │   │   ├── locations.ts
│   │   │   ├── notifications.ts
│   │   │   ├── organizations.ts
│   │   │   ├── payroll-periods.ts
│   │   │   ├── payslip-items.ts
│   │   │   ├── payslips.ts
│   │   │   ├── salary-components.ts
│   │   │   ├── salary-structures.ts
│   │   │   ├── work-schedule-days.ts
│   │   │   ├── work-schedules.ts
│   │   │   └── workdays.ts
│   │   ├── seed/
│   │   │   ├── employees.seed.ts
│   │   │   ├── index.ts
│   │   │   └── organization.seed.ts
│   │   └── index.ts
│   ├── features/
│   │   ├── approvals/
│   │   │   ├── approvals.repository.ts
│   │   │   ├── approvals.schemas.ts
│   │   │   ├── approvals.service.ts
│   │   │   └── approvals.types.ts
│   │   ├── attendance/
│   │   │   ├── attendance.domain.ts
│   │   │   ├── attendance.repository.ts
│   │   │   ├── attendance.schemas.ts
│   │   │   ├── attendance.service.ts
│   │   │   └── attendance.types.ts
│   │   ├── employees/
│   │   │   ├── employee.domain.ts
│   │   │   ├── employee.repository.ts
│   │   │   ├── employee.schemas.ts
│   │   │   ├── employee.service.ts
│   │   │   └── employee.types.ts
│   │   ├── organization/
│   │   │   ├── organization.repository.ts
│   │   │   ├── organization.schemas.ts
│   │   │   ├── organization.service.ts
│   │   │   └── organization.types.ts
│   │   ├── payroll/
│   │   │   ├── payroll.domain.ts
│   │   │   ├── payroll.repository.ts
│   │   │   ├── payroll.schemas.ts
│   │   │   ├── payroll.service.ts
│   │   │   └── payroll.types.ts
│   │   └── time-off/
│   │       ├── time-off.domain.ts
│   │       ├── time-off.repository.ts
│   │       ├── time-off.schemas.ts
│   │       ├── time-off.service.ts
│   │       └── time-off.types.ts
│   ├── hooks/
│   │   ├── use-approvals.ts
│   │   ├── use-attendance.ts
│   │   ├── use-audit-logs.ts
│   │   ├── use-employees.ts
│   │   ├── use-leave.ts
│   │   ├── use-me.ts
│   │   ├── use-mobile.ts
│   │   ├── use-notifications.ts
│   │   ├── use-organization.ts
│   │   ├── use-payroll.ts
│   │   └── use-reports.ts
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── errors.ts
│   │   │   ├── index.ts
│   │   │   ├── pagination.ts
│   │   │   ├── response.ts
│   │   │   └── validation.ts
│   │   ├── audit/
│   │   │   └── logger.ts
│   │   ├── auth/
│   │   │   ├── access.ts
│   │   │   ├── landing.ts
│   │   │   ├── page.ts
│   │   │   ├── permissions.ts
│   │   │   ├── redirects.ts
│   │   │   ├── roles.ts
│   │   │   └── session.ts
│   │   ├── email/
│   │   │   └── service.ts
│   │   ├── notifications/
│   │   │   └── service.ts
│   │   ├── auth-client.ts
│   │   ├── auth-context.ts
│   │   ├── auth.ts
│   │   ├── permissions.ts
│   │   ├── query-keys.ts
│   │   └── utils.ts
│   ├── providers/
│   │   ├── query-provider.tsx
│   │   └── theme-provider.tsx
│   └── proxy.ts
├── tests/
│   ├── auth-access.test.ts
│   ├── business-domain.test.ts
│   └── permissions.test.ts
├── .env
├── .env.example
├── .gitattributes
├── .gitignore
├── AGENTS.md
├── API_DOCUMENTATION.md
├── CLAUDE.md
├── DATABASE_SCHEMA.md
├── IMPLEMENTATION_PLAN.md
├── PRESENTATION.md
├── README.md
├── TESTING.md
├── bun.lock
├── components.json
├── drizzle.config.ts
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── skills-lock.json
├── structure.md
└── tsconfig.json
```
