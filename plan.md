# Dayflow HRMS — Production Auth, RBAC, Routing & Frontend Integration

You are a **Senior Staff Full-Stack Engineer and Software Architect** responsible for finishing and hardening an existing production-oriented HRMS called **Dayflow**.

This is an **existing codebase**. Do **not** rebuild the application from scratch.

Your job is to:

1. Analyze the existing implementation.
2. Fix authentication architecture.
3. Standardize Better Auth usage.
4. Implement production-grade RBAC.
5. Protect frontend pages and backend APIs.
6. Fix role-based redirects.
7. Connect all dashboard pages to the existing `/api/v1` APIs.
8. Remove duplicate/dead/scattered implementations.
9. Ensure all frontend routes actually work.
10. Preserve the existing feature/repository/service architecture.
11. Ensure the application builds, authenticates, authorizes, and navigates correctly.

---

# 1. Technology Stack

Work within the existing stack:

* Next.js App Router
* TypeScript
* React
* Tailwind CSS
* shadcn/ui
* Better Auth
* Drizzle ORM
* PostgreSQL / Neon
* TanStack Query
* Zod
* Bun

Do not replace these technologies unless there is a genuine incompatibility.

---

# 2. Critical Rule — Existing Codebase First

Before changing anything, inspect:

```text
src/app/
src/app/api/
src/app/api/v1/
src/lib/auth.ts
src/lib/auth-client.ts
src/lib/auth-context.ts
src/lib/auth/
src/lib/permissions.ts
src/proxy.ts
src/db/
src/db/schema/
src/features/
src/hooks/
src/providers/
src/components/
```

Also inspect:

```text
package.json
.env.example
drizzle.config.ts
next.config.ts
tsconfig.json
```

Create an internal inventory of:

* existing auth configuration
* Better Auth client configuration
* session retrieval methods
* roles
* permissions
* page guards
* API guards
* redirect logic
* duplicated auth utilities
* duplicated routes
* obsolete APIs
* hardcoded URLs
* hardcoded `/api` URLs
* client/server boundary violations
* dashboard pages using mock/static data
* pages not connected to APIs
* APIs not consumed by frontend
* routes pointing to nonexistent pages
* inconsistent naming
* TypeScript/build errors

Do not blindly create new files if an equivalent implementation already exists.

Prefer:

**repair → consolidate → reuse → extend → create**

in that order.

---

# 3. Environment Variable Strategy

The application must have one canonical application/auth origin:

```env
BETTER_AUTH_URL=http://localhost:3000
```

Production example:

```env
BETTER_AUTH_URL=https://dayflow.example.com
```

Do not scatter hardcoded origins such as:

```ts
"http://localhost:3000"
"http://127.0.0.1:3000"
"https://some-domain.vercel.app"
```

across the application.

Create a validated environment utility where appropriate.

Example concept:

```ts
const appUrl = process.env.BETTER_AUTH_URL

if (!appUrl) {
  throw new Error("BETTER_AUTH_URL is required")
}
```

Use `BETTER_AUTH_URL` for **server-side absolute application/auth URLs where an absolute origin is actually required**.

Do NOT unnecessarily turn every browser-side request into an absolute URL.

For same-origin client requests, prefer:

```ts
fetch("/api/v1/me")
```

instead of exposing server environment configuration to the browser.

Do not expose secrets through `NEXT_PUBLIC_*`.

Never expose:

```text
BETTER_AUTH_SECRET
DATABASE_URL
OAuth client secrets
server credentials
```

to client components.

The goal is:

```text
BETTER_AUTH_URL
      ↓
canonical server-side application origin
      ↓
Better Auth / callbacks / redirects / server absolute URLs
```

while browser API calls remain same-origin whenever possible.

---

# 4. Consolidate Better Auth

The current project contains:

```text
src/lib/auth.ts
src/lib/auth-client.ts
src/lib/auth-context.ts

src/lib/auth/
├── access.ts
├── landing.ts
├── page.ts
├── permissions.ts
├── redirects.ts
├── roles.ts
└── session.ts
```

Audit these carefully.

There must ultimately be **one authoritative Better Auth server configuration** and **one authoritative Better Auth browser client**.

Recommended responsibility:

```text
src/lib/auth.ts
    Better Auth server configuration

src/lib/auth-client.ts
    Browser auth client

src/lib/auth/roles.ts
    Role definitions

src/lib/auth/permissions.ts
    Permission matrix

src/lib/auth/session.ts
    Server session helpers

src/lib/auth/access.ts
    Authorization helpers

src/lib/auth/redirects.ts
    Role → route mapping
```

