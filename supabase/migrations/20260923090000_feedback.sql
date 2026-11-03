-- feedback: one row per submission of the "Share your feedback" form
-- (Figma UserFeedback, Feedback_1..Feedback_4).
--
-- Scope note: this table serves the feedback FORM only. The thumbs up/down on
-- AI answers is still unpersisted and will get its own store; a `source`
-- column was considered and deliberately left out, because a shared table
-- would have to make `rating` and `feedback_type` nullable and would lose the
-- check constraints below for every form row.
--
-- user_id is not null on purpose. Feedback you cannot trace back to an account
-- cannot be followed up on, and a bug report without a reporter is close to
-- useless. That makes the free text personal data: it belongs in the Privacy
-- Statement and under the same retention rule as conversation history.

create table if not exists public.feedback (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  rating        smallint    not null,
  feedback_type text        not null,
  message       text,
  created_at    timestamptz not null default now()
);

comment on table public.feedback is
  'User-submitted feedback from the Share your feedback form. Server-side only (service_role).';

-- Constraints rather than API-only validation. The service-role key bypasses
-- RLS, so anything holding it can write this table without passing through
-- the Pydantic model in api/app/routers/feedback.py. These are the only
-- limits that survive that path.
--
-- Keep the type list in step with FEEDBACK_TYPES in that router and with
-- FEEDBACK_TYPES in web/lib/feedback/feedbackTypes.ts.
alter table public.feedback
  drop constraint if exists feedback_rating_check;

alter table public.feedback
  add constraint feedback_rating_check
  check (rating between 1 and 5);

alter table public.feedback
  drop constraint if exists feedback_type_check;

alter table public.feedback
  add constraint feedback_type_check
  check (
    feedback_type in (
      'suggestion',
      'feature_request',
      'bug_report',
      'complaint',
      'general_feedback',
      'other'
    )
  );

-- 2000 characters is roughly four paragraphs, well past what the 933x127
-- textarea in the design invites. The cap is here so an unbounded blob cannot
-- be written by anything holding the service-role key.
alter table public.feedback
  drop constraint if exists feedback_message_length_check;

alter table public.feedback
  add constraint feedback_message_length_check
  check (message is null or char_length(message) <= 2000);

-- "This user's recent submissions", which is what any future durable rate
-- limit or abuse review needs.
create index if not exists feedback_user_created_idx
  on public.feedback (user_id, created_at desc);

-- Same posture as ai_answer_log: nothing in the browser reads this table
-- directly. The API is the only reader, and it connects as service_role.
alter table public.feedback enable row level security;

revoke all on public.feedback from anon, authenticated;

grant select, insert on public.feedback to service_role;

