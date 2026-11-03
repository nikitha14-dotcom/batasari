-- Sign-up cap for the open pilot.
--
-- ONB-01 opens sign-up to anyone, but the pilot budget covers a fixed number
-- of users. The cap has to live here, not in the web app: the anon key is
-- public, so anyone can call Supabase's sign-up endpoint directly and skip any
-- check the page makes. Supabase Auth calls this function before it creates a
-- user (the "Before User Created" auth hook) and refuses the sign-up when the
-- function returns an error.
--
-- ACTIVATION IS MANUAL, per project (Dev, staging, prod):
--   Dashboard -> Authentication -> Hooks -> "Before User Created"
--   -> Postgres function -> public.hook_before_user_created
-- Until that is switched on, this migration changes nothing.
--
-- Change the cap without a deploy:
--   update public.app_settings set value = '750', updated_at = now()
--    where key = 'max_users';
-- Remove the row (or set it to null) to lift the cap entirely.

create table if not exists public.app_settings (
  key        text        primary key,
  value      jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.app_settings is
  'Operator-set configuration read by database functions. Not exposed to the browser.';

insert into public.app_settings (key, value)
values ('max_users', '500'::jsonb)
on conflict (key) do nothing;

-- Browser roles never read or write settings (ADR 0010).
alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;
-- service_role needs select/insert/update on every public table (scripts/check_db_privileges.py).
grant select, insert, update on public.app_settings to service_role;

create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
security definer
-- Empty search_path so every name below must be schema-qualified; a security
-- definer function must not resolve names through a caller-controlled path.
set search_path = ''
as $$
declare
  cap           integer;
  current_users bigint;
begin
  select case when jsonb_typeof(value) = 'number' then (value #>> '{}')::integer end
    into cap
    from public.app_settings
   where key = 'max_users';

  -- No row, null, or a non-number: no cap.
  if cap is null then
    return '{}'::jsonb;
  end if;

  select count(*) into current_users from auth.users;

  if current_users >= cap then
    -- The web app matches on "pilot is full" to show a friendly screen.
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'The pilot is full. We are not accepting new sign-ups right now.'
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

comment on function public.hook_before_user_created(jsonb) is
  'Supabase Auth "Before User Created" hook: rejects sign-ups once auth.users reaches app_settings.max_users.';

-- Only Supabase Auth may call the hook. Functions are executable by PUBLIC by
-- default, which would expose it at /rest/v1/rpc.
revoke execute on function public.hook_before_user_created(jsonb) from public, anon, authenticated;
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;

