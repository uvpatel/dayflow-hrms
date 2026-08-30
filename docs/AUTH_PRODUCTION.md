# Dayflow authentication production runbook

This runbook describes the Better Auth 1.7.1 deployment contract. It does not
authorize a production migration and does not replace a successful browser test
against the intended deployment and database.

## Deployment contract

- `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `GITHUB_CLIENT_ID`, and
  `GITHUB_CLIENT_SECRET` are required at startup in every environment. Missing,
  blank, partial, or invalid configuration must stop startup with a clear error.
- `BETTER_AUTH_URL` is the sole canonical application origin. There is no
  localhost, request-host, or Vercel system-URL fallback.
- The browser Better Auth client remains same-origin and calls `/api/auth`; it
  never receives the canonical URL or an auth secret through a `NEXT_PUBLIC_`
  variable.
- GitHub account linking is implicit only for a verified email that exactly
  matches the verified email of an existing account. GitHub is not a trusted
  linking provider.
- A new verified GitHub identity starts with `user` access and onboarding. It
  does not require a pre-provisioned employee record, and OAuth metadata or
  browser input cannot grant `hr` or `admin`.
- A reviewed forward-only role/account backfill is still pending. Do not claim
  migration completion until it has been generated, reviewed, and rehearsed on
  representative data.

## URL, origin, proxy, and cookie contract

`BETTER_AUTH_URL` is the only canonical URL source. Set it to an origin with no
trailing slash, path, query, or fragment. Development normally uses
`http://localhost:3000`; every preview and production deployment must use its
explicit non-loopback HTTPS origin. Do not derive it from `VERCEL_URL`,
`VERCEL_PROJECT_PRODUCTION_URL`, request headers, or any other fallback.

The canonical origin is trusted automatically. `BETTER_AUTH_TRUSTED_ORIGINS`
is optional and may contain only additional reviewed first-party origins. It
must not replace or override `BETTER_AUTH_URL`.

Production trusted-origin values must include `https://`. `*` and the broad
`https://*.vercel.app` pattern are rejected. A project-specific pattern can be
used only when the team controls its complete namespace, but exact origins are
preferred.

`AUTH_TRUST_PROXY_HEADERS` defaults on only when Vercel exposes `VERCEL=1`.
Outside Vercel, enable it only when the reverse proxy overwrites
`x-forwarded-host` and `x-forwarded-proto` and clients cannot forge them. The
resolved host must still match the allowlist.

Cookies remain host-only; do not set a cookie domain. Better Auth is configured
for secure production cookies with `HttpOnly`, `SameSite=Lax`, and `Path=/`.
CSRF and origin checks remain enabled.

The browser client has no `baseURL`. It always calls same-origin `/api/auth`.
Never set `NEXT_PUBLIC_BETTER_AUTH_URL`.

## Handler, session, and authorization boundaries

There is exactly one Better Auth handler at
`src/app/api/auth/[...all]/route.ts`. Business APIs remain under `/api/v1`
(with three protected legacy aliases outside that namespace), never beneath
`/api/auth`.

Next.js 16 intentionally uses `src/proxy.ts`, not legacy `middleware.ts`. The
proxy's cookie check is only an optimistic redirect. Dashboard server code and
every `/api/v1` handler independently resolve the real Better Auth session and
employee authorization context. Direct `auth.api.getSession` calls forward the
request headers/cookies.

The dashboard layout supplies a broad page-policy guard, while APIs enforce
fresh role, organization, and row scope. Because Next layouts can remain
mounted across client navigation, especially sensitive leaf pages should keep
authorization close to their data as a future defense-in-depth improvement.
The current API boundary does not rely on the layout or on cookie presence.

Password and GitHub authentication converge on the internal `/auth/callback`
page. It reads the verified database role and redirects `admin` to `/admin`,
`hr` to `/hr`, and `user` to `/dashboard`. A new identity is written as `user`
and onboarding; existing `admin` and `hr` values remain unchanged. Elevated
roles may be assigned only through a trusted, server-authorized administrator
workflow or a reviewed database operation. Query parameters, forms, browser
storage, client state, and OAuth profile metadata are never role authorities.

