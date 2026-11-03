-- The crime results already provide the offence rows, rates, and incident count.
-- Remove internal/static copy that should not appear beneath the table.
delete from public.static_content
where category = 'Housing'
  and subcategory = 'Check the Place'
  and section_key in ('crime-data-overview', 'crime-data-specifics');