Remove or merge duplicate logic.

Do not maintain two competing implementations of:

```ts
getSession()
requireAuth()
requireRole()
hasPermission()
getLandingPage()
```

---

# 5. Better Auth Route

Preserve and correctly configure:

```text
src/app/api/auth/[...all]/route.ts
```

It must be the canonical Better Auth handler.

Verify:

* GET
* POST
* cookies
* sessions
* callback handling
* OAuth handling if configured
* credentials/email-password flow if configured
* database adapter
* schema configuration
* trusted origins
* base URL
* production behavior

Do not create another authentication API.

---

# 6. Better Auth + Drizzle

Inspect:

```text
src/db/schema/auth-schema.ts
src/db/schema/index.ts
src/db/index.ts
```

Ensure Better Auth receives the actual Drizzle schema object expected by the adapter.

Avoid previous classes of failures such as:

```text
Drizzle adapter failed to initialize.
Schema not found.
```

Also inspect the database for duplicated Better Auth tables such as:

```text
user
account
session
verification
```

There must be one authoritative schema definition for each Better Auth model.

Do not create duplicate authentication tables.

Do not generate destructive migrations just to make the application compile.

---

# 7. Canonical Roles

Use a single role model.

Required roles:

```ts
export const ROLES = {
  ADMIN: "admin",
  HR: "hr",
  MANAGER: "manager",
  EMPLOYEE: "employee",
} as const
```

Derive the TypeScript type from this definition.

Example:

```ts
export type Role = typeof ROLES[keyof typeof ROLES]
```

Do not scatter:

```ts
"Admin"
"ADMIN"
"hr_officer"
"HR"
"employee"
```

throughout the codebase.

Normalize existing values carefully without corrupting stored user data.

---

# 8. Authorization Model

Implement authorization in layers:

```text
Authentication
    ↓
Role
    ↓
Permission
    ↓
Resource ownership / scope
```

A role alone is not sufficient for every operation.

Example:

```text
Employee
    └── read own profile

Manager
    └── read managed employees

HR
    └── manage employees

Admin
    └── system-wide administration
```

---

# 9. Permission System

Create/repair a centralized permission system.

Concept:

```ts
type Permission =
  | "employee:read"
  | "employee:create"
  | "employee:update"
  | "employee:delete"
  | "attendance:read"
  | "attendance:manage"
  | "leave:create"
  | "leave:approve"
  | "payroll:read"
  | "payroll:manage"
  | "organization:manage"
  | "reports:read"
  | "audit:read"
  | "settings:manage"
```

Implement a centralized matrix such as:

```ts
ROLE_PERMISSIONS
```

Avoid authorization logic like:

```ts
if (
  role === "admin" ||
  role === "hr" ||
  role === "manager"
) {
  ...
}
```

repeated across dozens of files.

Use helpers instead:

```ts
hasPermission(role, permission)
requirePermission(permission)
```

---

# 10. Server-Side Session Helpers

Create or repair reusable server helpers.

The architecture should support concepts such as:

```ts
getCurrentSession()
getCurrentUser()
requireAuth()
requireRole()
requirePermission()
```

Expected behavior:

```ts
const session = await requireAuth()
```

and:

```ts
await requireRole(["admin", "hr"])
```

and:

```ts
await requirePermission("payroll:manage")
```

The exact implementation must match the installed Better Auth version.

Do not invent APIs that the installed version does not provide.

---

# 11. Do Not Trust Client-Side Authorization

Client-side checks exist for UX only.

This is insufficient:

```tsx
{role === "admin" && <DeleteEmployeeButton />}
```

The corresponding backend operation must independently verify authorization.

Correct security model:

```text
Frontend visibility
        +
Server page protection
        +
API authorization
        +
resource-level authorization
```

All four must agree.

---

# 12. API Security

Audit every endpoint under:

```text
src/app/api/v1/
```

Classify endpoints as:

```text
PUBLIC
AUTHENTICATED
ROLE-RESTRICTED
PERMISSION-RESTRICTED
OWNERSHIP-RESTRICTED
```

Every private endpoint must retrieve and validate the session server-side.

Example conceptual flow:

```ts
export async function GET(request: Request) {
  const session = await requireAuth()

  // permission / ownership checks

  return ...
}
```

