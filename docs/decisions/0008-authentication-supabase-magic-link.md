# 0007 — Authentication: Supabase Auth email magic link, verified server-side

**Date:** 2026-09-04 · **Who:** TL Full-stack · **Status:** Accepted

## Context
The website (Vercel) and the backend (Cloud Run) are separate deployments, so the backend
has no shared session with the browser and needs a way to know who is calling it. System
Design section 7 already fixed the shape: Supabase issues a signed token to the browser,
every request to `/api` carries it, and the backend asks Supabase whether it is valid.

Three things in the codebase contradicted that design and had to be fixed in the same
change, because auth is not meaningfully "on" while any of them stands:

1. `profiles` was created with row-level security **disabled**. (Fixed independently
   by Rahul in `20260831120000_profiles_rls.sql`, merged in PR #10 while this branch
   was in progress; this branch no longer carries its own RLS migration.) A `public` table with RLS
   off is fully readable and writable by anyone holding the anon key, and the anon key is
   public by design — it ships in the browser bundle. Section 15 of the design says the
   opposite: "every new table starts fully locked down until a rule explicitly opens it."
2. `AuthMiddleware` honoured an `x-test-user-id` header in **every** environment. One curl
   against staging was enough to become any user. (Also fixed independently by Rahul in
   the same PR; this branch keeps his gate and adds `/auth/me`, CORS ordering, and
   rejection of a present-but-unverifiable token.)
3. The frontend had no Supabase client. It read the `sb-<ref>-auth-token` localStorage key
   by hand — a supabase-js internal whose shape has changed between major versions — and
   `NEXT_PUBLIC_SUPABASE_URL` was never reaching the browser anyway (see below), so that
   function returned `null` on every call and no token was ever sent.

## Decision

**Magic link, not password.** Email address in, sign-in link out. No password storage, no
reset flow, no "forgot password" screen to build or support. Signing up and signing in are
the same action for the pilot (`shouldCreateUser: true`); closing the pilot to an invited
list is a one-line change.

**PKCE flow.** The link carries a short-lived code; the secret that redeems it stays in the
browser that asked for it. `detectSessionInUrl` is off and `/auth/callback` redeems the
code explicitly, so the redirect is deterministic rather than racing a background exchange.

**The browser holds the session; the backend verifies the token.** supabase-js keeps the
session in localStorage and refreshes it. `getAccessToken()` in `web/lib/supabase/client.ts`
is the only supported way to read it. `AuthMiddleware` calls `supabase.auth.get_user(token)`
per request. Local signature verification is deliberately deferred — Section 7 already
weighed this: roughly 100ms per request against several seconds of model latency, and it can
be switched later without changing anything else.

**RLS on `profiles`, per-user policies keyed on `auth.uid()`.** `/api` uses the service-role
key and therefore bypasses RLS; it enforces ownership itself. The policies constrain the
browser's direct PostgREST access with the anon key, which is a path we do not use but do
expose.

**Escape hatches are gated on `ENVIRONMENT=development`.** Both `x-test-user-id` and the
no-credentials `local-dev-user` fallback. `ENVIRONMENT` is read per request, not at import,
so tests and Cloud Run's runtime injection both behave.

**The root `.env` is loaded from `web/next.config.js`.** Next.js only reads `.env` files
from its own project directory. That is why the anon key never reached the browser. The
alternative — a second `web/.env` — would give two files that must agree on names, which is
exactly the failure ADR 0004 exists to prevent.

## Consequences

- **A magic link only works in the browser that requested it.** PKCE stores the code
  verifier in that browser's localStorage. Request on desktop, open on phone, and it fails —
  `/auth/callback` detects this specific error and says so rather than showing a raw
  library message. If pilot users hit this often, switching `flowType` to `implicit` fixes
  it at the cost of putting tokens in the URL fragment. Revisit with real usage data, not
  in advance.
- **Supabase's built-in email service is rate-limited and is not a production sender.**
  Fine for the team and the demo; a custom SMTP provider is required before real pilot
  users, and that is not in this change.
