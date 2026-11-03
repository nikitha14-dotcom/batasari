-- Seed category content from Content used under different categories (website, descriptions, etc).

delete from public.static_content
where category in (
  'Immigration',
  'Daily Needs',
  'Health',
  'The City',
  'Moving & Shipping'
);

insert into public.trusted_sources (name, url, authority_tier, jurisdiction)
select v.name, v.url, v.authority_tier, v.jurisdiction
from (values
  ('Canada SIN required documents', 'https://www.canada.ca/en/employment-social-development/services/sin/required-documents.html', 'A', 'Canada'),
  ('Canada SIN application', 'https://www.canada.ca/en/employment-social-development/services/sin/apply.html', 'A', 'Canada'),
  ('IRCC Settlement Program', 'https://www.canada.ca/en/immigration-refugees-citizenship/corporate/transparency/program-terms-conditions/settlement.html', 'A', 'Canada'),
  ('Immigration, Refugees and Citizenship Canada', 'https://www.canada.ca/en/immigration-refugees-citizenship.html', 'A', 'Canada'),
  ('Ontario newcomer services', 'https://www.ontario.ca/page/getting-settled-ontario', 'A', 'Ontario'),
  ('Toronto Newcomer Services Kiosks', 'https://www.toronto.ca/community-people/moving-to-toronto/after-you-arrive-checklist/newcomer-services-kiosks/', 'A', 'Toronto'),
  ('Flashfood', 'https://flashfood.com/', 'C', 'Canada'),
  ('Flipp', 'https://flipp.com/', 'C', 'Canada'),
  ('Canadian Free Stuff', 'https://www.canadianfreestuff.com/', 'C', 'Canada'),
  ('Save.ca', 'https://www.save.ca/', 'C', 'Canada'),
  ('Extreme Savings Canada', 'https://www.extremesavingscanada.com/', 'C', 'Canada'),
  ('Daily Bread Food Bank', 'https://www.dailybread.ca/need-food/how-it-works/', 'C', 'Toronto'),
  ('North York Harvest Food Bank', 'https://northyorkharvest.com/', 'C', 'Toronto'),
  ('Food Banks Mississauga', 'https://www.foodbanksmississauga.ca/', 'C', 'Mississauga'),
  ('PRESTO', 'https://www.prestocard.ca/en', 'A', 'Ontario'),
  ('Ontario driver''s licence', 'https://www.ontario.ca/page/drivers-licence', 'A', 'Ontario'),
  ('Ontario used vehicle guidance', 'https://www.ontario.ca/page/buy-or-sell-used-vehicle-ontario', 'A', 'Ontario'),
  ('Ontario out-of-province vehicle registration', 'https://www.ontario.ca/page/register-out-province-vehicle-ontario', 'A', 'Ontario'),
  ('CF Toronto Eaton Centre', 'https://shops.cadillacfairview.com/property/cf-toronto-eaton-centre', 'C', 'Toronto'),
  ('Yorkdale Shopping Centre', 'https://yorkdale.com/', 'C', 'Toronto'),
  ('Ontario OHIP coverage', 'https://www.ontario.ca/page/what-ohip-covers', 'A', 'Ontario'),
  ('Ontario health card application', 'https://www.ontario.ca/page/apply-ohip-and-get-health-card', 'A', 'Ontario'),
  ('University Health Insurance Plan', 'https://uhip.ca/get-started/', 'C', 'Ontario'),
  ('Interim Federal Health Program', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/refugees/help-within-canada/health-care.html', 'A', 'Canada'),
  ('Sun Life health insurance', 'https://www.sunlife.ca/en/', 'C', 'Canada'),
  ('Manulife health insurance', 'https://www.manulife.com/ca/en/personal/insurance/our-products/health-insurance', 'C', 'Canada'),
  ('Canada Life health and dental insurance', 'https://www.canadalife.com/insurance/health-and-dental-insurance.html', 'C', 'Canada'),
  ('GreenShield', 'https://www.greenshield.ca/en-ca', 'C', 'Canada'),
  ('Ontario Blue Cross', 'https://on.bluecross.ca/', 'C', 'Ontario'),
  ('Health Care Connect', 'https://www.ontario.ca/page/find-family-doctor-or-nurse-practitioner', 'A', 'Ontario'),
  ('CPSO Physician Register', 'https://register.cpso.on.ca/', 'A', 'Ontario'),
  ('University Health Network', 'https://www.uhn.ca/', 'A', 'Toronto'),
  ('Unity Health Toronto', 'https://unityhealth.to/', 'A', 'Toronto'),
  ('Sinai Health', 'https://www.sinaihealth.ca/', 'A', 'Toronto'),
  ('Sunnybrook Health Sciences Centre', 'https://sunnybrook.ca/', 'A', 'Toronto'),
  ('Scarborough Health Network', 'https://www.shn.ca/', 'A', 'Toronto'),
  ('North York General Hospital', 'https://www.nygh.on.ca/', 'A', 'Toronto'),
  ('Humber River Health', 'https://www.hrh.ca/', 'A', 'Toronto'),
  ('SickKids', 'https://www.sickkids.ca/', 'A', 'Toronto'),
  ('Women''s College Hospital', 'https://www.womenscollegehospital.ca/', 'A', 'Toronto'),
  ('Toronto Central Healthline walk-in clinics', 'https://www.torontocentralhealthline.ca/listservices.aspx?id=10072', 'A', 'Toronto'),
  ('CAMH crisis resources', 'https://www.camh.ca/en/health-info/crisis-resources', 'A', 'Ontario'),
  ('Toronto economy and demographics', 'https://www.toronto.ca/city-government/data-research-maps/toronto-economy-labour-force-demographics', 'B', 'Toronto'),
  ('Statistics Canada Census', 'https://www12.statcan.gc.ca/census-recensement/index-eng.cfm', 'B', 'Canada'),
  ('Toronto Neighbourhood Profiles', 'https://www.toronto.ca/city-government/data-research-maps/neighbourhoods-communities/neighbourhood-profiles/', 'B', 'Toronto'),
  ('Environment and Climate Change Canada weather', 'https://weather.gc.ca/', 'A', 'Canada'),
  ('Destination Toronto', 'https://www.destinationtoronto.com/', 'C', 'Toronto'),
  ('Toronto parks and recreation', 'https://www.toronto.ca/explore-enjoy/parks-gardens-beaches/', 'A', 'Toronto'),
  ('CMHC Rental Market Reports', 'https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/market-reports/rental-market-reports-major-centres', 'B', 'Canada'),
  ('Statistics Canada Consumer Price Index', 'https://www150.statcan.gc.ca/n1/en/catalogue/1810000401', 'B', 'Canada'),
  ('BestPlaces', 'https://www.bestplaces.net/', 'C', 'International'),
  ('Numbeo cost of living', 'https://www.numbeo.com/cost-of-living/', 'C', 'International'),
  ('Expatistan', 'https://www.expatistan.com/', 'C', 'International'),
  ('Canada moving advice', 'https://ised-isde.canada.ca/site/office-consumer-affairs/en/buying-and-leasing-big-ticket-items/moving-advice', 'A', 'Canada'),
  ('CBSA moving or returning to Canada', 'https://www.cbsa-asfc.gc.ca/travel-voyage/mrc-drc-eng.html', 'A', 'Canada'),
  ('Transport Canada vehicle import', 'https://tc.canada.ca/en/road-transportation/importing-vehicle', 'A', 'Canada'),
  ('CFIA importing food, plants or animals', 'https://inspection.canada.ca/en/importing-food-plants-animals', 'A', 'Canada'),
  ('Ontario hiring a mover', 'https://www.ontario.ca/page/hiring-mover', 'A', 'Ontario'),
  ('Canada Post', 'https://www.canadapost-postescanada.ca/cpc/en/home.page', 'C', 'Canada'),
  ('FedEx Canada', 'https://www.fedex.com/en-ca/home.html', 'C', 'Canada'),
  ('UPS Canada', 'https://www.ups.com/ca/en/home', 'C', 'Canada'),
  ('Chit Chats', 'https://chitchats.com/', 'C', 'Canada'),
  ('U-Haul truck rental', 'https://www.uhaul.com/', 'C', 'Canada'),
  ('PODS Canada', 'https://www.pods.ca/', 'C', 'Canada'),
  ('Moving.com', 'https://www.moving.com/', 'C', 'International'),
  ('Canadian Association of Movers', 'https://www.mover.net/find-a-mover', 'C', 'Canada'),
  ('FIDI international movers', 'https://www.fidi.org/find-fidi-affiliate', 'C', 'International'),
  ('U-Haul Storage Toronto', 'https://www.uhaul.com/Storage/Toronto-ON/', 'C', 'Toronto'),
  ('Public Storage Canada', 'https://publicstoragecanada.com/', 'C', 'Canada'),
  ('StorageMart', 'https://www.storage-mart.com/', 'C', 'Canada')
) as v(name, url, authority_tier, jurisdiction)
where not exists (
  select 1 from public.trusted_sources t
  where t.name = v.name and t.url = v.url
);

insert into public.static_content (
  category, subcategory, section_key, title, body_markdown, source_id, display_order
)
select
  v.category,
  v.subcategory,
  v.section_key,
  v.title,
  v.body_markdown,
  case when v.source_name is null then null else (
    select t.id from public.trusted_sources t
    where t.name = v.source_name and t.url = v.source_url
    order by t.created_at limit 1
  ) end,
  v.display_order
from (values
  -- Immigration
  ('Immigration', 'Social Insurance Number (SIN)', 'description', 'Social Insurance Number (SIN)', $catalog$For immigration and government requirements, we connect you directly to official sources so you always have the most current information.

A SIN is required to work and to access government programs and benefits.$catalog$, null, null, 1),
  ('Immigration', 'Social Insurance Number (SIN)', 'required-documents', 'Documents Required', $catalog$Documents Required$catalog$, 'Canada SIN required documents', 'https://www.canada.ca/en/employment-social-development/services/sin/required-documents.html', 2),
  ('Immigration', 'Social Insurance Number (SIN)', 'how-to-apply', 'How to Apply', $catalog$How to Apply$catalog$, 'Canada SIN application', 'https://www.canada.ca/en/employment-social-development/services/sin/apply.html', 3),
  ('Immigration', 'IRCC', 'settlement-program', 'IRCC Settlement Program', $catalog$IRCC Settlement Program$catalog$, 'IRCC Settlement Program', 'https://www.canada.ca/en/immigration-refugees-citizenship/corporate/transparency/program-terms-conditions/settlement.html', 1),
  ('Immigration', 'IRCC', 'ircc', 'Immigration, Refugees and Citizenship Canada', $catalog$Immigration, Refugees and Citizenship Canada$catalog$, 'Immigration, Refugees and Citizenship Canada', 'https://www.canada.ca/en/immigration-refugees-citizenship.html', 2),
  ('Immigration', 'Government Programs Serving Immigrants', 'ontario-newcomer-services', 'Ontario Newcomer Services', $catalog$Ontario Newcomer Services$catalog$, 'Ontario newcomer services', 'https://www.ontario.ca/page/getting-settled-ontario', 1),
  ('Immigration', 'Government Programs Serving Immigrants', 'toronto-newcomer-kiosks', 'Toronto Newcomer Services Kiosks', $catalog$Toronto Newcomer Services Kiosks$catalog$, 'Toronto Newcomer Services Kiosks', 'https://www.toronto.ca/community-people/moving-to-toronto/after-you-arrive-checklist/newcomer-services-kiosks/', 2),

  -- Daily Needs
  ('Daily Needs', 'Home Utilities', 'essentials', 'Home Utilities', $catalog$- Electricity ("hydro")
- Water and wastewater/sewer
- Garbage, recycling, and organic collection
- Internet
- Tenant or home insurance$catalog$, null, null, 1),
  ('Daily Needs', 'Groceries', 'description', 'Groceries', $catalog$**Apps to save $ on groceries**

**Affordable grocery stores**

**Tips and recommendations**

Use coupons found on sites such as Canadian Free Stuff, Save.ca, and Extreme Savings Canada.$catalog$, null, null, 1),
  ('Daily Needs', 'Groceries', 'flashfood', 'Flashfood', $catalog$Where grocers list deeply discounted food.$catalog$, 'Flashfood', 'https://flashfood.com/', 2),
  ('Daily Needs', 'Groceries', 'flipp', 'Flipp', $catalog$Weekly deals.$catalog$, 'Flipp', 'https://flipp.com/', 3),
  ('Daily Needs', 'Groceries', 'affordable-stores', 'Affordable Grocery Stores', $catalog$No Frills, FreshCo, Dollarama, Dollar Tree, Costco, Walmart, Real-Canadian-Superstore, etc.$catalog$, null, null, 4),
  ('Daily Needs', 'Groceries', 'canadian-free-stuff', 'Canadian Free Stuff', $catalog$Canadian Free Stuff$catalog$, 'Canadian Free Stuff', 'https://www.canadianfreestuff.com/', 5),
  ('Daily Needs', 'Groceries', 'save-ca', 'Save.ca', $catalog$Save.ca$catalog$, 'Save.ca', 'https://www.save.ca/', 6),
  ('Daily Needs', 'Groceries', 'extreme-savings-canada', 'Extreme Savings Canada', $catalog$Extreme Savings Canada$catalog$, 'Extreme Savings Canada', 'https://www.extremesavingscanada.com/', 7),
  ('Daily Needs', 'Groceries', 'shopping-tips', 'Shopping Tips', $catalog$- Check your receipt at purchase for accurate pricing, as a price reduction is sometimes missed by the scanner.
- Anything labelled "Organic" will cost 30-40% more.
- Take advantage of store loyalty point programs, as points can later be exchanged for purchases as cash.
- Use price-matching policies: some grocery store will lower the price for you if you find an identical item selling for less at another store. Use the GroceryGo App to help track the best available prices.$catalog$, null, null, 8),
  ('Daily Needs', 'Food Banks', 'description', 'Food Banks', $catalog$**What are food banks?** They are non-profit organizations that collect and distribute free food to those in need. Food banks source food donations from farms, corporate partners, and individuals.

How it works in Toronto and the GTA.$catalog$, null, null, 1),
  ('Daily Needs', 'Food Banks', 'daily-bread', 'Daily Bread Food Bank', $catalog$Daily Bread Food Bank$catalog$, 'Daily Bread Food Bank', 'https://www.dailybread.ca/need-food/how-it-works/', 2),
  ('Daily Needs', 'Food Banks', 'north-york-harvest', 'North York Harvest Food Bank', $catalog$North York Harvest Food Bank$catalog$, 'North York Harvest Food Bank', 'https://northyorkharvest.com/', 3),
  ('Daily Needs', 'Food Banks', 'food-banks-mississauga', 'Food Banks Mississauga', $catalog$Food Banks Mississauga$catalog$, 'Food Banks Mississauga', 'https://www.foodbanksmississauga.ca/', 4),
  ('Daily Needs', 'Transportation', 'presto', 'Public Transit and PRESTO', $catalog$Across Ontario can be accessed with a single card called PRESTO.$catalog$, 'PRESTO', 'https://www.prestocard.ca/en', 1),
  ('Daily Needs', 'Transportation', 'drivers-licence', 'Driver''s Licence', $catalog$Driver's Licence$catalog$, 'Ontario driver''s licence', 'https://www.ontario.ca/page/drivers-licence', 2),
  ('Daily Needs', 'Transportation', 'buy-sell-used-vehicle', 'Buying or Selling a Used Vehicle', $catalog$Buying or Selling a Used Vehicle$catalog$, 'Ontario used vehicle guidance', 'https://www.ontario.ca/page/buy-or-sell-used-vehicle-ontario', 3),
  ('Daily Needs', 'Transportation', 'out-of-province-vehicle', 'Register an Out-of-Province Vehicle', $catalog$Register an Out-of-Province Vehicle$catalog$, 'Ontario out-of-province vehicle registration', 'https://www.ontario.ca/page/register-out-province-vehicle-ontario', 4),
  ('Daily Needs', 'Mobile Phone & Internet', 'description', 'Mobile Phone and Internet', $catalog$**4 main providers:** Bell, Rogers, TELUS, Quebecor, and their subsidiary brands.

**Two main types of connections:** Prepaid & Postpaid.

**Tip:** If you expect to travel frequently within Canada or work outside major cities, consider Rogers, Bell or TELUS - or a lower-cost brand operating on one of their networks. These three national networks generally provide the broadest coverage, but check the provider's coverage map for the specific communities and routes you will visit.$catalog$, null, null, 1),
  ('Daily Needs', 'Major Malls', 'toronto-eaton-centre', 'CF Toronto Eaton Centre', $catalog$CF Toronto Eaton Centre$catalog$, 'CF Toronto Eaton Centre', 'https://shops.cadillacfairview.com/property/cf-toronto-eaton-centre', 1),
  ('Daily Needs', 'Major Malls', 'yorkdale', 'Yorkdale Shopping Centre', $catalog$Yorkdale Shopping Centre$catalog$, 'Yorkdale Shopping Centre', 'https://yorkdale.com/', 2),

  -- Health
  ('Health', 'Healthcare in Ontario', 'description', 'Healthcare in Ontario', $catalog$Ontario has a publicly funded healthcare system, but eligibility and coverage depend on your immigration status and Ontario residency.$catalog$, null, null, 1),
  ('Health', 'Healthcare in Ontario', 'ohip-coverage', 'What OHIP Covers', $catalog$For eligible residents, the Ontario Health Insurance Plan - OHIP - covers many medically necessary physician and hospital services. It does not cover every healthcare expense. Routine dental care, most take-home prescription drugs, routine vision care for many adults, private counselling and some ambulance costs may require another public program, an employer or school benefit plan, private insurance, or out-of-pocket payment.$catalog$, 'Ontario OHIP coverage', 'https://www.ontario.ca/page/what-ohip-covers', 2),
  ('Health', 'Healthcare in Ontario', 'apply-ohip', 'Apply for OHIP', $catalog$Apply for OHIP$catalog$, 'Ontario health card application', 'https://www.ontario.ca/page/apply-ohip-and-get-health-card', 3),
  ('Health', 'Additional Healthcare Insurance', 'uhip', 'Students', $catalog$Students$catalog$, 'University Health Insurance Plan', 'https://uhip.ca/get-started/', 1),
  ('Health', 'Additional Healthcare Insurance', 'ifhp', 'Refugees and Protected Persons', $catalog$Refugees and Protected Persons$catalog$, 'Interim Federal Health Program', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/refugees/help-within-canada/health-care.html', 2),
  ('Health', 'Additional Healthcare Insurance', 'sun-life', 'Sun Life', $catalog$Sun Life$catalog$, 'Sun Life health insurance', 'https://www.sunlife.ca/en/', 3),
  ('Health', 'Additional Healthcare Insurance', 'manulife', 'Manulife', $catalog$Manulife$catalog$, 'Manulife health insurance', 'https://www.manulife.com/ca/en/personal/insurance/our-products/health-insurance', 4),
  ('Health', 'Additional Healthcare Insurance', 'canada-life', 'Canada Life', $catalog$Canada Life$catalog$, 'Canada Life health and dental insurance', 'https://www.canadalife.com/insurance/health-and-dental-insurance.html', 5),
  ('Health', 'Additional Healthcare Insurance', 'greenshield', 'GreenShield', $catalog$GreenShield$catalog$, 'GreenShield', 'https://www.greenshield.ca/en-ca', 6),
  ('Health', 'Additional Healthcare Insurance', 'blue-cross', 'Ontario Blue Cross', $catalog$Ontario Blue Cross$catalog$, 'Ontario Blue Cross', 'https://on.bluecross.ca/', 7),
  ('Health', 'Find Primary Care', 'health-care-connect', 'Find a Family Doctor or Nurse Practitioner', $catalog$Find a family doctor: People with a valid OHIP card who do not have a primary-care provider can register with Health Care Connect. Or contact the doctor's office directly.$catalog$, 'Health Care Connect', 'https://www.ontario.ca/page/find-family-doctor-or-nurse-practitioner', 1),
  ('Health', 'Find Primary Care', 'cpso-register', 'The CPSO Physician Register', $catalog$The CPSO Physician Register can verify whether an Ontario doctor is registered and identify restrictions or disciplinary information, but it does not indicate whether the doctor is accepting patients.$catalog$, 'CPSO Physician Register', 'https://register.cpso.on.ca/', 2),
  ('Health', 'Medical Services & Mental Health', 'health-811', 'HealthLink', $catalog$HealthLink is a 24/7 medical hotline available at 811.$catalog$, null, null, 1),
  ('Health', 'Medical Services & Mental Health', 'walk-in-clinics', 'Walk-in Clinics', $catalog$You can still see doctors at walk-in clinics.$catalog$, 'Toronto Central Healthline walk-in clinics', 'https://www.torontocentralhealthline.ca/listservices.aspx?id=10072', 2),
  ('Health', 'Medical Services & Mental Health', 'camh-crisis', 'Mental Health Hotline', $catalog$Mental health hotline.$catalog$, 'CAMH crisis resources', 'https://www.camh.ca/en/health-info/crisis-resources', 3),
  ('Health', 'Medical Services & Mental Health', 'uhn', 'University Health Network', $catalog$University Health Network$catalog$, 'University Health Network', 'https://www.uhn.ca/', 4),
  ('Health', 'Medical Services & Mental Health', 'unity-health', 'Unity Health Toronto', $catalog$Unity Health Toronto$catalog$, 'Unity Health Toronto', 'https://unityhealth.to/', 5),
  ('Health', 'Medical Services & Mental Health', 'sinai-health', 'Sinai Health', $catalog$Sinai Health$catalog$, 'Sinai Health', 'https://www.sinaihealth.ca/', 6),
  ('Health', 'Medical Services & Mental Health', 'sunnybrook', 'Sunnybrook Health Sciences Centre', $catalog$Sunnybrook Health Sciences Centre$catalog$, 'Sunnybrook Health Sciences Centre', 'https://sunnybrook.ca/', 7),
  ('Health', 'Medical Services & Mental Health', 'scarborough-health', 'Scarborough Health Network', $catalog$Scarborough Health Network$catalog$, 'Scarborough Health Network', 'https://www.shn.ca/', 8),
  ('Health', 'Medical Services & Mental Health', 'north-york-general', 'North York General Hospital', $catalog$North York General Hospital$catalog$, 'North York General Hospital', 'https://www.nygh.on.ca/', 9),
  ('Health', 'Medical Services & Mental Health', 'humber-river-health', 'Humber River Health', $catalog$Humber River Health$catalog$, 'Humber River Health', 'https://www.hrh.ca/', 10),
  ('Health', 'Medical Services & Mental Health', 'sickkids', 'SickKids', $catalog$SickKids$catalog$, 'SickKids', 'https://www.sickkids.ca/', 11),
  ('Health', 'Medical Services & Mental Health', 'womens-college', 'Women''s College Hospital', $catalog$Women's College Hospital$catalog$, 'Women''s College Hospital', 'https://www.womenscollegehospital.ca/', 12),

  -- The City
  ('The City', 'Toronto at a Glance', 'description', 'Toronto at a Glance', $catalog$Toronto is Canada's largest, most culturally diverse economic hub, featuring four distinct seasons and a growing population (more than three million people live within the City of Toronto). The broader Toronto Census Metropolitan Area - or CMA - includes Toronto and surrounding municipalities and reached approximately 7.1 million residents in July 2024.$catalog$, null, null, 1),
  ('The City', 'People & Communities', 'toronto-demographics', 'Toronto Demographics, Economy and Labour Force', $catalog$Toronto's Demographics, Economy & Labour Force.$catalog$, 'Toronto economy and demographics', 'https://www.toronto.ca/city-government/data-research-maps/toronto-economy-labour-force-demographics', 1),
  ('The City', 'People & Communities', 'canada-census', 'Statistics Canada Census', $catalog$Total population, age distribution, gender breakdown, marital status, racial/ethnic diversity, and major languages spoken.$catalog$, 'Statistics Canada Census', 'https://www12.statcan.gc.ca/census-recensement/index-eng.cfm', 2),
  ('The City', 'Toronto Neighbourhoods', 'neighbourhood-profiles', 'Toronto Neighbourhood Profiles', $catalog$Geography & Neighbourhoods: Neighborhood breakdowns by lifestyle fit, local amenities, and urban vs. suburban vibe.$catalog$, 'Toronto Neighbourhood Profiles', 'https://www.toronto.ca/city-government/data-research-maps/neighbourhoods-communities/neighbourhood-profiles/', 1),
  ('The City', 'Climate & Seasonal Planning', 'weather', 'Weather and Seasonal Planning', $catalog$Four distinct seasonal patterns, typical summer/winter temperature ranges, and weather conditions.$catalog$, 'Environment and Climate Change Canada weather', 'https://weather.gc.ca/', 1),
  ('The City', 'Attractions & Recreation', 'destination-toronto', 'Destination Toronto', $catalog$Major landmarks, cultural venues, city parks, and natural trail networks.$catalog$, 'Destination Toronto', 'https://www.destinationtoronto.com/', 1),
  ('The City', 'Attractions & Recreation', 'parks-recreation', 'City Parks & Recreation', $catalog$Major landmarks, cultural venues, city parks, and natural trail networks.$catalog$, 'Toronto parks and recreation', 'https://www.toronto.ca/explore-enjoy/parks-gardens-beaches/', 2),
  ('The City', 'Cost & Lifestyle Comparison', 'cmhc-rental-reports', 'Rental Market Reports', $catalog$Rental Market Reports$catalog$, 'CMHC Rental Market Reports', 'https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/market-reports/rental-market-reports-major-centres', 1),
  ('The City', 'Cost & Lifestyle Comparison', 'statistics-canada-cpi', 'Consumer Price Index', $catalog$Consumer Price Index$catalog$, 'Statistics Canada Consumer Price Index', 'https://www150.statcan.gc.ca/n1/en/catalogue/1810000401', 2),
  ('The City', 'Cost & Lifestyle Comparison', 'bestplaces', 'BestPlaces', $catalog$BestPlaces$catalog$, 'BestPlaces', 'https://www.bestplaces.net/', 3),
  ('The City', 'Cost & Lifestyle Comparison', 'numbeo', 'Numbeo', $catalog$Numbeo$catalog$, 'Numbeo cost of living', 'https://www.numbeo.com/cost-of-living/', 4),
  ('The City', 'Cost & Lifestyle Comparison', 'expatistan', 'Expatistan', $catalog$Expatistan$catalog$, 'Expatistan', 'https://www.expatistan.com/', 5),

  -- Moving & Shipping
  ('Moving & Shipping', 'Official Guidance', 'canada-moving-advice', 'Moving Advice', $catalog$Moving Advice$catalog$, 'Canada moving advice', 'https://ised-isde.canada.ca/site/office-consumer-affairs/en/buying-and-leasing-big-ticket-items/moving-advice', 1),
  ('Moving & Shipping', 'Official Guidance', 'bringing-goods', 'Bringing Personal Goods into Canada', $catalog$Bringing Personal Goods into Canada$catalog$, 'CBSA moving or returning to Canada', 'https://www.cbsa-asfc.gc.ca/travel-voyage/mrc-drc-eng.html', 2),
  ('Moving & Shipping', 'Official Guidance', 'vehicle-import', 'Importing a Vehicle', $catalog$Importing a Vehicle$catalog$, 'Transport Canada vehicle import', 'https://tc.canada.ca/en/road-transportation/importing-vehicle', 3),
  ('Moving & Shipping', 'Official Guidance', 'food-plants-animals', 'Importing Food, Plants or Animals', $catalog$Importing Food, Plants or Animals$catalog$, 'CFIA importing food, plants or animals', 'https://inspection.canada.ca/en/importing-food-plants-animals', 4),
  ('Moving & Shipping', 'Official Guidance', 'hiring-mover', 'Hiring a Mover in Ontario', $catalog$Hiring a Mover in Ontario$catalog$, 'Ontario hiring a mover', 'https://www.ontario.ca/page/hiring-mover', 5),
  ('Moving & Shipping', 'Moving & Shipping Options', 'description', 'Moving and Shipping Options', $catalog$**Airline checked or excess baggage**

Check the baggage page of your airline.

**Parcel or courier shipping**

Examples: Canada Post, FedEx, UPS, and Chit Chats.

**DIY truck or cargo-van rental**

You can drive and load yourself, for example U-Haul.

**Containers**

Examples: PODS and U-Haul.

**Professional household mover**

Compare movers through Moving.com, the Canadian Association of Movers, and FIDI international movers.

**Storage lockers in Toronto**

Renting from private companies such as U-Haul Storage Toronto, Public Storage Canada, and StorageMart.$catalog$, null, null, 1),
  ('Moving & Shipping', 'Moving & Shipping Options', 'canada-post', 'Canada Post', $catalog$Parcel or courier shipping.$catalog$, 'Canada Post', 'https://www.canadapost-postescanada.ca/cpc/en/home.page', 2),
  ('Moving & Shipping', 'Moving & Shipping Options', 'fedex', 'FedEx Canada', $catalog$Parcel or courier shipping.$catalog$, 'FedEx Canada', 'https://www.fedex.com/en-ca/home.html', 3),
  ('Moving & Shipping', 'Moving & Shipping Options', 'ups', 'UPS Canada', $catalog$Parcel or courier shipping.$catalog$, 'UPS Canada', 'https://www.ups.com/ca/en/home', 4),
  ('Moving & Shipping', 'Moving & Shipping Options', 'chit-chats', 'Chit Chats', $catalog$Parcel or courier shipping.$catalog$, 'Chit Chats', 'https://chitchats.com/', 5),
  ('Moving & Shipping', 'Moving & Shipping Options', 'uhaul-rental', 'U-Haul', $catalog$You can drive and load yourself.$catalog$, 'U-Haul truck rental', 'https://www.uhaul.com/', 6),
  ('Moving & Shipping', 'Moving & Shipping Options', 'pods', 'PODS Canada', $catalog$Containers.$catalog$, 'PODS Canada', 'https://www.pods.ca/', 7),
  ('Moving & Shipping', 'Moving & Shipping Options', 'moving-com', 'Moving.com', $catalog$Professional household mover.$catalog$, 'Moving.com', 'https://www.moving.com/', 8),
  ('Moving & Shipping', 'Moving & Shipping Options', 'canadian-movers', 'Canadian Association of Movers', $catalog$Professional household mover.$catalog$, 'Canadian Association of Movers', 'https://www.mover.net/find-a-mover', 9),
  ('Moving & Shipping', 'Moving & Shipping Options', 'fidi', 'FIDI International Movers', $catalog$Professional household mover.$catalog$, 'FIDI international movers', 'https://www.fidi.org/find-fidi-affiliate', 10),
  ('Moving & Shipping', 'Moving & Shipping Options', 'uhaul-storage', 'U-Haul Storage Toronto', $catalog$Storage lockers in Toronto.$catalog$, 'U-Haul Storage Toronto', 'https://www.uhaul.com/Storage/Toronto-ON/', 11),
  ('Moving & Shipping', 'Moving & Shipping Options', 'public-storage', 'Public Storage Canada', $catalog$Storage lockers in Toronto.$catalog$, 'Public Storage Canada', 'https://publicstoragecanada.com/', 12),
  ('Moving & Shipping', 'Moving & Shipping Options', 'storage-mart', 'StorageMart', $catalog$Storage lockers in Toronto.$catalog$, 'StorageMart', 'https://www.storage-mart.com/', 13)
) as v(category, subcategory, section_key, title, body_markdown, source_name, source_url, display_order)
on conflict (category, subcategory, section_key) do update set
  title = excluded.title,
  body_markdown = excluded.body_markdown,
  source_id = excluded.source_id,
  display_order = excluded.display_order,
  updated_at = now();

