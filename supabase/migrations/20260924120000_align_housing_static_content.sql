-- Restore canonical Housing copy from Housing - content-20260923193416.md.
-- Existing source_id values remain intact for frontend Website links.

update public.static_content
set body_markdown = $housing$**Temporary (days-weeks)**

Short-term and Mid-term rentals (1-6 months)

**Long-term rentals**$housing$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Find Housing'
  and section_key = 'choose-housing-type';

update public.static_content
set body_markdown = '',
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Find Housing'
  and section_key in (
    'temporary-hotel-hostelworld',
    'temporary-hotel-expedia',
    'temporary-hotel-booking-com',
    'temporary-hotel-hotels-com',
    'temporary-hotel-trip-com',
    'temporary-hotel-priceline'
  );

update public.static_content
set body_markdown = $housing$short-term residential rentals booked directly with local home hosts$housing$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Find Housing'
  and section_key = 'temporary-airbnb';

update public.static_content
set body_markdown = $housing$Can also use some of the hotel booking websites in the table to compare.$housing$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Find Housing'
  and section_key = 'temporary-hotel-trivago';

update public.static_content
set body_markdown = $housing$owns [Rentfaster.ca](http://Rentfaster.ca), [Rentboard.ca](http://Rentboard.ca), [RentCanada.com](http://RentCanada.com), [TorontoRentals.com](http://TorontoRentals.com), [Louer.ca](http://Louer.ca).$housing$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Find Housing'
  and section_key = 'long-term-rentals-ca';

delete from public.static_content
where category = 'Housing'
  and subcategory = 'Find Housing'
  and section_key in (
    'long-term-rentfaster',
    'long-term-rentboard',
    'long-term-rentcanada',
    'long-term-toronto-rentals',
    'long-term-louer'
  );

update public.static_content
set body_markdown = $housing$Rentals here are listed on MLS by brokerages. A tenant's agent handles viewings, the application, and the offer to lease — normally paid by the landlord's brokerage (about one month's rent, split), at no direct cost to you. Confirm this, since arrangements vary.

**Before signing:** ask if the representation agreement is exclusive, how long it runs, and whether you could owe a fee. In Ontario, no written agreement means you're a self-represented party — the agent owes you no duty of care.

Realtor.ca is operated by CREA and represents no one — enquiries go directly to the listing brokerage. The others are operated by brokerages: registering or requesting a viewing routes you to one of their agents, and their leased-price history is behind a free account. That history is the main reason to use them.$housing$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Find Housing'
  and section_key = 'agent-listed-intro';

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
    select source.id
    from public.trusted_sources source
    where source.url = v.source_url
    order by source.created_at
    limit 1
  ),
  v.display_order
from (values
  ('agent-listed-condos-ca', 'Condos.ca', $housing$Same brokerage, two front-ends. Condo.ca focuses on condos, with building profiles, rental history, and market data.$housing$, 'https://condos.ca/', 29),
  ('agent-listed-property-ca', 'Property.ca', $housing$Same brokerage, two front-ends. Property.ca has other types of properties like houses.$housing$, 'https://property.ca/', 30)
) as v(section_key, title, body_markdown, source_url, display_order)
on conflict (category, subcategory, section_key) do update set
  title = excluded.title,
  body_markdown = excluded.body_markdown,
  source_id = excluded.source_id,
  display_order = excluded.display_order,
  updated_at = now();

update public.static_content
set body_markdown = $housing$Yardi-operated rental portal where listings come directly from property managers. Many properties provide current availability, floor plans, tours, and online applications.$housing$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Find Housing'
  and section_key = 'managed-rentcafe';

update public.static_content
set title = 'Managed Buildings',
    body_markdown = $housing$Rental buildings are operated as rental properties by a company rather than rented by individual condo owners. They often use standardized applications, screening, leases, and maintenance processes. Applying through the operator’s verified website can reduce scam risk, especially when renting from outside Toronto. Pricing may be less negotiable, although move-in promotions are sometimes available.$housing$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Find Housing'
  and section_key = 'managed-buildings-intro';

insert into public.static_content (
  category, subcategory, section_key, title, body_markdown, source_id, display_order
)
values (
  'Housing',
  'Find Housing',
  'managed-operator-sites-intro',
  'Operator sites',
  $housing$Large operators list vacancies on their own sites first — the freshest inventory and no third-party middleman.$housing$,
  null,
  37
)
on conflict (category, subcategory, section_key) do update set
  title = excluded.title,
  body_markdown = excluded.body_markdown,
  source_id = excluded.source_id,
  display_order = excluded.display_order,
  updated_at = now();

insert into public.static_content (
  category, subcategory, section_key, title, body_markdown, source_id, display_order
)
select
  'Housing',
  'Find Housing',
  v.section_key,
  v.title,
  '',
  (
    select source.id
    from public.trusted_sources source
    where source.url = v.source_url
    order by source.created_at
    limit 1
  ),
  v.display_order
from (values
  ('managed-capreit', 'Capreit', 'https://www.capreit.ca/', 38),
  ('managed-bwalk', 'Bwalk', 'https://www.bwalk.com/', 39),
  ('managed-realstar', 'Realstar', 'https://www.realstar.ca/', 40),
  ('managed-minto', 'Minto Apartments', 'https://www.minto-apartments.com/', 41),
  ('managed-greenwin', 'Greenwin', 'https://www.greenwin.ca/apartments-for-rent/cities/toronto', 42)
) as v(section_key, title, source_url, display_order)
on conflict (category, subcategory, section_key) do update set
  title = excluded.title,
  body_markdown = excluded.body_markdown,
  source_id = excluded.source_id,
  display_order = excluded.display_order,
  updated_at = now();

update public.static_content
set title = 'Private landlords',
    body_markdown = $housing$Individual owners may rent out condos, houses, basements, or rooms directly. They may offer more flexibility on rent, move-in dates, lease length, or application documents, but screening and communication vary by landlord. Most Ontario tenancies still require the [Ontario standard lease](https://www.ontario.ca/page/guide-ontarios-standard-lease?utm_source=chatgpt.com). On classified platforms, independently verify the advertiser’s identity and authority to rent the property before paying.$housing$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Find Housing'
  and section_key = 'private-landlords-intro';

update public.static_content
set title = 'craigslist Toronto',
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Find Housing'
  and section_key = 'private-craigslist';

update public.static_content
set body_markdown = $housing$General classifieds marketplace with listings from landlords, tenants, agents, and property managers. Do not assume the advertiser’s identity or ownership has been verified.$housing$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Find Housing'
  and section_key = 'private-facebook-marketplace';

update public.static_content
set body_markdown = $housing$Optional paid land-registry search that can help identify a property’s registered owner. It does not prove that the person messaging you is the owner or is authorized to rent the property.$housing$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Find Housing'
  and section_key = 'scams-onland';

insert into public.static_content (
  category, subcategory, section_key, title, body_markdown, source_id, display_order
)
values (
  'Housing',
  'Find Housing',
  'rooms-shared-intro',
  'Rooms & shared housing',
  $housing$**Your rights in shared housing depend heavily on the arrangement.** If you're required to share a kitchen or bathroom with the owner (or certain immediate family members of the owner who live in the building), the Residential Tenancies Act (RTA) generally does not apply. If you're moving into an existing tenant's home without becoming a tenant yourself, you may be an occupant/roommate rather than an RTA tenant.

Before paying a deposit, confirm who you're renting from, whether the owner lives there, what facilities you share, and whether you'll be named on the lease.$housing$,
  null,
  48
)
on conflict (category, subcategory, section_key) do update set
  title = excluded.title,
  body_markdown = excluded.body_markdown,
  source_id = excluded.source_id,
  display_order = excluded.display_order,
  updated_at = now();

delete from public.static_content
where category = 'Housing'
  and subcategory = 'Find Housing'
  and section_key = 'rooms-shared-types';

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
    select source.id
    from public.trusted_sources source
    where source.url = v.source_url
    order by source.created_at
    limit 1
  ),
  v.display_order
from (values
  ('rooms-shared-owner', 'Room in the owner''s home (shared kitchen/bath)', $housing$Generally not covered by the RTA.$housing$, null, 49),
  ('rooms-shared-owner-happipad', 'Happipad', '', 'https://happipad.com/', 50),
  ('rooms-shared-owner-homeshare', 'Canada HomeShare', '', 'https://www.canadahomeshare.com/', 51),
  ('rooms-shared-owner-kijiji', 'Kijiji rooms', '', 'https://www.kijiji.ca/', 52),
  ('rooms-shared-roommate', 'Joining an existing roommate household', $housing$May be a roommate/occupant rather than a tenant — confirm whether you'll be added to the lease. Look on Facebook groups or use the resource below.$housing$, null, 53),
  ('rooms-shared-roommate-roomies', 'Roomies', '', 'https://www.roomies.ca/', 54),
  ('rooms-shared-multi-tenant', 'Multi-tenant house', $housing$Four or more rooms rented separately to people who share a kitchen or bathroom but don’t live as one household. Usually covered by the RTA.$housing$, 'https://www.toronto.ca/community-people/housing-shelter/rental-housing-rights-information/multi-tenant-rooming-houses/', 55),
  ('rooms-shared-multi-kijiji', 'Kijiji', '', 'https://www.kijiji.ca/', 56),
  ('rooms-shared-multi-facebook', 'Facebook Marketplace/groups', '', 'https://www.facebook.com/marketplace/', 57),
  ('rooms-shared-multi-roomies', 'Roomies', '', 'https://www.roomies.ca/', 58),
  ('rooms-shared-student', 'Student housing', $housing$Varies; residence rules differ from RTA. Look on university off-campus boards or use the resource below.$housing$, 'https://www.places4students.com/', 59)
) as v(section_key, title, body_markdown, source_url, display_order)
on conflict (category, subcategory, section_key) do update set
  title = excluded.title,
  body_markdown = excluded.body_markdown,
  source_id = excluded.source_id,
  display_order = excluded.display_order,
  updated_at = now();

insert into public.static_content (
  category, subcategory, section_key, title, body_markdown, source_id, display_order
)
values (
  'Housing',
  'Find Housing',
  'university-boards',
  'University housing boards',
  '',
  null,
  60
)
on conflict (category, subcategory, section_key) do update set
  title = excluded.title,
  body_markdown = excluded.body_markdown,
  source_id = excluded.source_id,
  display_order = excluded.display_order,
  updated_at = now();

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
    select source.id
    from public.trusted_sources source
    where source.url = v.source_url
    order by source.created_at
    limit 1
  ),
  v.display_order
from (values
  ('university-board-utoronto', 'University of Toronto', 'U of T Off-Campus Housing Finder', 'https://offcampushousing.utoronto.ca/', 61),
  ('university-board-york', 'York University', 'York Off-Campus Housing', 'https://www.yorku.ca/housing/off-campus/', 62),
  ('university-board-tmu', 'Toronto Metropolitan University (TMU)', 'TMU Off-Campus Housing', 'https://www.torontooffcampus.ca/', 63),
  ('university-board-george-brown', 'George Brown Polytechnic', 'George Brown Housing', 'https://www.georgebrown.ca/current-students/services/housing', 64),
  ('university-board-humber', 'Humber Polytechnic', 'Humber Off-Campus Life', 'https://humber.ca/housing/living-off-campus', 65),
  ('university-board-ocad', 'OCAD University', 'OCAD Housing Resources', 'https://admissions.ocadu.ca/afford/housing-partners', 66)
) as v(section_key, title, body_markdown, source_url, display_order)
on conflict (category, subcategory, section_key) do update set
  title = excluded.title,
  body_markdown = excluded.body_markdown,
  source_id = excluded.source_id,
  display_order = excluded.display_order,
  updated_at = now();

update public.static_content
set body_markdown = $housing$In Ontario, landlords are generally responsible for maintaining the property and completing repairs. Tenants must keep their unit reasonably clean and repair or pay for damage caused by them or their guests—not normal wear and tear. See details from the [Ontario Landlord and Tenant Board](https://tribunalsontario.ca/documents/ltb/Brochures/Maintenance%20and%20Repairs.html).$housing$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Compare Housing Options'
  and section_key = 'maintenance-responsibilities';

update public.static_content
set body_markdown = $housing$Check the entire route for bike lanes or multi-use trails. In Toronto, people aged 14 and older cannot cycle on sidewalks. [City of Toronto](https://www.toronto.ca/services-payments/streets-parking-transportation/cycling-in-toronto/cycling-and-the-law/?utm_source=chatgpt.com)$housing$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Compare Housing Options'
  and section_key = 'cycling';

update public.static_content
set body_markdown = $housing$Verify when the unit was first occupied for residential use. Units first occupied after November 15, 2018 are generally exempt from Ontario’s rent-increase guideline, so annual increases are not capped. Landlords must still generally wait 12 months between increases and provide at least 90 days’ written notice.[Ontario Landlord and Tenant Board](https://tribunalsontario.ca/documents/ltb/Brochures/Guide%20to%20RTA%20%28English%29.html?utm_source=chatgpt.com)$housing$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Compare Housing Options'
  and section_key = 'rent-control';

update public.static_content
set body_markdown = $housing$If you lack Canadian credit or employment history, provide proof of income or savings, bank statements, references, or a guarantor/co-signer. You may voluntarily offer prepaid rent, but verify the landlord and unit and sign the lease before paying. A landlord cannot require more than one month’s rent as a deposit.[Ontario Landlord and Tenant Board](https://tribunalsontario.ca/documents/ltb/Brochures/Guide%20to%20RTA%20%28English%29.html?utm_source=chatgpt.com)$housing$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Compare Housing Options'
  and section_key = 'credit-employment-alternatives';

-- The final Check the Place content contains only address and crime-data
delete from public.static_content
where category = 'Housing'
  and subcategory = 'Check the Place'
  and section_key not in (
    'address-formats',
    'crime-data-overview',
    'crime-data-specifics'
  );

update public.static_content
set title = 'Valid address forms to enter from the UI',
    body_markdown = $housing$Valid address forms to enter from the UI:
1) full address: street address + city + postal code; 2) street address; 3) intersections$housing$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Check the Place'
  and section_key = 'address-formats';

update public.static_content
set title = 'Crime data',
    body_markdown = $housing$We have data for the following 9 crimes: assault, auto theft, bike theft, break and enter, robbery, theft over, homicide, shooting, and theft from motor vehicle.$housing$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Check the Place'
  and section_key = 'crime-data-overview';

update public.static_content
set title = 'Data specifics',
    body_markdown = $housing$Data only captures the entire year 2025, and it's updated on February 2, 2026.

UI needs to add 100K (the denominator) to the mock as the data only have incident numbers.$housing$,
    updated_at = now()
where category = 'Housing'
  and subcategory = 'Check the Place'
  and section_key = 'crime-data-specifics';