Never trust client-provided values such as:

```json
{
  "role": "admin",
  "userId": "..."
}
```

for authorization.

Identity must come from the authenticated session.

---

# 13. Resource Ownership

Implement ownership checks.

Employees must not be able to access arbitrary records by changing URLs such as:

```text
/api/v1/employees/123
/api/v1/employees/456
```

For `/me` endpoints derive identity from the session.

For example:

```text
GET /api/v1/me
GET /api/v1/me/attendance
GET /api/v1/me/time-off
GET /api/v1/me/payslips
```

must never depend on a client-supplied employee ID to determine the current user.

---

# 14. Manager Scope

Manager authorization requires additional scope checks.

Managers may access:

```text
their profile
their attendance
their leave
their payslips
their direct reports
team attendance
team leave requests
appropriate team reports
```

They must NOT automatically gain access to:

```text
all employees
all payroll
system settings
audit logs
organization administration
unrelated manager teams
```

For:

```text
/dashboard/my-team/[employeeId]
```

verify that the requested employee actually reports to the authenticated manager.

---

# 15. HR Scope

HR should generally be able to:

```text
manage employees
manage departments/designations
manage attendance
review attendance corrections
manage leave policies/types/allocations
approve/reject appropriate leave requests
manage work schedules
manage organization HR data
view HR reports
operate payroll where permitted
```

HR should not automatically receive every system-administration permission unless explicitly configured.

---

# 16. Admin Scope

Admin should have the highest application-level permissions.

Admin capabilities can include:

```text
user administration
role management
organization management
employee management
payroll administration
settings
audit logs
reports
system configuration
```

Critical role mutations must remain server-side and must be audited.

---

# 17. Employee Scope

Employees should have a self-service portal.

They may:

```text
view/update allowed profile fields
check in
check out
view own attendance
request attendance corrections
apply for leave
view leave balance
cancel eligible leave requests
view own payslips
view notifications
```

They must not gain administrative access merely by navigating manually to an admin URL.

---

# 18. Role-Based Landing Pages

Implement one centralized mapping.

Example:

```ts
const ROLE_HOME = {
  admin: "/dashboard",
  hr: "/dashboard",
  manager: "/dashboard/my-team",
  employee: "/dashboard",
}
```

OR preserve dedicated role portals if they serve a real architectural purpose:

```ts
const ROLE_HOME = {
  admin: "/admin",
  hr: "/hr",
  manager: "/manager",
  employee: "/employee",
}
```

Choose **one coherent strategy after auditing the current UI**.

Do not maintain two disconnected dashboard systems without a reason.

Centralize the mapping in:

```text
src/lib/auth/redirects.ts
```

---

# 19. Fix Authentication Redirect Flow

The intended authentication flow should be:

```text
User opens protected page
        ↓
No session
        ↓
/sign-in?callbackURL=<original-route>
        ↓
Authentication succeeds
        ↓
Validate callback URL
        ↓
return to allowed requested page
OR
role landing page
```

Prevent:

```text
/dashboard → /sign-in → /dashboard → /sign-in
```

redirect loops.

Never redirect authenticated users back to `/sign-in`.

---

# 20. Auth Pages

Audit:

```text
/sign-in
/sign-up
/signup
/verify-email
/auth/redirect
/auth/access-denied
```

There are currently both:

```text
/sign-up
/signup
```

Determine the canonical route.

Prefer one route such as:

```text
/sign-up
```

Update every internal reference and safely remove the duplicate if unused.

Authenticated users should normally not remain on:

```text
/sign-in
/sign-up
```

Redirect them to their authorized landing page.

---

# 21. Access Denied

Use:

```text
/auth/access-denied
```

for authenticated users who lack permission.

Distinguish:

```text
401 = unauthenticated
403 = authenticated but unauthorized
```

Frontend behavior:

```text
401 → /sign-in
403 → /auth/access-denied
404 → actual missing resource
```

Do not hide authorization failures as generic 500 errors.

---

# 22. Dashboard Route Protection

Protect:

```text
/dashboard/**
```

using server-side checks at the highest practical layout boundary.

For example:

```text
src/app/(dashboard)/layout.tsx
```

should establish authentication for the entire dashboard.

Then sensitive child pages apply additional permission checks.

Example:

```text
/dashboard
    requireAuth

/dashboard/payroll
    requirePermission("payroll:read")

/dashboard/audit-logs
    requirePermission("audit:read")

/dashboard/settings
    requirePermission("settings:manage")
```

