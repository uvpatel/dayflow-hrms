# Security Policy & Hardening — Dayflow HRMS

Dayflow HRMS handles sensitive employee information, attendance logs, leave balances, and payroll data. We take security seriously and enforce robust protection mechanisms across all architectural layers.

---

## 1. Supported Versions

Security updates and patches are actively maintained for the following versions:

| Version | Supported | Status |
| :--- | :---: | :--- |
| `0.1.x` (Current) | :white_check_mark: | Active Development / Hackathon |

---

## 2. Reporting a Vulnerability

If you discover a security vulnerability within Dayflow HRMS, please report it responsibly:

1. **Do not create a public GitHub Issue.**
2. Email your findings directly to the maintainers at **`security@dayflow.dev`** (or create a private GitHub Security Advisory).
3. Include:
   - Description of the vulnerability.
   - Step-by-step reproduction steps or proof-of-concept (PoC).
   - Potential impact on tenant data or user sessions.
4. The security team will acknowledge receipt within 48 hours and provide an estimated timeline for remediation.

---

## 3. Core Security Architecture

### A. Authentication & Session Management
- **Better Auth Integration**: Authentication relies on battle-tested [Better Auth](https://better-auth.com) protocols.
- **HTTP-Only, SameSite Cookies**: Session tokens are stored in `HttpOnly`, `Secure`, `SameSite=Lax` cookies, preventing client-side JavaScript access and mitigating Cross-Site Scripting (XSS) session theft.
- **Cryptographic Password Hashing**: User passwords are encrypted using modern cryptographic hashing (Argon2 / Scrypt). Plaintext passwords are never logged or stored.
- **OAuth 2.0 PKCE**: GitHub OAuth flow enforces state verification and strict redirect URI matching.

### B. Multi-Tenant Isolation
- **Organization-Scoped Queries**: Every business database query is strictly filtered by `organization_id` derived from the verified server-side session.
- **No Cross-Tenant Data Leaks**: Routes verify that requested resources (e.g. employees, payslips, leaves) belong to the actor's active organization.

### C. Server-Authoritative Business Logic
- **Timestamp Integrity**: Self-service attendance check-in/out timestamps are generated strictly using the server system clock (`new Date()`). Client-supplied timestamps in check-in requests are disregarded to prevent fraud.
- **Financial Calculation Guard**: Payslip earnings, deductions, and net-pay calculations are computed exclusively on the backend with numeric precision rounding.
- **State Transition Guards**: State transitions (e.g. Leave: `pending` → `approved`, Payroll: `draft` → `published`) are enforced through database transactions and status validations.

### D. CSRF & Origin Validation
- **Canonical Origin Enforcement**: `BETTER_AUTH_URL` defines the sole canonical origin.
- **Trusted Origins Allowlist**: Additional domains must be explicitly defined in `BETTER_AUTH_TRUSTED_ORIGINS`. Wildcards (such as `*` or `*.vercel.app`) are strictly rejected in production environments.
- **Proxy Header Verification**: `AUTH_TRUST_PROXY_HEADERS` is validated to prevent spoofed `X-Forwarded-For` or `X-Forwarded-Host` headers.

### E. Rate Limiting & Abuse Prevention
- **In-Memory Token Bucket**: Authentication endpoints (`/api/auth/sign-in`, `/api/auth/sign-up`, `/api/auth/forget-password`) enforce rate limiting to mitigate brute-force credential stuffing and denial-of-service attempts.
- **Email Verification Guard**: In production, `AUTH_REQUIRE_EMAIL_VERIFICATION="true"` is mandatory before granting active session access.

### F. Role-Based Access Control (RBAC)
- **Zero Client Trust**: UI element visibility (hiding buttons or sidebar links) is purely cosmetic. Every API route and Server Action verifies specific permissions (e.g. `leave:approve`, `payroll:manage`, `employee:delete`) before executing domain logic.
- **Workforce Hierarchy Rules**: Managers can only view or approve records belonging to their assigned direct reports (`employee.manager_id = current_employee.id`).

### G. Audit Trail & Activity Logging
- High-impact events (e.g. role updates, payroll finalization, leave decisions, employee termination) automatically write an immutable audit record to the `activity_logs` table.

---

## 4. Production Security Checklist

When deploying Dayflow to production, ensure:

- [ ] `BETTER_AUTH_SECRET` is generated using a cryptographically secure random generator (minimum 32 characters).
- [ ] `BETTER_AUTH_URL` uses an `https://` protocol and has no trailing slash.
- [ ] `AUTH_REQUIRE_EMAIL_VERIFICATION` is set to `"true"`.
- [ ] Direct database access is restricted via SSL (`?sslmode=require`).
- [ ] Production seed script (`bun run db:seed`) is **disabled** on live databases.
- [ ] Email provider credentials (`EMAIL_PROVIDER_API_KEY`) are stored in secure environment secrets.
- [ ] GitHub OAuth App is restricted to production domains and configured for `user:email` scope only.
