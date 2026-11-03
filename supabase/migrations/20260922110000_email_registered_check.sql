-- Lets Sign Up (ONB-01) tell someone "you already have an account, log in"
-- instead of silently emailing them a sign-in link.
--
-- Callable ONLY by service_role, i.e. through the API's POST /auth/email-status,
-- which rate-limits it. If the browser could call it directly, anyone could
-- test thousands of addresses to learn who uses the product.
--
-- Supabase already guarantees one account per email (auth.users.email is
-- unique); this function only improves the message.

create or replace function public.is_email_registered(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from auth.users u
     where lower(u.email) = lower(trim(p_email))
       and u.deleted_at is null
  );
$$;

comment on function public.is_email_registered(text) is
  'True if an active account uses this email. service_role only; exposed via rate-limited POST /auth/email-status.';

revoke execute on function public.is_email_registered(text) from public, anon, authenticated;
grant execute on function public.is_email_registered(text) to service_role;

