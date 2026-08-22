# Dayflow HRMS — Production-Grade API Architecture, Drizzle ORM Analysis & Implementation

You are working on an **existing production-oriented HRMS application called Dayflow**.

Do NOT rebuild the project from scratch.

Your responsibility is to deeply analyze the existing codebase, understand the current Drizzle ORM database architecture and existing API implementation, identify architectural problems, and then refactor/implement a consistent, secure, maintainable, production-grade API layer.

The final system must support the existing Dayflow HRMS functionality including:

* Authentication
* Organizations
* Employees
* Departments
* Designations
* Locations
* Attendance
* Attendance corrections
* Work schedules
* Holidays
* Leave types
* Leave policies
* Leave allocations/balances
* Leave requests
* Approval workflows
* Payroll periods
* Salary structures
* Salary components
* Payslips
* Notifications
* Activity/audit logs

---

# 1. IMPORTANT: ANALYZE BEFORE MODIFYING

Do NOT immediately generate APIs.

First inspect the complete project.

Pay particular attention to:

```text
src/db/
src/db/schema/
src/db/index.ts

src/app/api/

src/features/

src/lib/auth.ts
src/lib/auth-client.ts

src/proxy.ts

drizzle/
drizzle.config.ts

package.json
tsconfig.json
```

Also inspect all existing:

```text
route.ts
service.ts
_actions.ts
queries
mutations
schemas
types
```

Before changing code, understand what is already implemented and what is actually being used.

Do NOT delete working functionality merely because you prefer another architecture.

---

# 2. ANALYZE THE DRIZZLE ORM SCHEMA COMPLETELY

Inspect every file inside:

```text
src/db/schema/
```

The existing project contains schemas similar to:

```text
activity-logs.ts
approval-requests.ts
attendance-corrections.ts
attendances.ts
auth-schema.ts
departments.ts
designations.ts
emergency-contacts.ts
employee-addresses.ts
employee-documents.ts
employees.ts
enums.ts
holidays.ts
leave-allocations.ts
leave-policies.ts
leave-requests.ts
leave-types.ts
locations.ts
notifications.ts
organizations.ts
payroll-periods.ts
payslip-items.ts
payslips.ts
salary-components.ts
salary-structures.ts
work-schedule-days.ts
work-schedules.ts
workdays.ts
```

Analyze every schema rather than assuming its structure.

For every table determine:

* primary key
* foreign keys
* unique constraints
* nullable columns
* defaults
* enums
* indexes
* timestamps
* ownership
* organization relationship
* employee relationship
* user relationship
* cascading behavior
* business purpose
* tables depending on it
* tables it depends on

Build a mental/entity relationship model before implementing APIs.

---

# 3. VERIFY DATABASE RELATIONSHIPS

Determine whether relationships correctly represent:

```text
User
  ↓
Employee
  ↓
Organization

Organization
  ├── Departments
  ├── Designations
  ├── Locations
  ├── Employees
  ├── Work Schedules
  ├── Holidays
  └── Leave Policies

Employee
  ├── Department
  ├── Designation
  ├── Location
  ├── Manager
  ├── Work Schedule
  ├── Addresses
  ├── Emergency Contacts
  ├── Documents
  ├── Attendance
  ├── Attendance Corrections
  ├── Leave Allocations
  ├── Leave Requests
  ├── Salary Structure
  └── Payslips

Leave Request
  ↓
Approval Request

Attendance Correction
  ↓
Approval Request

Payroll Period
  ↓
Payslips
  ↓
Payslip Items
```

Do not assume these relationships already exist correctly.

Verify them from the actual Drizzle schema.

If a relationship is missing or incorrectly modeled, document the issue before modifying it.

---

# 4. CHECK DRIZZLE SCHEMA QUALITY

Review the schema for production database concerns.

Check for missing:

