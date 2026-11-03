# Engineering Foundations — Moving Assistant

**Owner:** Rahul Vaidhya (TL Full-stack: environment, CI, deployment)
**Date:** 2026-08-30 · **Version:** v0.1 · **Scope:** the 8-week bootcamp build

This is the platform contract for the pilot: how code moves from a laptop to a demo, and
what each of us can rely on without asking. Decisions with real trade-offs are recorded
separately in `/docs/decisions/`; this document is the map.

Sections marked **(Backend/DS lead)** are owned by Wissem and are framed here only to
show where they attach to the platform.

---

## 1. System architecture v0.1

Five layers, per the PRD:

| Layer | Stack | Responsibility |
|---|---|---|
| Client | Next.js + TypeScript (Vercel) | Onboarding, 10 category pages, checklist, scoped AI panel |
| Application | FastAPI + REST (Cloud Run) | Profile & session, personalisation rules, caching, rate limits |
| AI services | Provider SDKs behind one internal interface | Route · generate · verify · decide. Eval harness in CI |
| Data | Supabase Postgres + pgvector + PostGIS | Claim store, source registry, open datasets, profiles, memory |
| Ingestion | pg_cron (Supabase) | Fetch ~40 sources, parse, normalise, content-hash diff, flag changes |

Two boundaries matter more than the rest:

**The browser never talks to a model provider.** Every model call goes through the
backend. Provider keys are server-side only. This is not a style preference — it is what
keeps the spend cap enforceable and the keys unleakable.

**The browser never talks to Postgres for anything the backend owns.** The frontend uses
the Supabase anon key under RLS for auth and its own reads; profile writes, AI calls and
claim reads go through `/api`.

Synchronous: onboarding, profile, category content, AI request/response.
Asynchronous: scheduled ingestion, content-hash diffing, evaluation runs.

## 2. Chosen stack and why

The full table with owners lives in the ClickUp *Tech Stacks* doc. The reasoning behind
the choices I own:

- **Next.js + TypeScript** — 10 content-heavy category pages that must hit p95 < 1.0s.
  Server rendering makes that reachable; types matter most at the API boundary, which is
  still moving weekly.
- **FastAPI + Python** — the DS half of the team works in Python. One language across
  backend and evaluation means the eval harness calls the same model interface the
  product calls, rather than a reimplementation of it.
- **Supabase Postgres** — one managed service covers Postgres, pgvector, PostGIS, auth,
  storage and a job scheduler. Fewer moving parts than assembling those separately, and
  no infrastructure work competing with feature work in an 8-week build.
- **pnpm / uv** — both are lockfile-strict and fast in CI.
- **Tailwind** — three people touch the frontend; utility classes avoid the CSS
  ownership disputes that a shared stylesheet invites.

## 3. Repo structure

```
/web              Next.js + TypeScript frontend (pnpm)
/api              FastAPI backend (uv)
/eval             DS notebooks, prompt files, gold datasets
/supabase         config.toml + migrations/
/docs/decisions   one markdown file per significant decision
/.github/workflows
.env.example      every variable name, no values
```

Monorepo, independent dependency manifests per directory — see
[ADR 0001](decisions/0001-repo-shape.md).

## 4. Environment map: local / dev / staging

| | Frontend | Backend | Database |
|---|---|---|---|
| **local** | `pnpm dev` (:3000) | `uv run uvicorn` (:8000) | Supabase **dev** |
| **dev** | Vercel preview, per PR | Cloud Run (dev) | Supabase **dev** |
| **staging** | Vercel production | Cloud Run (staging) | Supabase **staging** |

Local development points at the **dev** Supabase project — there is no local Postgres in
the normal loop. Docker and the Supabase CLI are needed only by people changing schema.

Staging is the demo environment. It has its own database so a bad migration in dev cannot
take down a demo. See [ADR 0003](decisions/0003-environments-and-deployment.md).

## 5. Supabase ownership and config

