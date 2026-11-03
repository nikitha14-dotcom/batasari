-- Add missing Housing static content

-- Sources added by the final Housing content pass
-- ---------------------------------------------------------------------------
insert into public.trusted_sources (name, url, authority_tier, jurisdiction)
select v.name, v.url, v.authority_tier, v.jurisdiction
from (values
  ('Blueground Toronto', 'https://www.theblueground.com/furnished-apartments-toronto-canada', 'C', 'Toronto'),
  ('Craigslist Sublets', 'https://www.craigslist.org/search/area/toronto?cat=sub#search=2~gallery~0', 'D', 'Toronto'),
  ('Ontario Standard Lease Guide', 'https://www.ontario.ca/page/guide-ontarios-standard-lease', 'A', 'Ontario'),
  ('City of Toronto: Multi-tenant Houses', 'https://www.toronto.ca/community-people/housing-shelter/rental-housing-rights-information/multi-tenant-rooming-houses/', 'A', 'Toronto'),
  ('Ontario LTB: Maintenance and Repairs', 'https://tribunalsontario.ca/documents/ltb/Brochures/Maintenance%20and%20Repairs.html', 'A', 'Ontario'),
  ('City of Toronto: Cycling and the Law', 'https://www.toronto.ca/services-payments/streets-parking-transportation/cycling-in-toronto/cycling-and-the-law/', 'A', 'Toronto'),
  ('Ontario Landlord and Tenant Board', 'https://tribunalsontario.ca/documents/ltb/Brochures/Guide%20to%20RTA%20%28English%29.html', 'A', 'Ontario'),
  ('University of Toronto Off-Campus Housing Finder', 'https://offcampushousing.utoronto.ca/', 'C', 'Toronto'),
  ('York University Off-Campus Housing', 'https://www.yorku.ca/housing/off-campus/', 'C', 'Toronto'),
  ('TMU Off-Campus Housing', 'https://www.torontooffcampus.ca/', 'C', 'Toronto'),
  ('George Brown Housing', 'https://www.georgebrown.ca/current-students/services/housing', 'C', 'Toronto'),
  ('Humber Off-Campus Life', 'https://humber.ca/housing/living-off-campus', 'C', 'Toronto'),
  ('OCAD Housing Resources', 'https://admissions.ocadu.ca/afford/housing-partners', 'C', 'Toronto'),
  ('RentFaster.ca', 'https://www.rentfaster.ca/', 'C', 'Canada'),
  ('RentBoard.ca', 'https://www.rentboard.ca/', 'C', 'Canada'),
  ('RentCanada.com', 'https://www.rentcanada.com/', 'C', 'Canada'),
  ('TorontoRentals.com', 'https://www.torontorentals.com/', 'C', 'Toronto'),
  ('Louer.ca', 'https://www.louer.ca/', 'C', 'Canada')
) as v(name, url, authority_tier, jurisdiction)
where not exists (
  select 1
  from public.trusted_sources existing
  where existing.url = v.url
);

-- New entries
-- ---------------------------------------------------------------------------
insert into public.static_content (category, subcategory, section_key, title, body_markdown, source_id, display_order)
select 'Housing', v.subcategory, v.section_key, v.title, v.body_markdown,
       case when v.source_name is null then null
            else (select t.id from public.trusted_sources t where t.name = v.source_name)
       end,
       v.display_order
from (values
  ('Check the Place',
   'address-formats',
   'Valid address forms',
   $h$Enter a full address (street address + city + postal code), a street address, or an intersection.$h$,
   null, 7),
  ('Check the Place',
   'crime-data-overview',
   'Crime data overview',
   $h$Crime data is available for assault, auto theft, bike theft, break and enter, robbery, theft over, homicide, shooting, and theft from motor vehicle.$h$,
   null, 8),
  ('Check the Place',
   'crime-data-specifics',
   'Data specifics',
   $h$The data covers the full year 2025 and was updated on February 2, 2026. Rates use a denominator of 100,000 people.$h$,
   null, 9)
) as v(subcategory, section_key, title, body_markdown, source_name, display_order)
on conflict (category, subcategory, section_key) do update set
  title = excluded.title,
  body_markdown = excluded.body_markdown,
  source_id = excluded.source_id,
  display_order = excluded.display_order,
  updated_at = now();