* foreign keys
* unique constraints
* indexes
* composite indexes
* organization-scoped uniqueness
* timestamps
* `createdAt`
* `updatedAt`
* appropriate `onDelete`
* appropriate defaults
* status enums
* monetary precision
* date/time types
* auditability

For example, frequently queried combinations may need indexes such as:

```text
employeeId + date

organizationId + date

organizationId + status

employeeId + status

departmentId + status

payrollPeriodId + employeeId
```

Do NOT blindly create indexes.

Inspect actual query patterns first.

---

# 5. MULTI-TENANCY

Dayflow should be organization-aware.

Every organization-owned resource must be scoped using the authenticated user's organization.

Never trust:

```text
organizationId
employeeId
userId
```

simply because they were sent from the frontend.

Determine organization context from the authenticated user/session whenever possible.

A user belonging to Organization A must NEVER be able to access resources belonging to Organization B.

This requirement applies to:

* reads
* updates
* deletes
* nested resources
* search
* filtering
* exports
* approvals
* payroll
* documents

Prevent IDOR vulnerabilities.

---

# 6. ANALYZE EXISTING API ROUTES

Inspect all existing routes under:

```text
src/app/api/
```

There are already API routes for several HRMS domains.

Do NOT create duplicate APIs.

Create an inventory containing:

```text
METHOD
ROUTE
PURPOSE
AUTH REQUIRED?
ROLE/PERMISSION
IMPLEMENTED?
VALIDATION?
SERVICE USED?
PROBLEMS
RECOMMENDED ACTION
```

Identify:

* duplicate routes
* inconsistent naming
* spelling mistakes
* business APIs incorrectly nested under authentication
* duplicated logic
* direct database calls inside route handlers
* missing authorization
* missing validation
* inconsistent responses
* incorrect HTTP methods
* weak error handling

---

# 7. STANDARDIZE API ROUTING

Authentication should remain something like:

```text
/api/auth/[...all]
```

Business APIs should preferably follow:

```text
/api/v1/organizations

/api/v1/employees
/api/v1/employees/[employeeId]

/api/v1/departments
/api/v1/departments/[departmentId]

/api/v1/designations
/api/v1/designations/[designationId]

/api/v1/locations
/api/v1/locations/[locationId]

/api/v1/attendance
/api/v1/attendance/[attendanceId]
/api/v1/attendance/check-in
/api/v1/attendance/check-out

/api/v1/attendance/corrections
/api/v1/attendance/corrections/[correctionId]

/api/v1/work-schedules
/api/v1/work-schedules/[scheduleId]

/api/v1/holidays
/api/v1/holidays/[holidayId]

/api/v1/leave-types
/api/v1/leave-types/[leaveTypeId]

/api/v1/leave-policies
/api/v1/leave-policies/[policyId]

/api/v1/leave-allocations
/api/v1/leave-allocations/[allocationId]

/api/v1/leave-requests
/api/v1/leave-requests/[requestId]

/api/v1/leave-requests/[requestId]/approve
/api/v1/leave-requests/[requestId]/reject

/api/v1/approvals
/api/v1/approvals/[approvalId]
/api/v1/approvals/[approvalId]/approve
/api/v1/approvals/[approvalId]/reject

/api/v1/payroll/periods
/api/v1/payroll/periods/[periodId]

/api/v1/payroll/payslips
/api/v1/payroll/payslips/[payslipId]

/api/v1/salary-structures
/api/v1/salary-structures/[salaryStructureId]

/api/v1/notifications
/api/v1/notifications/[notificationId]

/api/v1/me
/api/v1/me/attendance
/api/v1/me/time-off
/api/v1/me/payslips
/api/v1/me/notifications
```

However:

DO NOT migrate existing routes blindly.

First determine whether existing frontend components depend on old routes.

If migration is necessary, update callers systematically and avoid leaving broken endpoints.

---

# 8. HTTP METHOD DESIGN

Use HTTP semantics consistently.

## Collection routes

Example:

