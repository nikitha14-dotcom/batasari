-- Beta access state, waitlist idempotency, and MVP funnel events.
create table if not exists public.beta_waitlist (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.beta_access_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists beta_access_events_name_created_idx
  on public.beta_access_events (event_name, created_at);
create index if not exists beta_access_events_user_created_idx
  on public.beta_access_events (user_id, created_at desc);

alter table public.beta_waitlist enable row level security;
alter table public.beta_access_events enable row level security;
revoke all on public.beta_waitlist, public.beta_access_events from anon, authenticated;
grant select, insert on public.beta_waitlist, public.beta_access_events to service_role;