Rate limiting still uses process memory and is therefore instance-local on
Vercel. Move it to shared storage before treating it as a global brute-force
control.

## Deployment environment matrix

Environment values changed on a hosting platform apply only to a new deployment,
so redeploy after every auth configuration change.

| Variable | Development | Preview | Production |
| --- | --- | --- | --- |
| `DATABASE_URL` | Disposable development Neon branch | Isolated preview/staging branch | Verified production Neon project and branch |
| `BETTER_AUTH_SECRET` | Required development-only high-entropy value | Required preview-only high-entropy value | Required production-only value, at least 32 high-entropy characters |
| `BETTER_AUTH_URL` | Required: `http://localhost:3000` | Required explicit HTTPS preview origin, with no path or trailing slash | Required canonical HTTPS production origin, with no path or trailing slash |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Optional additional local origins | Optional exact additional preview origins | Optional exact additional first-party HTTPS origins |
| `AUTH_TRUST_PROXY_HEADERS` | Empty/false | Leave empty on Vercel | Leave empty on Vercel |
| `GITHUB_CLIENT_ID` | Required development OAuth app | Required preview OAuth app | Required production OAuth app |
| `GITHUB_CLIENT_SECRET` | Required development secret | Required preview secret | Required production secret |
| `AUTH_REQUIRE_EMAIL_VERIFICATION` | Explicitly choose `true` or `false`; default is `true` | `true` (required) | `true` (required) |
| `EMAIL_PROVIDER_API_URL` | Optional; links log locally when omitted | HTTPS delivery endpoint when verification is on | HTTPS delivery endpoint |
| `EMAIL_PROVIDER_API_KEY` | Optional | Required with provider URL | Required and server-only |
| `EMAIL_FROM` | Optional | Required when verification is on | Verified production sender |

Do not prefix `DATABASE_URL`, `BETTER_AUTH_SECRET`, GitHub credentials, email
credentials, or trusted-origin configuration with `NEXT_PUBLIC_`.

## GitHub OAuth

Configure GitHub Developer Settings with these exact values:

```text
Development callback: http://localhost:3000/api/auth/callback/github
Production callback:  ${BETTER_AUTH_URL}/api/auth/callback/github
```

Replace `${BETTER_AUTH_URL}` with the actual canonical production origin; do
not enter the braces or variable name in GitHub. For example,
`BETTER_AUTH_URL=https://dayflow.example.com` produces
`https://dayflow.example.com/api/auth/callback/github`. The environment value
must contain no trailing slash or path. Use separate development/preview and
production OAuth apps when practical.

A GitHub OAuth App must authorize the `user:email` scope so Better Auth can read
verified private email addresses. If a GitHub App is used instead, grant the
account permission **Email addresses: Read-only**.

Better Auth may implicitly link GitHub only when the selected GitHub email is
verified and exactly equals the verified email on an existing Dayflow account.
GitHub must not appear in `account.accountLinking.trustedProviders`.
Different-email, missing-email, and unverified-email cases fail without custom
linking logic or a role change:

```text
GitHub identity
  -> GitHub-selected verified email
  -> exact verified Dayflow email match: link to the existing user
  -> no match: create a new user/onboarding identity with role=user
  -> verified database role
  -> /auth/callback
```

One limitation remains intentional: Better Auth selects GitHub's public,
primary, or first email. It does not search every verified secondary email for
a Dayflow account match. Supporting that policy requires a separately
reviewed provider `getUserInfo` implementation that considers verified emails
only and rejects missing or ambiguous matches.

## Database and migration contract

The Vercel `DATABASE_URL` branch cannot be inferred from repository files.
Before migration, use a read-only Neon role to confirm the project, branch,
database, migration ledger, table/column shape, row counts, identity
collisions, and orphan rows.

Better Auth 1.7.1 and Dayflow require:

- singular `user`, `session`, `account`, and `verification` tables;
- a server-owned `user.role` restricted to `admin`, `hr`, or `user`, with new
  identities defaulting to `user`;
- the checked-in compatibility columns `banned`, `ban_reason`, `ban_expires`,
  and `session.impersonated_by` until a reviewed cleanup migration removes them;
