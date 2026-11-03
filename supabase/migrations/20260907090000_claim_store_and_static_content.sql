-- Claim store + static content sections.
--
-- Two separate tables sharing one trusted_sources table, because they serve
-- two different consumers with different rules:
--
--   claim_store    -> fed to the AI Gateway's "retrieving" stage (runner.py),
--                     so the model answers from a short, human-verified fact
--                     instead of guessing from memory (this is the fix for
--                     the Bill 60 / N1-N2 class of errors).
--
--   static_content -> fed to the frontend's static content cache (Vu's work),
--                     rendered directly in the app (e.g. the Housing
--                     marketplaces/tips page). Real prose, not a single claim.
--
-- Per Jia's call (avoid the copyright/freshness burden of storing scraped
-- page content): claim_store holds short, team-written/paraphrased facts,
-- never a copy of the source page. static_content is written/curated by the
-- team directly (e.g. from the ClickUp housing content doc), not scraped.
--
-- Follows the ADR 0010 pattern: RLS enabled, service_role gets exactly the
-- DML it needs, anon/authenticated get nothing (browser reaches Postgres
-- only through /api, per ADR 0004).

-- ---------------------------------------------------------------------------
-- Shared source registry
-- ---------------------------------------------------------------------------
create table public.trusted_sources (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,                 -- e.g. "Ontario LTB"
  url           text not null,
  authority_tier text not null check (authority_tier in ('A', 'B', 'C', 'D')),
  -- A = rule-maker (LTB, IRCC, ontario.ca) · B = official stats (CMHC, TPS)
  -- · C = reputable secondary (matches rubrics.md's tiering, so grading and
  -- grounding use the same scale).
  jurisdiction  text not null default 'Ontario',
  notes         text,
  created_at    timestamptz not null default now()
);

comment on table public.trusted_sources is
  'Registry of sources both claim_store and static_content point back to. '
  'One place to update a source''s tier/URL instead of two.';

-- ---------------------------------------------------------------------------
-- claim_store: short, verified facts the AI Gateway grounds answers in
-- ---------------------------------------------------------------------------
create table public.claim_store (
  id              uuid primary key default gen_random_uuid(),
  category        text not null,               -- e.g. 'Housing'
  subcategory     text not null,                -- e.g. 'Check The Place'
  claim_value     text not null,
  -- Short, team-written/paraphrased fact — e.g. "The 2026 Ontario rent
  -- increase guideline is 2.1%." Never a copy of the source page's wording.
  source_id       uuid not null references public.trusted_sources(id),
  effective_date  date,
  -- When this fact took/takes effect. Null only for genuinely timeless facts
  -- (e.g. "SIN is not legally required to open a basic bank account").
  retrieved_at    timestamptz not null default now(),
  -- When a human last confirmed this against the source. Distinct from
  -- effective_date: a fact can be effective today but not re-checked in
  -- months, which is exactly the staleness this column exists to surface.
  content_hash    text,
  -- Optional hash of the source page at retrieval time, so a future
  -- re-check can detect "the source page changed" without a human having
  -- to re-read it from scratch.
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index claim_store_category_idx on public.claim_store (category, subcategory);

comment on table public.claim_store is
  'Short, human-verified facts fed to the AI Gateway before it answers, so '
  'it grounds claims in a checked fact instead of guessing from memory. '
  'This is the retrieval fix discussed for the Bill 60 / N1-N2 error class.';

-- ---------------------------------------------------------------------------
-- static_content: real prose sections rendered directly in the app
-- ---------------------------------------------------------------------------
create table public.static_content (
  id              uuid primary key default gen_random_uuid(),
  category        text not null,
  subcategory     text not null,
  section_key     text not null,
  -- Stable slug for a specific block, e.g. 'rental-marketplaces',
  -- 'avoiding-scams'. What the frontend cache keys off of.
  title           text not null,
  body_markdown   text not null,
  source_id       uuid references public.trusted_sources(id),
  -- Nullable: some sections (e.g. general tips) aren't tied to one source.
  display_order   integer not null default 0,
  updated_at      timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique (category, subcategory, section_key)
);

create index static_content_category_idx on public.static_content (category, subcategory);

comment on table public.static_content is
  'Real prose content sections rendered in the app (e.g. the Housing '
  'marketplaces/tips page). Curated/written by the team, not scraped. '
  'Feeds the frontend static-content cache.';

-- ---------------------------------------------------------------------------
-- RLS + grants, per ADR 0010: browser roles get nothing, service_role gets
-- exactly the DML it uses. All three tables pass the db-guard CI check.
-- ---------------------------------------------------------------------------
alter table public.trusted_sources enable row level security;
alter table public.claim_store enable row level security;
alter table public.static_content enable row level security;

grant select, insert, update on public.trusted_sources to service_role;
grant select, insert, update on public.claim_store to service_role;
grant select, insert, update on public.static_content to service_role;

-- No policies for anon/authenticated: this data reaches the browser only
-- through /api (static content) or is never browser-visible at all (claim
-- store, used server-side by the Gateway). No policies + RLS on = fully
-- closed to PostgREST, matching profiles' pattern in 20260831120000.

