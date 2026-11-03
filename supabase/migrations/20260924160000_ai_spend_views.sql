-- AI spend for real users, read from ai_answer_log. Backs the $1 per-user cap
-- (MVP Launch Plan) and the "AI cost" metrics in PRD 6.2: total per day, per
-- user per day, and each user's remaining balance.
--
-- The cap has to be counted here rather than in the API's in-memory rate
-- limiter: that one resets on every deploy and cold start, and each Cloud Run
-- instance keeps its own count.
--
-- Days are Toronto days, since that is where the pilot users are. The eval
-- views use UTC, so the two will not line up day for day.
--
-- security_invoker makes each view run with the caller's privileges, so the
-- RLS and grants on ai_answer_log still apply. Without it a view runs as its
-- owner and would expose every user's spend to anyone who can select it.

create or replace view public.ai_spend_by_user_day
with (security_invoker = true) as
select
  user_id,
  (created_at at time zone 'America/Toronto')::date as day,
  count(*) as answers,
  count(*) filter (where estimated_cost_usd is null) as answers_missing_cost,
  coalesce(sum(estimated_cost_usd), 0) as spend_usd
from public.ai_answer_log
group by 1, 2;

create or replace view public.ai_spend_by_day
with (security_invoker = true) as
select
  (created_at at time zone 'America/Toronto')::date as day,
  count(distinct user_id) as users,
  count(*) as answers,
  count(*) filter (where estimated_cost_usd is null) as answers_missing_cost,
  coalesce(sum(estimated_cost_usd), 0) as spend_usd
from public.ai_answer_log
group by 1;

-- What the cap checks: all-time spend per user. Web search cost is not in
-- estimated_cost_usd yet, so this undercounts real spend until it is.
create or replace view public.ai_spend_by_user
with (security_invoker = true) as
select
  user_id,
  count(*) as answers,
  coalesce(sum(estimated_cost_usd), 0) as spend_usd,
  max(created_at) as last_answer_at
from public.ai_answer_log
group by 1;

revoke all on public.ai_spend_by_user_day, public.ai_spend_by_day, public.ai_spend_by_user
  from anon, authenticated;
grant select on public.ai_spend_by_user_day, public.ai_spend_by_day, public.ai_spend_by_user
  to service_role;

