# 0002 — Supabase CLI migrations are the only source of schema truth

**Date:** 2026-08-30 · **Who:** Rahul Vaidhya (TL Full-stack) · **Status:** Accepted

## Context
The Supabase free tier has no backups. If a database is lost or corrupted, the only
way back is to rebuild it. That makes reproducibility a correctness requirement, not a
convenience: the schema must be rebuildable from `main` at any moment.

Supabase offers a dashboard SQL editor, which is the path of least resistance and the
main risk here. A table created by hand in the dashboard exists in dev and nowhere
else — not in staging, not in the repo, and not in anyone else's environment.

## Decision
Supabase CLI migrations in `supabase/migrations/` are the single source of schema
truth. Every schema change — tables, indexes, extensions, RLS policies, and seeded
authored content — ships as a timestamped migration file in the repo.

No schema change is made through the Supabase dashboard. Extension enablement is
included: `20260830120000_enable_extensions.sql` turns on pgvector and postgis, rather
than someone toggling them in the UI.

Migrations flow in one direction: **local → dev → staging**. A migration is written and
applied locally, merged to `main`, then pushed to dev, then to staging.

## Consequences
- Any developer can rebuild the whole database from a clean state with `supabase db reset`.
- Authored content (category content, gold questions, clarification policies, seed data)
  must be expressible as SQL and loaded via migration. This is a constraint on how PMs
  and DS hand content over — it cannot arrive as a spreadsheet pasted into the dashboard.
- Migrations are append-only once merged. A mistake is corrected by a new migration, not
  by editing a merged one, because other environments have already applied it.
- Someone changing schema needs the Supabase CLI and Docker installed locally. This is a
  real setup cost, documented in the README prerequisites.

