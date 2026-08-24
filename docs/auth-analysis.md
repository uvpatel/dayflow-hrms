# Dayflow HRMS — Authentication & Authorization Audit and Analysis

> **Historical document — superseded.** This file describes the repository
> before the authentication/RBAC refactor and contains statements that are no
> longer true (including duplicate handlers and the Next.js 16 `proxy.ts`
> convention). Do not use it for deployment. See
> [AUTH_PRODUCTION.md](./AUTH_PRODUCTION.md) for the current audited contract.

**Date:** 2026-08-22  
**Status:** Superseded historical audit
**Application:** Dayflow HRMS ("Every workday, perfectly aligned.")  
**Installed Better Auth Version:** `1.7.1`  
**Framework:** Next.js `16.3.1` (Turbopack, App Router) with React `19.2.8`  
**Database:** Neon PostgreSQL with Drizzle ORM (`1.0.0-rc.4`)  

---

## 1. Executive Summary

Dayflow HRMS requires an enterprise-grade, multi-tenant authentication and Role-Based Access Control (RBAC) architecture. Authentication identity is managed by **Better Auth**, while business identity resides in Dayflow's **Employee** and **Organization** domains.

Our audit identified several fundamental architectural gaps:
1. **Duplicate Auth Handlers:** Both `/auth/[...all]/route.ts` and `/api/auth/[...all]/route.ts` exist.
2. **API Misplacement:** 30+ business HRMS routes were placed inside `/src/app/api/auth/` rather than `/api/v1/`, conflicting with Better Auth's base path and causing 404s for frontend pages requesting `/api/v1/...`.
3. **Database Schema Deficiencies:** The `user` table in `auth-schema.ts` lacks the fields required by Better Auth's `admin` plugin (`role`, `banned`, `banReason`, `banExpires`), causing TypeScript build errors. The `employees` table lacks `userId`, `organizationId`, `role`, `departmentId`, and `employmentStatus`.
4. **No Centralized Authorization Layer:** Zero API endpoints or Server Components enforce tenant isolation (`organizationId`) or permissions (`getAuthContext()`, `requirePermission()`).
5. **No Next.js Route Protection:** `src/proxy.ts` is not named `middleware.ts`, meaning Next.js middleware is inactive. Furthermore, `proxy.ts` only performed a superficial cookie-existence check with no session verification.

---

## 2. Installed Better Auth Version & Configuration

### 2.1 Package Analysis
- **Version:** `better-auth@1.7.1` (`node_modules/better-auth/package.json`).
- **Client Library:** `better-auth/react` and `better-auth/client/plugins` (`adminClient()`).
- **Server Adapter:** `better-auth/adapters/drizzle` with PostgreSQL (`provider: "pg"`).
- **Handlers:** `better-auth/next-js` (`toNextJsHandler(auth)`).

### 2.2 Server Configuration (`src/lib/auth.ts`)
```ts
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin", "moderator"],
    }),
  ],
  socialProviders: {
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? { github: { clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET } }
      : {}),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
      : {}),
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
  ],
});
```

### 2.3 Client Configuration (`src/lib/auth-client.ts`)
```ts
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  plugins: [adminClient()],
});
```

---

## 3. Existing Authentication & API Routes Audit

| Location | Path | Purpose / Issue | Action Required |
|---|---|---|---|
| `src/app/auth/[...all]/route.ts` | `/auth/*` | Duplicate Better Auth handler | **Delete** (Redundant) |
| `src/app/api/auth/[...all]/route.ts` | `/api/auth/*` | Canonical Better Auth handler | **Keep & Standardize** |
| `src/app/api/auth/employees/*` | `/api/auth/employees` | Misplaced business route | **Move to `/api/v1/employees`** with auth & RBAC |
| `src/app/api/auth/attendance/*` | `/api/auth/attendance` | Misplaced business route | **Move to `/api/v1/attendance`** with auth & RBAC |
| `src/app/api/auth/attendence/*` | `/api/auth/attendence` | Misplaced typo route | **Consolidate into `/api/v1/attendance`** |
| `src/app/api/auth/leave-requests/*` | `/api/auth/leave-requests`| Misplaced business route | **Move to `/api/v1/leave-requests`** with auth & RBAC |
| `src/app/api/auth/departments/*` | `/api/auth/departments` | Misplaced business route | **Move to `/api/v1/departments`** |
| `src/app/api/auth/holidays/*` | `/api/auth/holidays` | Misplaced business route | **Move to `/api/v1/holidays`** |
| `src/app/api/auth/me/*` | `/api/auth/me` | Misplaced business route | **Move to `/api/v1/me`** (Session-derived) |
| `src/app/api/auth/payroll/*` | `/api/auth/payroll` | Misplaced business route | **Move to `/api/v1/payroll`** (Strict permission) |
| `src/app/api/auth/approvals/*` | `/api/auth/approvals` | Misplaced business route | **Move to `/api/v1/approvals`** |
| `src/app/api/auth/users/*` | `/api/auth/users` | Misplaced business route | **Move to `/api/v1/users`** (Admin only) |
| `src/app/api/auth/organizations/*` | `/api/auth/organizations`| Misplaced business route | **Move to `/api/v1/organizations`** |

---

## 4. Database Model & Schema Analysis

