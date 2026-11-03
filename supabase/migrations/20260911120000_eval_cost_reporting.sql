-- Cost reporting views for evaluation runs.
-- Provides per-user-per-day and per-day totals for all users.

create or replace view public.eval_cost_by_user_day as
select
  user_id,
  date("timestamp") as day,
  count(*) as total_calls,
  count(*) filter (
    where estimated_cost_usd is not null
  ) as calls_with_cost,
  count(*) filter (
    where estimated_cost_usd is null
  ) as calls_missing_cost,
  sum(estimated_cost_usd) as recorded_cost_usd
from
  public.eval_cost_log
group by
  user_id,
  date("timestamp")
order by
  date("timestamp") desc,
  user_id;

create or replace view public.eval_cost_by_day as
select
  date("timestamp") as day,
  count(*) as total_calls,
  count(*) filter (
    where estimated_cost_usd is not null
  ) as calls_with_cost,
  count(*) filter (
    where estimated_cost_usd is null
  ) as calls_missing_cost,
  sum(estimated_cost_usd) as recorded_cost_usd
from
  public.eval_cost_log
group by
  date("timestamp")
order by
  date("timestamp") desc;