```text
/api/v1/employees
```

Support:

```text
GET
POST
```

GET:

```text
GET /api/v1/employees
```

POST:

```text
POST /api/v1/employees
```

---

## Resource routes

Example:

```text
/api/v1/employees/[employeeId]
```

Support:

```text
GET
PUT
PATCH
DELETE
```

Semantics:

```text
GET
Retrieve resource

POST
Create resource

PUT
Complete replacement when appropriate

PATCH
Partial update

DELETE
Delete/archive resource
```

Do NOT treat PUT and PATCH as identical unless there is a documented reason.

For business entities where full replacement is unsafe, prefer PATCH and only expose PUT where complete replacement has clear semantics.

---

# 9. BUSINESS ACTION ENDPOINTS

Do not force business operations into generic CRUD when explicit actions communicate intent better.

Use endpoints such as:

```text
POST /attendance/check-in

POST /attendance/check-out

POST /leave-requests/:id/approve

POST /leave-requests/:id/reject

POST /approvals/:id/approve

POST /approvals/:id/reject

POST /payroll/periods/:id/calculate

POST /payroll/periods/:id/finalize

POST /notifications/:id/read
```

These are commands, not generic resource updates.

---

# 10. PRODUCTION-GRADE FOLDER ARCHITECTURE

Do NOT place all logic inside:

```text
route.ts
```

Use a layered feature architecture.

Target:

```text
src/

├── app/
│   └── api/
│       ├── auth/
│       │   └── [...all]/
│       │       └── route.ts
│       │
│       └── v1/
│           ├── employees/
│           ├── departments/
│           ├── designations/
│           ├── locations/
│           ├── attendance/
│           ├── leave-requests/
│           ├── approvals/
│           ├── payroll/
│           ├── notifications/
│           └── me/
│
├── features/
│
│   ├── employees/
│   │   ├── employee.service.ts
│   │   ├── employee.repository.ts
│   │   ├── employee.schema.ts
│   │   ├── employee.types.ts
│   │   ├── employee.permissions.ts
│   │   └── employee.errors.ts
│   │
│   ├── attendance/
│   ├── time-off/
│   ├── approvals/
│   ├── payroll/
│   └── organization/
│
├── db/
│   ├── index.ts
│   └── schema/
│
└── lib/
    ├── api/
    ├── auth/
    ├── errors/
    └── permissions/
```

Adapt this to the existing project rather than moving files merely for aesthetics.

---

# 11. ROUTE HANDLER RESPONSIBILITY

`route.ts` should remain thin.

A route should mainly:

```text
request
   ↓
authentication
   ↓
authorization
   ↓
input extraction
   ↓
validation
   ↓
service
   ↓
response
```

Avoid:

```text
route.ts
   ↓
300 lines
   ↓
business logic
   ↓
Drizzle queries
   ↓
notifications
   ↓
transactions
   ↓
permission checks
```

---

# 12. REPOSITORY LAYER

Database access should be isolated where useful.

Example responsibilities:

```text
employee.repository.ts

findById()
findByUserId()
findMany()
create()
update()
archive()
existsByEmail()
findByEmployeeNumber()
```

Repository code should deal primarily with Drizzle/database concerns.

It should NOT contain HTTP-specific behavior.

Do not return `NextResponse` from repositories.

---

# 13. SERVICE LAYER

Business logic belongs in services.

Example:

```text
employee.service.ts
```

Responsibilities could include:

```text
createEmployee()
updateEmployee()
getEmployee()
listEmployees()
archiveEmployee()
```

Creation might coordinate:

```text
validate organization
validate department
validate designation
validate manager
validate location
validate schedule

create employee
create address
create emergency contact
create salary assignment
create leave allocation
create audit event
```

Use database transactions where multiple writes must succeed or fail together.

---

# 14. VALIDATION

Use the validation library already installed in the project. If Zod is already present, use Zod consistently.

Never trust:

```text
request.json()
searchParams
route params
```

without validation.

Create reusable schemas.

Example:

```text
createEmployeeSchema

updateEmployeeSchema

employeeIdSchema

employeeQuerySchema
```

Validate:

* body
* path parameters
* query parameters
* enums
* dates
* pagination
* sorting
* filters

---

# 15. CREATE VS UPDATE VALIDATION

Do not blindly use:

```ts
createSchema.partial()
```

for every update.

Some fields should never be editable after creation.

Examples may include:

```text
organizationId
userId
employeeNumber
createdAt
createdBy
```

depending on the actual schema.

Explicitly define safe update schemas.

---

# 16. QUERY PARAMETERS

Collection APIs should support consistent querying.

For example:

```text
GET /api/v1/employees?page=1&pageSize=20

GET /api/v1/employees?search=urvil

GET /api/v1/employees?departmentId=...

GET /api/v1/employees?status=ACTIVE

GET /api/v1/employees?sortBy=createdAt&sortOrder=desc
```

Support where appropriate:

```text
pagination
search
filtering
sorting
date ranges
status filtering
```

Never allow arbitrary column names directly into SQL ordering.

Use an allowlist.

---

# 17. PAGINATION

Do not return thousands of employees/attendance records.

Use a consistent response:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 128,
    "totalPages": 7
  }
}
```

Use sensible maximum page sizes.

Example:

```text
default = 20
maximum = 100
```

---

# 18. STANDARD API RESPONSE

Create centralized response helpers.

Success:

```json
{
  "success": true,
  "data": {}
}
```

Collection:

```json
{
  "success": true,
  "data": [],
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "EMPLOYEE_NOT_FOUND",
    "message": "Employee not found"
  }
}
```

Do not return different response shapes from every endpoint.

---

# 19. HTTP STATUS CODES

Use correct status codes.

```text
200 OK
GET / successful update

201 Created
successful POST

204 No Content
successful deletion when no body is returned

400 Bad Request
malformed request

401 Unauthorized
not authenticated

403 Forbidden
authenticated but insufficient permission

404 Not Found
resource does not exist

409 Conflict
duplicate/conflicting state

422 Unprocessable Entity
valid request structure but invalid domain/validation input when appropriate

429 Too Many Requests
rate limited

500 Internal Server Error
unexpected server failure
```

Do not return `200` for every outcome.

---

# 20. CENTRALIZED ERROR HANDLING

Create typed application errors such as:

```text
AppError
ValidationError
AuthenticationError
AuthorizationError
NotFoundError
ConflictError
BusinessRuleError
```

Example error codes:

```text
EMPLOYEE_NOT_FOUND

DEPARTMENT_NOT_FOUND

ATTENDANCE_ALREADY_CHECKED_IN

NO_ACTIVE_ATTENDANCE

INSUFFICIENT_LEAVE_BALANCE

LEAVE_REQUEST_OVERLAP

APPROVAL_ALREADY_RESOLVED

PAYROLL_ALREADY_FINALIZED
```

Route handlers should translate application errors into standardized HTTP responses.

Do not expose:

```text
SQL errors
database credentials
stack traces
internal implementation details
```

to clients.

---

# 21. AUTHENTICATION

Every protected endpoint must derive the user from the server-side session.

Never accept:

```json
{
  "userId": "..."
}
```

and trust it as identity.

Instead:

```text
request
   ↓
session
   ↓
authenticated user
   ↓
employee
   ↓
organization
   ↓
permissions
```

---

# 22. AUTHORIZATION / RBAC

Create centralized permissions.

Example:

```text
employee:read:self
employee:read:any
employee:create
employee:update
employee:delete

attendance:read:self
attendance:read:any
attendance:manage

leave:create
leave:read:self
leave:read:any
leave:approve

payroll:read:self
payroll:read:any
payroll:manage

