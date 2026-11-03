# Beta retention staging smoke test

Run this test after applying `20260930120000_beta_ai_data_retention.sql` and
`20261001120000_extend_beta_profile_retention.sql`, and before enabling or
changing the Beta retention policy. It exercises the real Postgres function
rather than an application mock.

## Preparation

1. Create two temporary, verified users in the staging Supabase Auth dashboard.
2. Record their UUIDs as the due user and waitlisted user.
3. Replace the UUID placeholders in the SQL below.

The transaction rolls back all test data and setting changes. Delete both
temporary Auth users from the dashboard afterward.

```sql
begin;

update auth.users
set email_confirmed_at = now() - interval '20 days'
where id in ('DUE_USER_UUID'::uuid, 'WAITLIST_USER_UUID'::uuid);

update public.app_settings
set value = jsonb_build_object(
  'epoch', (now() - interval '20 days')::text,
  'stopped_at', null,
  'access_days', 3,
  'retention_days', 7,
  'deletion_enabled', false,
  'exempt_user_ids', (
    select coalesce(jsonb_agg(lower(id::text)), '[]'::jsonb)
    from auth.users
    where id not in ('DUE_USER_UUID'::uuid, 'WAITLIST_USER_UUID'::uuid)
  )
)
where key = 'beta_access_retention';

insert into public.beta_waitlist (user_id)
values ('WAITLIST_USER_UUID')
on conflict (user_id) do nothing;

insert into public.conversation_history
  (user_id, category, question, answer, conversation_id)
values
  ('DUE_USER_UUID', 'Housing', 'retention smoke test', 'due', gen_random_uuid()),
  ('WAITLIST_USER_UUID', 'Housing', 'retention smoke test', 'waitlisted', gen_random_uuid());

insert into public.user_insights (user_id, category, insights)
values
  ('DUE_USER_UUID', 'Housing', '{"test": "due"}'::jsonb),
  ('WAITLIST_USER_UUID', 'Housing', '{"test": "waitlisted"}'::jsonb);

insert into public.profiles (user_id)
values ('DUE_USER_UUID'), ('WAITLIST_USER_UUID')
on conflict (user_id) do nothing;

insert into public.feedback (user_id, rating, feedback_type, message)
values
  ('DUE_USER_UUID', 5, 'general_feedback', 'retention smoke test due'),
  ('WAITLIST_USER_UUID', 5, 'general_feedback', 'retention smoke test waitlisted');

insert into public.contact_messages (user_id, name, email, topic, message)
values
  ('DUE_USER_UUID', 'Due User', 'due@example.com', 'privacy_data', 'retention smoke test'),
  ('WAITLIST_USER_UUID', 'Waitlisted User', 'waitlist@example.com', 'privacy_data', 'retention smoke test');

insert into public.product_update_subscriptions
  (user_id, email, subscribed, consented_at)
values
  ('DUE_USER_UUID', 'due@example.com', true, now()),
  ('WAITLIST_USER_UUID', 'waitlist@example.com', true, now())
on conflict (user_id) do update set
  email = excluded.email,
  subscribed = excluded.subscribed,
  consented_at = excluded.consented_at,
  withdrawn_at = null,
  updated_at = now();

insert into public.beta_access_events (user_id, event_name, metadata)
values
  ('DUE_USER_UUID', 'decline_reason_submitted', '{"reason": "due smoke test"}'::jsonb),
  ('WAITLIST_USER_UUID', 'waitlist_joined', '{}'::jsonb);

insert into public.ai_answer_log (run_id, user_id, model, estimated_cost_usd)
values
  (gen_random_uuid(), 'DUE_USER_UUID', 'retention-smoke-test', 0.01),
  (gen_random_uuid(), 'WAITLIST_USER_UUID', 'retention-smoke-test', 0.01);

create temporary table retention_smoke_results (
  phase text primary key,
  result jsonb not null
);

-- Preview first. This must report the due rows without deleting them.
insert into retention_smoke_results
values ('preview', public.delete_expired_beta_ai_data(true));

do $$
declare
  preview jsonb;
begin
  select result into preview
  from retention_smoke_results
  where phase = 'preview';

  if preview ->> 'status' <> 'dry_run'
    or (preview ->> 'users_due')::integer <> 1
    or (preview ->> 'conversations_due')::integer <> 1
    or (preview ->> 'insights_due')::integer <> 1
    or (preview ->> 'profiles_due')::integer <> 1
    or (preview ->> 'feedback_due')::integer <> 1
    or (preview ->> 'contact_messages_due')::integer <> 1
    or (preview ->> 'product_update_subscriptions_due')::integer <> 1
    or (preview ->> 'beta_access_events_due')::integer <> 1
    or (preview ->> 'beta_waitlist_due')::integer <> 0
    or (preview ->> 'ai_answer_logs_due')::integer <> 1 then
    raise exception 'unexpected dry-run counts: %', preview;
  end if;

  if not exists (select 1 from public.profiles where user_id = 'DUE_USER_UUID'::uuid)
    or not exists (select 1 from public.feedback where user_id = 'DUE_USER_UUID'::uuid)
    or not exists (select 1 from public.contact_messages where user_id = 'DUE_USER_UUID'::uuid)
    or not exists (select 1 from public.product_update_subscriptions where user_id = 'DUE_USER_UUID'::uuid)
    or not exists (select 1 from public.beta_access_events where user_id = 'DUE_USER_UUID'::uuid)
    or not exists (select 1 from public.ai_answer_log where user_id = 'DUE_USER_UUID'::uuid)
    or not exists (select 1 from auth.users where id = 'DUE_USER_UUID'::uuid) then
    raise exception 'dry run deleted profile data';
  end if;
end;
$$;

update public.app_settings
set value = jsonb_set(value, '{deletion_enabled}', 'true'::jsonb)
where key = 'beta_access_retention';

insert into retention_smoke_results
values ('delete', public.delete_expired_beta_ai_data(false));

do $$
declare
  deletion jsonb;
begin
  select result into deletion
  from retention_smoke_results
  where phase = 'delete';

  if deletion ->> 'status' <> 'ok'
    or (deletion ->> 'conversations_deleted')::integer <> 1
    or (deletion ->> 'insights_deleted')::integer <> 1
    or (deletion ->> 'profiles_deleted')::integer <> 1
    or (deletion ->> 'feedback_deleted')::integer <> 1
    or (deletion ->> 'contact_messages_deleted')::integer <> 1
    or (deletion ->> 'product_update_subscriptions_deleted')::integer <> 1
    or (deletion ->> 'beta_access_events_deleted')::integer <> 1
    or (deletion ->> 'beta_waitlist_deleted')::integer <> 0
    or (deletion ->> 'ai_answer_logs_deleted')::integer <> 1
    or (deletion ->> 'auth_users_deleted')::integer <> 1 then
    raise exception 'unexpected deletion counts: %', deletion;
  end if;

  if exists (
    select 1 from public.conversation_history
    where user_id = 'DUE_USER_UUID'::uuid
  ) or exists (
    select 1 from public.user_insights
    where user_id = 'DUE_USER_UUID'::uuid
  ) or exists (
    select 1 from public.profiles
    where user_id = 'DUE_USER_UUID'::uuid
  ) or exists (
    select 1 from public.feedback
    where user_id = 'DUE_USER_UUID'::uuid
  ) or exists (
    select 1 from public.contact_messages
    where user_id = 'DUE_USER_UUID'::uuid
  ) or exists (
    select 1 from public.product_update_subscriptions
    where user_id = 'DUE_USER_UUID'::uuid
  ) or exists (
    select 1 from public.beta_access_events
    where user_id = 'DUE_USER_UUID'::uuid
  ) or exists (
    select 1 from public.ai_answer_log
    where user_id = 'DUE_USER_UUID'::uuid
  ) or exists (
    select 1 from auth.users
    where id = 'DUE_USER_UUID'::uuid
  ) then
    raise exception 'due user data was not deleted';
  end if;

  if not exists (
    select 1 from public.conversation_history
    where user_id = 'WAITLIST_USER_UUID'::uuid
  ) or not exists (
    select 1 from public.user_insights
    where user_id = 'WAITLIST_USER_UUID'::uuid
  ) or not exists (
    select 1 from public.profiles
    where user_id = 'WAITLIST_USER_UUID'::uuid
  ) or not exists (
    select 1 from public.feedback
    where user_id = 'WAITLIST_USER_UUID'::uuid
  ) or not exists (
    select 1 from public.contact_messages
    where user_id = 'WAITLIST_USER_UUID'::uuid
  ) or not exists (
    select 1 from public.product_update_subscriptions
    where user_id = 'WAITLIST_USER_UUID'::uuid
  ) or not exists (
    select 1 from public.beta_access_events
    where user_id = 'WAITLIST_USER_UUID'::uuid
  ) or not exists (
    select 1 from public.ai_answer_log
    where user_id = 'WAITLIST_USER_UUID'::uuid
  ) or not exists (
    select 1 from auth.users
    where id = 'WAITLIST_USER_UUID'::uuid
  ) then
    raise exception 'waitlisted user data was deleted';
  end if;
end;
$$;

rollback;
```

The function result reports due and deleted rows for every user-owned table and
the Auth account. The test also confirms that `beta_waitlist` membership
excludes a user from normal-expiry deletion. `insights_deleted` is not a count
of distinct users; a user can have one insight row per category.

Do not simulate `stopped_at` in this shared staging smoke test. A global stop
intentionally overrides both waitlist and team exemptions, so its dry-run can
include every staging user. If product discontinues the Beta, set the real stop
timestamp with deletion still disabled and review the complete preview before
enabling deletion.

Confirm the hourly evaluation job exists, then confirm destructive deletion is
still disabled while reviewing staging counts:

```sql
select jobname, schedule, active
from cron.job
where jobname = 'beta-ai-data-retention';
```

Expected schedule: `17 * * * *`, with `active = true`.

```sql
select value ->> 'deletion_enabled' as deletion_enabled
from public.app_settings
where key = 'beta_access_retention';
```

Expected value before approval: `false`.

