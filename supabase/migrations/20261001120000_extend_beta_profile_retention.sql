-- Extend Beta retention from AI history to the user's full stored profile.
--
-- 20260930120000 created the durable insight store and the opt-in retention
-- function. This migration follow-up replaces the function without rewriting 
-- migration history. Waitlisted and team-exempt users are retained after their 
-- individual access window, but a global Beta stop makes every account eligible 
-- after the retention period. For every due account, all user-owned rows and 
-- the auth account are deleted, including stored emails, free-text Beta events, and the spend/audit log.

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
  profiles_due bigint;
  feedback_due bigint;
  contact_messages_due bigint;
  product_update_subscriptions_due bigint;
  beta_access_events_due bigint;
  beta_waitlist_due bigint;
  ai_answer_logs_due bigint;
  conversations_deleted bigint;
  insights_deleted bigint;
  profiles_deleted bigint;
  feedback_deleted bigint;
  contact_messages_deleted bigint;
  product_update_subscriptions_deleted bigint;
  beta_access_events_deleted bigint;
  beta_waitlist_deleted bigint;
  ai_answer_logs_deleted bigint;
  auth_users_deleted bigint;
begin
  select value into policy
  from public.app_settings
  where key = 'beta_access_retention';

  rollout_epoch := nullif(policy ->> 'epoch', '')::timestamptz;
  if rollout_epoch is null then
    return jsonb_build_object(
      'status', 'not_configured',
      'deletion_enabled', false,
      'users_due', 0,
      'conversations_due', 0,
      'insights_due', 0,
      'profiles_due', 0,
      'feedback_due', 0,
      'contact_messages_due', 0,
      'product_update_subscriptions_due', 0,
      'beta_access_events_due', 0,
      'beta_waitlist_due', 0,
      'ai_answer_logs_due', 0,
      'conversations_deleted', 0,
      'insights_deleted', 0,
      'profiles_deleted', 0,
      'feedback_deleted', 0,
      'contact_messages_deleted', 0,
      'product_update_subscriptions_deleted', 0,
      'beta_access_events_deleted', 0,
      'beta_waitlist_deleted', 0,
      'ai_answer_logs_deleted', 0,
      'auth_users_deleted', 0
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
      or not exists (
        select 1
        from public.beta_waitlist as waitlist
        where waitlist.user_id = users.id
      )
    )
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
      -- The check runs hourly. Make rows eligible one interval early so the
      -- next run still satisfies the "within seven days" commitment.
      - interval '1 hour'
    ) <= now();

  users_due := cardinality(due_user_ids);
  select count(*) into conversations_due
  from public.conversation_history
  where user_id = any(due_user_ids);
  select count(*) into insights_due
  from public.user_insights
  where user_id = any(due_user_ids);
  select count(*) into profiles_due
  from public.profiles
  where user_id = any(due_user_ids);
  select count(*) into feedback_due
  from public.feedback
  where user_id = any(due_user_ids);
  select count(*) into contact_messages_due
  from public.contact_messages
  where user_id = any(due_user_ids);
  select count(*) into product_update_subscriptions_due
  from public.product_update_subscriptions
  where user_id = any(due_user_ids);
  select count(*) into beta_access_events_due
  from public.beta_access_events
  where user_id = any(due_user_ids);
  select count(*) into beta_waitlist_due
  from public.beta_waitlist
  where user_id = any(due_user_ids);
  select count(*) into ai_answer_logs_due
  from public.ai_answer_log
  where user_id = any(due_user_ids);

  if p_dry_run or not deletion_enabled then
    return jsonb_build_object(
      'status', 'dry_run',
      'deletion_enabled', deletion_enabled,
      'users_due', users_due,
      'conversations_due', conversations_due,
      'insights_due', insights_due,
      'profiles_due', profiles_due,
      'feedback_due', feedback_due,
      'contact_messages_due', contact_messages_due,
      'product_update_subscriptions_due', product_update_subscriptions_due,
      'beta_access_events_due', beta_access_events_due,
      'beta_waitlist_due', beta_waitlist_due,
      'ai_answer_logs_due', ai_answer_logs_due,
      'conversations_deleted', 0,
      'insights_deleted', 0,
      'profiles_deleted', 0,
      'feedback_deleted', 0,
      'contact_messages_deleted', 0,
      'product_update_subscriptions_deleted', 0,
      'beta_access_events_deleted', 0,
      'beta_waitlist_deleted', 0,
      'ai_answer_logs_deleted', 0,
      'auth_users_deleted', 0
    );
  end if;

  delete from public.conversation_history
  where user_id = any(due_user_ids);
  get diagnostics conversations_deleted = row_count;

  delete from public.user_insights
  where user_id = any(due_user_ids);
  get diagnostics insights_deleted = row_count;

  delete from public.feedback
  where user_id = any(due_user_ids);
  get diagnostics feedback_deleted = row_count;

  delete from public.contact_messages
  where user_id = any(due_user_ids);
  get diagnostics contact_messages_deleted = row_count;

  delete from public.product_update_subscriptions
  where user_id = any(due_user_ids);
  get diagnostics product_update_subscriptions_deleted = row_count;

  delete from public.beta_access_events
  where user_id = any(due_user_ids);
  get diagnostics beta_access_events_deleted = row_count;

  delete from public.beta_waitlist
  where user_id = any(due_user_ids);
  get diagnostics beta_waitlist_deleted = row_count;

  delete from public.ai_answer_log
  where user_id = any(due_user_ids);
  get diagnostics ai_answer_logs_deleted = row_count;

  delete from public.profiles
  where user_id = any(due_user_ids);
  get diagnostics profiles_deleted = row_count;

  delete from auth.users
  where id = any(due_user_ids);
  get diagnostics auth_users_deleted = row_count;

  return jsonb_build_object(
    'status', 'ok',
    'deletion_enabled', deletion_enabled,
    'users_due', users_due,
    'conversations_due', conversations_due,
    'insights_due', insights_due,
    'profiles_due', profiles_due,
    'feedback_due', feedback_due,
    'contact_messages_due', contact_messages_due,
    'product_update_subscriptions_due', product_update_subscriptions_due,
    'beta_access_events_due', beta_access_events_due,
    'beta_waitlist_due', beta_waitlist_due,
    'ai_answer_logs_due', ai_answer_logs_due,
    'conversations_deleted', conversations_deleted,
    'insights_deleted', insights_deleted,
    'profiles_deleted', profiles_deleted,
    'feedback_deleted', feedback_deleted,
    'contact_messages_deleted', contact_messages_deleted,
    'product_update_subscriptions_deleted', product_update_subscriptions_deleted,
    'beta_access_events_deleted', beta_access_events_deleted,
    'beta_waitlist_deleted', beta_waitlist_deleted,
    'ai_answer_logs_deleted', ai_answer_logs_deleted,
    'auth_users_deleted', auth_users_deleted
  );
end;
$$;

revoke all on function public.delete_expired_beta_ai_data(boolean) from public;
grant execute on function public.delete_expired_beta_ai_data(boolean) to service_role;

comment on function public.delete_expired_beta_ai_data(boolean) is
  'ADR 0006: retain waitlisted and exempt users during normal operation; after the retention deadline, delete every due user-owned row and auth account. A global Beta stop includes all users.';

