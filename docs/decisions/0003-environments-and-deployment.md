# 0003 — Three environments; split hosting (Vercel + Cloud Run)

**Date:** 2026-08-30 · **Who:** Rahul Vaidhya (TL Full-stack) · **Status:** Accepted

## Context
The team is distributed across five time zones and a demo can be called at short notice.
Testing on a laptop is not a shared truth, and pointing everyone at one database means
one person's migration experiment breaks another person's afternoon.

The frontend is Next.js; the backend is Python. No single host is the obvious best fit
for both.

## Decision
Three environments, two Supabase projects:

| Environment | Frontend | Backend | Database |
|---|---|---|---|
| local | `pnpm dev` | `uv run uvicorn` | Supabase **dev** project |
| dev | Vercel preview (per PR) | Cloud Run (dev service) | Supabase **dev** project |
| staging | Vercel production | Cloud Run (staging service) | Supabase **staging** project |

Vercel hosts `/web` because it is the reference host for Next.js — preview deployments
per pull request come free, which is what makes frontend review possible for reviewers
in other time zones. Cloud Run hosts `/api` because it runs a container, scales to zero
between demos, and keeps cost near zero at pilot traffic.

**Continuous delivery, not continuous deployment.** Merges to `main` deploy to staging
automatically. There is no automatic path to production; a human promotes.

## Consequences
- Two hosting providers means two dashboards, two sets of credentials, and two failure
  modes to understand. Accepted in exchange for each half running on its native platform.
- A PR gets a working frontend URL a reviewer can click. It points at the dev backend and
  dev database, so preview data is disposable.
- Staging is the demo environment. Its database is a separate Supabase project, so a
  destructive migration in dev cannot take down a demo.
- Cloud Run scale-to-zero means a cold first request after idle. Acceptable for pilot;
  revisit if it shows up in the p95 latency target.
- **Open:** Cloud Run requires a billing account on the GCP project. Blocked until Jia
  confirms the billing owner.

