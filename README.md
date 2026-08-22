# Dayflow — Human Resource Management System

> **Every workday, perfectly aligned.**

[![Next.js](https://img.shields.io/badge/Next.js-16.3.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-1.0-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/Neon_Postgres-Serverless-00e599?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-v1.7-black?style=for-the-badge)](https://better-auth.com/)

---

## 📑 Table of Contents

- [1. Introduction](#1-introduction)
  - [1.1 Purpose](#11-purpose)
  - [1.2 Scope](#12-scope)
  - [1.3 Definitions & Abbreviations](#13-definitions--abbreviations)
- [2. User Classes and Characteristics](#2-user-classes-and-characteristics)
- [3. Functional Requirements](#3-functional-requirements)
  - [3.1 Authentication & Authorization](#31-authentication--authorization)
  - [3.2 Intelligent Dashboards](#32-intelligent-dashboards)
  - [3.3 Employee Profile Management](#33-employee-profile-management)
  - [3.4 Attendance Management](#34-attendance-management)
  - [3.5 Leave & Time-Off Management](#35-leave--time-off-management)
  - [3.6 Payroll & Compensation Management](#36-payroll--compensation-management)
  - [3.7 Notifications, Alerts & Analytics](#37-notifications-alerts--analytics)
- [4. Non-Functional Requirements & Security](#4-non-functional-requirements--security)
- [5. System Architecture & Tech Stack](#5-system-architecture--tech-stack)
- [6. Database Architecture](#6-database-architecture)
- [7. API Route Reference](#7-api-route-reference)
- [8. Getting Started & Installation](#8-getting-started--installation)
- [9. Project Structure](#9-project-structure)
- [10. Interactive Workflows & Wireframes](#10-interactive-workflows--wireframes)
- [11. Future Enhancements](#11-future-enhancements)
- [12. License & Acknowledgments](#12-license--acknowledgments)

---

## 1. Introduction

### 1.1 Purpose
The purpose of **Dayflow** is to define and execute the functional and non-functional requirements of a modernized, cloud-native **Human Resource Management System (HRMS)**. The platform digitizes and streamlines core HR operations—such as employee onboarding, profile lifecycle management, dynamic attendance tracking, leave requests and time-off policies, payroll visibility, and administrative approval workflows—bringing operational clarity and friction-free interaction for both admins and employees.

### 1.2 Scope
Dayflow delivers an end-to-end enterprise suite providing:
- **Secure Authentication & Onboarding**: Robust sign-up, sign-in, credential validation, and role assignment.
- **Role-Based Access Control (RBAC)**: Strict permission boundaries separating Admin/HR Officers from regular Employees.
- **Employee Profile Hub**: Comprehensive personal, job, departmental, and document lifecycle management.
- **Attendance Engine**: Interactive check-in/check-out with daily, weekly, and monthly attendance visualization and regularization workflows.
- **Time-Off & Leave Management**: Request submission, balance tracking, and multi-state approval/rejection pipelines.
- **Payroll & Salary Transparency**: Structured salary components, automated payroll period tracking, and employee payslip generation.
- **Auditing & Reporting**: Centralized notification triggers, attendance summaries, and payslip exports.

### 1.3 Definitions & Abbreviations
| Term | Description |
| :--- | :--- |
| **HRMS** | Human Resource Management System |
| **Admin / HR Officer** | Privileged user with full workforce management, payroll configuration, and approval authority |
| **Employee** | Standard organizational user with self-service view and action privileges for personal data |
| **Time-Off** | Any authorized absence, including Paid Time Off (PTO), Sick Leave, Casual Leave, and Unpaid Leave |
| **RBAC** | Role-Based Access Control enforcing resource-level security |
| **Payslip / Pay Period** | Formal compensation breakdown distributed across specified billing cycles |

---

## 2. User Classes and Characteristics

```mermaid
graph LR
    subgraph Users[Dayflow Users]
        Admin["👑 Admin / HR Officer"]
        Emp["👤 Employee"]
    end

    subgraph AdminActions[Admin Privileges]
        A1["Workforce Directory & Onboarding"]
        A2["Leave Approvals & Rejections"]
        A3["Attendance Oversight & Regularization"]
        A4["Payroll Structure & Period Controls"]
        A5["Organization Settings & Analytics"]
    end

    subgraph EmpActions[Employee Privileges]
        E1["Self-Service Profile View & Limited Edit"]
        E2["Check-in / Check-out & Weekly Timesheets"]
        E3["Submit Leave Requests & Track Balances"]
        E4["View & Download Monthly Payslips"]
    end

    Admin --> AdminActions
    Emp --> EmpActions
```

| User Type | Role & Responsibilities | Permissions & Capabilities |
| :--- | :--- | :--- |
| **Admin / HR Officer** | Full management and administrative privilege across the organizational workspace. | • Manage employee onboarding, updates, and terminations.<br>• Review, approve, or reject leave requests with administrative remarks.<br>• Oversee company-wide attendance tracking and approve attendance regularizations.<br>• Configure salary components, payroll periods, and generate employee payslips.<br>• Access full analytics, department management, and audit logs. |
| **Employee** | Standard user focused on day-to-day work log and self-service capabilities. | • View personal profile, job details, and compensation breakdown.<br>• Edit personal contact info, emergency contacts, and profile picture.<br>• Check-in / check-out daily and review personal weekly attendance logs.<br>• Apply for time-off, monitor balance allowances, and track request status.<br>• Access read-only payroll records and download payslips. |

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization

#### 3.1.1 Sign Up
- **Registration Fields**: Employee ID, Full Name, Email Address, Password, and Role selection (`Employee` or `HR / Admin`).
- **Security Validation**:
  - Enforced password strength policies (minimum length, special characters, uppercase, and numerals).
  - Unique constraint verification on Employee ID and Email.
- **Verification**: Email confirmation workflow ensuring only verified company domains gain access.

#### 3.1.2 Sign In
- **Credential Validation**: Secure authentication with email and password via **Better Auth**.
- **Error Handling**: Explicit, context-aware error feedback for incorrect credentials, locked accounts, or unverified emails.
- **Session & Redirection**: Persistent, secure session tokens with automated routing directly to role-tailored dashboards.

---

### 3.2 Intelligent Dashboards

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DAYFLOW DASHBOARD                               │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ 👤 EMPLOYEE DASHBOARD                │ 👑 ADMIN / HR DASHBOARD              │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • Quick Access Cards:                │ • Workforce Stats (Headcount, OOO)   │
│   - My Profile                       │ • Master Employee Directory          │
│   - Attendance Clock In/Out          │ • Real-time Attendance Monitor       │
│   - Leave Requests & Balance         │ • Pending Leave Approval Queue       │
│ • Live Time-tracker & Quick Stats    │ • Employee Switching & Quick Actions │
│ • Recent Activity Feed & Alerts      │ • Payroll Processing & Analytics     │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

#### 3.2.1 Employee Dashboard
- **Quick-Access Cards**: Direct navigation to Profile, Daily Attendance, Leave Requests, and Sign Out.
- **Live Status Widget**: Real-time punch state, worked hours tally, and remaining leave quotas.
- **Activity & Alerts**: Live notifications on request status updates, upcoming public holidays, and payslip generation.

#### 3.2.2 Admin / HR Dashboard
- **Operational Metrics**: Total workforce headcount, present employees, on-leave count, and pending approval items.
- **Queue Central**: Consolidated inbox for time-off and attendance correction approvals.
- **Employee Switching**: Effortlessly search and inspect individual employee records without leaving the administrative cockpit.

---

### 3.3 Employee Profile Management

#### 3.3.1 View Profile
Employees and Admins can view structured employee data categorized into:
- **Personal Details**: Full name, contact email, phone number, residential address, emergency contacts.
- **Job & Organization Details**: Employee ID, Department, Designation, Manager, Date of Joining, Employment Type.
- **Salary Structure**: Base salary, HRA, allowances, deductions, and gross calculation.
- **Documents & Assets**: National ID, certificates, contract agreements, and avatar image.

#### 3.3.2 Edit Profile & Permissions Matrix
- **Employee Self-Service**: Permitted to update contact details, residential address, emergency contact numbers, and profile avatar.
- **Admin Privileges**: Unrestricted capability to modify all profile fields, adjust roles, alter compensation structures, and update employment statuses.

---

### 3.4 Attendance Management

#### 3.4.1 Attendance Tracking
- **Check-In / Check-Out**: One-click action recording exact timestamps, IP/location metadata, and work modes (Remote/On-site).
- **Status Classifications**:
  - `Present`: Standard full-day shift completed.
  - `Absent`: No check-in recorded without approved leave.
  - `Half-Day`: Shift duration below half-day threshold.
  - `Leave`: Absence backed by approved time-off request.
- **Regularization**: Option for employees to submit attendance correction requests for missed punches.

#### 3.4.2 Attendance Views & Scope
- **Employee View**: Daily status, weekly breakdown calendar, total logged hours, and overtime calculations.
- **Admin View**: Organization-wide attendance sheet, filterable by date, department, or individual employee.

---

### 3.5 Leave & Time-Off Management

```mermaid
sequenceDiagram
    autonumber
    actor Emp as 👤 Employee
    participant Sys as ⚡ Dayflow HRMS
    actor Adm as 👑 Admin / HR Officer

    Emp->>Sys: Submit Leave Request (Type, Date Range, Remarks)
    Sys-->>Sys: Set Status: PENDING & Notify Admin
    Adm->>Sys: Review Request & Check Team Calendar
    alt Request Approved
        Adm->>Sys: Approve Request with Comments
        Sys-->>Sys: Deduct Balance & Mark Status: APPROVED
        Sys-->>Emp: Notification: Leave Approved
    else Request Rejected
        Adm->>Sys: Reject Request with Reason
        Sys-->>Sys: Retain Balance & Mark Status: REJECTED
        Sys-->>Emp: Notification: Leave Rejected
    end
```

#### 3.5.1 Apply for Leave (Employee)
- **Leave Categorization**: Paid Time Off (PTO), Sick Leave, Casual Leave, Unpaid Leave, Maternity/Paternity Leave.
- **Request Parameters**: Single/multi-day date range selector, reason remarks, and optional document attachment.
- **Real-time Lifecycle**: Track request status through `Pending` ➔ `Approved` / `Rejected`.

#### 3.5.2 Leave Approval (Admin / HR)
- **Review Pipeline**: Centralized list of incoming leave applications showing employee leave history and balance impact.
- **Approval Actions**: Instant one-click approval or rejection with mandatory feedback remarks.
- **Instant Synchronization**: Approvals automatically update attendance sheets and leave balances across the system.

---

### 3.6 Payroll & Compensation Management

#### 3.6.1 Employee Payroll View
- **Read-Only Transparency**: View annualized CTC, monthly earnings, deductions (tax, insurance, PF), and net pay.
- **Payslip Downloads**: Access historical pay slips with detailed line-item breakdowns.

#### 3.6.2 Admin Payroll Control
- **Salary Architecture**: Create and configure custom salary structures (Base, Allowances, Incentives, Deductions).
- **Period Execution**: Process and lock monthly pay periods based on attendance and approved unpaid leaves.
- **Accuracy & Audit**: Run validation passes to prevent compensation discrepancies.

---

### 3.7 Notifications, Alerts & Analytics

- **Real-time Alerts**: Toast notifications and alert badges for approvals, punches, and announcements.
- **Reporting Suite**:
  - Exportable attendance reports (CSV / Excel).
  - Payroll summary statements and tax deduction summaries.
  - Departmental headcount and absenteeism trend charts.

---

## 4. Non-Functional Requirements & Security

| Requirement | Implementation & Standard |
| :--- | :--- |
| **Security & Privacy** | Password hashing with cryptographic salts via Better Auth, secure HTTP-only session cookies, and strict Role-Based Access Control (RBAC) across all server endpoints. |
| **Data Integrity** | Relational integrity ensured by PostgreSQL foreign key constraints and schema-level validation powered by Drizzle ORM and Zod. |
| **Performance** | Next.js Server Components for sub-second page loads, TanStack React Query for intelligent caching, and optimized database queries. |
| **Scalability** | Cloud-native serverless architecture deployed on Neon PostgreSQL and Edge-ready Next.js runtimes. |
| **Responsive UX** | Fully responsive layout powered by Tailwind CSS v4, supporting mobile, tablet, and desktop viewports. |

---

## 5. System Architecture & Tech Stack

```mermaid
graph TD
    subgraph ClientLayer["🖥️ Frontend Client (Next.js 16 + React 19)"]
        UI["Tailwind CSS v4 + shadcn/ui"]
        State["TanStack React Query & State"]
        Router["App Router (Role-Grouped Layouts)"]
    end

    subgraph AuthLayer["🔐 Authentication & Authorization"]
        BA["Better Auth Session Manager"]
        RBAC["RBAC Middleware & Route Guards"]
    end

    subgraph ServerLayer["⚙️ Server & Business Logic"]
        API["REST API Route Handlers (/api/v1/*)"]
        Services["Domain Modules (Attendance, Leave, Payroll, Profile)"]
    end

    subgraph DataLayer["🗄️ Persistence Layer"]
        ORM["Drizzle ORM"]
        DB[(Neon Serverless PostgreSQL)]
    end

    ClientLayer --> AuthLayer
    AuthLayer --> ServerLayer
    ServerLayer --> DataLayer
```

### Technology Matrix
- **Core Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions, API Routes)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Lucide Icons](https://lucide.dev/), [Motion](https://motion.dev/)
- **Database & ORM**: [Neon Serverless PostgreSQL](https://neon.tech/), [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Better Auth](https://better-auth.com/) (Email/Password & Social Auth)
- **Data Tables & Charts**: [TanStack Table](https://tanstack.com/table), [Recharts](https://recharts.org/)
- **Data Validation**: [Zod](https://zod.dev/)

---

## 6. Database Architecture

Dayflow uses an enterprise relational schema designed with Drizzle ORM:

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ DEPARTMENTS : contains
    DEPARTMENTS ||--o{ EMPLOYEES : employs
    EMPLOYEES ||--o{ ATTENDANCES : records
    EMPLOYEES ||--o{ LEAVE_REQUESTS : submits
    EMPLOYEES ||--o{ PAYSLIPS : receives
    EMPLOYEES ||--o{ APPROVAL_REQUESTS : initiates
    LEAVE_TYPES ||--o{ LEAVE_REQUESTS : classifies
    SALARY_STRUCTURES ||--o{ EMPLOYEES : assigns
    PAYROLL_PERIODS ||--o{ PAYSLIPS : aggregates

    EMPLOYEES {
        string id PK
        string employeeId UK
        string email UK
        string role
        string firstName
        string lastName
        string departmentId FK
        string salaryStructureId FK
    }

    ATTENDANCES {
        string id PK
        string employeeId FK
        date workDate
        timestamp checkIn
        timestamp checkOut
        string status
    }

    LEAVE_REQUESTS {
        string id PK
        string employeeId FK
        string leaveTypeId FK
        date startDate
        date endDate
        string status
        text remarks
    }

    PAYSLIPS {
        string id PK
        string employeeId FK
        string payrollPeriodId FK
        numeric grossPay
        numeric netPay
        string status
    }
```

---

## 7. API Route Reference

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/sign-up` | Register new employee / admin | Public |
| `POST` | `/api/auth/sign-in` | Authenticate and create session | Public |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile | Authenticated |
| `GET` | `/api/auth/employees` | List all employees (filterable) | Admin / HR |
| `POST` | `/api/auth/employees` | Create / onboard new employee | Admin / HR |
| `GET` | `/api/auth/employees/:id` | Fetch specific employee details | Admin / Owner |
| `PATCH` | `/api/auth/employees/:id` | Update employee profile fields | Admin / Owner |
| `POST` | `/api/auth/attendence/check-in` | Punch-in daily attendance | Employee |
| `POST` | `/api/auth/attendence/check-out` | Punch-out daily attendance | Employee |
| `GET` | `/api/auth/attendance` | View attendance logs (scoped) | Authenticated |
| `GET` | `/api/auth/leave-requests` | List leave requests | Authenticated |
| `POST` | `/api/auth/leave-requests` | Submit new leave application | Employee |
| `POST` | `/api/auth/leave-requests/:id/approve` | Approve leave request | Admin / HR |
| `POST` | `/api/auth/leave-requests/:id/reject` | Reject leave request | Admin / HR |
| `GET` | `/api/auth/payroll/payslips` | List generated payslips | Authenticated |
| `POST` | `/api/auth/payroll/periods` | Create & calculate payroll period | Admin / HR |

---

## 8. Getting Started & Installation

### Prerequisites
- [Node.js 20+](https://nodejs.org/) or [Bun 1.3+](https://bun.sh/)
- A [Neon PostgreSQL](https://neon.tech/) database instance (or local PostgreSQL 15+)

### 1. Clone the Repository
```bash
git clone https://github.com/uvpatel/dayflow-hrms.git
cd dayflow
```

### 2. Install Dependencies
```bash
bun install
# or: npm install / pnpm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory by copying the sample:
```bash
cp .env.example .env
```

Fill in your configuration:
```env
# Database Configuration (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Better Auth Configuration
BETTER_AUTH_SECRET="your-super-secret-key-at-least-32-characters-long"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# Optional Social OAuth
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### 4. Push Database Schema
```bash
bun run db:push
```

*(Optional) Launch Drizzle Studio to inspect your database:*
```bash
bun run db:studio
```

### 5. Run Development Server
```bash
bun run dev
# or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to experience Dayflow.

---

## 9. Project Structure

```plaintext
dayflow/
├── public/                 # Static assets, logos, and SVGs
├── drizzle/                # Database migrations and snapshots
├── src/
│   ├── app/                # Next.js App Router root
│   │   ├── (auth)/         # Auth pages (sign-in, signup)
│   │   ├── (dashboard)/    # HRMS cockpit & workspace
│   │   │   ├── (approvals)/# Approval management
│   │   │   ├── (attendance)/# Daily/weekly attendance logs & regularization
│   │   │   ├── (organization)/# Departments, roles, holidays
│   │   │   ├── (payroll)/  # Salary structure & payroll runs
│   │   │   ├── (people)/   # Employee profiles & onboarding
│   │   │   └── (timeoff)/  # Leave balance & application flows
│   │   ├── (marketing)/    # Landing & pricing pages
│   │   ├── (user)/         # Role-specific portals (admin, hr, employee)
│   │   └── api/            # API endpoints & auth handlers
│   ├── components/         # Reusable UI & layout elements
│   │   ├── main/           # Shell headers, sidebars, interactive tables
│   │   ├── sidebar/        # Contextual navigation controls
│   │   └── ui/             # shadcn/ui base primitives
│   ├── db/                 # Drizzle schema definitions & seed scripts
│   │   ├── schema/         # Entity models (employees, attendances, payroll)
│   │   └── seed/           # Mock seed data
│   ├── features/           # Domain feature modules
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Auth configurations & utilities
├── drizzle.config.ts       # Drizzle kit configuration
├── package.json            # Scripts & project dependencies
└── tsconfig.json           # TypeScript configuration
```

---

## 10. Interactive Workflows & Wireframes

Explore visual system architecture and UI state diagrams:

🎨 **Excalidraw Workflow & Architecture Board**:  
👉 [https://link.excalidraw.com/l/65VNwvy7c4X/58RLEJ4oOwh](https://link.excalidraw.com/l/65VNwvy7c4X/58RLEJ4oOwh)

---

## 11. Future Enhancements

- [ ] **AI-Powered HR Assistant**: Intelligent conversational agent to summarize company policies, review leave allocations, and answer tax queries.
- [ ] **Geofencing & Biometric Check-In**: Mobile punch-in with location verification and hardware biometric integration.
- [ ] **Automated Multi-Tier Performance Appraisals**: 360-degree feedback cycles, OKR/KPI milestone trackers, and promotion workflows.
- [ ] **Direct Multi-Currency Bank Payouts**: Automated payment gateway integrations (Stripe, RazorpayX) for direct salary disbursements.
- [ ] **Mobile Native Companion App**: React Native (iOS & Android) application for seamless punch-ins and push notifications on the go.
- [ ] **Automated Document OCR**: Automatic parsing and verification of tax identification and national ID cards during employee onboarding.

---

## 12. License & Acknowledgments

Distributed under the **MIT License**. Built with ❤️ for modern workplaces.

*Dayflow — Every workday, perfectly aligned.*