- **Every deployed origin must be added to the Supabase redirect allow-list** — including
  Vercel preview URLs, which change per PR. A missing entry fails at the redirect with
  `error_description`, not at send time, so it looks like a broken link.
- **`web/` now has runtime dependencies.** `pnpm-lock.yaml` changed; CI's
  `--frozen-lockfile` will fail on any branch that adds a package without committing it.
- Sessions live in `localStorage`, so they do not survive a different browser or a cleared
  site data, and they are not readable by a server component. Both are acceptable: the app
  is client-rendered and the backend is a separate service that only ever sees the token.

## Addendum, same day — table grants, not RLS, are the first gate

Verifying the RLS migration against dev turned up something the migration alone did not
cover. On this project a table created by a migration (owner `postgres`) receives no DML
grant for `anon`, `authenticated`, or `service_role` — only `REFERENCES`, `TRIGGER`, and
`TRUNCATE`. Two consequences:

- **PostgREST fails at the privilege check with 42501 before RLS is consulted.** The
  policies added in `20260831120000` are correct but currently dormant. They are kept:
  they are the right rule the moment any role is granted access.
- **`service_role` was caught by the same gap, and that is a blocking bug.** `/api`
  connects as `service_role`, which bypasses RLS but not table grants. Every `/profile`
  read and write would have failed. `20260904140000_profiles_grants.sql` grants it
  exactly `SELECT, INSERT, UPDATE`.

`TRUNCATE` was also revoked from `anon` and `authenticated`. RLS does not apply to
`TRUNCATE`, so those policies would offer no protection against a future
`SECURITY INVOKER` function reachable at `/rest/v1/rpc`.

Two things follow that are worth stating plainly:

- **`service_role` bypasses RLS, so ownership is enforced only by application code.**
  `profile.py` scopes every query with `.eq("user_id", user_id)`. A future query that
  forgets that filter returns every user's data with nothing at the database layer to stop
  it. This is inherent to the "browser → FastAPI → Postgres as service_role" shape the
  design already chose; it is not introduced here. It does mean the `.eq` filter is a
  security control and should be reviewed as one.
- **This will recur on every new table.** Nothing about it is specific to `profiles`.

## `@supabase/supabase-js` is pinned exactly, not with a caret

`2.112.4`, while every other dependency in `/web` uses a caret range. The first lockfile
for this branch was generated in an environment with no supply-chain policy and resolved to
`2.115.0`, published twelve hours earlier. `pnpm install` then failed on a developer machine
with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` — a personal `minimumReleaseAge` setting
refusing to install anything younger than a day.

The policy is right and was not relaxed. A compromised npm account is typically caught
within a day or two, so the first days after publish are exactly the window worth avoiding
— and auth is not where to be first on a release. `2.112.4` was eleven days old when
chosen, so it satisfies a 24-hour policy and a 7-day one.

Exact rather than caret because the lockfile is what CI installs from: an exact spec means
anyone regenerating the lockfile cannot silently land on a same-day release again. Bumping
it is then a deliberate, reviewable line in a PR.

## Not decided here
- **A repo-wide `minimumReleaseAge` in `pnpm-workspace.yaml`**, so this guard is a property
  of the project rather than of whichever machine happens to have it configured. Attempted
  while fixing the above and backed out: at 7 days, resolution fails on unrelated transitive
  packages whose newest release is itself only days old (`@rollup/rollup-darwin-arm64`).
  Making it work needs a tuned window and probably a `minimumReleaseAgeExclude` list,
  which is its own change with its own testing — not a rider on an auth PR.
- **Whether to set `ALTER DEFAULT PRIVILEGES` schema-wide** so new tables grant
  `service_role` its DML automatically. It would stop each new table needing a paired
  grants migration, but it would also apply to tables that should stay closed. This
  affects every table the team adds and belongs to the TLs alongside ADR 0002, not to a
  single feature branch.
- Custom SMTP provider and email templates.
- Whether `/ai/answer` needs any authorisation beyond "is a valid user" once categories land.
- Local JWT signature verification (see Section 7 — explicitly deferred, both TLs agreed).

