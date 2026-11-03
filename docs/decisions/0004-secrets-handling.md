# 0004 — Secrets: env vars locally, Google Secret Manager for deployed environments

**Date:** 2026-08-30 · **Who:** Rahul Vaidhya (TL Full-stack) · **Status:** Accepted

## Context
The team standard is blunt: nothing sensitive in the repo, ever. The specific risks here
are model provider keys, which cost real money if leaked, and the Supabase service role
key, which bypasses row-level security entirely.

A second, quieter failure mode: eleven people each inventing their own variable names,
so `SUPABASE_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_ANON` all refer to
the same value and nobody's `.env` works on anyone else's machine.

## Decision
- `.env` is gitignored. `.env.example` is committed and lists every variable name with
  an empty value, so names are fixed by the repo rather than invented per person.
- Real values are distributed through the shared secrets note, not the repo.
- Deployed environments read secrets from **Google Secret Manager**, injected into Cloud
  Run at runtime. Vercel environment variables hold the frontend's public values.
- **Model provider keys are server-side only.** They are never present in `/web`, never
  in a `NEXT_PUBLIC_*` variable, and never reach the browser. All model calls go through
  the backend.
- `NEXT_PUBLIC_*` is the explicit marker for "this value reaches the browser." Anything
  without that prefix must never be referenced from client code.

## Consequences
- Adding a new configuration value is a two-step change: add it to `.env.example` in the
  same PR that uses it, or every other developer's environment silently breaks.
- The Supabase service role key exists only in backend environments. Frontend uses the
  anon key with RLS enforced.
- A leaked key is rotated in Secret Manager and redeployed; no repo history rewrite is
  needed, because the key was never committed.