-- Add source links to existing Find Housing sections
-- ---------------------------------------------------------------------------
update public.static_content
set source_id = (
      select id from public.trusted_sources
      where url = 'https://www.theblueground.com/furnished-apartments-toronto-canada'
      order by id limit 1
    ),
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Find Housing'
  and section_key = 'short-term-blueground';

update public.static_content
set source_id = (
      select id from public.trusted_sources
      where url = 'https://www.craigslist.org/search/area/toronto?cat=sub#search=2~gallery~0'
      order by id limit 1
    ),
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Find Housing'
  and section_key = 'short-term-craigslist-sublets';

-- Keep Rentals.ca's linked network sites as individual resources rather than
-- embedding a multi-link table in one content body.
update public.static_content
set display_order = display_order + 5,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Find Housing'
  and display_order between 20 and 59;

insert into public.static_content (
  category, subcategory, section_key, title, body_markdown, source_id, display_order
)
select
  'Housing',
  'Find Housing',
  v.section_key,
  v.title,
  v.title,
  (
    select t.id
    from public.trusted_sources t
    where t.name = v.source_name and t.url = v.source_url
    order by t.created_at
    limit 1
  ),
  v.display_order
from (values
  ('long-term-rentfaster', 'RentFaster.ca', 'RentFaster.ca', 'https://www.rentfaster.ca/', 20),
  ('long-term-rentboard', 'RentBoard.ca', 'RentBoard.ca', 'https://www.rentboard.ca/', 21),
  ('long-term-rentcanada', 'RentCanada.com', 'RentCanada.com', 'https://www.rentcanada.com/', 22),
  ('long-term-toronto-rentals', 'TorontoRentals.com', 'TorontoRentals.com', 'https://www.torontorentals.com/', 23),
  ('long-term-louer', 'Louer.ca', 'Louer.ca', 'https://www.louer.ca/', 24)
) as v(section_key, title, source_name, source_url, display_order)
on conflict (category, subcategory, section_key) do update set
  title = excluded.title,
  body_markdown = excluded.body_markdown,
  source_id = excluded.source_id,
  display_order = excluded.display_order,
  updated_at = now();

update public.static_content
set body_markdown = $h$
Individual owners may rent out condos, houses, basements, or rooms directly. They may offer more flexibility on rent, move-in dates, lease length, or application documents, but screening and communication vary by landlord. Most Ontario tenancies still require the Ontario standard lease. On classified platforms, independently verify the advertiser's identity and authority to rent the property before paying.
$h$,
    source_id = (
      select id from public.trusted_sources
      where url = 'https://www.ontario.ca/page/guide-ontarios-standard-lease'
      order by id limit 1
    ),
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Find Housing'
  and section_key = 'private-landlords-intro';

update public.static_content
set body_markdown = $h$
Room in the owner's home (shared kitchen/bath): generally not covered by the RTA. Look on Happipad, Canada HomeShare, or Kijiji rooms.

Joining an existing roommate household: you may be a roommate or occupant rather than a tenant. Confirm whether you'll be added to the lease. Look on Roomies or Facebook groups.

Multi-tenant house: four or more rooms rented separately to people who share a kitchen or bathroom but don't live as one household. Usually covered by the RTA. Look on Kijiji, Facebook Marketplace or groups, or Roomies.

Student housing: residence rules differ from the RTA. Look on university off-campus boards or Places4Students.
$h$,
    source_id = (
      select id from public.trusted_sources
      where url = 'https://www.toronto.ca/community-people/housing-shelter/rental-housing-rights-information/multi-tenant-rooming-houses/'
      order by id limit 1
    ),
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Find Housing'
  and section_key = 'rooms-shared-types';

update public.static_content
set body_markdown = $h$
Use your institution's official off-campus housing resource. Each institution is listed separately below so the frontend can render its Website button from source metadata.
$h$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Find Housing'
  and section_key = 'university-boards';

insert into public.static_content (
  category, subcategory, section_key, title, body_markdown, source_id, display_order
)
select
  'Housing',
  'Find Housing',
  v.section_key,
  v.title,
  v.body_markdown,
  (
    select t.id
    from public.trusted_sources t
    where t.name = v.source_name and t.url = v.source_url
    order by t.created_at
    limit 1
  ),
  v.display_order
