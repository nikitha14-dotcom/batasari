create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,

  -- Screen 1: When is your move date?
  move_date date null,

  -- Screen 2: What type of visa?
  visa_type text null
    check (visa_type in (
      'open_work_permit',
      'employer_specific_work_permit',
      'study_permit',
      'permanent_resident',
      'visitor',
      'other'
    )),
  visa_other text null,

  -- Screen 3: Who's moving?
  household_type text null
    check (household_type in ('solo', 'partner', 'family')),
  children_ages int[] null,

  -- Screen 4: Will you bring pets?
  pets text[] null,
  pets_other text null,

  -- Screen 5: City and country you are moving from?
  city_country text null,

  -- Screen 6: Do you have long-term accommodation already?
  has_accommodation boolean null,
  accommodation_zip text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
  before update on profiles
  for each row
  execute function set_updated_at();

