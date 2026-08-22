# Dayflow HRMS — Backend Architecture & Database Analysis Report

**Date:** 2026-08-22  
**Status:** Analysis Complete  
**Application:** Dayflow HRMS  

---

## 1. Executive Summary

Dayflow HRMS is an enterprise-oriented Human Resource Management System built on **Next.js 16 (App Router)**, **React 19**, **Drizzle ORM**, **Neon PostgreSQL**, **Better Auth**, and **Tailwind CSS**.

A thorough audit of the database schema, route handlers, and frontend consumers revealed several architectural gaps:
1. **API Path Misplacement:** 30 business API routes were placed inside `/src/app/api/auth/` instead of `/api/v1/`, while client pages (`/dashboard`, `/people`, `/attendance`, `/time-off`, `/approvals/leave`) expect endpoints at `/api/v1/...`.
2. **Missing Multi-Tenancy & Authorization:** Zero endpoints enforced organization tenancy or session-based employee ownership. Handlers blindly accepted raw query params or request bodies (e.g. `userId = body.userId ?? "1"`).
3. **Database Schema Deficiencies:** Foreign keys, indexes, organization IDs, employee relationships, and workflow state columns were missing or unindexed in several Drizzle schemas.
4. **Mocked/Incomplete Endpoints:** Several endpoints (`/me`, `/payroll/periods`, `/payroll/payslips`, `/approvals/[id]`, `/notifications`) returned hardcoded mock data or echoed inputs without database persistence or transactions.
5. **No Layered Separation:** Logic was written inline inside 200+ line `route.ts` files without a dedicated Service, Repository, or Validation layer.

---

## 2. Drizzle ORM Schema & Database Model Analysis

### 2.1 Entity Relationship Model Discovered

```
User (Better Auth)
  │ (1:1)
  ▼
Employee
  ├── Organization (Many:1)
  ├── Department (Many:1)
  ├── Designation (Many:1)
  ├── Location (Many:1)
  ├── Manager (Self-referencing Many:1)
  ├── Addresses (1:Many)
  ├── Emergency Contacts (1:Many)
  ├── Documents (1:Many)
  ├── Work Schedules (1:Many)
  ├── Attendances (1:Many)
  ├── Attendance Corrections (1:Many)
  ├── Leave Allocations (1:Many)
  ├── Leave Requests (1:Many)
  ├── Salary Structure (Many:1)
  └── Payslips (1:Many)

Leave Request / Attendance Correction
  │ (1:1)
  ▼
Approval Request
  ├── Requestor (Employee)
  └── Approver (Employee)

Payroll Period
  │ (1:Many)
  ▼
Payslips
  │ (1:Many)
  ▼
Payslip Items
```

### 2.2 Table-by-Table Schema Quality Assessment

| Table | Primary Key | Foreign Keys Present | Indexes Present | Issues Identified |
|---|---|---|---|---|
| `user` | `id` (text) | None | None | Better-auth admin plugin needs `role`, `banned`, `banReason`, `banExpires` |
| `session` | `id` (text) | `userId` -> `user.id` | `userId` | Standard Better-Auth |
| `account` | `id` (text) | `userId` -> `user.id` | `userId` | Standard Better-Auth |
| `organizations` | `id` (serial) | None | None | Needs unique constraint on slug/code, timestamps |
| `departments` | `id` (serial) | None | None | Missing `organizationId` FK; no unique index on (orgId, name) |
| `designations` | `id` (serial) | None | None | Missing `organizationId` FK; no unique index on (orgId, name) |
| `locations` | `id` (serial) | None | None | Missing `organizationId` FK |
| `employees` | `id` (serial) | None | None | Missing `userId`, `organizationId`, `departmentId`, `designationId`, `locationId`, `managerId`, `employeeNumber`, `status`, `employmentType` |
| `employee_addresses` | `id` (serial) | `employeeId` (integer) | None | Missing explicit Drizzle `.references()` cascading constraint |
| `emergency_contacts` | `id` (serial) | `employeeId` (integer) | None | Missing explicit Drizzle `.references()` cascading constraint |
| `employee_documents` | `id` (serial) | `employeeId` (integer) | None | Missing explicit Drizzle `.references()` cascading constraint |
| `work_schedules` | `id` (serial) | `employeeId` (integer) | None | Needs organization/employee scoping and date indexes |
| `holidays` | `id` (serial) | None | None | Missing `organizationId` FK; needs index on `(organizationId, holidayDate)` |
| `attendances` | `id` (serial) | `userId` (text) | None | Missing composite index on `(userId, date)` or `(employeeId, date)`; needs unique/concurrency constraint on open check-ins |
| `attendance_corrections` | `id` (serial) | `userId` (text) | None | Missing checkInTime, checkOutTime, status, approvalRequestId, organizationId |
| `leave_types` | `id` (serial) | None | None | Missing `organizationId` FK; needs unique index |
| `leave_policies` | `id` (serial) | None | None | Missing `organizationId`, `leaveTypeId` FKs |
| `leave_allocations` | `id` (serial) | `employeeId` (integer) | None | Missing unique constraint on `(employeeId, leaveType, year)` |
| `leave_requests` | `id` (serial) | `employeeId` (integer) | None | Missing composite index on `(employeeId, status)`, `(startDate, endDate)` |
| `approval_requests` | `id` (serial) | `requestorId`, `approverId` | None | Needs entity reference (leaveRequestId, correctionId) and status tracking |
| `payroll_periods` | `id` (serial) | None | None | Missing `organizationId`, startDate, endDate, status ("draft", "processing", "finalized") |
| `salary_structures` | `id` (serial) | None | None | Missing `organizationId`, baseSalary, currency |
| `salary_components` | `id` (serial) | None | None | Missing structure link, type ("earning", "deduction"), amount/percentage |
| `payslips` | `id` (serial) | None | None | Missing `employeeId`, `payrollPeriodId`, `organizationId`, grossPay, netPay, status |
| `payslip_items` | `id` (serial) | None | None | Missing `payslipId`, componentName, amount, type |
| `notifications` | `id` (serial) | `userId` (integer) | None | Missing `organizationId`, type, linkUrl, readAt |
| `activity_logs` | `id` (serial) | None | None | Missing `actorId`, `organizationId`, `entityType`, `entityId`, `ipAddress` |

