-- eval_cost_log: one row per model call made by the evaluation harness.
--
-- This table already exists on the hosted dev project -- it was created by hand
-- when eval/harness/eval_harness_final.py started writing to it (01505a9) -- but
-- it is in no migration. Under ADR 0002 that means it does not exist: a
-- `supabase db reset`, a rebuild after data loss, or the first push to staging
-- would all produce a database without it, and the harness's Supabase write
-- would fail (it only warns, so the cost data would silently stop accumulating).
--
-- `if not exists` is deliberate. On dev the table is already there, and a plain
-- `create table` would make `supabase db push` to dev fail outright. The cost of
-- that choice: on dev this statement is a no-op, so if dev's hand-made columns
-- differ from these, dev and staging drift.
--
-- Kavya compared this against dev's actual columns. Two differences found:
--   - id: dev has uuid default gen_random_uuid(), this had bigint identity.
--     Nothing in the codebase reads eval_cost_log.id, so there's no functional
--     reason to force dev's rows onto a new type -- this migration now matches
--     dev instead.
--   - latency_ms: dev has it nullable. This migration keeps it NOT NULL, since
--     eval_harness_final.py always computes and sends it, even on the error
--     path -- dev's column is just looser than what the harness actually does.
--     Kavya is writing a follow-up migration to tighten dev to match, after
--     confirming dev has no existing null rows.
--
-- Columns are exactly the keys save_to_supabase() inserts. Token counts and
-- cost are nullable because the harness logs failed calls too, with no usage.
-- user_id is the DS person tag (e.g. 'kavya_ds4') used for per-person cost
-- attribution, not an auth.users id.

create table if not exists public.eval_cost_log (
  id                        uuid          primary key default gen_random_uuid(),
  run_id                    uuid          not null,
  user_id                   text          not null,
  provider                  text          not null,
  model                     text          not null,
  category                  text,
  subcategory               text,
  experiment                text,
  input_tokens              integer,
  output_tokens             integer,
  estimated_cost_usd        numeric(12, 6),
  estimated_search_cost_usd numeric(12, 6),
  latency_ms                integer       not null,
  "timestamp"               timestamptz   not null default now()
);

comment on table public.eval_cost_log is
  'Per-call cost/latency log written by the eval harness (DS #4). Server-side only.';

-- Everything below is idempotent, so it also hardens the existing dev table.

-- Nothing in the browser reads evaluation spend. RLS on with no policies means
-- no PostgREST access for browser roles, which is the intent.
alter table public.eval_cost_log enable row level security;

-- The default privileges from 20260905090000 already strip TRUNCATE/DELETE from
-- browser roles on tables created by `postgres`. The dev table was made by hand,
-- possibly by a role whose defaults that migration could not change, so it may
-- still hold the full set. Revoke everything; they need none of it.
revoke all on public.eval_cost_log from anon, authenticated;

-- On a fresh build service_role already holds full DML through Supabase's default
-- privileges. The explicit grant is for the hand-made dev table, where hosted
-- defaults may differ (ADR 0010, Unresolved). The harness writes and cost
-- aggregation reads, both as service_role.
grant select, insert on public.eval_cost_log to service_role;