---

# 23. Role Portal Protection

Protect:

```text
/admin
/hr
/manager
/employee
```

according to their corresponding role.

Examples:

```text
/admin     → admin
/hr        → hr/admin where appropriate
/manager   → manager/admin where appropriate
/employee  → authenticated employee context
```

Do not depend exclusively on client components for this protection.

---

# 24. Sidebar Must Be Permission-Aware

Audit:

```text
src/components/main/app-sidebar.tsx
src/components/main/nav-main.tsx
src/components/sidebar/*
```

There appear to be multiple sidebar implementations.

Choose one canonical dashboard navigation system where practical.

Generate navigation from configuration.

Example:

```ts
{
  title: "Payroll",
  href: "/dashboard/payroll",
  permission: "payroll:read",
}
```

Then filter navigation using the authenticated user's permissions.

Do not maintain four completely duplicated sidebar definitions for four roles.

---

# 25. Frontend Route Audit

Audit every route under:

```text
src/app/(dashboard)/dashboard/
```

including:

```text
/dashboard
/dashboard/approvals
/dashboard/approvals/attendance
/dashboard/approvals/leave

/dashboard/attendance
/dashboard/attendance/daily
/dashboard/attendance/weekly
/dashboard/attendance/corrections

/dashboard/organization
/dashboard/organization/departments
/dashboard/organization/holidays

/dashboard/departments
/dashboard/designations
/dashboard/office-locations
/dashboard/roles

/dashboard/people
/dashboard/people/[employeeId]
/dashboard/people/onboarding
/dashboard/people/profile

/dashboard/time-off
/dashboard/time-off/apply
/dashboard/time-off/balance

/dashboard/payroll
/dashboard/payroll/periods
/dashboard/payroll/salary-structures

/dashboard/my-team
/dashboard/my-team/[employeeId]

/dashboard/work-schedules
/dashboard/reports
/dashboard/audit-logs
/dashboard/notifications
/dashboard/profile
/dashboard/settings
```

For every route verify:

1. page exists
2. navigation link is correct
3. authentication is enforced
4. authorization is enforced
5. data source exists
6. API exists
7. React Query hook exists where needed
8. loading UI exists
9. empty state exists
10. error handling exists
11. mutations work
12. forms validate input
13. query invalidation works
14. no static/mock data remains unless explicitly intended

---

# 26. Route Groups

Remember that route groups do not affect the public URL.

For example:

```text
dashboard/(attendence)/attendance/page.tsx
```

still maps to:

```text
/dashboard/attendance
```

Correct misspelled internal group names where safe:

```text
(approvels)
(attendence)
```

to:

```text
(approvals)
(attendance)
```

because route-group folder names do not affect URLs.

Do not accidentally change public URLs while cleaning route groups.

---

# 27. Remove Duplicate Public Routes

The tree currently suggests possible duplication, including:

```text
/dashboard/departments
/dashboard/organization/departments

/dashboard/holidays
/dashboard/organization/holidays
```

Audit whether both are genuinely required.

If they represent the same feature:

* choose one canonical route
* update navigation
* update links
* update redirects
* remove dead implementation

Do not leave multiple URLs representing the same resource without a product reason.

---

# 28. API Architecture

Keep `/api/v1` as the canonical business API namespace.

Target:

```text
/api/auth/**
    Better Auth only

/api/v1/**
    Dayflow business APIs
```

Audit these legacy/scattered routes:

```text
/api/notifications
/api/payroll/payslips
/api/payroll/periods
```

If equivalent `/api/v1` routes already exist, migrate frontend consumers to `/api/v1` and remove obsolete duplicates only after confirming they are unused.

---

# 29. API Client

Repair:

```text
src/lib/api/client.ts
```

so frontend code does not repeatedly implement raw fetch behavior.

Support:

```ts
api.get()
api.post()
api.put()
api.patch()
api.delete()
```

with consistent handling for:

```text
JSON
errors
401
403
validation errors
network failures
```

For same-origin browser requests, use relative `/api/v1/...` paths.

Do not manually attach roles or impersonated user IDs.

Authentication should use Better Auth's normal session/cookie mechanism.

---

# 30. Standard API Responses