---

## 3. Existing API Implementation & Discovered Problems

### 3.1 Routing Misplacement & Duplication
- All business APIs were erroneously placed under `/api/auth/` (e.g. `/api/auth/employees`, `/api/auth/attendence`, `/api/auth/leave-requests`).
- Typo duplicate routes existed: `/api/auth/attendence/` and `/api/auth/attendance/` (where the latter merely re-exported the former).
- Frontend components were already built expecting `/api/v1/...` routes, causing HTTP 404 runtime failures.

### 3.2 Security & Multi-Tenancy Vulnerabilities
- **Zero Authentication Enforcement:** Most handlers did not verify sessions using `auth.api.getSession`.
- **Identity Spoofing:** Handlers trusted client-supplied `userId` or `employeeId` from request bodies or query params (e.g. `userId = body.userId ?? "1"`).
- **No Organization Isolation:** No queries filtered by `organizationId`, resulting in complete multi-tenant IDOR vulnerability.
- **Missing RBAC:** No role-based access checks existed between Employee, Manager, HR, and Admin.

### 3.3 Business Logic & Data Integrity Deficits
- **Attendance Check-In:** Did not check for existing active open check-ins; spamming the button creates infinite orphaned records. Lacked schedule lookup, lateness calculation, and audit logging.
- **Leave Requests:** Did not check leave balances or overlapping requests before creating a leave record.
- **Approvals:** Did not perform atomic transactional approval, balance deduction, or approver authorization.
- **Payroll:** Entire payroll period and payslip routes were stubs returning empty arrays or echoing request JSON without database persistence.
- **HTTP Semantics:** Collection endpoints implemented PUT/PATCH/DELETE methods improperly. Resource endpoints accepted PUT as partial updates instead of full replacement.

---

## 4. Proposed Production-Grade Architecture

### 4.1 Layered Architecture Pattern

```
Client (Next.js App / Fetch)
  │
  ▼
Next.js Route Handler (`src/app/api/v1/.../route.ts`)
  ├── Session Authentication (`authContext`)
  ├── Permission Check (`requirePermission`)
  ├── Request Validation (`validateBody`, `validateQuery`, `validateParams`)
  │
  ▼
Feature Domain Service (`src/features/.../*.service.ts`)
  ├── Business Domain Logic
  ├── Transaction Coordination (`db.transaction`)
  ├── Notification Triggering
  ├── Audit Activity Logging
  │
  ▼
Feature Repository / Query Layer (`src/features/.../*.repository.ts`)
  ├── Drizzle ORM Queries with Relational Selects
  ├── Multi-Tenant `where(eq(..., organizationId))` Scoping
  ├── Pagination, Filtering, Ordering Allowlist
  │
  ▼
Neon PostgreSQL Database
```

### 4.2 Standard API Response Structure

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Resource created successfully"
}
```

#### Paginated Collection Response
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "totalPages": 8
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "EMPLOYEE_NOT_FOUND",
    "message": "The requested employee could not be found."
  }
}
```

---

## 5. Migration Strategy & Compatibility Plan

1. **API Route Standardization:**
   - Establish `/api/v1/...` for all standard business routes.
   - For temporary backwards compatibility, maintain lightweight alias re-exports under `/api/auth/...` and `/api/v1/attendence` (matching the typo) that delegate to the clean `/api/v1/` handlers.
   - Update frontend callers in `page.tsx` files to use correct `/api/v1/attendance` and `/api/v1/...` routes.
2. **Database Schema Enhancements:**
   - Expand `auth-schema.ts` to include Better-Auth admin plugin fields (`role`, `banned`, etc.).
   - Support organization scoping across all core tables.
   - Maintain full backward compatibility for existing columns.
3. **Domain Implementation Sequence:**
   - **Phase 1:** Core Infrastructure (Auth helpers, RBAC permissions, typed AppError, standard API response, validation helpers).
   - **Phase 2:** Organization Domain (Organizations, Departments, Designations, Locations, Holidays, Work Schedules).
   - **Phase 3:** Employees Domain (CRUD, profile, addresses, emergency contacts, documents, self-service `/me`).
   - **Phase 4:** Attendance Domain (Check-in, Check-out, History, Attendance Corrections, Concurrency control).
   - **Phase 5:** Time Off Domain (Leave types, Policies, Allocations, Leave request submission & calculations).
   - **Phase 6:** Approval Workflow Domain (Approvals list, atomic leave/correction approve/reject transactions).
   - **Phase 7:** Payroll Domain (Payroll periods, Salary structures, Components, Calculation engine, Payslip generation).
   - **Phase 8:** Workflow Domain (Notifications, Activity audit logs).
   - **Phase 9:** Security Audit, Test Suite & Documentation (`docs/api.md`, `docs/api-inventory.md`).

---

## 6. Implementation Readiness

All existing codebase files have been mapped. Implementation will proceed strictly phase by phase with TypeScript verification and descriptive git commits per domain.
