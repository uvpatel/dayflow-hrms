# Dayflow HRMS - Directory Structure

## Overview & Architecture

Dayflow is a modern HRMS (Human Resource Management System) built with Next.js App Router, Tailwind CSS, Drizzle ORM, and TypeScript.

- **`src/app/`**: Next.js App Router root containing page routes, layout definitions, route groups (`(auth)`, `(dashboard)`, `(marketing)`, `(user)`), and API routes under `api/v1`.
- **`src/components/`**: Reusable UI components including base shadcn/ui components (`src/components/ui/`), layout components (`src/components/main/`, `src/components/sidebar/`), and auth forms.
- **`src/db/`**: Database configuration with Drizzle ORM, including database schemas (`src/db/schema/`) and seed data scripts (`src/db/seed/`).
- **`src/features/`**: Feature-oriented domain modules (attendance, approvals, employees, organization, payroll, time-off).
- **`src/lib/`**: Core utilities, auth server configuration, and client-side auth helpers.
- **`src/hooks/`**: Custom React hooks.
- **`src/providers/`**: Context and theme providers.
- **`public/`**: Static assets and SVG icons.
- **`drizzle/`**: Drizzle migration SQL files and schema snapshots.

---

## Full Directory Tree

```plaintext
dayflow/
├── .env
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── bun.lock
├── components.json
├── drizzle/
│   ├── 20260818172948_productive_dexter_bennett/
│   │   ├── migration.sql
│   │   └── snapshot.json
│   ├── 20260819131111_safe_arclight/
│   │   ├── migration.sql
│   │   └── snapshot.json
│   └── 20260819140616_overconfident_scarecrow/
│       ├── migration.sql
│       └── snapshot.json
├── drizzle.config.ts
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── sign-in/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   ├── (approvels)/
│   │   │   │   │   └── approvels/
│   │   │   │   │       └── leave/
│   │   │   │   │           ├── error.tsx
│   │   │   │   │           ├── loading.tsx
│   │   │   │   │           ├── not-found.tsx
│   │   │   │   │           └── page.tsx
│   │   │   │   ├── (attendence)/
│   │   │   │   │   └── attendance/
│   │   │   │   │       ├── daily/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       ├── regulize/
│   │   │   │   │       │   ├── error.tsx
│   │   │   │   │       │   ├── loading.tsx
│   │   │   │   │       │   ├── not-found.tsx
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       └── weekly/
│   │   │   │   │           ├── error.tsx
│   │   │   │   │           ├── loading.tsx
│   │   │   │   │           ├── not-found.tsx
│   │   │   │   │           └── page.tsx
│   │   │   │   ├── (organization)/
│   │   │   │   │   ├── holidays/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── organization/
│   │   │   │   │   │   ├── departments/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   ├── error.tsx
│   │   │   │   │   │   ├── loading.tsx
│   │   │   │   │   │   ├── not-found.tsx
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── roles/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── (payroll)/
│   │   │   │   │   ├── payroll/
│   │   │   │   │   │   ├── error.tsx
│   │   │   │   │   │   ├── loading.tsx
│   │   │   │   │   │   ├── not-found.tsx
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── structured/
│   │   │   │   │       ├── error.tsx
│   │   │   │   │       ├── loading.tsx
│   │   │   │   │       ├── not-found.tsx
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── (people)/
│   │   │   │   │   └── people/
│   │   │   │   │       ├── billing/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       ├── onboarding/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       ├── profile/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       └── settings/
│   │   │   │   │           ├── error.tsx
│   │   │   │   │           ├── loading.tsx
│   │   │   │   │           ├── not-found.tsx
│   │   │   │   │           └── page.tsx
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
│   │   │   │   ├── data.json
│   │   │   │   ├── page.tsx
│   │   │   │   └── settings/
│   │   │   │       ├── billing/
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── page.tsx
│   │   │   │       └── team/
│   │   │   │           └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (marketing)/
│   │   │   ├── about/
│   │   │   │   └── page.tsx
│   │   │   └── pricing/
│   │   │       └── page.tsx
│   │   ├── (user)/
│   │   │   ├── admin/
│   │   │   │   ├── SearchUsers.tsx
│   │   │   │   ├── _actions.ts
│   │   │   │   └── page.tsx
│   │   │   ├── employee/
│   │   │   │   ├── employee-service.ts
│   │   │   │   ├── employee-table.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── hr/
│   │   │   │   └── page.tsx
│   │   │   └── manager/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   └── auth/
│   │   │       ├── [...all]/
│   │   │       │   └── route.ts
│   │   │       ├── approvals/
│   │   │       │   ├── [approvalId]/
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       ├── attendance/
│   │   │       │   └── route.ts
│   │   │       ├── attendence/
│   │   │       │   ├── check-in/
│   │   │       │   │   └── route.ts
│   │   │       │   ├── check-out/
│   │   │       │   │   └── route.ts
│   │   │       │   ├── corrections/
│   │   │       │   │   ├── [correctionId]/
│   │   │       │   │   │   └── route.ts
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       ├── departments/
│   │   │       │   ├── [departmentId]/
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       ├── employees/
│   │   │       │   ├── [employeeId]/
│   │   │       │   │   ├── attendance/
│   │   │       │   │   │   └── route.ts
│   │   │       │   │   ├── payslips/
│   │   │       │   │   │   └── route.ts
│   │   │       │   │   ├── route.ts
│   │   │       │   │   └── time-off/
│   │   │       │   │       └── route.ts
│   │   │       │   └── route.ts
│   │   │       ├── holidays/
│   │   │       │   └── route.ts
│   │   │       ├── leave-requests/
│   │   │       │   ├── [requestId]/
│   │   │       │   │   ├── approve/
│   │   │       │   │   │   └── route.ts
│   │   │       │   │   ├── reject/
│   │   │       │   │   │   └── route.ts
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       ├── leave-types/
│   │   │       │   └── route.ts
│   │   │       ├── me/
│   │   │       │   ├── attendance/
│   │   │       │   │   └── route.ts
│   │   │       │   ├── payslips/
│   │   │       │   │   └── route.ts
│   │   │       │   ├── route.ts
│   │   │       │   └── time-off/
│   │   │       │       └── route.ts
│   │   │       ├── notifications/
│   │   │       │   └── route.ts
│   │   │       ├── payroll/
│   │   │       │   ├── payslips/
│   │   │       │   │   └── route.ts
│   │   │       │   └── periods/
│   │   │       │       └── route.ts
│   │   │       └── work-schedules/
│   │   │           ├── [scheduleId]/
│   │   │           │   └── route.ts
│   │   │           └── route.ts
│   │   ├── auth/
│   │   │   └── [...all]/
│   │   │       └── route.ts
│   │   ├── favicon.ico
│   │   ├── features/
│   │   │   ├── attendance/
│   │   │   │   └── page.tsx
│   │   │   └── employees/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── types/
│   │       └── globals.d.ts
│   ├── components/
│   │   ├── background-lines-demo.tsx
│   │   ├── background-ripple-effect-demo.tsx
│   │   ├── hover-border-gradient-demo.tsx
│   │   ├── login-form.tsx
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
│   │   ├── signup-form.tsx
│   │   ├── toggler.tsx
│   │   └── ui/
│   │       ├── avatar.tsx
│   │       ├── background-lines.tsx
│   │       ├── background-ripple-effect.tsx
│   │       ├── badge.tsx
│   │       ├── breadcrumb.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── chart.tsx
│   │       ├── checkbox.tsx
│   │       ├── collapsible.tsx
│   │       ├── drawer.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── field.tsx
│   │       ├── hover-border-gradient.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── sidebar.tsx
│   │       ├── skeleton.tsx
│   │       ├── sonner.tsx
│   │       ├── switch.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toggle-group.tsx
│   │       ├── toggle.tsx
│   │       └── tooltip.tsx
│   ├── db/
│   │   ├── index.ts
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
│   │   └── seed/
│   │       ├── employees.seed.ts
│   │       ├── index.ts
│   │       └── organization.seed.ts
│   ├── features/
│   │   ├── approvals/
│   │   ├── attendance/
│   │   ├── employees/
│   │   ├── organization/
│   │   ├── payroll/
│   │   └── time-off/
│   ├── hooks/
│   │   └── use-mobile.ts
│   ├── lib/
│   │   ├── auth-client.ts
│   │   ├── auth.ts
│   │   └── utils.ts
│   ├── providers/
│   │   └── theme-provider.tsx
│   └── proxy.ts
├── structure.md
├── tsconfig.json
└── tsconfig.tsbuildinfo
```
