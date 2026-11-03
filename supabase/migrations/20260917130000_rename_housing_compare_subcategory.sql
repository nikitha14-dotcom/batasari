-- Rename subcategory "Compare Options" to "Compare Housing Options" in the static housing content table

delete from public.static_content as old
using public.static_content as canonical
where old.category = 'Housing'
  and old.subcategory = 'Compare Options'
  and canonical.category = old.category
  and canonical.subcategory = 'Compare Housing Options'
  and canonical.section_key = old.section_key;

update public.static_content
set subcategory = 'Compare Housing Options',
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Compare Options';

