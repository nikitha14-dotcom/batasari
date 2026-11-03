
update public.static_content
set subcategory = case
      when category = 'Immigration' and subcategory = 'IRCC'
        then 'Immigration, Refugees and Citizenship Canada (IRCC)'
      when category = 'Daily Needs' and subcategory = 'Food Banks'
        then 'Food banks'
      when category = 'Daily Needs' and subcategory = 'Transportation'
        then 'Transportation — public transit, driver''s licence, and car'
      when category = 'Daily Needs' and subcategory = 'Mobile Phone & Internet'
        then 'Mobile phone and internet'
      when category = 'Daily Needs' and subcategory = 'Major Malls'
        then 'Major malls'
      when category = 'Health' and subcategory = 'Additional Healthcare Insurance'
        then 'Additional healthcare insurance'
      when category = 'Health' and subcategory = 'Find Primary Care'
        then 'Finding a family doctor or nurse practitioner'
      when category = 'Health' and subcategory = 'Medical Services & Mental Health'
        then 'Medical services and mental health support'
      when category = 'The City' and subcategory = 'Toronto at a Glance'
        then 'The City: Toronto at a Glance'
      when category = 'The City' and subcategory = 'People & Communities'
        then 'People and Communities'
      when category = 'The City' and subcategory = 'Toronto Neighbourhoods'
        then 'Understanding Toronto’s Neighbourhoods'
      when category = 'The City' and subcategory = 'Climate & Seasonal Planning'
        then 'Climate and Seasonal Planning'
      when category = 'The City' and subcategory = 'Cost & Lifestyle Comparison'
        then 'Cost & Lifestyle Comparison for Different Cities'
      when category = 'Moving & Shipping' and subcategory = 'Official Guidance'
        then 'Official guidance'
      when category = 'Moving & Shipping' and subcategory = 'Moving & Shipping Options'
        then 'Moving and shipping options'
      else subcategory
    end,
    updated_at = now()
where category in (
  'Immigration',
  'Daily Needs',
  'Health',
  'The City',
  'Moving & Shipping'
);

