-- User-owned move plans for Batasari. API routes also scope every query by user_id.
create table if not exists public.move_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  move_type text not null check (move_type in ('within_india', 'returning_to_india', 'relocating_to_india')),
  origin_city text null check (origin_city is null or char_length(origin_city) <= 120),
  origin_country text null check (origin_country is null or char_length(origin_country) <= 120),
  destination_city text not null check (char_length(destination_city) between 1 and 120),
  move_date date null,
  household_size integer not null default 1 check (household_size between 1 and 20),
  services jsonb not null default '[]'::jsonb check (jsonb_typeof(services) = 'array'),
  notes text null check (notes is null or char_length(notes) <= 1000),
  status text not null default 'planning' check (status in ('planning', 'booked', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint move_plans_origin_by_type check (
    (move_type = 'within_india' and origin_city is not null)
    or (move_type <> 'within_india' and origin_country is not null)
  )
);

create index if not exists move_plans_user_created_idx
  on public.move_plans (user_id, created_at desc);

alter table public.move_plans enable row level security;

drop policy if exists "Users can view their own move plans" on public.move_plans;
create policy "Users can view their own move plans"
  on public.move_plans for select using (auth.uid() = user_id);
drop policy if exists "Users can create their own move plans" on public.move_plans;
create policy "Users can create their own move plans"
  on public.move_plans for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own move plans" on public.move_plans;
create policy "Users can update their own move plans"
  on public.move_plans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own move plans" on public.move_plans;
create policy "Users can delete their own move plans"
  on public.move_plans for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.move_plans to authenticated;