organization:manage
```

Then map roles:

```text
EMPLOYEE
MANAGER
HR
ADMIN
```

Do NOT scatter:

```ts
if (role === "admin")
```

through dozens of route handlers.

Use:

```text
requirePermission(...)
```

or equivalent.

---

# 23. SELF-SERVICE ENDPOINTS

Employee self-service endpoints should derive employee identity from the session.

For example:

```text
GET /api/v1/me

GET /api/v1/me/attendance

GET /api/v1/me/time-off

GET /api/v1/me/payslips
```

Never require:

```text
/me?employeeId=123
```

The server already knows who the user is.

---

# 24. ATTENDANCE BUSINESS LOGIC

Analyze existing attendance schema before implementing.

Check-in should approximately perform:

```text
authenticate
↓
resolve employee
↓
verify employee active
↓
resolve schedule
↓
ensure no open attendance
↓
determine workday
↓
record check-in
↓
calculate lateness when appropriate
↓
activity log
↓
return attendance
```

Check-out:

```text
authenticate
↓
resolve employee
↓
find open attendance
↓
record check-out
↓
calculate worked duration
↓
calculate overtime if supported
↓
update status
↓
activity log
```

Handle concurrency so double-clicking check-in cannot create duplicate open attendance records.

---

# 25. LEAVE REQUEST LOGIC

Creating leave must perform business validation.

```text
authenticate
↓
employee
↓
leave type
↓
policy
↓
calculate requested working days
↓
check holidays
↓
check available allocation/balance
↓
check overlapping requests
↓
create leave request
↓
create approval request
↓
create notification
↓
activity log
```

Use a database transaction where these operations form one logical unit.

---

# 26. LEAVE APPROVAL

Approval must be atomic.

```text
BEGIN

lock/read request safely

verify request is PENDING

verify approver permission

update approval

update leave request

update allocation/balance if required

update attendance/workdays if required by current schema

create notification

create activity log

COMMIT
```

If any step fails:

```text
ROLLBACK
```

Prevent:

```text
double approval
double balance deduction
approval of rejected request
cross-organization approval
```

---

# 27. ATTENDANCE CORRECTIONS

Implement:

```text
POST /attendance/corrections

GET /attendance/corrections

GET /attendance/corrections/:id

PATCH /attendance/corrections/:id

DELETE /attendance/corrections/:id
```

where CRUD semantics make sense.

Approval should use a business action:

```text
POST /approvals/:id/approve
POST /approvals/:id/reject
```

Do not allow employees to arbitrarily update an already approved correction.

---

# 28. PAYROLL SECURITY

Payroll is highly sensitive.

Employee:

```text
payroll:read:self
```

HR/Admin:

```text
payroll:read:any
payroll:manage
```

Every query for payslips must enforce organization and employee ownership.

Never rely solely on frontend hiding.

---

# 29. PAYROLL WORKFLOW

Analyze existing:

```text
payroll-periods
salary-structures
salary-components
payslips
payslip-items
```

Implement services such as:

```text
createPayrollPeriod()

calculatePayroll()

getPayrollPeriod()

finalizePayroll()

generatePayslips()

getEmployeePayslips()
```

Finalization must prevent accidental duplicate payslip generation.

---

# 30. DELETE STRATEGY

Do NOT blindly hard-delete HR records.

Determine which entities should support:

```text
hard delete
soft delete
archive
deactivate
```

Examples:

Employee should normally become:

```text
INACTIVE
TERMINATED
ARCHIVED
```

rather than disappearing.

Financial/audit records generally should not be casually deleted.

Consider deletion rules carefully for:

```text
employees
attendance
leave requests
payroll
payslips
activity logs
```

Use hard deletes mainly where appropriate for configuration entities and only when no dependent records make deletion unsafe.

---

# 31. DATABASE TRANSACTIONS

Use:

```ts
db.transaction(...)
```

for workflows involving multiple related writes.

Important candidates:

```text
employee onboarding

leave submission

leave approval/rejection

