-- Remove an internal implementation note from the user-facing Check the Place copy.
update public.static_content
set body_markdown = $housing$Data only captures the entire year 2025, and it's updated on February 2, 2026.$housing$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Check the Place'
  and section_key = 'crime-data-specifics';

