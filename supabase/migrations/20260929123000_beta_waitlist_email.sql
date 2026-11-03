-- Keep the address expressed at waitlist time for the MVP export/audit.
alter table public.beta_waitlist
  add column if not exists email text;

create index if not exists beta_waitlist_email_idx on public.beta_waitlist (email);

