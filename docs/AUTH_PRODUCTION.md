# Dayflow authentication production runbook

This runbook describes the audited Better Auth 1.7.1 deployment contract. It
does not authorize a migration against production and it does not replace a
successful browser test using an eligible employee identity.

## Audit conclusion

The documented production host currently reaches the one Better Auth handler,
generates an HTTPS GitHub callback on that same host, sets a host-only OAuth
state cookie with `Secure`, `HttpOnly`, `SameSite=Lax`, and `Path=/`, rejects
untrusted origins/callbacks, and reaches a database for credential sign-in.
Those observations rule out a universal handler, cookie-attribute, or origin-
check failure on that exact host. They do not prove token exchange, the Vercel
database branch/schema, employee eligibility, verification-email delivery, or
session creation for a real user.

The audit did confirm production defects that could explain environment-
specific failures:

- The old URL validation allowed an explicit production localhost URL or no
  canonical URL at all.
- A static callback host could differ from the preview/custom host that owned
  the host-only OAuth state cookie.
- Every `*.vercel.app` tenant was trusted by default.
- Forwarded headers were trusted outside a known proxy environment.
- GitHub was marked as an implicitly trusted account-linking provider.
- Employee emails were included in OAuth error query strings.
- Required production email delivery was not checked at startup.
- The Better Auth 1.7 repair command referenced a deleted script.
- Auth URL and routing regression tests had been deleted.

The implementation now fails closed on insecure production configuration,
uses Better Auth 1.7's dynamic base URL with an exact request-host allowlist,
keeps CSRF/origin validation enabled, and provides a safe database/schema
health probe.

## URL, origin, proxy, and cookie contract

`src/lib/auth/url.ts` is the only URL resolver. The canonical origin priority
is:

1. `BETTER_AUTH_URL`
2. `VERCEL_PROJECT_PRODUCTION_URL`
3. `VERCEL_URL`
4. `http://localhost:3000` only when `NODE_ENV` is not `production`

The value is reduced to an origin, so `/api/auth` and trailing slashes are not
retained. A production origin must be non-loopback HTTPS.

Better Auth resolves each request only after its host matches the same
validated allowlist. Exact Vercel production, branch, and deployment URLs are
added from Vercel's system variables. Additional custom aliases must be listed
in `BETTER_AUTH_TRUSTED_ORIGINS`. Unknown hosts throw; there is deliberately no
fallback that could hide a proxy/host error.

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

Rate limiting still uses process memory and is therefore instance-local on
Vercel. Move it to shared storage before treating it as a global brute-force
control.

## Vercel environment matrix

Vercel system environment variables must be enabled for the project. Values
changed in Vercel apply only to a new deployment, so redeploy afterward.

| Variable | Development | Preview | Production |
| --- | --- | --- | --- |
| `DATABASE_URL` | Disposable development Neon branch | Isolated preview/staging branch | Verified production Neon project and branch |
| `BETTER_AUTH_SECRET` | Development-only high-entropy value | Preview-only high-entropy value | Production-only value, at least 32 high-entropy characters |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Stable HTTPS branch/custom preview origin when OAuth is tested; otherwise Vercel system URLs resolve it | Canonical custom or Vercel production origin, with no path |
| `BETTER_AUTH_TRUSTED_ORIGINS` | `http://localhost:3000` | Exact stable preview/custom origins not already exposed by Vercel | Exact canonical and additional first-party aliases |
| `AUTH_TRUST_PROXY_HEADERS` | Empty/false | Leave empty on Vercel | Leave empty on Vercel |
| `GITHUB_CLIENT_ID` | Development OAuth app | Preview OAuth app or deliberately omitted | Production OAuth app |
| `GITHUB_CLIENT_SECRET` | Development secret | Preview secret or deliberately omitted | Production secret |
| `AUTH_REQUIRE_EMAIL_VERIFICATION` | Explicitly choose `true` or `false`; default is `true` | `true` (required) | `true` (required) |
| `EMAIL_PROVIDER_API_URL` | Optional; links log locally when omitted | HTTPS delivery endpoint when verification is on | HTTPS delivery endpoint |
| `EMAIL_PROVIDER_API_KEY` | Optional | Required with provider URL | Required and server-only |
| `EMAIL_FROM` | Optional | Required when verification is on | Verified production sender |