### 4.1 Better Auth Core Schema (`src/db/schema/auth-schema.ts`)
- **`user`**: `id` (text PK), `name`, `email`, `emailVerified`, `image`, `createdAt`, `updatedAt`.
  - *Missing Fields required by Better Auth Admin Plugin:* `role` (text default 'user'), `banned` (boolean default false), `banReason` (text), `banExpires` (timestamp).
- **`session`**: `id` (text PK), `expiresAt`, `token` (unique), `ipAddress`, `userAgent`, `userId` (FK -> `user.id`).
- **`account`**: `id` (text PK), `accountId`, `providerId`, `userId` (FK -> `user.id`), `accessToken`, `refreshToken`, `password`, etc.
- **`verification`**: `id` (text PK), `identifier`, `value`, `expiresAt`.

### 4.2 HR Business Schema & User Linking
```text
Better Auth User (users.id)
       │
       │ 1 : 1 (or 1 : 0..1 during initial signup before onboarding)
       ▼
Employees (employees.userId -> user.id)
       │
       ├── organizationId -> organizations.id
       ├── departmentId -> departments.id
       ├── designationId -> designations.id
       ├── managerId -> employees.id (self-referencing manager)
       ├── locationId -> locations.id
       ├── role -> 'admin' | 'hr' | 'manager' | 'employee'
       ├── employmentStatus -> 'active' | 'onboarding' | 'inactive' | 'notice_period'
       └── employeeNumber -> unique string (e.g. "EMP-001")
```

---

## 5. Security & Architectural Problems Identified

1. **Privilege Escalation Vulnerability:** Previous implementations did not validate role modification endpoints; public forms or API bodies could attempt to inject `role: "admin"`.
2. **Missing Multi-Tenancy Scoping (IDOR):** Endpoints directly read and updated records by primary key without verifying `organizationId === authContext.organizationId`.
3. **Client-Supplied Identity in Self-Service:** Attendance punch routes accepted `userId` from query params (`/api/v1/attendence/check-in?userId=1`) rather than resolving the caller from the cryptographic session token.
4. **No Centralized Authorization (`getAuthContext`):** Every API route implemented its own ad-hoc logic or omitted auth completely.
5. **Drizzle Connection Relational Queries Inactive:** `src/db/index.ts` instantiated `drizzle({ client: sql })` without passing `{ schema }`, preventing typed relational queries.
6. **Middleware Misconfiguration:** Next.js expects `src/middleware.ts` (or root `middleware.ts`). `src/proxy.ts` was never invoked by Next.js.
7. **Type Mismatch in Navigation:** `src/components/sidebar/sidebar.tsx` passed `username={data.user}` to `NavUser` which expects `user?: UserProp`, resulting in build errors.
8. **Missing `.env.example`:** No environment template existed for deployment and onboarding.

---

## 6. Target Production Architecture

```text
Browser / API Client
       │
       ▼
Next.js Middleware (`src/middleware.ts`)
       │ (Coarse route protection for /dashboard/*)
       ▼
Route / Server Component / API Route
       │
       ▼
getAuthContext() / requireAuth() / requirePermission()
       │
       ├── 1. Better Auth Session Validation (Server-side from cookies/headers)
       ├── 2. Resolve Better Auth User
       ├── 3. Resolve Linked Employee Profile (`employees.userId == user.id`)
       ├── 4. Resolve Tenant Organization (`employees.organizationId`)
       ├── 5. Determine Role (`ADMIN` | `HR` | `MANAGER` | `EMPLOYEE`)
       └── 6. Evaluate Granular Permissions & Resource Ownership Scope
               │
               ▼
Drizzle ORM (PostgreSQL Query with WHERE organizationId = authContext.organizationId)
```

### Granular Permission Matrix

| Role | Permissions |
|---|---|
| **EMPLOYEE** | `self:read`, `self:update`, `attendance:self`, `leave:self`, `leave:create`, `payroll:read:self` |
| **MANAGER** | All Employee permissions + `employee:read:team`, `attendance:read:team`, `leave:read:team`, `approval:manage:team` |
| **HR** | `employee:read:any`, `employee:create`, `employee:update`, `attendance:read:any`, `attendance:manage`, `leave:read:any`, `leave:manage`, `payroll:read:any`, `payroll:manage`, `organization:read` |
| **ADMIN** | Full organization management, user role management, system configurations, audit logs (`*`) |

---

## 7. Implementation Roadmap (Phased Execution)

- **Phase 1:** Comprehensive Audit & Analysis (Completed).
- **Phase 2:** Better Auth Foundation (Fix schemas, adapter, single `/api/auth/[...all]`, `src/db/index.ts` relational schema, `.env.example`).
- **Phase 3:** Safe Email/Password Authentication & Sign-in/Sign-up UI validation.
- **Phase 4:** User ↔ Employee Linking & `getAuthContext()` Server Utility.
- **Phase 5:** Role-Based Access Control (RBAC) & Centralized Permission System (`hasPermission`, `requirePermission`).
- **Phase 6:** Dashboard Route Protection, Permission-Aware Sidebar, and Dynamic Unified Role Views.
- **Phase 7:** Securing & Moving all Business APIs to `/api/v1/...` with Tenant Scoping & RBAC.
- **Phase 8:** Safe Invitation & Email Verification Workflows.
- **Phase 9:** Social Auth (Graceful GitHub/Google support with fallback).
- **Phase 10:** End-to-End Verification, Security Testing, TypeScript Check & Production Build.
