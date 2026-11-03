-- ai_answer_log: one row per real /ai/answer call, for per-user AI cost and
-- usage tracking.
--
-- Found while checking the MVP Launch Plan against the actual code: the plan
-- requires per-user, per-day AI cost as a real-time balance ("AI cost per
-- user per day - we need to know their remaining balance real time"), and the
-- whole batched-rollout model gives each user a fixed AI credit. But
-- run_ai_answer already computes real cost per call (estimate_cost) and only
-- ever puts it in the SSE response -- nothing persists it. There is currently
-- no way to answer "how much has this user spent" at all.
--
-- Separate table from eval_cost_log, deliberately: that one is DS-harness
-- test-run data tagged with DS-person labels like 'kavya_ds4', not real
-- auth.users. Mixing live user spend into it would make both harder to read
-- and query correctly. user_id here is a real auth.users id (matches
-- profiles.user_id), not a DS tag.

create table if not exists public.ai_answer_log (
  id                 uuid          primary key default gen_random_uuid(),
  run_id             uuid          not null,
  user_id            uuid          not null references auth.users(id) on delete cascade,
  category           text,
  subcategory        text,
  model              text          not null,
  input_tokens       integer,
  output_tokens      integer,
  estimated_cost_usd numeric(12, 6),
  latency_ms         integer,
  created_at         timestamptz   not null default now()
);

comment on table public.ai_answer_log is
  'Per-call cost/latency for real /ai/answer requests. Server-side only -- feeds per-user AI credit tracking (MVP Launch Plan).';

-- An index for the exact query the launch plan needs: this user's spend today.
create index if not exists ai_answer_log_user_created_idx
  on public.ai_answer_log (user_id, created_at);

-- Nothing in the browser should read another user's spend directly, and this
-- user's own spend is meant to be served as a computed balance (via the
-- backend, service_role), not raw log rows. Same posture as eval_cost_log.
alter table public.ai_answer_log enable row level security;

revoke all on public.ai_answer_log from anon, authenticated;

grant select, insert on public.ai_answer_log to service_role;

