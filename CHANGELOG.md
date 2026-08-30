# Changelog

All notable changes to **Dayflow HRMS** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Biometric attendance device synchronization via Webhooks & MQTT.
- Statutory tax and payroll calculation engine for US, UK, and India compliance.
- Mobile PWA application with offline clock-in support and geolocation geofencing.
- Multi-currency payroll disbursements and direct bank integrations.

---

## [0.1.0] - 2026-08-30

### Added
- **Authentication Engine**:
  - Full Better Auth 1.7 integration supporting Email/Password and GitHub OAuth 2.0.
  - Verification email delivery and password reset pipelines with console logging in development and HTTPS JSON provider in production.
  - Canonical origin validation, in-memory rate limiting, and trusted proxy header resolution.
- **Role-Based Access Control (RBAC)**:
  - 4-tier workforce hierarchy (`Admin`, `HR`, `Manager`, `Employee`) mapped to 3 public Better Auth access roles.
  - Server-authoritative permission guards across all REST API endpoints and Server Actions.
  - Multi-tenant data scoping enforced via `organization_id` on all database operations.
- **Employee Management Module**:
  - Employee directory with pagination, search, status, and department filters.
  - Employee profile management with support for `active`, `onboarding`, `notice_period`, and `inactive` lifecycle states.
  - Reporting line management with automatic self-management and circular reporting cycle prevention.
  - Extended employee data models for addresses, emergency contacts, and compliance documents.
- **Attendance & Time Tracking**:
  - Real-time 1-click clock-in and clock-out with server-authoritative timestamps (`new Date()`).
  - Work schedule engine calculating work hours, lateness, overtime, and break duration against IANA timezones.
  - Daily, weekly, and calendar attendance log views.
  - Multi-stage attendance correction request and approval workflow.
- **Leave & Time-Off System**:
  - Organization-wide leave catalog supporting custom leave types (Sick, Casual, Earned, Parental, Unpaid).
  - Annual leave allocations with real-time balance tracking.
  - Smart leave duration calculation excluding official company holidays and non-working weekend days.
  - Multi-stage leave approval engine with mandatory rejection feedback.
- **Payroll Processing**:
  - Organization payroll period state machine (`draft` → `review` → `finalized` → `published`).
  - Exact-cent numeric calculations for gross pay, statutory deductions, and net salary.
  - Role-scoped employee payslip viewing and printable payslip exports.
  - Scaffolding for modular salary structures and salary component rules.
- **Approvals & Operations**:
  - Unified approvals dashboard for Managers and HR specialists.
  - In-app notification center for attendance, leave, and payroll events.
  - System activity logging and audit trail capturing sensitive workforce operations.
- **Analytics & Reporting**:
  - Interactive dashboard analytics powered by Recharts (headcount trends, attendance rates, leave distributions).
  - Filterable organizational reports for attendance, leave, and payroll expenditures.
- **Developer Experience & Tooling**:
  - Complete TypeScript strict mode implementation.
  - Bun test runner integration with automated unit test suites for permissions and auth URLs.
  - Idempotent development database seeder with 26 realistic workforce profiles.
  - Comprehensive documentation hub (`docs/INSTALLATION.md`, `docs/ARCHITECTURE.md`, `SECURITY.md`, `CONTRIBUTING.md`).

---

## [0.0.1] - 2026-08-15

### Added
- Initial project scaffolding using Next.js 16 App Router, React 19, and Tailwind CSS v4.
- Drizzle ORM schema definitions and Neon PostgreSQL database configuration.
- Base UI component library integration.
- Initial conceptual implementation plan and database ERD specifications.
