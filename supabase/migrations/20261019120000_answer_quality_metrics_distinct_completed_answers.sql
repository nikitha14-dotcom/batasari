-- A completed answer is an answer-log row, not a feedback row.  The feedback
-- join can legitimately have more than one row under privileged/manual data
-- access, so count answer identities rather than joined rows.
create or replace view public.ai_answer_quality_metrics
with (security_invoker = true) as
select
  count(distinct answer.id) as total_answers_provided,
  count(feedback.id) filter (where feedback.rating = 1) as total_thumbs_up,
  count(feedback.id) filter (where feedback.rating = -1) as total_thumbs_down
from public.ai_answer_log as answer
left join public.ai_answer_feedback as feedback
  on feedback.answer_log_id = answer.id
where answer.completed_at is not null;

revoke all on public.ai_answer_quality_metrics from anon, authenticated;
grant select on public.ai_answer_quality_metrics to service_role;