Two projects: **dev** and **staging**. Both have `pgvector` and `postgis` enabled, via
migration rather than the dashboard.

- Project owners: Rahul and Wissem. Ask either for access.
- Everyone else works from URL + anon key + service role key in the shared secrets note.
- `supabase/config.toml` is committed. Local ports: API 54321, DB 54322.
- **Proposed (not yet ratified): RLS on for every table, no exceptions.** A table shipped
  without a policy is readable by anyone holding the anon key, which is every browser
  session. Flagging this as a proposal because PRD §8.4 (Privacy and PII) currently
  contains a single line — "security and privacy review (e.g. resume, etc)" — so there is
  no agreed privacy rule for me to point at. Needs Jia's sign-off.
- The free tier has no backups. The repo is the recovery path — see §7.

## 6. API conventions **(Backend/DS lead)**

Wissem owns the minimal API contracts (profile, category content, AI request/response,
public-data endpoints) and the AI service interface. The platform-level constraints those
contracts sit inside:

- REST over JSON. Base path `/api/v1`. The version segment exists so a contract change
  does not have to be simultaneous across frontend and backend.
- `GET /health` returns `{"status": "ok"}` and is what Cloud Run's health check hits.
- All model access is behind **one swappable interface**, so providers change without
  product code changing — the same abstraction DS #1–4 evaluate against.
- Frontend calls the backend through one configured base URL (`API_BASE_URL`), never a
  hardcoded host. This is what lets a Vercel preview point at the dev backend.

## 7. DB migration process

Supabase CLI migrations in `supabase/migrations/` are the **only** source of schema
truth — no dashboard schema edits, ever. Authored content (category content, gold
questions, clarification policies, seed data) also loads via migration, because the
database must be reproducible from `main` at any moment.

Flow is one-directional: **local → dev → staging.**

```bash
# author
supabase migration new <name>          # creates a timestamped .sql file
supabase db reset                      # rebuild local from scratch, verify it applies

# after merge to main
supabase link --project-ref <dev-ref>     && supabase db push
supabase link --project-ref <staging-ref> && supabase db push
```

Migrations are append-only once merged. A mistake is corrected by a new migration, never
by editing a merged one — other environments have already applied it.
See [ADR 0002](decisions/0002-migrations-and-schema-source-of-truth.md).

> **Status:** `20260830120000_enable_extensions.sql` is the first migration. The
> reproduce-from-scratch run (`supabase db reset`) has **not yet been executed** — it
> needs the Supabase CLI and Docker, which are not installed on my machine yet. This is
> the open item on my week-1 list, not a claim already met.

## 8. Logging and error conventions **(Backend/DS lead)**

Yoseph owns logging and error conventions as part of the core API structure. Platform
requirements they need to satisfy:

- **Structured JSON logs to stdout.** Cloud Run captures stdout; a log line that is not
  JSON is a log line that cannot be filtered when a demo breaks.
- **Never log secrets, resume content, or user free text.** This now extends to raw
  conversation turns too — per [ADR 0006](decisions/0006-data-retention-and-pii.md), only a
  derived preference/context summary is persisted, never the message-by-message history.
- Every model call logs: model, provider, prompt version, latency, input tokens, output
  tokens, estimated cost, and outcome. These are the Tier 1 metrics — if they are not
  logged from the first call, the baseline cannot be reconstructed later.
- Errors return a stable machine-readable code plus a human message. The frontend
  renders the message; it never parses the prose.

## 9. Secrets handling

`.env` is gitignored; `.env.example` is committed with every variable name and no values,
so nobody invents their own names. Real values come from the shared secrets note.

Deployed environments read from **Google Secret Manager**, injected into Cloud Run at
runtime. Vercel environment variables hold the frontend's public values.

`NEXT_PUBLIC_*` is the explicit marker for "this reaches the browser." Model provider
keys and the Supabase service role key never carry it and never appear in `/web`.

Adding a config value means adding it to `.env.example` in the same PR, or everyone
else's environment silently breaks. See [ADR 0004](decisions/0004-secrets-handling.md).

