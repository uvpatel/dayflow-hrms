# Dayflow API

Dayflow business route handlers live under `/api/v1`. Better Auth owns `/api/auth/*`. Two older compatibility families, `/api/notifications` and `/api/payroll/*`, also remain in the repository; new client code should use `/api/v1`.

## Authentication and identity

Requests authenticate through Better Auth's HTTP-only session cookie. The server resolves a linked employee record, organization ID, normalized role, and permission list. The employee record is the application authorization source; unknown role values normalize to `employee`.

Self-service attendance check-in/out derives the employee and timestamp from the session and server clock. Administrative endpoints may intentionally accept a target employee ID, but it must be authorized and resolved by the server.

Current caveat: the auth-context resolver can create/link an employee and create a default organization while resolving a session. That side effect is not part of a stable public API contract and should move to explicit onboarding.

## Response shapes

Newer handlers use the shared envelope:

```ts
type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
};
```

Error responses are still in transition. Clients must currently handle both structured and legacy string errors:

```ts
type ApiError = {
  success: false;
  error: string | {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
  code?: string;
  details?: unknown;
};
```

Common statuses are `400` for invalid input, `401` for no session, `403` for insufficient permission, `404` for missing or deliberately concealed resources, `409` for a state conflict, `422` for a business-rule failure, and `500` for an unexpected failure. Individual legacy handlers do not yet use every status consistently.

## Identity endpoints

| Method | Path | Current behavior |
| --- | --- | --- |
| `GET` | `/api/v1/me` | Returns the current Better Auth user and linked employee profile |
| `PATCH` | `/api/v1/me` | Updates the current employee's validated name, email, or phone fields |
| `GET` | `/api/v1/me/attendance` | Returns attendance belonging to the current employee |
| `GET` | `/api/v1/me/time-off` | Returns the current employee's allocations and requests |
| `GET` | `/api/v1/me/payslips` | Returns up to 50 published payslips belonging to the current employee |

## Employees and managers

| Method | Path | Current scope |
| --- | --- | --- |
| `GET` | `/api/v1/employees` | Employee: self; manager: self plus direct reports; HR/admin: organization |
| `POST` | `/api/v1/employees` | HR/admin; HR cannot create an admin employee |
| `GET` | `/api/v1/employees/:employeeId` | Self, assigned direct report, or organization-scoped HR/admin |
| `PATCH` | `/api/v1/employees/:employeeId` | Self-field allowlist or HR/admin organization update; only admin may promote to admin |
| `DELETE` | `/api/v1/employees/:employeeId` | Admin; sets employment status to `inactive` rather than deleting the row |
| `GET` | `/api/v1/employees/:employeeId/attendance` | Self, direct report, or organization-scoped HR/admin |
| `GET` | `/api/v1/employees/:employeeId/time-off` | Self, assigned direct report, or organization-scoped HR/admin |
| `GET` | `/api/v1/employees/:employeeId/payslips` | Self or HR/admin; managers remain self-only for payroll |
| `PATCH` | `/api/v1/employees/:employeeId/manager` | HR/admin assign or clear a manager |
| `GET` | `/api/v1/managers/me/team` | Current manager's direct reports |
| `GET` | `/api/v1/managers/:managerId/reports` | Manager may request self; HR/admin may request a manager in the same organization |

Manager assignment validates same-organization membership, active manager status, manager role, direct self-management, and reporting cycles in application code.

## Attendance

