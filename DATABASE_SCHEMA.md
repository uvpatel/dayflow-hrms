# Dayflow Database Schema

This document describes the Drizzle schema currently exported from `src/db/schema`. PostgreSQL is the only application database; `drizzle.config.ts` reads `DATABASE_URL`, loads `src/db/index.ts`, and writes append-only migration artifacts to `drizzle/`.

## Current migration status

The latest migration was generated at:

```text
drizzle/20260822083351_worthless_mister_fear/
├── migration.sql
└── snapshot.json
```

It has **not** been applied to a database, and the development seed has **not** been executed as part of this implementation pass. Before applying it, point `DATABASE_URL` at a disposable development branch and inspect the SQL and existing data. In particular, the migration adds uniqueness constraints, foreign keys, check constraints, timestamp casts, and text-to-`numeric` casts that can fail when legacy rows are duplicated, orphaned, or malformed.

Do not edit or remove older migration folders. Do not use `db:push` as a substitute for reviewing and applying the generated migration.

## Table inventory

The current schema exports 30 tables.

| Area | Tables | Current purpose |
| --- | --- | --- |
| Authentication | `user`, `session`, `account`, `verification` | Better Auth users, sessions, credentials/OAuth accounts, and one-time verification records |
| Organization | `organizations`, `departments`, `designations`, `locations`, `holidays` | Tenant and organization reference data |
| People | `employees`, `employee_addresses`, `emergency_contacts`, `employee_documents` | Employee identity, reporting line, contact, and document records |
| Attendance | `attendances`, `attendance_corrections`, `work_schedules`, `work_schedule_days`, `workdays` | Check-in/out records, correction requests, and shift configuration |
| Leave and approvals | `leave_types`, `leave_policies`, `leave_allocations`, `leave_requests`, `approval_requests` | Leave catalog, balances, requests, and generic approval records |
| Payroll | `payroll_periods`, `payslips`, `payslip_items`, `salary_structures`, `salary_components` | Periods, employee payslips, and payroll catalog scaffolding |
| Operations | `notifications`, `activity_logs` | In-app messages and audit-style activity entries |

## Core relationships

The following relationships are declared as database foreign keys in the current Drizzle schema:

| Child column | Parent column | Delete behavior |
| --- | --- | --- |
| `session.user_id` | `user.id` | cascade |
| `account.user_id` | `user.id` | cascade |
| `employees.user_id` | `user.id` | set null |
| `employees.organization_id` | `organizations.id` | cascade |
| `employees.department_id` | `departments.id` | set null |
| `employees.designation_id` | `designations.id` | set null |
| `employees.manager_id` | `employees.id` | set null |
| `employees.location_id` | `locations.id` | set null |
| `designations.department_id` | `departments.id` | set null |
| `attendances.employee_id` | `employees.id` | restrict |
| `attendances.organization_id` | `organizations.id` | restrict |
| `attendance_corrections.employee_id` | `employees.id` | restrict |
| `attendance_corrections.organization_id` | `organizations.id` | restrict |
| `attendance_corrections.attendance_id` | `attendances.id` | set null |
| `attendance_corrections.reviewed_by` | `employees.id` | set null |
| `leave_types.organization_id` | `organizations.id` | cascade |
| `leave_allocations.employee_id` | `employees.id` | restrict |
| `leave_requests.employee_id` | `employees.id` | restrict |
| `leave_requests.organization_id` | `organizations.id` | restrict |
| `leave_requests.approved_by` | `employees.id` | set null |
| `payroll_periods.organization_id` | `organizations.id` | restrict |
| `payslips.employee_id` | `employees.id` | restrict |
| `payslips.organization_id` | `organizations.id` | restrict |
| `payslips.payroll_period_id` | `payroll_periods.id` | restrict |
| `work_schedules.employee_id` | `employees.id` | cascade |