## 10. Deployment flow

**Continuous delivery, not continuous deployment.** Merges to `main` reach staging
automatically; production is a human decision.

```
PR opened   → CI (lint, typecheck) + Vercel preview deploy
merge main  → staging: Vercel production + Cloud Run staging revision
            → migrations pushed to staging
production  → manual promotion, not automatic
```

CI gates lint and typecheck only this week — deliberately, so failures are always
actionable while there is barely any code to test. Vitest is installed and configured but
not yet gated. See [ADR 0005](decisions/0005-ci-scope-week-1.md).

Definition of done, team-wide: merged to `main` · runs in the dev environment · has a
one-line note in the weekly update · does not break CI.

Every PR needs one reviewer, within 24 hours. TL Backend/DS reviews backend and DS;
TL Full-stack reviews frontend and platform.

## 11. Unresolved architecture questions

| # | Question | Blocks | Needs |
|---|---|---|---|
| 1 | Who owns GCP billing? | Cloud Run **and** Secret Manager — §4, §9, §10 all assume them | Jia owns billing generally; confirming with her (2026-08-30) whether a billing account is attached to *this* GCP project specifically — that's the actual blocker, not who pays personally |
| 2 | Branch naming convention | Nothing yet, but it hardens the moment people start branching | Team call — **not decided, and I am not deciding it unilaterally** |
| 3 | Where does the AI service interface live — a module inside `/api`, or its own service? | Deployment topology, cost attribution | Wissem + me |
| 4 | Per-person API cost attribution | Jia has said this gates engineers getting model keys | Jia + Wissem; nothing to attribute against until the interface exists |
| 5 | Claim store: what is a structured table vs a future vector/search system? | Yoseph's schema draft | Wissem + Yoseph (already on their list) |
| 6 | ~~DS #5 (crime data) ownership~~ | Housing → "Check The Place" | **Resolved** — Jia reassigned DS #5's work to DS #3 (João Diniz) this week |
| 7 | Does staging get its own Vercel project, or is it the production deployment of one project? | Preview/staging URL separation | Me, once billing unblocks |
| 8 | Conversation memory (pgvector) — who owns the schema? | Unassigned in the week-1 sheet | **In discussion** (started by Jia, 2026-08-30) — retention policy resolved (no raw history, derived summary only), capture mechanism still open. See [ADR 0006](decisions/0006-data-retention-and-pii.md) |
| 9 | Authored content is organised as *Stage 1/2/3*; the product is organised as 10 categories. Which shape does the database store, and who reconciles them? | Content migration schema — ADR 0002 requires authored content to load via migration | Jia + PMs |
| 10 | ~~PRD §8.1 is stale (says Node, omits PostGIS)~~ | Anyone reading the PRD as current | **Deprioritized** — Jia: PRD updates are hard to keep in sync given pace of change; team refers to the System Design and Tech Stacks docs as current going forward instead of fixing the PRD |
| 11 | ~~PRD §5 said uploads aren't stored but shipped resume storage~~ | Object storage config, privacy review, UI copy | **Resolved by Jia, 2026-08-30** — resumes stored, nothing else persisted or logged. See [ADR 0006](decisions/0006-data-retention-and-pii.md) |
| 12 | Tier 0 #7 requires *100% of displayed URLs resolve*. ~150 curated links exist and at least one is already broken. | A Tier 0 release gate | **Approved** by Jia — owner TBD via weekly task assignment. I'll build the CI link-check job once someone owns the content side |
| 13 | PRD §5 lists *"evaluation harness running in CI against the gold set"* as a platform feature. DS #4 builds the harness; wiring it into CI is mine, but it is on no one's week-1 list. | Nothing yet — flagging before it falls through | Me + Kavya, week 2 |

> Items 1 and 6 are the two I would raise first. Item 1 blocks three sections of this
> document. Item 6 is a product gap, not a platform one: Housing is the category with a
> demo attached, and "Check The Place" depends on the crime-data slice.

