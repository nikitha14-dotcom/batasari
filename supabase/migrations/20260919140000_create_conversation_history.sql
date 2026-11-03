-- Stores real conversation turns (question + answer) per user, tagged by
-- category, so history can be shown when a user returns to that category's
-- page. Retrieval is always by user_id + category (page-based, per Jia's
-- decision), not by topic classification.
--
-- Retention: raw history + derived insights retained while the user is
-- active; deleted after 12 months of inactivity or account deletion.
-- Exact duration TBD (Jia aligning with PMs). Auto-expiry and user-
-- initiated deletion are not yet implemented -- tracked as follow-up work.
create table public.conversation_history (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  category        text not null,
  subcategory     text,
  question        text not null,
  answer          text not null,
  conversation_id uuid not null,
  created_at      timestamptz not null default now()
);

create index conversation_history_user_category_idx
  on public.conversation_history (user_id, category, created_at desc);

-- Hosted Supabase locks down new tables by default (service_role gets no
-- access without an explicit grant, unlike local). See Rahul V's finding.
revoke all on public.conversation_history from anon, authenticated;
grant select, insert on public.conversation_history to service_role;

-- RLS so a user can only ever see their own history, on top of the
-- app-level user_id filtering in get_conversation_history.
alter table public.conversation_history enable row level security;

create policy "Users can view their own conversation history"
  on public.conversation_history for select
  using (auth.uid() = user_id);