from (values
  ('university-board-utoronto', 'University of Toronto', $h$U of T Off-Campus Housing Finder$h$, 'University of Toronto Off-Campus Housing Finder', 'https://offcampushousing.utoronto.ca/', 56),
  ('university-board-york', 'York University', $h$York Off-Campus Housing$h$, 'York University Off-Campus Housing', 'https://www.yorku.ca/housing/off-campus/', 57),
  ('university-board-tmu', 'Toronto Metropolitan University (TMU)', $h$TMU Off-Campus Housing$h$, 'TMU Off-Campus Housing', 'https://www.torontooffcampus.ca/', 58),
  ('university-board-george-brown', 'George Brown Polytechnic', $h$George Brown Housing$h$, 'George Brown Housing', 'https://www.georgebrown.ca/current-students/services/housing', 59),
  ('university-board-humber', 'Humber Polytechnic', $h$Humber Off-Campus Life$h$, 'Humber Off-Campus Life', 'https://humber.ca/housing/living-off-campus', 60),
  ('university-board-ocad', 'OCAD University', $h$OCAD Housing Resources$h$, 'OCAD Housing Resources', 'https://admissions.ocadu.ca/afford/housing-partners', 61)
) as v(section_key, title, body_markdown, source_name, source_url, display_order)
on conflict (category, subcategory, section_key) do update set
  title = excluded.title,
  body_markdown = excluded.body_markdown,
  source_id = excluded.source_id,
  display_order = excluded.display_order,
  updated_at = now();

update public.static_content
set display_order = case section_key
  when 'avoiding-rental-scams' then 62
  when 'scams-cafc' then 63
  when 'scams-competition-bureau' then 64
  when 'scams-reco' then 65
  when 'scams-onland' then 66
  when 'scams-standard-lease' then 67
  when 'scams-privacy-commissioner' then 68
  when 'scams-steps-to-justice' then 69
  when 'scams-toronto-police' then 70
end,
updated_at = now()
where category = 'Housing'
  and subcategory = 'Find Housing'
  and section_key in (
    'avoiding-rental-scams',
    'scams-cafc',
    'scams-competition-bureau',
    'scams-reco',
    'scams-onland',
    'scams-standard-lease',
    'scams-privacy-commissioner',
    'scams-steps-to-justice',
    'scams-toronto-police'
  );

-- Add source links to existing Compare Housing Options sections
-- ---------------------------------------------------------------------------
update public.static_content
set body_markdown = $h$
In Ontario, landlords are generally responsible for maintaining the property and completing repairs. Tenants must keep their unit reasonably clean and repair or pay for damage caused by them or their guests—not normal wear and tear.
$h$,
    source_id = (
      select id from public.trusted_sources
      where url = 'https://tribunalsontario.ca/documents/ltb/Brochures/Maintenance%20and%20Repairs.html'
      order by id limit 1
    ),
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Compare Housing Options'
  and section_key = 'maintenance-responsibilities';

update public.static_content
set body_markdown = $h$
Check the entire route for bike lanes or multi-use trails. In Toronto, people aged 14 and older cannot cycle on sidewalks.
$h$,
    source_id = (
      select id from public.trusted_sources
      where url = 'https://www.toronto.ca/services-payments/streets-parking-transportation/cycling-in-toronto/cycling-and-the-law/'
      order by id limit 1
    ),
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Compare Housing Options'
  and section_key = 'cycling';

-- Concatenated text in rent-control
-- ---------------------------------------------------------------------------
update public.static_content
set body_markdown = $h$
Verify when the unit was first occupied for residential use. Units first occupied after November 15, 2018 are generally exempt from Ontario's rent-increase guideline, so annual increases are not capped. Landlords must still generally wait 12 months between increases and provide at least 90 days' written notice.
$h$,
    source_id = (
      select id
      from public.trusted_sources
      where url = 'https://tribunalsontario.ca/documents/ltb/Brochures/Guide%20to%20RTA%20%28English%29.html'
      order by id
      limit 1
    ),
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Compare Housing Options'
  and section_key = 'rent-control';

-- Concatenated text in credit-employment-alternatives
-- ---------------------------------------------------------------------------
update public.static_content
set body_markdown = $h$
If you lack Canadian credit or employment history, provide proof of income or savings, bank statements, references, or a guarantor/co-signer. You may voluntarily offer prepaid rent, but verify the landlord and unit and sign the lease before paying. A landlord cannot require more than one month's rent as a deposit.
$h$,
    source_id = (
      select id
      from public.trusted_sources
      where url = 'https://tribunalsontario.ca/documents/ltb/Brochures/Guide%20to%20RTA%20%28English%29.html'
      order by id
      limit 1
    ),
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Compare Housing Options'
  and section_key = 'credit-employment-alternatives';

