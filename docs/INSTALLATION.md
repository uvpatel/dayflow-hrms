# Dayflow HRMS — Installation & Setup Guide

This guide provides step-by-step instructions to install, configure, migrate, seed, and run **Dayflow HRMS** in both local development and production environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quickstart (5-Minute Setup)](#quickstart-5-minute-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup & Migrations](#database-setup--migrations)
5. [Database Seeding & Test Accounts](#database-seeding--test-accounts)
6. [GitHub OAuth Setup](#github-oauth-setup)
7. [Email Provider Configuration](#email-provider-configuration)
8. [Running the Application](#running-the-application)
9. [Production Deployment](#production-deployment)
10. [Troubleshooting & FAQs](#troubleshooting--faqs)

---

## Prerequisites

Before starting, ensure your system meets the following requirements:

| Requirement | Supported Version | Notes |
| :--- | :--- | :--- |
| **Bun** | `^1.3.0` (Recommended) | Primary runtime and package manager |
| **Node.js** | `^20.0.0` or `^22.0.0` | Required for auxiliary tooling |
| **PostgreSQL** | `^15.0` or Neon Serverless | Local PostgreSQL or [Neon](https://neon.tech) cloud instance |
| **Git** | Latest | Version control |

> [!NOTE]
> Dayflow uses [Bun](https://bun.sh) as its default package manager and test runner. If you do not have Bun installed, install it via `curl -fsSL https://bun.sh/install | bash` or `npm install -g bun`.

---

## Quickstart (5-Minute Setup)

Run the following commands in your terminal:

```bash
# 1. Clone the repository
git clone https://github.com/your-org/dayflow.git
cd dayflow

# 2. Install dependencies
bun install

# 3. Copy environment template
cp .env.example .env

# 4. Configure your .env file with your PostgreSQL connection string
# (See Environment Configuration section below)

# 5. Apply migrations and seed the database
bun run db:migrate
bun run db:seed

# 6. Start the local development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Configuration

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

### Environment Variables Reference

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/dayflow`) |
| `BETTER_AUTH_SECRET` | **Yes** | — | High-entropy secret key (min 32 chars). Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | **Yes** | `http://localhost:3000` | Canonical app origin (no trailing slash, no `/api/auth` path) |
| `GITHUB_CLIENT_ID` | **Yes** | — | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | **Yes** | — | GitHub OAuth App Client Secret |
| `AUTH_REQUIRE_EMAIL_VERIFICATION` | No | `true` | Set to `false` only during local development if you want to bypass email verification |
| `BETTER_AUTH_TRUSTED_ORIGINS` | No | `""` | Comma-separated list of additional trusted origins (e.g. `https://preview.dayflow.dev`) |
| `AUTH_TRUST_PROXY_HEADERS` | No | `false` | Enable only if behind a trusted reverse proxy (auto-enabled on Vercel) |
| `EMAIL_PROVIDER_API_URL` | No* | `""` | JSON HTTP endpoint for sending emails (Required in production) |
| `EMAIL_PROVIDER_API_KEY` | No* | `""` | Bearer token / API key for the email provider endpoint |
| `EMAIL_FROM` | No | `""` | Sender address (e.g. `noreply@dayflow.dev`) |

> [!IMPORTANT]
> **Production Rules for `BETTER_AUTH_URL`**:
> - Must include the `https://` protocol (e.g. `https://dayflow.example.com`).
> - Do **not** append `/api/auth` or any subpath.
> - Do **not** include a trailing slash `/`.
> - Do **not** define `NEXT_PUBLIC_BETTER_AUTH_URL`. The client uses relative paths (`/api/auth`) while the server reads `BETTER_AUTH_URL`.

---

## Database Setup & Migrations

Dayflow uses [Drizzle ORM](https://orm.drizzle.team) with PostgreSQL.

### Option A: Using Neon Cloud PostgreSQL (Recommended)
1. Create a free PostgreSQL database at [Neon.tech](https://neon.tech).
2. Copy the connection string (with pooled or direct connection).
3. Paste into `.env`:
   ```env
   DATABASE_URL="postgresql://neondb_owner:password@ep-cool-project.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```

### Option B: Using Local Docker PostgreSQL
Run a local PostgreSQL container:
```bash
docker run --name dayflow-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=dayflow \
  -p 5432:5432 \
  -d postgres:16-alpine
```
Then set in `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dayflow"
```

### Applying Schema & Migrations

```bash
# Generate new migration files if schema is modified (src/db/schema)
bun run db:generate

# Apply pending migrations from drizzle/ folder to the database
bun run db:migrate

# Open Drizzle Studio to inspect and edit records via a visual GUI
bun run db:studio
```

> [!CAUTION]
> Never use `drizzle-kit push` (`bun run db:push`) against production databases. Always use versioned migrations via `bun run db:migrate`.

---

## Database Seeding & Test Accounts

Dayflow includes an idempotent development seed that sets up an organization (`Dayflow Technologies`), departments, designations, work schedules, holidays, leave policies, and **26 realistic user accounts**.

To seed your development database:

```bash
bun run db:seed
```

### Pre-configured Seed Credentials

All seeded accounts use the password: **`Password123!`**

| Role | Name | Email | Employee ID | Department | Access Level |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin** | Alex Vance | `admin@dayflow.dev` | `EMP-1001` | Executive / Engineering | Full administrative & system config |
| **HR** | Sarah Jenkins | `hr1@dayflow.dev` | `EMP-1002` | Human Resources | Org-wide People, Leave, Attendance, Payroll |
| **HR** | Michael Chang | `hr2@dayflow.dev` | `EMP-1003` | Human Resources | Org-wide People, Leave, Attendance, Payroll |
| **Manager** | Elena Rostova | `manager1@dayflow.dev` | `EMP-1004` | Engineering | Direct Reports Team, Approvals |
| **Manager** | David Miller | `manager2@dayflow.dev` | `EMP-1005` | Product Design | Direct Reports Team, Approvals |
| **Manager** | Priya Raman | `manager3@dayflow.dev` | `EMP-1021` | Marketing | Direct Reports Team, Approvals |
| **Employee** | James Wilson | `emp1@dayflow.dev` | `EMP-1006` | Engineering | Self-Service (Profile, Clock-in, Leave, Payslips) |
| **Employee** | Olivia Martinez | `emp2@dayflow.dev` | `EMP-1007` | Engineering | Self-Service |
| *(+18 more)* | *Staff Members* | `emp3@dayflow.dev` ... `emp20@dayflow.dev` | `EMP-1008`–`EMP-1026` | Various | Self-Service |

---

## GitHub OAuth Setup

To enable GitHub social login:

1. Go to [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers).
2. Click **New OAuth App**.
3. Fill in the application details:
   - **Application name**: `Dayflow HRMS (Dev)`
   - **Homepage URL**: `http://localhost:3000` (or your production domain)
   - **Authorization callback URL**:
     - Local Dev: `http://localhost:3000/api/auth/callback/github`
     - Production: `https://your-domain.com/api/auth/callback/github`
4. Click **Register application**.
5. Copy the **Client ID** and generate a **Client Secret**.
6. Add them to your `.env`:
   ```env
   GITHUB_CLIENT_ID="Iv1.xxxxxxxxxxxx"
   GITHUB_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

---

## Email Provider Configuration

Dayflow supports email verification and password reset workflows.

### Development Mode
In local development (when `EMAIL_PROVIDER_API_URL` is omitted), email verification tokens and password reset links are **logged directly to the server terminal console**.

### Production Mode
Production requires an HTTPS JSON-based email provider endpoint:

```env
EMAIL_PROVIDER_API_URL="https://api.resend.com/emails" # or your custom transactional email endpoint
EMAIL_PROVIDER_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="Dayflow HRMS <notifications@dayflow.dev>"
AUTH_REQUIRE_EMAIL_VERIFICATION="true"
```

---

## Running the Application

### Development Server
```bash
bun run dev
```
Starts Next.js development server with Hot Module Replacement on `http://localhost:3000`.

### Type Checking & Linting
```bash
# Run TypeScript compilation check
bun run typecheck

# Run ESLint validation
bun run lint
```

### Running Tests
```bash
# Execute Bun test suite
bun test
```

### Building for Production
```bash
bun run build
bun run start
```

---

## Production Deployment

### Deploying to Vercel

1. Push your repository to GitHub / GitLab.
2. Import the project into [Vercel](https://vercel.com).
3. Configure **Environment Variables** in Vercel Project Settings:
   - `DATABASE_URL` (Neon PostgreSQL direct or pooled connection string)
   - `BETTER_AUTH_SECRET` (generate a unique 32+ char secret)
   - `BETTER_AUTH_URL` (`https://your-production-domain.com`)
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `EMAIL_PROVIDER_API_URL`
   - `EMAIL_PROVIDER_API_KEY`
   - `EMAIL_FROM`
   - `AUTH_REQUIRE_EMAIL_VERIFICATION="true"`
4. Run migrations prior to deploying production traffic:
   ```bash
   bun run db:migrate
   ```
5. Deploy!

---

## Troubleshooting & FAQs

### 1. `AUTH_CONFIGURATION_ERROR: BETTER_AUTH_SECRET must be at least 32 characters`
Generate a high entropy secret using:
```bash
openssl rand -base64 32
```
And ensure it is assigned without quotes or spaces in your `.env`.

### 2. GitHub OAuth Redirect Mismatch
Ensure your GitHub OAuth App's Authorization Callback URL matches your current environment origin:
- Dev: `http://localhost:3000/api/auth/callback/github`
- Prod: `https://<YOUR_DOMAIN>/api/auth/callback/github`

### 3. Database connection timeout / SSL error
If using Neon, ensure `?sslmode=require` is present at the end of `DATABASE_URL`.

### 4. Migration table locks or conflicts
Inspect migration files in `drizzle/` and verify table status using:
```bash
bun run db:studio
```