Use one response format.

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
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action"
  }
}
```

Reuse:

```text
src/lib/api/response.ts
src/lib/api/errors.ts
src/lib/api/validation.ts
src/lib/api/pagination.ts
```

rather than duplicating response code.

---

# 31. TanStack Query

All interactive client-side dashboard data should use the existing query infrastructure where appropriate.

Audit:

```text
use-approvals.ts
use-attendance.ts
use-audit-logs.ts
use-employees.ts
use-leave.ts
use-me.ts
use-notifications.ts
use-organization.ts
use-payroll.ts
use-reports.ts
```

Every hook should use centralized query keys from:

```text
src/lib/query-keys.ts
```

Example architecture:

```ts
queryKeys.employees.all
queryKeys.employees.detail(id)
queryKeys.attendance.today
queryKeys.leave.mine
queryKeys.payroll.periods
```

After mutations invalidate only relevant queries.

Example:

```ts
await queryClient.invalidateQueries({
  queryKey: queryKeys.employees.all,
})
```

Avoid unnecessary global invalidation.

---

# 32. Server Components vs Client Components

Use Server Components by default.

Use `"use client"` only when required for:

```text
TanStack Query
forms
event handlers
dialogs
interactive tables
browser APIs
local UI state
```

Do not turn an entire dashboard page into a client component just to retrieve the session.

Prefer:

```text
Server Page
   ↓
authorization
   ↓
Client Feature Component
   ↓
TanStack Query
```

---

# 33. Feature Layer

Preserve the existing architecture:

```text
API Route
   ↓
Service
   ↓
Domain
   ↓
Repository
   ↓
Drizzle
   ↓
PostgreSQL
```

Do NOT write large database queries directly inside every `route.ts`.

Example:

```ts
export async function GET(request: Request) {
  const session = await requirePermission("employee:read")

  const result = await employeeService.list(...)

  return success(result)
}
```

Business rules belong in services/domain modules.

Database queries belong in repositories.

---

# 34. Employee Identity Mapping

Better Auth users and HRMS employees must have a reliable relationship.

Audit:

```text
auth user
        ↓
employee
        ↓
department
designation
manager
organization
```

Do not assume:

```text
session.user.id === employee.id
```

unless the schema explicitly guarantees that.

If necessary use a relationship such as:

```text
employees.userId → user.id
```

and centralize resolution:

```ts
getCurrentEmployee()
```

This is critical for:

```text
/me
attendance
leave
payslips
manager team
profile
```

---

# 35. Organization Boundaries

If Dayflow supports multiple organizations, authorization must include organization scope.

A user from:

```text
Organization A
```

must not access resources belonging to:

```text
Organization B
```

by changing URL parameters.

Repositories/services should apply organization filters where necessary.

Never trust `organizationId` from the client without validating membership.

---

# 36. Forms

Use:

```text
Zod
shadcn/ui
existing field components
```

for forms.

Every mutation must provide:

```text
pending state
disabled submit state
validation errors
server error
success feedback
query refresh
```

Prevent accidental double submissions.

---

# 37. Attendance Workflow

Fully connect:

```text
/dashboard/attendance
/dashboard/attendance/daily
/dashboard/attendance/weekly
/dashboard/attendance/corrections
```

to:

```text
/api/v1/attendance
/api/v1/attendance/today
/api/v1/attendance/check-in
/api/v1/attendance/check-out
/api/v1/attendance/corrections
```

Expected flow:

```text
Employee
   ↓
Check In
   ↓
attendance record
   ↓
Check Out
   ↓
working duration
   ↓
daily/weekly reporting
```

Corrections:

```text
Employee submits correction
        ↓
Pending
        ↓
Manager/HR reviews
        ↓
Approve / Reject
        ↓
Attendance updated where appropriate
        ↓
Audit log
```

---

# 38. Leave Workflow

Connect:

```text
/dashboard/time-off
/dashboard/time-off/apply
/dashboard/time-off/balance
/dashboard/approvals/leave
```

with:

```text
/api/v1/leave-requests
/api/v1/leave-allocations
/api/v1/leave-policies
/api/v1/leave-types
```

Expected workflow:

```text
Employee
   ↓
Apply
   ↓
Validate policy/balance
   ↓
Pending
   ↓
Manager/HR
   ↓
Approve / Reject
   ↓
Balance updated
   ↓
Notification
   ↓
Audit log
```

---

# 39. Payroll Workflow

Protect payroll more strictly.

Connect:

```text
/dashboard/payroll
/dashboard/payroll/periods
/dashboard/payroll/salary-structures
```

to:

```text
/api/v1/payroll/periods
/api/v1/payroll/payslips
/api/v1/salary-structures
```

Lifecycle:

```text
DRAFT
  ↓