attendance correction approval

salary structure changes

payroll calculation/finalization

payslip generation
```

Do not allow partial business workflows.

---

# 32. CONCURRENCY AND IDEMPOTENCY

Protect operations that users may accidentally trigger multiple times.

Examples:

```text
check-in
check-out
leave approval
leave rejection
payroll finalization
payslip generation
```

Use database constraints and transactional checks where appropriate.

Do not rely only on disabling a frontend button.

---

# 33. AUDIT LOGGING

Use the existing activity-log system.

Record important events such as:

```text
EMPLOYEE_CREATED
EMPLOYEE_UPDATED
EMPLOYEE_ARCHIVED

ATTENDANCE_CHECKED_IN
ATTENDANCE_CHECKED_OUT
ATTENDANCE_CORRECTION_REQUESTED
ATTENDANCE_CORRECTION_APPROVED

LEAVE_REQUESTED
LEAVE_APPROVED
LEAVE_REJECTED

SALARY_STRUCTURE_UPDATED

PAYROLL_CREATED
PAYROLL_FINALIZED

PAYSLIP_GENERATED
```

Capture where supported:

```text
actorId
organizationId
entityType
entityId
action
metadata
timestamp
```

Never store passwords, tokens, or sensitive secrets in logs.

---

# 34. NOTIFICATIONS

Integrate the existing notification table/API into business workflows.

Examples:

```text
Leave submitted
→ notify approver

Leave approved
→ notify employee

Leave rejected
→ notify employee

Attendance correction submitted
→ notify HR

Correction resolved
→ notify employee

Payslip generated
→ notify employee
```

Notification creation should happen inside the service layer, not frontend code.

---

# 35. SECURITY REVIEW

Audit all endpoints for:

* authentication bypass
* missing authorization
* IDOR
* cross-organization data access
* mass assignment
* unsafe update fields
* SQL injection
* arbitrary sorting
* excessive data exposure
* sensitive payroll exposure
* error leakage
* missing validation
* duplicate requests
* race conditions

Drizzle parameterization should be used correctly.

Never build raw SQL using untrusted string concatenation.

---

# 36. DATA EXPOSURE

Do not automatically return entire database rows.

Create deliberate API response objects where necessary.

For example, employee-list endpoints should not expose:

```text
password hashes
session data
auth tokens
private authentication metadata
sensitive payroll fields
internal audit metadata
```

Return only fields needed by the client.

---

# 37. DRIZZLE QUERY QUALITY

Use Drizzle ORM consistently.

Prefer typed queries.

Avoid unnecessary:

```text
select *
```

when only a few fields are needed.

Prevent N+1 queries.

Use joins/relations appropriately.

For list endpoints:

```text
filter
sort
paginate
select
```

at database level rather than loading everything and filtering in JavaScript.

---

# 38. API HELPERS

Create reusable infrastructure where appropriate.

For example:

```text
src/lib/api/

response.ts
errors.ts
pagination.ts
query.ts
validation.ts
```

And:

```text
src/lib/auth/

session.ts
permissions.ts
authorization.ts
```

Potential helpers:

```text
getCurrentUser()
getCurrentEmployee()
getOrganizationContext()

requireAuth()
requirePermission()

parsePagination()
parseSort()

