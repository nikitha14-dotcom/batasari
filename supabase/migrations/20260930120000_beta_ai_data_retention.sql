-- Durable derived insights plus opt-in automatic Beta retention enforcement.
--
-- A user's ordinary Beta ends three days after the later of email confirmation
-- and the rollout epoch. Seven days later, this job deletes both raw
-- conversation history and derived insights. Time-exempt users are skipped
-- while the Beta is active. Setting stopped_at makes the global Beta stop the
-- application and starts the retention clock for every user, including
-- time-exempt team members. API startup treats BETA_STOPPED_AT as authoritative:
-- setting it writes the timestamp here, and removing it clears stopped_at. It
-- also copies AI_SPEND_CAP_EXEMPT_USER_IDS into exempt_user_ids so access,
-- spend-cap, and retention exemptions cannot drift. Deletion starts disabled:
-- preview with delete_expired_beta_ai_data(true), review the counts, then set
-- BETA_RETENTION_DELETE_ENABLED=true before allowing the cron job to delete.

create table public.user_insights (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  category   text        not null,
  insights   jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, category),
  constraint user_insights_category_not_blank check (btrim(category) <> ''),
  constraint user_insights_object check (jsonb_typeof(insights) = 'object')
);

alter table public.user_insights enable row level security;
revoke all on public.user_insights from anon, authenticated;
grant select, insert, update, delete on public.user_insights to service_role;

create trigger user_insights_set_updated_at
  before update on public.user_insights
  for each row execute function public.set_updated_at();

insert into public.app_settings (key, value)
values (
  'beta_access_retention',
  '{"epoch":null,"stopped_at":null,"access_days":3,"retention_days":7,"deletion_enabled":false,"exempt_user_ids":[]}'::jsonb
)
on conflict (key) do nothing;

create or replace function public.delete_expired_beta_ai_data(p_dry_run boolean default true)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  policy jsonb;
  exempt_user_ids jsonb;
  due_user_ids uuid[];
  rollout_epoch timestamptz;
  beta_stopped_at timestamptz;
  access_days integer;
  retention_days integer;
  deletion_enabled boolean;
  users_due bigint;
  conversations_due bigint;
  insights_due bigint;
  conversations_deleted bigint;
  insights_deleted bigint;
begin
  select value into policy
  from public.app_settings
  where key = 'beta_access_retention';

  rollout_epoch := nullif(policy ->> 'epoch', '')::timestamptz;
  if rollout_epoch is null then
    return jsonb_build_object(
      'status', 'not_configured',
      'users_due', 0,
      'conversations_due', 0,
      'insights_due', 0,
      'conversations_deleted', 0,
      'insights_deleted', 0
    );
  end if;

  beta_stopped_at := nullif(policy ->> 'stopped_at', '')::timestamptz;
  access_days := coalesce((policy ->> 'access_days')::integer, 3);
  retention_days := coalesce((policy ->> 'retention_days')::integer, 7);
  deletion_enabled := coalesce((policy ->> 'deletion_enabled')::boolean, false);

  if access_days <= 0 or retention_days <= 0 then
    raise exception 'Beta access and retention days must be positive';
  end if;

  exempt_user_ids := coalesce(policy -> 'exempt_user_ids', '[]'::jsonb);

  select coalesce(array_agg(users.id), '{}'::uuid[])
  into due_user_ids
  from auth.users as users
  where users.email_confirmed_at is not null
    and (
      beta_stopped_at is not null
      or not exempt_user_ids ? lower(users.id::text)
    )
    and (
      case
        when beta_stopped_at is not null then least(
          greatest(users.email_confirmed_at, rollout_epoch)
            + make_interval(days => access_days),
          beta_stopped_at
        )
        else greatest(users.email_confirmed_at, rollout_epoch)
          + make_interval(days => access_days)
      end
      + make_interval(days => retention_days)
      -- The job runs hourly. This guard schedules eligibility one interval
      -- early so the next run still deletes data within the seven-day promise.
      - interval '1 hour'
    ) <= now();

  users_due := cardinality(due_user_ids);
  select count(*) into conversations_due
  from public.conversation_history
  where user_id = any(due_user_ids);
  select count(*) into insights_due
  from public.user_insights
  where user_id = any(due_user_ids);

  if p_dry_run or not deletion_enabled then
    return jsonb_build_object(
      'status', 'dry_run',
      'deletion_enabled', deletion_enabled,
      'users_due', users_due,
      'conversations_due', conversations_due,
      'insights_due', insights_due,
      'conversations_deleted', 0,
      'insights_deleted', 0
    );
  end if;

  delete from public.conversation_history
  where user_id = any(due_user_ids);
  get diagnostics conversations_deleted = row_count;

  delete from public.user_insights
  where user_id = any(due_user_ids);
  get diagnostics insights_deleted = row_count;

  return jsonb_build_object(
    'status', 'ok',
    'deletion_enabled', deletion_enabled,
    'users_due', users_due,
    'conversations_due', conversations_due,
    'insights_due', insights_due,
    'conversations_deleted', conversations_deleted,
    'insights_deleted', insights_deleted
  );
end;
$$;

revoke all on function public.delete_expired_beta_ai_data(boolean) from public;
grant execute on function public.delete_expired_beta_ai_data(boolean) to service_role;

-- Idempotent across local resets and repaired migration histories.
select cron.unschedule(jobid)
from cron.job
where jobname = 'beta-ai-data-retention';

select cron.schedule(
  'beta-ai-data-retention',
  '17 * * * *',
  $job$select public.delete_expired_beta_ai_data(false);$job$
);

comment on function public.delete_expired_beta_ai_data(boolean) is
  'ADR 0006: preview or delete conversation history and derived insights due for seven-day Beta retention.';

