-- Completion and ordering hardening for answer-quality metrics.
-- Historical log rows deliberately remain NULL: their completion point cannot
-- be reconstructed safely.

alter table public.ai_answer_log
  add column if not exists completed_at timestamptz;

create index if not exists ai_answer_log_completed_at_idx
  on public.ai_answer_log (completed_at)
  where completed_at is not null;

-- Keep a versioned tombstone for an unselected thumb. Deleting the row would
-- let a delayed request recreate an older selection after a user removed it.
alter table public.ai_answer_feedback
  alter column rating drop not null,
  add column if not exists version bigint not null default 0;

alter table public.ai_answer_feedback
  drop column if exists answer_run_id;

drop index if exists public.ai_answer_feedback_user_run_idx;

create or replace function public.set_ai_answer_feedback(
  p_answer_log_id uuid,
  p_user_id uuid,
  p_rating smallint,
  p_expected_version bigint
)
returns table (rating smallint, version bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_expected_version < 0 or (p_rating is not null and p_rating not in (-1, 1)) then
    raise exception 'invalid answer feedback state';
  end if;

  return query
  insert into public.ai_answer_feedback as feedback
    (answer_log_id, user_id, rating, version)
  values
    (p_answer_log_id, p_user_id, p_rating, 1)
  on conflict (answer_log_id, user_id) do update
    set rating = excluded.rating,
        version = feedback.version + 1
    where feedback.version = p_expected_version
  returning feedback.rating, feedback.version;
end;
$$;

revoke all on function public.set_ai_answer_feedback(uuid, uuid, smallint, bigint)
  from public, anon, authenticated;
grant execute on function public.set_ai_answer_feedback(uuid, uuid, smallint, bigint)
  to service_role;

create or replace view public.ai_answer_feedback_status
with (security_invoker = true) as
select
  feedback.user_id,
  answer.run_id as answer_run_id,
  feedback.rating,
  feedback.version
from public.ai_answer_feedback as feedback
join public.ai_answer_log as answer on answer.id = feedback.answer_log_id;

revoke all on public.ai_answer_feedback_status from anon, authenticated;
grant select on public.ai_answer_feedback_status to service_role;

create or replace view public.ai_answer_quality_metrics
with (security_invoker = true) as
select
  count(*) as total_answers_provided,
  count(feedback.id) filter (where feedback.rating = 1) as total_thumbs_up,
  count(feedback.id) filter (where feedback.rating = -1) as total_thumbs_down
from public.ai_answer_log as answer
left join public.ai_answer_feedback as feedback
  on feedback.answer_log_id = answer.id
where answer.completed_at is not null;

create or replace view public.ai_answer_feedback_by_category
with (security_invoker = true) as
select
  answer.category,
  count(feedback.id) filter (where feedback.rating = 1) as thumbs_up,
  count(feedback.id) filter (where feedback.rating = -1) as thumbs_down
from public.ai_answer_log as answer
left join public.ai_answer_feedback as feedback
  on feedback.answer_log_id = answer.id
where answer.completed_at is not null
group by answer.category;

revoke all on public.ai_answer_quality_metrics, public.ai_answer_feedback_by_category
  from anon, authenticated;
grant select on public.ai_answer_quality_metrics, public.ai_answer_feedback_by_category
  to service_role;

