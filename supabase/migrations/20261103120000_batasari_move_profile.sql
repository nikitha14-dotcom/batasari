-- Batasari: support both moves between Indian cities and relocations to India.
alter table public.profiles
  add column if not exists move_type text null
    check (move_type in ('within_india', 'returning_to_india', 'relocating_to_india')),
  add column if not exists destination_city text null
    check (destination_city is null or length(destination_city) <= 120);

alter table public.profiles drop constraint if exists profiles_visa_type_check;
alter table public.profiles add constraint profiles_visa_type_check
  check (visa_type is null or visa_type in (
    'open_work_permit', 'employer_specific_work_permit', 'study_permit',
    'permanent_resident', 'visitor', 'other', 'indian_citizen',
    'oci_card_holder', 'employment_visa', 'student_visa', 'business_visa', 'visitor_visa'
  ));