CALCULATED
  ↓
FINALIZED
  ↓
PUBLISHED
```

Employees should only access their own published payslips unless permissions explicitly allow otherwise.

---

# 40. People Module

Connect:

```text
/dashboard/people
/dashboard/people/[employeeId]
/dashboard/people/onboarding
```

to:

```text
/api/v1/employees
/api/v1/employees/[employeeId]
```

Support:

```text
search
filter
pagination
details
create
update
manager assignment
department
designation
location
status
```

based on permissions.

Do not load the entire employee database into the browser just to implement filtering.

---

# 41. Organization Module

Connect:

```text
departments
designations
locations
holidays
work schedules
organization settings
```

to their existing `/api/v1` endpoints.

Implement CRUD only for authorized roles.

Employees may receive read-only access to appropriate organization information.

---

# 42. Approvals

Build one coherent approvals workflow.

Dashboard:

```text
/dashboard/approvals
```

should aggregate pending work such as:

```text
leave approvals
attendance corrections
other approval requests
```

Role/scope rules determine which approvals a user sees.

Managers see their team's relevant requests.

HR/Admin see broader queues according to permissions.

---

# 43. Notifications

Use:

```text
/api/v1/notifications
/api/v1/notifications/[notificationId]
/api/v1/notifications/read-all
```

Connect them to:

```text
/dashboard/notifications
```

Support:

```text
unread count
mark read
mark all read
pagination
links to related resources
```

Do not keep duplicate `/api/notifications` endpoints if `/api/v1/notifications` is canonical.

---

# 44. Audit Logging

Critical operations should create audit records.

Examples:

```text
employee created
employee updated
role changed
leave approved
leave rejected
attendance corrected
salary structure changed
payroll calculated
payroll finalized
payroll published
organization settings changed
```

Audit logs should capture appropriate fields such as:

```text
actor
action
resource type
resource ID
organization
timestamp
metadata
```

Do not log passwords, tokens, secrets, or unnecessary sensitive payloads.

---

# 45. Root Route

Audit:

```text
src/app/page.tsx
```

Expected behavior should be coherent.

For example:

```text
Unauthenticated
    ↓
marketing/home/sign-in

Authenticated
    ↓
role-aware dashboard
```

Do not introduce a redirect loop between:

```text
/
dashboard
sign-in
auth/redirect
```

---

# 46. Proxy / Middleware

Audit:

```text
src/proxy.ts
```

Use it only where appropriate.

Do not put all database-backed authorization logic into middleware/proxy if Better Auth session/database access is more reliable in server layouts/pages/API routes.

A good architecture is:

```text
proxy
    ↓
coarse route handling if useful

server layout/page
    ↓
authentication + role/permission validation

API
    ↓
final authorization enforcement
```

Never treat middleware as the sole security boundary.

---

# 47. Redirect Safety

Never blindly redirect to arbitrary callback URLs.

Validate callback destinations.

Allowed:

```text
/dashboard
/dashboard/attendance
/dashboard/profile
```

Reject malicious external destinations such as:

```text
https://malicious.example
//malicious.example
```

Prevent open redirect vulnerabilities.

---

# 48. Loading / Error / Empty States

Every major dashboard feature must handle:

```text
loading
error
empty
success
unauthorized
not found
```

Use existing shadcn components:

```text
Skeleton
Card
Table
Alert
Button
Dialog
Badge
```

Do not leave pages permanently showing blank screens while queries run.

---

# 49. Frontend UX Requirements

The dashboard must be fully navigable.

Verify:

```text
sidebar links
breadcrumbs
table row links
buttons
dialogs
forms
tabs
pagination
filters
search
profile menu
logout
notification navigation
role-based links
```

No button should exist purely decoratively if the UI implies functionality.

Remove or disable unfinished actions explicitly.

---

# 50. Logout

Implement logout through the canonical Better Auth client.

After successful logout:

```text
clear session through Better Auth
        ↓
redirect to /sign-in
        ↓