successResponse()
createdResponse()
errorResponse()
```

Avoid overengineering wrappers that make Next.js route handlers difficult to understand.

---

# 39. TESTING

Every major endpoint must be testable.

At minimum cover:

## Employees

```text
GET employees
GET employee
POST employee
PATCH employee
DELETE/archive employee
```

## Attendance

```text
GET attendance
POST check-in
POST check-out
POST correction
approve correction
```

## Leave

```text
GET requests
POST request
GET request
PATCH pending request
DELETE/cancel pending request
approve
reject
```

## Payroll

```text
GET periods
POST period
calculate
finalize
GET payslips
GET employee payslip
```

Test:

```text
success
unauthenticated
unauthorized
not found
invalid input
cross-organization access
duplicate operation
business-rule violation
```

---

# 40. TYPECHECK AND BUILD

After every significant domain refactor run the project's actual available scripts.

At minimum, if available:

```bash
bun run lint
bun run typecheck
bun run build
```

Do not assume scripts exist.

Inspect `package.json` first.

Also run relevant tests.

Do not continue stacking errors on top of failing code.

---

# 41. DRIZZLE MIGRATIONS

If schema changes are required:

1. Explain why.
2. Modify the Drizzle schema.
3. Generate the proper migration using the project's existing migration workflow.
4. Inspect generated SQL.
5. Ensure existing data is considered.
6. Never manually destroy production data.
7. Never reset the database simply to make development easier.

Do not modify historical migrations unless there is a compelling development-only reason.

Prefer a new migration.

---

# 42. EXISTING FRONTEND COMPATIBILITY

Before renaming/moving APIs search the entire repository for callers.

Search for:

```text
fetch(
axios
useQuery
useMutation
/api/
```

Identify every frontend dependency.

When an endpoint changes:

```text
old API
↓
find all callers
↓
create/update new API
↓
migrate callers
↓
test
↓
remove old route only when safe
```

Do not leave the application with broken fetch calls.

---

# 43. IMPLEMENT DOMAIN BY DOMAIN

Do NOT rewrite all APIs simultaneously.

Use this order:

```text
Phase 1
API infrastructure
authentication
permissions
errors
responses
validation

Phase 2
Organization
departments
designations
locations
holidays
work schedules

Phase 3
Employees
profile
addresses
contacts
documents

Phase 4
Attendance
check-in
check-out
history
corrections

Phase 5
Time Off
leave types
policies
allocations
requests

Phase 6
Approvals

Phase 7
Payroll

Phase 8
Notifications
activity logs

Phase 9
API cleanup
security review
tests
documentation
```

Finish and validate one phase before moving to the next.

---

# 44. API DOCUMENTATION

Create:

```text
docs/api.md
```

Document every production endpoint.

For each endpoint include:

```text
METHOD
PATH
DESCRIPTION
AUTH
PERMISSION
QUERY PARAMETERS
REQUEST BODY
SUCCESS RESPONSE
ERROR RESPONSES
```

Example:

```text
POST /api/v1/attendance/check-in

Authentication:
Required

Permission:
attendance:create:self

Body:
None or only fields justified by actual schema

Success:
201/200 depending on implementation

Errors:
401 UNAUTHORIZED
403 FORBIDDEN
409 ALREADY_CHECKED_IN
```

Keep documentation synchronized with implementation.

---

# 45. CREATE AN API INVENTORY

Create:

```text
docs/api-inventory.md
```

Include:

| Domain     | Method | Endpoint                    | Status      | Auth | Permission             |
| ---------- | ------ | --------------------------- | ----------- | ---- | ---------------------- |
| Employees  | GET    | /api/v1/employees           | Implemented | Yes  | employee:read:any      |
| Employees  | POST   | /api/v1/employees           | Implemented | Yes  | employee:create        |
| Attendance | POST   | /api/v1/attendance/check-in | Implemented | Yes  | attendance:create:self |
| Leave      | POST   | /api/v1/leave-requests      | Implemented | Yes  | leave:create           |
| Payroll    | GET    | /api/v1/payroll/payslips    | Implemented | Yes  | payroll:read:any       |

Do not mark something implemented until it actually works.

---

# 46. CREATE AN ARCHITECTURE REPORT FIRST

Before major implementation create:

```text
docs/backend-analysis.md
```

It should contain:

## Current Architecture

What currently exists.

## Database Model

Tables and relationships discovered from Drizzle.

## Existing API Inventory

What already works.

## Problems

Examples:

```text
duplicate endpoints
incorrect naming
missing validation
authorization problems
direct DB access
missing transactions
schema issues
```

## Proposed Architecture

Show the final backend structure.

## Migration Strategy

Explain how existing APIs will move without breaking the frontend.

## Security Risks

Document discovered vulnerabilities.

## Implementation Plan

Exact order of changes.

Only after this analysis should major refactoring begin.

---

# 47. DO NOT OVERENGINEER

Production-grade does NOT mean creating unnecessary abstraction.

Do not create:

```text
controller
manager
provider
gateway
factory
handler
repository
service
use-case
command
```

for a simple CRUD operation.

Prefer:

```text
Route
   ↓
Service
   ↓
Repository/Drizzle
```

Repository abstraction is useful where queries are reused or complicated.

For simple domain-specific queries, a well-organized service using Drizzle directly may be acceptable if it keeps the architecture clearer.

Choose consistency over abstraction for abstraction's sake.

---

# 48. IMPORTANT CODING RULES

Follow these rules throughout:

1. TypeScript strict typing.
2. Avoid `any`.
3. No `@ts-ignore` unless absolutely justified.
4. No fake/mock implementations in production paths.
5. No hardcoded users.
6. No hardcoded organization IDs.
7. No hardcoded employee IDs.
8. No duplicated business logic.
9. Validate all external input.
10. Authenticate protected APIs.
11. Authorize sensitive operations.
12. Scope organization data.
13. Use transactions for multi-write workflows.
14. Use consistent API responses.
15. Use correct HTTP status codes.
16. Log sensitive business mutations.
17. Never expose secrets.
18. Preserve existing working functionality.
19. Run typecheck/lint/build continuously.
20. Do not claim something works without verifying it.

---

# 49. REQUIRED END STATE

At completion the architecture should approximately look like:

```text
Client
   │
   ↓
Next.js Route Handler
   │
   ├── authentication
   ├── authorization
   ├── validation
   │
   ↓
Domain Service
   │
   ├── business rules
   ├── transactions
   ├── notifications
   └── audit events
   │
   ↓
Repository / Drizzle ORM
   │
   ↓
Neon PostgreSQL
```

And cross-cutting concerns:

```text
             Authentication
                   │
             Authorization
                   │
Client → API → Validation → Service → Database
                   │
              Error Handling
                   │
               Audit Logs
                   │
              Notifications
```

---

# 50. FINAL VERIFICATION

Before declaring the backend complete:

* inspect every Drizzle schema
* verify relationships
* verify migrations
* verify every API route
* remove accidental duplicates
* verify authentication
* verify RBAC
* verify organization isolation
* verify validation
* verify GET endpoints
* verify POST endpoints
* verify PUT endpoints where appropriate
* verify PATCH endpoints
* verify DELETE/archive endpoints
* verify business-action endpoints
* verify pagination
* verify filtering
* verify sorting
* verify transactions
* verify notifications
* verify audit logs
* verify error responses
* verify TypeScript
* verify lint
* verify tests
* verify production build
* verify existing frontend still works

Do not stop at generating files.

The objective is a **working, production-oriented Dayflow API architecture built on top of the existing Drizzle ORM schema and existing application**, not merely a visually clean folder structure.

---

# Execution Strategy

Start now with **analysis only**.

First inspect:

```text
src/db/schema/
src/app/api/
src/features/
src/lib/auth.ts
src/db/index.ts
drizzle.config.ts
package.json
```

Then create:

```text
docs/backend-analysis.md
docs/api-inventory.md
```

Show the discovered database relationships, current API problems, proposed architecture and migration plan.

After the analysis, begin implementation domain-by-domain:

```text
Infrastructure
→ Organization
→ Employees
→ Attendance
→ Time Off
→ Approvals
→ Payroll
→ Notifications/Audit
→ Security Review
→ Tests
→ Documentation
```

Do not rewrite everything at once.

Preserve the existing frontend and migrate API consumers safely as endpoints are improved.
