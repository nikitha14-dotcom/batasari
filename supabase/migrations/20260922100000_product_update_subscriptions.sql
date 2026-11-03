-- Product-update email subscriptions (ONB-04 "Subscribe to product update emails").
--
-- The switch is saved by the browser to the user's auth metadata
-- (raw_user_meta_data.product_updates_opt_in). That alone is not a usable
-- mailing list: it can't be queried cleanly, and it keeps no record of WHEN
-- consent was given or withdrawn. Canada's anti-spam law (CASL) expects a
-- sender to be able to show that, so this table is the list of record.
--
-- A trigger on auth.users keeps it in sync, so no API or browser change is
-- needed and a user can only ever affect their own row:
--   * switch turned on  -> row upserted, subscribed = true, consented_at = now()
--   * switch turned off -> subscribed = false, withdrawn_at = now()
--   * email changed     -> row follows the new address
--   * account deleted   -> row deleted (cascade)
-- Users who never opted in get no row.
--
-- Export the list:
--   select email from public.product_update_subscriptions where subscribed;

create table if not exists public.product_update_subscriptions (
  user_id       uuid        primary key references auth.users(id) on delete cascade,
  email         text        not null,
  subscribed    boolean     not null,
  consented_at  timestamptz,
  withdrawn_at  timestamptz,
  source        text        not null default 'onboarding_onb04',
  updated_at    timestamptz not null default now()
);

comment on table public.product_update_subscriptions is
  'Product-update email opt-ins with consent/withdrawal timestamps (CASL). Synced from auth.users by trigger; not exposed to the browser.';

create index if not exists product_update_subscriptions_subscribed_idx
  on public.product_update_subscriptions (subscribed) where subscribed;

-- Browser roles get nothing (ADR 0010). service_role needs select/insert/
-- update on every public table (scripts/check_db_privileges.py).
alter table public.product_update_subscriptions enable row level security;
revoke all on public.product_update_subscriptions from anon, authenticated;
grant select, insert, update on public.product_update_subscriptions to service_role;

create or replace function public.sync_product_update_subscription()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  wants boolean := coalesce(new.raw_user_meta_data -> 'product_updates_opt_in' = 'true'::jsonb, false);
begin
  -- Never subscribed and not subscribing now: nothing to record.
  if not wants and not exists (
    select 1 from public.product_update_subscriptions where user_id = new.id
  ) then
    return new;
  end if;

  insert into public.product_update_subscriptions as s
    (user_id, email, subscribed, consented_at, withdrawn_at, updated_at)
  values
    (new.id, new.email, wants, case when wants then now() end, null, now())
  on conflict (user_id) do update set
    email        = excluded.email,
    subscribed   = excluded.subscribed,
    consented_at = case when excluded.subscribed and not s.subscribed then now() else s.consented_at end,
    withdrawn_at = case
                     when excluded.subscribed then null
                     when s.subscribed then now()
                     else s.withdrawn_at
                   end,
    updated_at   = now();

  return new;
exception when others then
  -- A mailing-list problem must never block sign-up or a profile save.
  raise warning 'sync_product_update_subscription failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

revoke execute on function public.sync_product_update_subscription() from public, anon, authenticated;

drop trigger if exists on_auth_user_product_updates on auth.users;
create trigger on_auth_user_product_updates
  after insert or update of raw_user_meta_data, email on auth.users
  for each row execute function public.sync_product_update_subscription();

-- Backfill anyone who already switched it on before this migration.
insert into public.product_update_subscriptions (user_id, email, subscribed, consented_at)
select u.id, u.email, true, coalesce(u.updated_at, now())
  from auth.users u
 where u.raw_user_meta_data -> 'product_updates_opt_in' = 'true'::jsonb
   and u.email is not null
on conflict (user_id) do nothing;