refresh router/session state
```

Do not manually delete arbitrary auth cookies from client JavaScript.

---

# 51. Type Safety

Avoid:

```ts
any
as any
unknown as SomeType
```

unless absolutely necessary and documented.

Infer types from:

```text
Drizzle
Zod
Better Auth
service return types
```

Do not maintain multiple conflicting definitions for:

```text
User
Employee
Role
Session
Permission
```

---

# 52. Security

Verify:

* passwords are never logged
* secrets never reach client bundles
* database URLs stay server-only
* session identity is server-derived
* role cannot be changed through client payload manipulation
* employee ownership is validated
* manager scope is validated
* organization scope is validated
* payroll is protected
* audit logs are protected
* callback URLs are safe
* input is validated with Zod
* SQL is handled through Drizzle
* error responses do not leak stack traces in production

---

# 53. Cleanup

Remove after verifying they are unused:

```text
duplicate auth helpers
duplicate signup route
duplicate API endpoints
duplicate permission definitions
obsolete role logic
unused imports
dead components
stale mock data
unused sidebar implementation
hardcoded origins
hardcoded auth redirects
temporary debug logs
```

Do not delete working code merely because it looks redundant.

Trace imports and consumers first.

---

# 54. Do Not Destroy Existing Database State

The project already contains many migrations.

Do not reset production/development data automatically.

Before changing auth schemas or enums:

1. inspect current schema
2. inspect migration history
3. compare schema definitions
4. identify duplicated enums/tables
5. generate only required changes
6. avoid destructive drops
7. document manual intervention if required

Pay special attention to duplicate enum/table errors.

---

# 55. Seed Data

After schema stability, ensure development seed data covers:

```text
1 organization
departments
designations
locations
work schedules
holidays

admin
HR
manager
employees

attendance records
leave policies
leave balances
leave requests
salary structures
payroll periods
payslips
notifications
```

Seed data must preserve referential integrity.

Do not duplicate Better Auth users on every seed run.

Prefer idempotent seeding.

---

# 56. Testing

Expand existing tests:

```text
tests/auth-access.test.ts
tests/permissions.test.ts
tests/business-domain.test.ts
```

Test at minimum:

```text
unauthenticated dashboard access
authenticated dashboard access
admin permissions
HR permissions
manager permissions
employee permissions
employee self-resource protection
manager team protection
organization isolation
payroll protection
API 401
API 403
role redirects
callback redirects
logout
```

---

# 57. Manual Route Verification

Test manually:

```text
/
sign-in
sign-up
dashboard
dashboard/people
dashboard/attendance
dashboard/time-off
dashboard/payroll
dashboard/approvals
dashboard/organization
dashboard/reports
dashboard/settings
admin
hr
manager
employee
```

Test each using:

```text
logged out
admin
HR
manager
employee
```

Verify direct URL navigation, not just sidebar navigation.

---

# 58. Build Verification

Before declaring completion run the project's actual scripts, preferably using Bun where configured:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

If script names differ, inspect `package.json` and run the correct equivalents.

Also run appropriate Drizzle validation/generation commands without applying destructive database operations automatically.

There must be no unresolved:

```text
TypeScript errors
broken imports
missing exports
invalid routes
auth redirect loops
duplicate route handlers
missing schema exports
Better Auth initialization failures
React Query provider failures
```

---

# 59. Expected Architecture

Final architecture should resemble:

```text
Browser
   ↓
Next.js
   ↓
Better Auth
   ↓
Session
   ↓
RBAC / Permission / Scope
   ↓
Page or API
   ↓
Service
   ↓
Domain
   ↓
Repository
   ↓
Drizzle
   ↓
PostgreSQL
```

Frontend data:

```text
Page
   ↓
Feature Client Component
   ↓
TanStack Query Hook
   ↓
API Client
   ↓
/api/v1
   ↓
Authorization
   ↓
Service
```

---

# 60. Authentication Architecture

Target:

```text
                    Better Auth
                        │
              ┌─────────┴─────────┐
              │                   │
          Server Auth          Auth Client
              │                   │
        requireAuth()        useSession()
              │
      requirePermission()
              │
   ┌──────────┼───────────────┐
   │          │               │
Pages       APIs          Server Actions
   │          │               │
   └──────────┴───────────────┘
              │
          RBAC + Scope
              │
          Business Logic
```

---

# 61. Important Implementation Principle

Do not solve authorization by hiding UI.

For every sensitive feature:

```text
Sidebar
   ↓ permission filtered

Page
   ↓ permission protected

API
   ↓ permission protected

Service
   ↓ ownership / organization rules where required

