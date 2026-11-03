# 0010 — Browser roles get no destructive privileges, enforced in CI

**Date:** 2026-09-05 · **Who:** Rahul Vaidhya (Platform lead) · **Status:** Accepted

## Context
Reviewing PR #16, Jia raised that `public.profiles` had privilege problems and
asked whether schema-wide `ALTER DEFAULT PRIVILEGES` was the right systemic
answer, or whether every new table should carry a paired grants migration.

Measured on a clean database (`supabase db reset`, `main` @ `2297dbd`):

```
pg_default_acl, schema public, granted by postgres and supabase_admin:
  anon=arwdDxtm   authenticated=arwdDxtm   service_role=arwdDxtm
             ^^ D = TRUNCATE

public.profiles inherited exactly that:
  anon: select=t  insert=t  update=t  delete=t  TRUNCATE=t
```

Two findings, and they point in opposite directions.

**`service_role` is not missing grants.** On a clean rebuild it has SELECT,
INSERT and UPDATE, so `/profile` does not fail with 42501 there. The failure Jia
observed on hosted dev is real but I could not reproduce it locally, and dev was
already patched by the time I checked, so its "before" state is no longer
observable. Recorded as unresolved rather than settled — see below.

**`anon` and `authenticated` hold TRUNCATE, and that is a genuine hole.** RLS
does not apply to TRUNCATE at all. The row policies added in
`20260831120000_profiles_rls.sql` correctly gate select/insert/update, and
DELETE is denied only because no delete policy exists — but TRUNCATE bypasses
the mechanism entirely. Anyone holding the anon key, which is every browser
session, could empty a table through any `SECURITY INVOKER` function exposed at
`/rest/v1/rpc`.

This is not a property of `profiles`. It is the default for every table created
in `public`, so every table anyone adds lands the same way.

## Decision

**1. Browser roles get no destructive privileges.** `TRUNCATE`, `DELETE`,
`REFERENCES` and `TRIGGER` are revoked from `anon` and `authenticated` — on the
tables that exist, and via `ALTER DEFAULT PRIVILEGES` for the ones that don't
yet. `service_role` is untouched; the backend connects as it and it never
reaches the browser (ADR 0004).

DELETE is included even though RLS blocks it today, because that protection
lasts exactly until someone adds a permissive delete policy. Not holding the
grant survives that.

**2. Neither of Jia's two options on their own.** Schema-wide default privileges
alone are not enough — they cannot fix tables created by a role whose defaults
we cannot alter, and `ALTER DEFAULT PRIVILEGES` silently does nothing when the
creating role differs from the one named. Per-table grants migrations alone are
not enough either, because they depend on every future author remembering.

**3. CI enforces it, which is the part that actually holds.**
`scripts/check_db_privileges.py` runs in the `db-guard` job against a database
rebuilt from migrations, and fails the build if any table in `public` grants
TRUNCATE or DELETE to a browser role, or has RLS disabled. It also warns when
`service_role` is missing DML the backend needs.

## Consequences
- A new table with unsafe privileges cannot reach `main`. The check does not
  rely on anyone remembering the rule.
- The same job rebuilds the schema from scratch on every PR, so it doubles as
  the continuous version of "prove the schema is reproducible from `main`"
  (ADR 0002) — previously a one-off manual check that had never been run.
- CI gets slower: `supabase start` pulls containers and adds roughly 2–3 minutes.
  Worth it for a database with no backups.
- Granting a browser role DELETE on a table now requires deliberately editing
  the guard's expectations, which is the intended friction.

## Unresolved
Whether hosted Supabase creates migration tables under a role whose default
privileges differ from local — which would explain Jia's `service_role` 42501
and mean local and hosted diverge. Worth confirming against staging before
trusting local results as representative. The guard's `service_role` warning
will surface it either way.