- non-null `account.issuer` and `account.account_id`;
- a unique `(account.issuer, account.account_id)` identity;
- the checked-in indexes and foreign keys.

Do not replay the complete history blindly. Migration
`20260822041208_public_rogue` drops plural legacy auth tables after creating
singular tables and can destroy populated legacy auth data.

Safe sequence:

1. Pause auth writes and create a verified Neon backup/branch.
2. Inspect `drizzle.__drizzle_migrations`, singular and plural auth tables,
   required columns/indexes/FKs, account collisions/orphans, and normalized
   employee identifiers using a read-only role.
3. If the database is empty, run `bun run db:migrate` on the rehearsal branch.
4. If its ledger is valid and only safe migrations are pending, rehearse those
   exact migrations in timestamp order.
5. If populated plural auth tables exist, or tables exist without a reliable
   ledger, stop. Write a reviewed forward-only copy/reconciliation migration;
   do not use `db:push` and do not mark history applied until equivalence is
   proven.
6. Add a reviewed forward-only migration/backfill before production. It must
   preserve existing users, sessions, and accounts; retain `admin`, `hr`, and
   `user`; map legacy employee/manager authentication roles to `user`; and
   preflight issuer/account collisions before tightening constraints. This
   migration is currently pending.
7. Verify non-null issuers, credential `account_id = user_id`, GitHub identity,
   the unique composite index, role values, foreign keys, counts, and every auth
   flow before applying the reviewed sequence to production.

Do not put migrations in the Vercel build command. Preserve users and sessions.

## Diagnostics and health

Production logs use fixed event codes and allowlisted metadata:

- `AUTH_CONFIGURATION_ERROR`
- `AUTH_DATABASE_ERROR`
- `AUTH_ORIGIN_ERROR`
- `AUTH_OAUTH_CALLBACK_ERROR`
- `AUTH_SESSION_ERROR`
- `AUTH_EMPLOYEE_LINK_ERROR`
- `AUTH_EMAIL_ERROR`

They do not serialize request bodies, headers, cookies, URLs, emails, tokens,
passwords, secrets, or database credentials.

`GET /api/health/auth` performs a read-only configuration, database, and auth-
schema probe. Its public response exposes only `ok/error` categories and uses
`Cache-Control: no-store`; it never returns configuration values. A 503 means
the deployment should not receive auth traffic. Better Auth's built-in
`/api/auth/ok` is only a handler liveness check and does not query PostgreSQL.

## Post-deployment verification

Use non-production test identities and inspect browser network/cookies on each
intended environment.

1. `GET /api/health/auth` returns 200 and `status: ok`.
2. `GET /api/auth/get-session` returns null without a session, then a valid
   user/session after authentication.
3. Email signup creates a `user`, sends verification, verifies, creates a
   session, passes through `/auth/callback`, and reaches `/dashboard`.
4. Credential sign-in returns a session cookie; the next protected request
   sends it and the server validates it.
5. GitHub initiation sends `redirect_uri=${BETTER_AUTH_URL}/api/auth/callback/github`
   after substituting the actual canonical origin.
6. The provider callback accepts a verified GitHub email, safely links an exact
   verified match or creates a new `user`/onboarding identity, sets the session
   cookie, and continues through `/auth/callback`.
7. A returning GitHub account resolves by `(issuer, account_id)` and does not
   create a duplicate user or employee link.
8. Both credential and GitHub login retain verified database roles and route
   Admin to `/admin`, HR to `/hr`, and User to `/dashboard`.
9. Sign-out invalidates the database session and expires/removes the cookie.
10. Forged, expired, and revoked cookies receive 401 from protected APIs.
11. Unauthenticated APIs return 401; a `user` requesting Admin or HR resources
    receives 403 without leaking protected data.

Build success alone does not prove OAuth token exchange, email delivery,
employee eligibility, cookie return, or production database identity.

## Primary references

- [Better Auth options and trusted origins](https://better-auth.com/docs/reference/options)
- [Better Auth GitHub provider](https://better-auth.com/docs/authentication/github)
- [GitHub OAuth App callback configuration](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
- [Vercel system environment variables](https://vercel.com/docs/environment-variables/system-environment-variables)
