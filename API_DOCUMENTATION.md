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
| `GET` | `/api/v1/me/payslips` | Returns up to 50 current-employee payslips; published-status filtering is implementation-dependent |

## Employees and managers

| Method | Path | Current scope |
| --- | --- | --- |
| `GET` | `/api/v1/employees` | Employee: self; manager: self plus direct reports; HR/admin: organization |
| `POST` | `/api/v1/employees` | HR/admin; HR cannot create an admin employee |
| `GET` | `/api/v1/employees/:employeeId` | Self, assigned direct report, or organization-scoped HR/admin |
| `PATCH` | `/api/v1/employees/:employeeId` | Self-field allowlist or HR/admin organization update; only admin may promote to admin |
| `DELETE` | `/api/v1/employees/:employeeId` | Admin; sets employment status to `inactive` rather than deleting the row |
| `GET` | `/api/v1/employees/:employeeId/attendance` | Self, direct report, or organization-scoped HR/admin |
| `GET` | `/api/v1/employees/:employeeId/time-off` | Self/team/organization according to the handler's resource scope |
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

Check-in/out bodies do not accept an authoritative employee ID or timestamp. The service derives work date and lateness from the applicable employee/organization timezone and schedule. Check-out calculates break, work, overtime, decimal display hours, and present/half-day status.

The generated migration adds one-record-per-employee/workday and one-open-record-per-employee unique indexes. Until that migration is applied, a database does not have those new guarantees. Duplicate/open conflicts are mapped to `409` when the database reports a unique violation.

## Leave and approvals

### Route inventory

| Methods | Path family | Current purpose |
| --- | --- | --- |
| `GET`, `POST` | `/api/v1/leave-types` | List types; privileged create |
| `GET`, `PATCH`, `DELETE` | `/api/v1/leave-types/:leaveTypeId` | Read or privileged mutation |
| `GET`, `POST` | `/api/v1/leave-policies` | List policies; privileged create |
| `GET`, `PATCH`, `DELETE` | `/api/v1/leave-policies/:policyId` | Read or privileged mutation |
| `GET`, `POST` | `/api/v1/leave-allocations` | List allocations; privileged create |
| `GET`, `PATCH`, `DELETE` | `/api/v1/leave-allocations/:allocationId` | Read or privileged mutation |
| `GET`, `POST` | `/api/v1/leave-requests` | Role-filtered list or request submission |
| `GET`, `PATCH`, `DELETE` | `/api/v1/leave-requests/:requestId` | Read, update/cancel, or delete one request according to the current handler |
| `POST` | `/api/v1/leave-requests/:requestId/approve` | Privileged pending-request decision |
| `POST` | `/api/v1/leave-requests/:requestId/reject` | Privileged pending-request decision |
| `GET`, `POST` | `/api/v1/approvals` | Generic approval list/create |
| `GET`, `PATCH`, `DELETE` | `/api/v1/approvals/:approvalId` | Generic approval read/mutation |
| `POST` | `/api/v1/approvals/:approvalId/approve` | Privileged approval action |
| `POST` | `/api/v1/approvals/:approvalId/reject` | Privileged rejection action |

Leave requests calculate inclusive full/half-day duration and validate overlap/balance. The final integration must be verified for actor-scoped single-resource reads, pending-only cancellation, required rejection comments, transaction boundaries, allocation updates, notifications, and audit metadata. The generic `approval_requests` table remains separate scaffolding without a database relation to its underlying leave/correction resource.

## Payroll

| Methods | Path | Current purpose |
| --- | --- | --- |
| `GET`, `POST` | `/api/v1/payroll/periods` | Privileged list/create periods |
| `GET`, `PATCH`, `DELETE` | `/api/v1/payroll/periods/:periodId` | Privileged period operations |
| `POST` | `/api/v1/payroll/periods/:periodId/calculate` | Payroll calculation action |
| `POST` | `/api/v1/payroll/periods/:periodId/finalize` | Payroll finalize action |
| `GET`, `POST` | `/api/v1/payroll/payslips` | Privileged list/create payslips |
| `GET`, `PATCH`, `DELETE` | `/api/v1/payroll/payslips/:payslipId` | Privileged payslip operations |
| `GET`, `POST` | `/api/v1/salary-structures` | Privileged salary-structure operations |
| `GET`, `PATCH`, `DELETE` | `/api/v1/salary-structures/:salaryStructureId` | Privileged salary-structure operations |

The permission map grants organization-wide payroll only to HR/admin; managers have self payroll only. Payroll calculations, status locking, publication visibility, and cross-organization checks must be verified with integration tests before treating this surface as a production payroll engine.

## Organization, notifications, reports, and audit

| Methods | Path family | Current access |
| --- | --- | --- |
| `GET`, `PATCH` | `/api/v1/organizations`, `/api/v1/organizations/:id` | Organization reads and privileged updates |
| CRUD | `/api/v1/departments`, `/designations`, `/locations`, `/work-schedules`, `/holidays` | Broadly available reference reads and privileged mutations |
| `GET`, `POST`, `PATCH`, `DELETE` | `/api/v1/notifications` and item/read-all routes | Employee read plus privileged creation/mutation operations |
| `GET` | `/api/v1/reports/dashboard`, `/attendance`, `/leave`, `/payroll` | Role-appropriate reporting endpoints |
| `GET` | `/api/v1/activity-logs` | Users with audit-read permission |

Report handlers must aggregate persisted, actor-scoped data. Any sample trends, fixed totals, or fallback department data found during verification are implementation gaps, not authoritative analytics.

## Pagination and filters

Newer list endpoints use one-based `page` and `limit`; the shared parser caps endpoint-specific limits. Some hooks also normalize older `pageSize` values. Common optional filters include `search`, `status`, `departmentId`, `employeeId`, `from`, and `to`, but support is route-specific.

When a shared paginated response is used, `meta.total` is the matching row count and `meta.totalPages` is calculated from the active limit. A few legacy list endpoints still report the current page length as total or return unpaginated arrays; clients should follow the documented handler rather than assume every family is normalized.

## Verification status

At the 2026-08-22 documentation checkpoint, the generated schema migration had not been applied, the seed had not been run, and no database-backed API integration tests had been executed. The 20 passing unit tests cover pure permission/redirect and attendance/manager/leave domain rules; they do not prove route transactionality, database constraints, tenant isolation under real data, or concurrent behavior.