insert into public.static_content (
  category,
  subcategory,
  section_key,
  title,
  body_markdown,
  source_id,
  display_order
)
values
  (
    'Immigration',
    'Social Insurance Number (SIN)',
    'document-copy',
    'Social Insurance Number (SIN)',
    '',
    null,
    1
  ),
  (
    'Immigration',
    'Immigration, Refugees and Citizenship Canada (IRCC)',
    'document-copy',
    'Immigration, Refugees and Citizenship Canada (IRCC)',
    '',
    null,
    1
  ),
  (
    'Immigration',
    'Government Programs Serving Immigrants',
    'document-copy',
    'Government Programs Serving Immigrants',
    '',
    null,
    1
  ),

  (
    'Daily Needs',
    'Home Utilities',
    'document-copy',
    'Home Utilities',
    $doc$* Electricity (“hydro”)
* Water and wastewater/sewer
* Garbage, recycling, and organic collection
* Internet
* Tenant or home insurance$doc$,
    null,
    1
  ),
  (
    'Daily Needs',
    'Groceries',
    'document-copy',
    'Groceries',
    $doc$#### Apps to save $ on groceries:

* where grocers list deeply discounted food: flashfood
* weekly deals: flipp

#### Affordable grocery stores:

* No Frills, FreshCo, Dollarama, Dollar Tree, Costco, Walmart, Real-Canadian-Superstore, etc

#### Tips and recommendations:

* Use coupons found on sites such as Canadian Free Stuff, Save.ca, and Extreme Savings Canada.
* Check your receipt at purchase for accurate pricing, as a price reduction is sometimes missed by the scanner.
* Anything labelled "Organic" will cost 30–40% more.
* Take advantage of store loyalty point programs, as points can later be exchanged for purchases as cash.
* Use price-matching policies: some grocery store will lower the price for you if you find an identical item selling for less at another store. Use the GroceryGo App to help track the best available prices.$doc$,
    null,
    1
  ),
  (
    'Daily Needs',
    'Food banks',
    'document-copy',
    'Food banks',
    $doc$**What are food banks**? They are non-profit organizations that collect and distribute free food to those in need. Food banks source food donations from farms, corporate partners, and individuals.

How it works in:

* Toronto: Daily Bread Food Bank
* GTA: North York Harvest food bank, Food Banks Mississauga$doc$,
    null,
    1
  ),
  (
    'Daily Needs',
    'Transportation — public transit, driver''s licence, and car',
    'document-copy',
    'Transportation — public transit, driver''s licence, and car',
    $doc$#### Public transit:

* across Ontario can be accessed with a single card called PRESTO.

#### Driver's licence: [drivers-licence](https://www.ontario.ca/page/drivers-licence)

#### Car: [buy-or-sell-used-vehicle-ontario](https://www.ontario.ca/page/buy-or-sell-used-vehicle-ontario), [register-out-province-vehicle-ontario](https://www.ontario.ca/page/register-out-province-vehicle-ontario)$doc$,
    null,
    1
  ),
  (
    'Daily Needs',
    'Mobile phone and internet',
    'document-copy',
    'Mobile phone and internet',
    $doc$**4 main providers**: Bell, Rogers, TELUS, Quebecor, and their subsidiary brands

**Two main types of connections:** Prepaid & Postpaid

* **Tips**: If you expect to travel frequently within Canada or work outside major cities, consider Rogers, Bell or TELUS—or a lower-cost brand operating on one of their networks. These three national networks generally provide the broadest coverage, but check the provider’s coverage map for the specific communities and routes you will visit.$doc$,
    null,
    1
  ),
  (
    'Daily Needs',
    'Major malls',
    'document-copy',
    'Major malls',
    $doc$$doc$,
    null,
    1
  ),
  (
    'Health',
    'Healthcare in Ontario',
    'document-copy',
    'Healthcare in Ontario',
    $doc$Ontario has a publicly funded healthcare system, but eligibility and coverage depend on your immigration status and Ontario residency.

For eligible residents, the Ontario Health Insurance Plan—OHIP—covers many medically necessary physician and hospital services. It does **not** cover every healthcare expense. Routine dental care, most take-home prescription drugs, routine vision care for many adults, private counselling and some ambulance costs may require another public program, an employer or school benefit plan, private insurance, or out-of-pocket payment. See [what OHIP covers](https://www.ontario.ca/page/what-ohip-covers). **How to apply**: [Apply for OHIP](https://www.ontario.ca/page/apply-ohip-and-get-health-card)$doc$,
    null,
    1
  ),
  (
    'Health',
    'Additional healthcare insurance',
    'document-copy',
    'Additional healthcare insurance',
    $doc$* Students: [uhip.ca](https://uhip.ca/get-started/)
* Refugee and protected person: [canada.ca](https://www.canada.ca/en/immigration-refugees-citizenship/services/refugees/help-within-canada/health-care.html)
* Major private insurance companies:
  * Sun Life: [sunlife.ca](https://www.sunlife.ca/en/)
  * Manulife: [manulife.com](https://www.manulife.com/ca/en/personal/insurance/our-products/health-insurance)
  * Canada Life: [canadalife.com](https://www.canadalife.com/insurance/health-and-dental-insurance.html)
  * Greenshield: [greenshield.ca](https://www.greenshield.ca/en-ca)
  * Bluecross: [bluecross.ca](https://on.bluecross.ca/)$doc$,
    null,
    1
  ),
  (
    'Health',
    'Finding a family doctor or nurse practitioner',
    'document-copy',
    'Finding a family doctor or nurse practitioner',
    $doc$* Find a family doctor: People with a valid OHIP card who do not have a primary-care provider can register with Health Care Connect: [ontario.ca](https://www.ontario.ca/page/find-family-doctor-or-nurse-practitioner) Or contacting the doctor's office directly. The CPSO Physician Register: [register.cpso.on.ca](https://register.cpso.on.ca/) can verify whether an Ontario doctor is registered and identify restrictions or disciplinary information, but it does not indicate whether the doctor is accepting patients.$doc$,
    null,
    1
  ),
  (
    'Health',
    'Medical services and mental health support',
    'document-copy',
    'Medical services and mental health support',
    $doc$* Major hospitals:
  * University Health Network: [uhn.ca](https://www.uhn.ca/)
  * Unity Health: [unityhealth.to](https://unityhealth.to/)
  * Sinaihealth: [sinaihealth.ca](https://www.sinaihealth.ca/)
  * Sunnybrook: [sunnybrook.ca](https://sunnybrook.ca/)
  * Scarborough Health Network: [shn.ca](https://www.shn.ca/)
  * North York General: [nygh.on.ca](https://www.nygh.on.ca/)
  * Humber River Health: [hrh.ca](https://www.hrh.ca/)
  * SickKids: [sickkids.ca](https://www.sickkids.ca/)
  * Women’s College Hospital: [womenscollegehospital.ca](https://www.womenscollegehospital.ca/)
* HealthLink is a 24/7 medical hotline available at 811.
* You can still see doctors at walk-in clinics: [torontocentralhealthline.ca](https://www.torontocentralhealthline.ca/listservices.aspx?id=10072)
* Mental health hotline: [camh.ca](https://www.camh.ca/en/health-info/crisis-resources)$doc$,
    null,
    1
  ),

  (
    'The City',
    'The City: Toronto at a Glance',
    'document-copy',
    'The City: Toronto at a Glance',
    $doc$Toronto is Canada's largest, most culturally diverse economic hub, featuring four distinct seasons and a growing population (more than three million people live within the City of Toronto). The broader Toronto Census Metropolitan Area—or CMA—includes Toronto and surrounding municipalities and reached approximately 7.1 million residents in July 2024.$doc$,
    null,
    1
  ),
  (
    'The City',
    'People and Communities',
    'document-copy',
    'People and Communities',
    $doc$Toronto's Demographics, Economy & Labour Force: [toronto-economy-labour-force-demographics](https://www.toronto.ca/city-government/data-research-maps/toronto-economy-labour-force-demographics)

Total population, age distribution, gender breakdown, marital status, racial/ethnic diversity, and major languages spoken. Statistics of Canada Census: [census-recensement](https://www12.statcan.gc.ca/census-recensement/index-eng.cfm)$doc$,
    null,
    1
  ),
  (
    'The City',
    'Understanding Toronto’s Neighbourhoods',
    'document-copy',
    'Understanding Toronto’s Neighbourhoods',
    $doc$Geography & Neighbourhoods: Neighborhood breakdowns by lifestyle fit, local amenities, and urban vs. suburban vibe. [Toronto Neighbourhood Profiles](https://www.toronto.ca/city-government/data-research-maps/neighbourhoods-communities/neighbourhood-profiles/)$doc$,
    null,
    1
  ),
  (
    'The City',
    'Climate and Seasonal Planning',
    'document-copy',
    'Climate and Seasonal Planning',
    $doc$Four distinct seasonal patterns, typical summer/winter temperature ranges, and weather conditions. [Environment and Climate Change Canada](https://weather.gc.ca)$doc$,
    null,
    1
  ),
  (
    'The City',
    'Attractions & Recreation',
    'document-copy',
    'Attractions & Recreation',
    $doc$Major landmarks, cultural venues, city parks, and natural trail networks. [Destination Toronto](https://www.destinationtoronto.com) , [City Parks & Recreation](https://www.toronto.ca/explore-enjoy/parks-gardens-beaches/)$doc$,
    null,
    1
  ),
  (
    'The City',
    'Cost & Lifestyle Comparison for Different Cities',
    'document-copy',
    'Cost & Lifestyle Comparison for Different Cities',
    $doc$* CMHC rental market report: [housing-markets-data-and-research](https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/market-reports/rental-market-reports-major-centres)
* Statistics Canada CPI: [statcan.gc](https://www150.statcan.gc.ca/n1/en/catalogue/1810000401)
* Direct cost-of-living comparisons for different cities: [BestPlaces](https://www.bestplaces.net) , [Numbeo](https://www.numbeo.com/cost-of-living/) , [Expatistan](https://www.expatistan.com)$doc$,
    null,
    1
  ),

  (
    'Moving & Shipping',
    'Official guidance',
    'document-copy',
    'Official guidance',
    $doc$* Moving advice - Government of Canada: [moving-advice](https://ised-isde.canada.ca/site/office-consumer-affairs/en/buying-and-leasing-big-ticket-items/moving-advice)
* Bringing personal goods into Canada - CBSA: [cbsa-asfc](https://www.cbsa-asfc.gc.ca/travel-voyage/mrc-drc-eng.html)
* Vehicle import: [importing-vehicle](https://tc.canada.ca/en/road-transportation/importing-vehicle)
* Importing food, plants, or animals: [importing-food-plants-animals](https://inspection.canada.ca/en/importing-food-plants-animals)
* Hiring a mover - Ontario: [hiring-mover](https://www.ontario.ca/page/hiring-mover)$doc$,
    null,
    1
  ),
  (
    'Moving & Shipping',
    'Moving and shipping options',
    'document-copy',
    'Moving and shipping options',
    $doc$
* Airline checked or excess baggage: Check the baggage page of your airline.
* Parcel or courier shipping: [canadapost-postescanada](https://www.canadapost-postescanada.ca/cpc/en/home.page), [fedex](https://www.fedex.com/en-ca/home.html), [ups](https://www.ups.com/ca/en/home), [chitchats](https://chitchats.com/)
* DIY truck or cargo-van rental: You can drive and load yourself [uhaul](https://www.uhaul.com/)
* Containers: [pods](https://www.pods.ca/), [uhaul](https://www.uhaul.com/)
* Professional household mover: [moving](https://www.moving.com/), Canadian Association of Movers Association: [mover](https://www.mover.net/find-a-mover), FIDI international mover: [fidi-france](https://www.fidi-france.com/en)
* Storage lockers in Toronto: Renting from private companies [uhaul-storage](https://www.uhaul.com/Storage/Toronto-ON/), [publicstoragecanada](https://publicstoragecanada.com/), [storage-mart](https://www.storage-mart.com/) $doc$,
    null,
    1
  )
on conflict (category, subcategory, section_key) do update set
  title = excluded.title,
  body_markdown = excluded.body_markdown,
  source_id = excluded.source_id,
  display_order = excluded.display_order,
  updated_at = now();

-- Keep one exact document-copy row plus source-backed rows for Website buttons.
-- Remove old unsourced summaries and clear paraphrased copy from source rows.
delete from public.static_content
where category in (
    'Immigration',
    'Daily Needs',
    'Health',
    'The City',
    'Moving & Shipping'
  )
  and section_key <> 'document-copy'
  and source_id is null;

update public.static_content
set body_markdown = '',
    display_order = display_order + 1,
    updated_at = now()
where category in (
    'Immigration',
    'Daily Needs',
    'Health',
    'The City',
    'Moving & Shipping'
  )
  and section_key <> 'document-copy';

-- Preserve stable Work lookup keys while aligning visible copy with the final
-- document's exact capitalization and wording.
update public.static_content
set title = 'Employment services & Support Agencies',
    updated_at = now()
where category = 'Work'
  and subcategory = 'Employment Services & Support Agencies'
  and section_key = 'description';

update public.static_content
set title = 'Credential recognition',
    updated_at = now()
where category = 'Work'
  and subcategory = 'Credential Recognition'
  and section_key = 'description';

update public.static_content
set title = 'T I P',
    updated_at = now()
where category = 'Work'
  and section_key = 'tip';

update public.static_content
set body_markdown = $doc$Government-funded settlement agencies offer 100% free services to eligible newcomers — including Permanent Residents, Protected Persons, approved PR applicants, and participants in select economic classes (always verify eligibility directly with the agency or on [Canada.ca](http://Canada.ca)). In contrast, provincial programs like Employment Ontario assist anyone holding basic legal work authorization.$doc$,
    updated_at = now()
where category = 'Work'
  and subcategory = 'Employment Services & Support Agencies'
  and section_key = 'tip';

update public.static_content
set body_markdown = $doc$The official federal job board — the best place to find LMIA approved employers and verified Canadian businesses.$doc$,
    updated_at = now()
where category = 'Work'
  and subcategory = 'Job Posting Sites'
  and section_key = 'job-bank-canada';

update public.static_content
set body_markdown = $doc$Recurring professional and interest groups — a low pressure way to build informal industry contacts.$doc$,
    updated_at = now()
where category = 'Work'
  and subcategory = 'Networking'
  and section_key = 'meetup-toronto';

update public.static_content
set subcategory = 'Employment services & Support Agencies',
    updated_at = now()
where category = 'Work'
  and subcategory = 'Employment Services & Support Agencies';

update public.static_content
set subcategory = 'Credential recognition',
    updated_at = now()
where category = 'Work'
  and subcategory = 'Credential Recognition';
