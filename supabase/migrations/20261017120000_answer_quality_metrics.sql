-- Durable, answer-level thumbs feedback. This deliberately does not reuse
-- public.feedback, which holds the separate Share your feedback form.
--
-- ai_answer_log.run_id is generated per request in the API, but the original
-- schema did not make it unique. Do not add a unique constraint without a
-- production duplicate audit. The feedback row instead has a foreign key to
-- ai_answer_log.id; answer_run_id is retained for the SSE/browser mapping.

alter table public.conversation_history
  add column if not exists run_id uuid;

create index if not exists conversation_history_run_id_idx
  on public.conversation_history (run_id)
  where run_id is not null;

create table if not exists public.ai_answer_feedback (
  id             uuid        primary key default gen_random_uuid(),
  answer_log_id  uuid        not null references public.ai_answer_log(id) on delete cascade,
  answer_run_id  uuid        not null,
  user_id        uuid        not null references auth.users(id) on delete cascade,
  rating         smallint    not null check (rating in (-1, 1)),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (answer_log_id, user_id)
);

comment on table public.ai_answer_feedback is
  'One current thumbs rating per user and AI answer. Server-side only.';

create index if not exists ai_answer_feedback_user_run_idx
  on public.ai_answer_feedback (user_id, answer_run_id);

alter table public.ai_answer_feedback enable row level security;

revoke all on public.ai_answer_feedback from anon, authenticated;
grant select, insert, update, delete on public.ai_answer_feedback to service_role;

drop trigger if exists ai_answer_feedback_set_updated_at on public.ai_answer_feedback;
create trigger ai_answer_feedback_set_updated_at
  before update on public.ai_answer_feedback
  for each row execute function public.set_updated_at();

-- A server-side "provided answer" is an ai_answer_log row: runner.py only
-- writes it after it has a complete response (including cache/fallback and
-- router-only completed responses) and before emitting SSE complete. It cannot
-- prove that a disconnected browser rendered the event. Historical best-effort
-- logging failures are intentionally not reconstructed by these views.
create or replace view public.ai_answer_quality_metrics
with (security_invoker = true) as
select
  count(*) as total_answers_provided,
  count(feedback.id) filter (where feedback.rating = 1) as total_thumbs_up,
  count(feedback.id) filter (where feedback.rating = -1) as total_thumbs_down
from public.ai_answer_log as answer
left join public.ai_answer_feedback as feedback
  on feedback.answer_log_id = answer.id;

create or replace view public.ai_answer_feedback_by_category
with (security_invoker = true) as
select
  answer.category,
  count(feedback.id) filter (where feedback.rating = 1) as thumbs_up,
  count(feedback.id) filter (where feedback.rating = -1) as thumbs_down
from public.ai_answer_log as answer
left join public.ai_answer_feedback as feedback
  on feedback.answer_log_id = answer.id
group by answer.category;

revoke all on public.ai_answer_quality_metrics, public.ai_answer_feedback_by_category
  from anon, authenticated;
grant select on public.ai_answer_quality_metrics, public.ai_answer_feedback_by_category
  to service_role;