`employees.work_schedule_id` is indexed but is not currently declared as a foreign key. Several supporting tables listed in [Legacy and incomplete relationships](#legacy-and-incomplete-relationships) also contain identifier columns without database-enforced relationships.

## Authentication

### `user`

Better Auth user identity. Email is unique. The table also contains verification state, image, role, ban fields, and created/updated timestamps.

### `session`

Session tokens are unique and expire at `expires_at`. Sessions link to `user` with cascade deletion and retain IP address, user agent, and optional impersonator metadata.

### `account`

Credential and OAuth accounts contain `account_id`, `provider_id`, non-null `issuer`, token fields, optional password hash, scopes, and expiry timestamps. `(issuer, account_id)` is unique, matching Better Auth 1.7 account lookup requirements.

The latest migration backfills credential accounts with `issuer = 'local:credential'` and OAuth accounts with `issuer = 'local:oauth:' || provider_id` before making the column non-null.

### `verification`

Stores expiring verification/reset values by indexed identifier.

## Employees and organization

### `organizations`

Stores name, optional slug/description, and an IANA timezone string. `timezone` defaults to `UTC`; the database does not validate that the value is a real IANA zone.

### `employees`

The employee profile is the authorization source used by application code. Important columns include:

- Better Auth link: `user_id`
- Tenant scope: `organization_id`
- Identity: `employee_number`, name, email, phone
- Organization references: department, designation, manager, location, and work-schedule IDs
- Employment data: role, status, type, and joining date

Important integrity rules:

- Email is globally unique.
- A non-null employee number is globally unique.
- A manager cannot equal the employee in the same row.
- Role is limited to `admin`, `hr`, `manager`, or `employee`.
- Status is limited to `active`, `onboarding`, `notice_period`, or `inactive`.
- Employment type is null or one of `full_time`, `part_time`, `contract`, or `intern`.

Reporting-cycle prevention is an application-domain rule; the database check only prevents direct self-management.

### Organization reference tables

Departments, designations, locations, and holidays hold organization reference data and have lookup indexes. Designations optionally reference a department. Organization IDs on departments, designations, locations, and holidays are not all declared as foreign keys in the current schema.

## Attendance

### `attendances`

Each record can link an employee and organization to a server-derived `work_date`, check-in/out timestamps, schedule metadata, break/work/overtime minutes, lateness, and attendance status. The legacy `date` and `work_hours` columns remain for compatibility.

Important integrity rules:

- At most one non-null `(employee_id, work_date)` record.
- At most one open record per employee, where check-in is set and check-out is null.
- Check-out cannot precede check-in.
- Break, work, and overtime minutes cannot be negative.
- Status is limited to `present`, `absent`, `half_day`, `leave`, or `holiday`.

The latest migration backfills `work_date` only for employee/day combinations that have one legacy record. Duplicate legacy days remain null so the migration does not silently discard or merge data.

### `attendance_corrections`

Stores requested check-in/out values, reason, review state, optional related attendance record, reviewer, comment, and timestamps. Status is limited to `pending`, `approved`, `rejected`, or `cancelled`; a requested check-out requires a check-in and cannot precede it.

### `work_schedules`

Employee-specific schedules store timezone, shift start/end as minutes from midnight, break/full-day/half-day/grace durations, weekday CSV text, and an effective date range. Checks keep minute values and date ranges internally consistent. `work_schedule_days` and `workdays` are older descriptive tables and are not linked to this schedule model.

## Leave

### `leave_types`

Organization-scoped leave catalog with balance requirement and active flags. `(organization_id, name)` is unique.

### `leave_allocations`

Stores `numeric(7,2)` allocated and used balances for one employee/type pair. The pair is unique, values cannot be negative, and used days cannot exceed allocated days.

### `leave_requests`

Stores employee and organization, leave type text, timezone-aware start/end timestamps, `numeric(7,2)` requested days, full/half-day unit, reason, state, decision metadata, and rejection reason.

Checks require an ordered date range, positive days, a known unit/status, and a non-empty rejection reason when status is `rejected`. These constraints are present in the generated migration but have not yet been exercised against a database.

`leave_policies` and `approval_requests` remain generic scaffolding. They do not currently declare organization or foreign-key relationships.

## Payroll

### `payroll_periods`

Organization-scoped period with optional start/end timestamps and a state of `draft`, `calculating`, `review`, `finalized`, or `published`. Non-null organization/date triples are unique, and end cannot precede start.

### `payslips`

Links an employee, organization, and payroll period. Money columns use `numeric(14,2)` for basic, gross, deductions, and net salary; negative amounts are rejected. Status is limited to `draft`, `calculated`, `reviewed`, `published`, or `void`. One employee can have at most one payslip for a non-null payroll period.

`salary_structures`, `salary_components`, and `payslip_items` are currently name/description scaffolds and are not linked to employees, periods, or payslips.

## Legacy and incomplete relationships

The schema accurately reflects an incremental application, not a completed normalized HR database. The following gaps remain:

- `departments.organization_id`, `designations.organization_id`, `locations.organization_id`, and `holidays.organization_id` are indexed but do not currently reference `organizations.id`.
- `employees.work_schedule_id` is not a foreign key.
- Employee addresses, emergency contacts, and documents contain `employee_id` without a declared foreign key.
- Notifications use an integer `user_id` without a declared relationship; current services treat it as an employee identifier.
- Approval requests store integer requestor/approver IDs without declared relationships or a link to the underlying leave/correction record.
- Activity logs have no actor, employee, organization, resource, or metadata columns.
- Leave policies, salary structures/components, payslip items, work-schedule days, and workdays are not tenant-scoped or relationally connected.

These limitations should be resolved with new append-only migrations rather than editing migration history.

## Safe migration workflow

Generate and inspect without changing a database:

```bash
bun run db:generate
```

After confirming the URL is a disposable development database:

```bash
bun run db:migrate
bun run db:seed
```

Recommended preflight checks before applying the latest migration:

1. Find duplicate employee emails and employee numbers.
2. Find duplicate attendance rows for the same employee and calendar day.
3. Find duplicate leave allocation employee/type pairs.
4. Find duplicate employee/payroll-period payslips.
5. Find orphaned employee, organization, manager, attendance, leave, and payroll references.
6. Verify legacy leave/payroll text amounts cast cleanly to the target `numeric` types.
7. Back up or branch the database, apply the migration, then exercise concurrent attendance and leave/payroll workflows.