| Method | Path | Current behavior |
| --- | --- | --- |
| `GET` | `/api/v1/attendance` | Paginated role scope: self, self plus direct reports, or organization; supports status/from/to filters |
| `POST` | `/api/v1/attendance` | Privileged manual record creation for an organization employee |
| `GET` | `/api/v1/attendance/today` | Current employee's open record or schedule-timezone workday record |
| `GET`, `POST` | `/api/v1/attendance/check-in` | Reads current state or creates a server-timestamped current-employee check-in |
| `GET`, `POST` | `/api/v1/attendance/check-out` | Reads current state or atomically closes the current employee's open record |
| `GET`, `PATCH`, `DELETE` | `/api/v1/attendance/:attendanceId` | Row-scoped read; privileged mutation |
| `GET`, `POST` | `/api/v1/attendance/corrections` | Role-scoped list or current-employee correction request |
| `GET`, `PATCH`, `DELETE` | `/api/v1/attendance/corrections/:correctionId` | Row-scoped read; privileged mutation |
| `POST` | `/api/v1/attendance/corrections/:correctionId/decision` | Assigned manager or organization HR/admin approves or rejects a pending correction |

Check-in/out bodies do not accept an authoritative employee ID or timestamp. The service derives work date and lateness from the applicable employee/organization timezone and schedule. Check-out calculates break, work, overtime, decimal display hours, and present/half-day status.

Correction decisions require a rejection comment when rejected and atomically update or create the attendance record, resolve the correction, notify the employee, and write an activity record. The generated migration adds one-record-per-employee/workday and one-open-record-per-employee unique indexes. Until that migration is applied, a database does not have those new guarantees. Duplicate/open conflicts are mapped to `409` when the database reports a unique violation.

## Leave and approvals

### Route inventory

| Methods | Path family | Current purpose |
| --- | --- | --- |
| `GET`, `POST` | `/api/v1/leave-types` | List available organization/global types; HR/admin create an organization type |
| `GET`, `PATCH`, `DELETE` | `/api/v1/leave-types/:leaveTypeId` | Organization-visible read; HR/admin organization mutation |
| `GET`, `POST` | `/api/v1/leave-policies` | Organization list; HR/admin organization create |
| `GET`, `PATCH`, `DELETE` | `/api/v1/leave-policies/:policyId` | Organization read; HR/admin organization mutation |
| `GET`, `POST` | `/api/v1/leave-allocations` | Self/team/organization list; HR/admin organization create |
| `GET`, `PATCH`, `DELETE` | `/api/v1/leave-allocations/:allocationId` | Self/team/organization read; HR/admin organization mutation |
| `GET`, `POST` | `/api/v1/leave-requests` | Self/team/organization list or request submission |
| `GET`, `PATCH`, `DELETE` | `/api/v1/leave-requests/:requestId` | Actor-scoped read; owner-only pending edit; owner-only pending cancellation (`DELETE` does not remove the row) |
| `POST` | `/api/v1/leave-requests/:requestId/cancel` | Owner-only pending cancellation |
| `POST` | `/api/v1/leave-requests/:requestId/decision` | Assigned manager or organization HR/admin approves/rejects a pending request |
| `POST` | `/api/v1/leave-requests/:requestId/approve` | Compatibility approval route using the same decision service |
| `POST` | `/api/v1/leave-requests/:requestId/reject` | Compatibility rejection route using the same decision service |
| `GET`, `POST` | `/api/v1/approvals` | Direct-report/organization-scoped generic list; HR/admin create |
| `GET`, `PATCH`, `DELETE` | `/api/v1/approvals/:approvalId` | Scoped read; HR/admin reassignment; admin pending-row deletion |
| `POST` | `/api/v1/approvals/:approvalId/approve` | Scoped reviewer resolves a pending generic approval |
| `POST` | `/api/v1/approvals/:approvalId/reject` | Scoped reviewer rejects with a required reason |

Leave duration uses the employee schedule, excludes organization holidays, and supports full- or half-day requests. Submission and pending edits serialize per employee with a PostgreSQL advisory transaction lock and enforce overlap and balance rules. Decisions enforce self/team/organization scope, require a rejection comment, and use one SQL statement for request state, balance, notification, activity, and approved-day attendance writes.

The generic `approval_requests` workflow is independently scoped to assigned direct reports for managers and the organization for HR/admin. It remains a parallel record without a database relation to its underlying leave/correction resource; its decision, notification, and activity writes are separate operations rather than one database transaction.