Database
```

The API is the final trust boundary for client-triggered operations.

---

# 62. Implementation Order

Perform the work in this order:

### Phase 1 — Audit

Analyze:

```text
auth
database
routes
APIs
hooks
frontend pages
roles
permissions
duplicates
```

Produce a concise issue inventory before major refactoring.

### Phase 2 — Auth Foundation

Fix:

```text
BETTER_AUTH_URL
Better Auth server config
Better Auth client
Drizzle adapter
auth schema
session helpers
```

### Phase 3 — RBAC

Implement:

```text
roles
permissions
requireAuth
requireRole
requirePermission
ownership checks
manager scope
organization scope
```

### Phase 4 — Route Security

Protect:

```text
dashboard
role portals
sensitive pages
API routes
```

### Phase 5 — API Cleanup

Consolidate:

```text
/api/auth
/api/v1
```

Remove obsolete duplicate endpoints after updating consumers.

### Phase 6 — Frontend Integration

Connect:

```text
dashboard
people
attendance
leave
approvals
payroll
organization
reports
notifications
settings
```

### Phase 7 — Navigation

Fix:

```text
sidebar
breadcrumbs
role visibility
redirects
callback URLs
```

### Phase 8 — Cleanup

Remove:

```text
dead code
duplicate auth logic
mock data
hardcoded URLs
duplicate routes
debugging code
```

### Phase 9 — Verification

Run:

```text
lint
typecheck
tests
build
route testing
role testing
```

---

# 63. Required Final Report

When implementation is complete, provide:

## A. Auth Architecture

Explain the final Better Auth flow.

## B. Environment Variables

List required environment variables without revealing secret values.

## C. RBAC Matrix

Provide:

```text
Route / Feature | Admin | HR | Manager | Employee
```

## D. API Security Matrix

Provide:

```text
Endpoint | Authentication | Permission | Scope
```

## E. Route Inventory

Provide:

```text
Route | Purpose | Access | API
```

## F. Removed Duplicates

Document:

```text
duplicate APIs
duplicate auth helpers
duplicate routes
obsolete files
```

## G. Database Changes

Explain migrations/schema changes.

## H. Remaining Issues

Do not hide unresolved issues.

## I. Verification

Report results for:

```text
lint
typecheck
tests
build
auth
RBAC
route navigation
API connectivity
```

---

# 64. Definition of Done

The work is NOT complete merely because the application compiles.

It is complete only when:

* Better Auth initializes correctly.
* `BETTER_AUTH_URL` is the canonical server-side application/auth origin.
* No server origin is unnecessarily hardcoded.
* Sign-in works.
* Sign-up works.
* Logout works.
* Session persistence works.
* Role resolution works.
* Admin access works.
* HR access works.
* Manager access works.
* Employee access works.
* Unauthorized users cannot bypass permissions through direct URLs.
* Unauthorized users cannot bypass permissions through APIs.
* Employee ownership is enforced.
* Manager team scope is enforced.
* Organization boundaries are enforced where applicable.
* Dashboard redirects do not loop.
* All sidebar links resolve.
* Frontend pages use real APIs.
* Mutations persist to PostgreSQL.
* TanStack Query updates UI correctly.
* Duplicate APIs are removed or intentionally documented.
* Duplicate auth logic is consolidated.
* Mock data is removed from production flows.
* Errors are handled correctly.
* Lint succeeds.
* TypeScript succeeds.
* Tests succeed.
* Production build succeeds.

---

# 65. Non-Negotiable Rules

**DO NOT:**

* rebuild Dayflow from scratch
* replace Better Auth
* replace Drizzle
* replace TanStack Query
* create a second auth system
* trust frontend role values
* authorize using client-supplied user IDs
* hardcode `localhost:3000` throughout the codebase
* expose `BETTER_AUTH_SECRET`
* expose `DATABASE_URL`
* duplicate APIs
* duplicate database tables
* reset the database without explicit approval
* hide authorization only through the sidebar
* leave mock data where a real API exists
* declare completion without running verification

**DO:**

* inspect first
* reuse existing architecture
* consolidate auth
* centralize RBAC
* enforce authorization server-side
* use `BETTER_AUTH_URL` where an absolute server origin is required
* use same-origin relative API paths in the browser
* use `/api/v1` for business APIs
* use Better Auth sessions as identity
* validate input
* enforce ownership
* enforce organization scope
* connect frontend to backend
* clean duplicate implementations
* preserve data
* test every role
* verify the production build

The final result should behave like a cohesive **production HRMS**, not a collection of independent pages and APIs.
