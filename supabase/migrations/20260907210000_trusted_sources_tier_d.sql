-- Allow authority_tier 'D' on trusted_sources.
--
-- Why this file exists rather than an edit to 20260907090000:
--
-- That migration was merged on 2026-09-08 with check (authority_tier in
-- ('A','B','C')), and both dev and staging applied it that week. On 2026-09-12
-- commit 135947b edited the merged file in place to add 'D', and added tier-D
-- rows (Craigslist, Facebook Marketplace, Kijiji) to the seed in
-- 20260908090000.
--
-- Editing a merged migration changes the repository and nothing else. Both
-- databases had already recorded 20260907090000 as applied, so neither ever
-- saw the widened constraint. The result was a repo whose migrations described
-- a schema that existed nowhere: every environment still rejected 'D', while
-- the seed that ships alongside them inserts it. Replaying the seed on any
-- environment failed with
--
--   new row for relation "trusted_sources" violates check constraint
--   "trusted_sources_authority_tier_check"
--
-- This is the append-only correction engineering-foundations.md calls for.
--
-- On the timestamp: it is deliberately dated between 20260907090000 (which
-- creates trusted_sources) and 20260908090000 (which seeds tier-D rows into
-- it), rather than "now". `supabase db push` applies in filename order, so a
-- present-day timestamp would run this AFTER the seed -- and the seed is the
-- statement that fails without it. Environments that already recorded the two
-- neighbours need `--include-all` to insert this between them, which is the
-- expected and documented way to backfill a missed migration.
--
-- Tier D is the peer/marketplace tier: user-posted listings with no editorial
-- or regulatory oversight. Distinct from C (reputable secondary) because an
-- answer grounded in a Craigslist post is not grounded the way an answer
-- citing the LTB is, and the grading rubric needs to tell them apart.

alter table public.trusted_sources
  drop constraint if exists trusted_sources_authority_tier_check;

alter table public.trusted_sources
  add constraint trusted_sources_authority_tier_check
  check (authority_tier in ('A', 'B', 'C', 'D'));

comment on column public.trusted_sources.authority_tier is
  'A = rule-maker (LTB, IRCC, ontario.ca). B = official stats (CMHC, TPS). '
  'C = reputable secondary. D = peer/marketplace listings, no editorial or '
  'regulatory oversight. Matches the tiering in rubrics.md.';