## Payroll

| Methods | Path | Current purpose |
| --- | --- | --- |
| `GET`, `POST` | `/api/v1/payroll/periods` | Privileged list/create periods |
| `GET`, `PATCH`, `DELETE` | `/api/v1/payroll/periods/:periodId` | Privileged period operations |
| `POST` | `/api/v1/payroll/periods/:periodId/calculate` | Payroll calculation action |
| `POST` | `/api/v1/payroll/periods/:periodId/finalize` | Payroll finalize action |
| `POST` | `/api/v1/payroll/periods/:periodId/publish` | Publish a finalized period and its reviewed payslips |
| `GET`, `POST` | `/api/v1/payroll/payslips` | Privileged list/create payslips |
| `GET`, `PATCH`, `DELETE` | `/api/v1/payroll/payslips/:payslipId` | Privileged payslip operations |
| `GET`, `POST` | `/api/v1/salary-structures` | Privileged salary-structure operations |
| `GET`, `PATCH`, `DELETE` | `/api/v1/salary-structures/:salaryStructureId` | Privileged salary-structure operations |

The permission map grants organization-wide payroll only to HR/admin; managers have self payroll only. Draft payslip create/update derives net salary from exact-cent gross and deductions and rejects deductions above gross. Calculation atomically derives net values and moves draft payslips/period to `calculated`/`review`; finalization validates those values and moves them to `reviewed`/`finalized`; publication moves reviewed payslips and the period to `published`. Finalized and published data is locked, and employee/self endpoints expose only published payslips.

This is a controlled visibility and lifecycle workflow, not a statutory payroll engine: salary structures/components and `payslip_items` are not used to calculate taxes, benefits, or compensation formulas. The lifecycle and transaction behavior still require database-backed integration and concurrency verification.

## Organization, notifications, reports, and audit

| Methods | Path family | Current access |
| --- | --- | --- |
| `GET`, `PATCH` | `/api/v1/organizations`, `/api/v1/organizations/:id` | Organization reads; admin updates |
| CRUD | `/api/v1/departments`, `/designations`, `/locations`, `/work-schedules`, `/holidays` | Organization-scoped reads; HR/admin mutations; schedule reads additionally use self/team scope |
| `GET`, `POST`, `PATCH`, `DELETE` | `/api/v1/notifications` and item/read-all routes | Current employee reads/marks/deletes own rows; HR/admin send only to same-organization recipients |
| `GET` | `/api/v1/reports/dashboard`, `/attendance`, `/leave`, `/payroll` | Persisted organization/team aggregates; operational reports exclude employees and payroll report is HR/admin only |
| `GET` | `/api/v1/activity-logs` | Users with audit-read permission |

Report handlers aggregate persisted, actor-scoped data; they no longer use hard-coded sample trends or totals. Dashboard recent activity intentionally omits `activity_logs` because that legacy table has no organization key and cannot yet be safely tenant-filtered.

## Pagination and filters

Newer list endpoints use one-based `page` and `limit`; the shared parser caps endpoint-specific limits. Some hooks also normalize older `pageSize` values. Common optional filters include `search`, `status`, `departmentId`, `employeeId`, `from`, and `to`, but support is route-specific.

When a shared paginated response is used, `meta.total` is the matching row count and `meta.totalPages` is calculated from the active limit. A few legacy list endpoints still report the current page length as total or return unpaginated arrays; clients should follow the documented handler rather than assume every family is normalized.

## Verification status

At the 2026-08-22 documentation checkpoint, neither generated schema migration had been applied, the seed had not been run, and no database-backed API integration tests had been executed. The 26 passing unit tests cover pure permission/redirect and attendance, manager, leave, and payroll domain rules; they do not prove route transactionality, database constraints, tenant isolation under real data, or concurrent behavior.
