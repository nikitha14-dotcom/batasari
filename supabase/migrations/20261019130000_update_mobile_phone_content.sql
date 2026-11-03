-- Keep the provider labels shown in the Mobile Phone and Internet panel in
-- static_content, so the API remains the source of truth for this UI.
update public.static_content
set body_markdown = $content$**4 main providers**: Bell, Rogers, TELUS, Quebecor, Costco, and their subsidiary brands

**Two main types of connections**: Prepaid & Postpaid

* **Tips**: If you expect to travel frequently within Canada or work outside major cities, consider Rogers, Bell or TELUS—or a lower-cost brand operating on one of their networks. These three national networks generally provide the broadest coverage, but check the provider’s coverage map for the specific communities and routes you will visit.$content$,
    updated_at = now()
where category = 'Daily Needs'
  and subcategory = 'Mobile phone and internet'
  and section_key in ('document-copy', 'description');

