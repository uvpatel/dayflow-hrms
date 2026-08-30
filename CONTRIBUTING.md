# Contributing to Dayflow HRMS

Thank you for your interest in contributing to **Dayflow HRMS**! We welcome contributions from developers of all backgrounds.

This guide outlines our development workflow, coding standards, branch conventions, testing practices, and pull request process.

---

## 1. Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for all contributors. Please maintain respectful, collaborative, and constructive discussions across issues and pull requests.

---

## 2. Getting Started

### Local Development Setup

1. **Fork and clone** the repository:
   ```bash
   git clone https://github.com/your-username/dayflow.git
   cd dayflow
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Configure your environment**:
   ```bash
   cp .env.example .env
   ```
   Configure your PostgreSQL connection string (`DATABASE_URL`) and generate a `BETTER_AUTH_SECRET`.

4. **Apply migrations and seed data**:
   ```bash
   bun run db:migrate
   bun run db:seed
   ```

5. **Start development server**:
   ```bash
   bun run dev
   ```

---

## 3. Branching Strategy

We follow a structured branch naming convention:

| Branch Type | Format | Example |
| :--- | :--- | :--- |
| **New Features** | `feature/<short-description>` | `feature/slack-notifications` |
| **Bug Fixes** | `fix/<short-description>` | `fix/attendance-overtime-rounding` |
| **Documentation** | `docs/<short-description>` | `docs/api-guide-update` |
| **Refactoring** | `refactor/<short-description>` | `refactor/payroll-service` |
| **Performance** | `perf/<short-description>` | `perf/employee-list-query` |

---

## 4. Commit Message Guidelines

We enforce [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Supported Types:
- `feat`: A new feature or capability
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semi-colons, whitespace
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Code change that improves performance
- `test`: Adding or updating tests
- `chore`: Tooling, dependencies, configuration

### Examples:
```text
feat(leave): add half-day leave policy calculation
fix(attendance): prevent duplicate check-in within the same minute
docs(api): document /api/v1/payroll/periods endpoints
refactor(auth): simplify role normalization pipeline
```

---

## 5. Coding Standards & Guidelines

### TypeScript & Strict Mode
- Write clean, strongly-typed TypeScript code.
- Avoid `any` — use precise interfaces, generics, or `unknown` with type narrowing.
- Validate all incoming API or form inputs using **Zod** schemas.

### Architecture & Feature Domains
- New domain logic belongs in `src/features/<domain>/`:
  - `schemas.ts`: Zod validation schemas
  - `types.ts`: TypeScript interfaces and Drizzle inferred types
  - `repository.ts`: Drizzle ORM queries (database isolation)
  - `service.ts`: Business workflows, validations, and state machines
  - `actions.ts`: Server Actions interfacing with the frontend
  - `components/`: Domain-specific React components

### React 19 & Next.js App Router
- Default to **React Server Components (RSC)** where possible for optimal performance and SEO.
- Add `'use client'` only when interactive state, browser hooks, or event listeners are required.
- Use **TanStack Query** for client-side asynchronous data fetching and cache management.

### Styling & Tailwind CSS v4
- Use Tailwind CSS utility classes and `clsx` / `tailwind-merge` for conditional class combinations.
- Adhere to the design system defined in `components/ui/`.

### Database & Drizzle Schema
- Define tables in `src/db/schema/`.
- Always generate migrations using `bun run db:generate` rather than manual schema alterations.
- Always include foreign key constraints and `organization_id` tenant scoping on new tables.

---

## 6. Testing & Quality Gates

Before opening a pull request, ensure all validation checks pass:

```bash
# 1. Check for ESLint issues
bun run lint

# 2. Verify TypeScript types
bun run typecheck

# 3. Run unit and integration tests
bun test

# 4. Verify production build compilation
bun run build
```

---

## 7. Submitting a Pull Request (PR)

1. Ensure your branch is rebased on the latest `main`.
2. Push your branch to your GitHub fork:
   ```bash
   git push origin feature/your-feature-name
   ```
3. Open a Pull Request on GitHub against the `main` branch.
4. Fill out the PR description template:
   - **Summary**: Concise overview of changes made.
   - **Motivation**: Why is this change necessary?
   - **Testing Done**: Commands and test suites executed.
   - **Screenshots / Recordings** (if UI changes are included).
5. A maintainer will review your PR, request changes if necessary, and merge once approved!
