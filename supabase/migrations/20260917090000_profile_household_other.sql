-- ONB-07 gains an "Other" option: the user names who else is moving
-- (brother, sister, father, ...) in free text.
--
-- Two changes, plus length ceilings on every free-text column.
--
-- The ceilings are here rather than only in Pydantic because these columns are
-- read straight into the assistant's system prompt by _get_profile_context.
-- The API is the enforcement boundary today, but the service-role key bypasses
-- RLS, so anything holding that key can write this table without passing
-- through ProfileUpdate at all. A check constraint is the only limit that
-- survives that path.

alter table profiles
  drop constraint if exists profiles_household_type_check;

alter table profiles
  add constraint profiles_household_type_check
  check (household_type in ('solo', 'partner', 'family', 'other'));

alter table profiles
  add column if not exists household_other text null;

-- Keep these in step with api/app/routers/profile.py. Two places is one too
-- many; until the limits are generated from a single source, changing one
-- without the other is the failure mode to watch for.
--
-- NOT VALID is deliberate, and it is the difference between this migration
-- applying and aborting. A plain ADD CONSTRAINT validates every existing row,
-- and these columns were unbounded until today -- any pilot profile with a
-- visa_other over 50 characters would fail the migration and take the deploy
-- with it. NOT VALID skips the back-scan while still enforcing the rule on
-- every insert and update from here on, which is the property we actually
-- want. Legacy rows are grandfathered until someone runs
--   alter table profiles validate constraint profiles_free_text_length_check;
-- against clean data. See the pre-flight query at the bottom of this file.
alter table profiles
  drop constraint if exists profiles_free_text_length_check;

alter table profiles
  add constraint profiles_free_text_length_check
  check (
    coalesce(length(visa_other), 0) <= 50
    and coalesce(length(pets_other), 0) <= 50
    and coalesce(length(household_other), 0) <= 200
    and coalesce(length(city_country), 0) <= 120
    and coalesce(length(accommodation_zip), 0) <= 12
  )
  not valid;

-- children_ages is int[] with no bound of its own. Ten children, ages 0-25 --
-- the same numbers the onboarding stepper enforces.
alter table profiles
  drop constraint if exists profiles_children_ages_check;

alter table profiles
  add constraint profiles_children_ages_check
  check (
    children_ages is null
    or (
      array_length(children_ages, 1) <= 10
      and 0 <= all (children_ages)
      and 25 >= all (children_ages)
    )
  )
  not valid;

-- Pre-flight: how many existing rows the new rules would have rejected.
-- Run this against each environment before validating the constraints above.
--
--   select count(*) filter (where length(visa_other)       > 50)  as visa_other,
--          count(*) filter (where length(pets_other)       > 50)  as pets_other,
--          count(*) filter (where length(household_other)  > 200) as household_other,
--          count(*) filter (where length(city_country)     > 120) as city_country,
--          count(*) filter (where length(accommodation_zip) > 12) as accommodation_zip,
--          count(*) filter (where array_length(children_ages, 1) > 10) as too_many_children
--     from profiles;
--
-- All zeroes means the constraints can be validated safely.