Do not prefix `DATABASE_URL`, `BETTER_AUTH_SECRET`, GitHub credentials, email
credentials, or trusted-origin configuration with `NEXT_PUBLIC_`.

## GitHub OAuth

For each host that must independently initiate OAuth, configure:

```text
Homepage URL:                https://<host>
Authorization callback URL: https://<host>/api/auth/callback/github
```

GitHub OAuth Apps currently support up to ten callback URLs. Register the exact
production URL, local URL, and only the bounded stable preview URLs that are
actually used. Avoid GitHub callback wildcard matching unless the organization
controls every matching host. Separate development/preview and production
OAuth apps are preferable for secret isolation and change safety.

Better Auth 1.7 requests `user:email` and fetches GitHub's email endpoint, so a
private primary email is normally recovered. If GitHub supplies no usable
email, the UI maps `email_not_found` to a verified-email-required message. The
employee rule is not bypassed:

```text
GitHub identity
  -> GitHub-selected verified email
  -> unlinked pre-existing employee with the same normalized email
  -> Better Auth user/account
  -> verified user links atomically to that employee
```

One limitation remains intentional: Better Auth selects GitHub's public,
primary, or first email. It does not search every verified secondary email for
a Dayflow employee match. Supporting that policy requires a separately
reviewed provider `getUserInfo` implementation that considers verified emails
only and rejects missing or ambiguous matches.

## Database and migration contract

The Vercel `DATABASE_URL` branch cannot be inferred from repository files.
Before migration, use a read-only Neon role to confirm the project, branch,
database, migration ledger, table/column shape, row counts, identity
collisions, and orphan rows.

Better Auth 1.7.1 with the Admin plugin and Dayflow requires:

- singular `user`, `session`, `account`, and `verification` tables;
- `user.role`, `banned`, `ban_reason`, `ban_expires`, and `employee_number`;
- `session.impersonated_by`;
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
6. For a Better Auth 1.6 singular `account` table, add a nullable `issuer`
   column on the backup branch if needed, then run the read-only preflight:

   ```bash
   bun run db:repair-auth
   ```

7. Review its sanitized target and aggregate collision/mismatch counts. Only
   after approval, write pause, and backup verification run:

   ```bash
   CONFIRM_AUTH_DB_REPAIR=1 bun run db:repair-auth
   ```

8. Verify non-null issuers, credential `account_id = user_id`, GitHub identity,
   the unique composite index, foreign keys, counts, and every auth flow before
   applying the reviewed sequence to production.

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

Use an eligible, non-production test employee identity and inspect the browser
network/cookies on each intended host.

1. `GET /api/health/auth` returns 200 and `status: ok`.
2. `GET /api/auth/get-session` returns null without a session, then a valid
   user/session after authentication.
3. Email signup validates the normalized employee ID/email, creates a user,
   sends verification, verifies, creates a session, and reaches `/dashboard`.
4. Credential sign-in returns a session cookie; the next protected request
   sends it and the server validates it.
5. GitHub initiation sends `redirect_uri=https://<same-host>/api/auth/callback/github`.
6. The callback uses a verified GitHub email, enforces employee eligibility,
   creates/links the account, sets the session cookie, and reaches the intended
   safe callback path.
7. A returning GitHub account resolves by `(issuer, account_id)` and does not
   create a duplicate user or employee link.
8. Sign-out invalidates the database session and expires/removes the cookie.
9. Forged, expired, and revoked cookies receive 401 from protected APIs.
10. Unlinked/disabled employees and wrong-role/cross-organization requests
    receive 403/404 without leaking protected data.

Build success alone does not prove OAuth token exchange, email delivery,
employee eligibility, cookie return, or production database identity.

## Primary references

- [Better Auth dynamic base URL](https://better-auth.com/docs/guides/dynamic-base-url)
- [Better Auth options and trusted origins](https://better-auth.com/docs/reference/options)
- [Better Auth GitHub provider](https://better-auth.com/docs/authentication/github)
- [GitHub OAuth App callback configuration](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
- [Vercel system environment variables](https://vercel.com/docs/environment-variables/system-environment-variables)
