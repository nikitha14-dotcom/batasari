-- Messages from the Contact Support page. Only the API's service role may
-- read or write these records; they contain names, email addresses, and text.
create table if not exists public.contact_messages (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  name       text        not null,
  email      text        not null,
  topic      text        not null,
  message    text        not null,
  created_at timestamptz not null default now()
);

alter table public.contact_messages
  drop constraint if exists contact_messages_length_check;

alter table public.contact_messages
  add constraint contact_messages_length_check
  check (
    char_length(name) between 1 and 120
    and char_length(email) between 3 and 254
    and char_length(message) between 1 and 5000
  );

alter table public.contact_messages
  drop constraint if exists contact_messages_topic_check;

alter table public.contact_messages
  add constraint contact_messages_topic_check
  check (topic in (
    'technical_issue',
    'account_sign_in',
    'privacy_data',
    'subscriptions',
    'general_question',
    'partnership',
    'other'
  ));

create index if not exists contact_messages_user_created_idx
  on public.contact_messages (user_id, created_at desc);

alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;
grant select, insert on public.contact_messages to service_role;

