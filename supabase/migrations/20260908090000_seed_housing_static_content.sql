-- Curated Housing static content with source URLs and authority tiers
-- Depends on 20260907090000_claim_store_and_static_content.sql.
-- Rows with Website button URLs point to trusted_sources through source_id.
-- Rows without a source URL keep source_id NULL.

delete from public.static_content where category = 'Housing';

-- ---------------------------------------------------------------------------
-- Source registry
-- ---------------------------------------------------------------------------
insert into public.trusted_sources (name, url, authority_tier, jurisdiction)
select v.name, v.url, v.authority_tier, v.jurisdiction
from (values
  ('Toronto Shelter System',   'https://www.toronto.ca/community-people/housing-shelter/', 'A', 'Toronto'),
  ('Hostelworld',              'https://www.hostelworld.com/',                             'C', 'Ontario'),
  ('Expedia',                  'https://www.expedia.ca/',                                 'C', 'Ontario'),
  ('Booking.com',              'https://www.booking.com/',                                'C', 'Ontario'),
  ('Hotels.com',               'https://ca.hotels.com/',                                  'C', 'Ontario'),
  ('Trip.com',                 'https://www.trip.com/',                                   'C', 'Ontario'),
  ('Priceline',                'https://www.priceline.com/',                              'C', 'Ontario'),
  ('Trivago',                  'https://www.trivago.ca/',                                 'C', 'Ontario'),
  ('Airbnb',                   'https://www.airbnb.ca/',                                  'C', 'Ontario'),
  ('Airbnb Monthly Stays',     'https://www.airbnb.ca/toronto-canada/stays/monthly',      'C', 'Toronto'),
  ('Happipad',                 'https://happipad.com/',                                   'C', 'Ontario'),
  ('Roomies',                  'https://www.roomies.ca/',                                 'C', 'Ontario'),
  ('Zumper',                   'https://www.zumper.com/',                                 'C', 'Ontario'),
  ('Craigslist',               'https://www.craigslist.org/search/area/toronto?cat=apa#search=2~gallery~0', 'D', 'Toronto'),
  ('Facebook Marketplace',     'https://www.facebook.com/marketplace/',                    'D', 'Ontario'),
  ('Rentals.ca',               'https://rentals.ca/',                                     'C', 'Ontario'),
  ('PadMapper',                'https://www.padmapper.com/',                              'C', 'Ontario'),
  ('liv.rent',                 'https://liv.rent/',                                       'C', 'Ontario'),
  ('Apartments.com',           'https://www.apartments.com/',                             'C', 'Ontario'),
  ('Viewit.ca',                'https://viewit.ca/',                                      'C', 'Ontario'),
  ('RentSeeker.ca',            'https://www.rentseeker.ca/',                              'C', 'Ontario'),
  ('4Rent.ca',                 'https://4rent.ca/',                                       'C', 'Ontario'),
  ('Kijiji Real Estate',       'https://www.kijiji.ca/h-real-estate/108',                  'D', 'Ontario'),
  ('Realtor.ca',               'https://www.realtor.ca/',                                 'C', 'Ontario'),
  ('Condos.ca',                'https://condos.ca/',                                      'C', 'Ontario'),
  ('Property.ca',              'https://property.ca/',                                    'C', 'Ontario'),
  ('Strata.ca',                'https://strata.ca/',                                      'C', 'Ontario'),
  ('HouseSigma',               'https://www.housesigma.com/',                             'C', 'Ontario'),
  ('RentCafe',                 'https://www.rentcafe.com/canada',                         'C', 'Ontario'),
  ('Capreit',                  'https://www.capreit.ca/',                                 'C', 'Ontario'),
  ('Bwalk',                    'https://www.bwalk.com/',                                  'C', 'Ontario'),
  ('Realstar',                 'https://www.realstar.ca/',                                'C', 'Ontario'),
  ('Minto Apartments',         'https://www.minto-apartments.com/',                       'C', 'Ontario'),
  ('Greenwin',                 'https://www.greenwin.ca/apartments-for-rent/cities/toronto', 'C', 'Toronto'),
  ('Kijiji',                   'https://www.kijiji.ca/',                                  'D', 'Ontario'),
  ('CanadaHomeshare',          'https://www.canadahomeshare.com/',                        'C', 'Ontario'),
  ('Places4Students',          'https://www.places4students.com/',                        'C', 'Ontario'),
  ('Canadian Anti-Fraud Centre: Rental fraud', 'https://antifraudcentre-centreantifraude.ca/scams-fraudes/merchandise-marchandises-eng.htm', 'A', 'Canada'),
  ('Competition Bureau: Common scams', 'https://competition-bureau.canada.ca/en/fraud-and-scams/common-scams-and-deceptive-marketing-practices-and-how-avoid-them', 'A', 'Canada'),
  ('RECO Registrant Search',   'https://registrantsearch.reco.on.ca/',                    'A', 'Ontario'),
  ('OnLand Property Search',   'https://help.onland.ca/en/property-search/',              'A', 'Ontario'),
  ('Ontario Standard Lease',   'https://forms.mgcs.gov.on.ca/en/dataset/047-2229', 'A', 'Ontario'),
  ('Privacy Commissioner: Landlords and tenants', 'https://www.priv.gc.ca/en/privacy-topics/landlords-and-tenants/privacy-in-the-landlord-and-tenant-relationship/', 'A', 'Canada'),
  ('Steps to Justice: Renting in Ontario', 'https://stepstojustice.ca/resource/renting-in-ontario-your-rights-who-s-protected-by-rental-rules/?utm_source=chatgpt.com', 'C', 'Ontario'),
  ('Toronto Police: Online reporting', 'https://www.tps.ca/services/online-reporting/',        'A', 'Toronto')
) as v(name, url, authority_tier, jurisdiction)
where not exists (
  select 1
  from public.trusted_sources t
  where t.name = v.name and t.url = v.url
);

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------
insert into public.static_content (category, subcategory, section_key, title, body_markdown, source_id, display_order)
select 'Housing', v.subcategory, v.section_key, v.title, v.body_markdown,
       case when v.source_name is null then null
            else (select t.id from public.trusted_sources t where t.name = v.source_name)
       end,
       v.display_order
from (values
  -- Find Housing
  ('Find Housing',
   'choose-housing-type',
   'Choose the right type of housing',
   $h$
Temporary (days - weeks)

Short-term and Mid-term rentals (1 - 6 months)

Long-term rentals
$h$,
   null, 1),
  ('Find Housing',
   'temporary-emergency-accommodation',
   'Toronto Shelter System',
   $h$
Emergency accommodation and support for people experiencing homelessness; not a rental-booking service. Contact 311 or Central Intake for placement.
$h$,
   'Toronto Shelter System', 2),
  ('Find Housing',
   'temporary-hotel-hostelworld',
   'Hostelworld',
   $h$
Booking website.
$h$,
   'Hostelworld', 3),
  ('Find Housing',
   'temporary-hotel-expedia',
   'Expedia',
   $h$
Booking website.
$h$,
   'Expedia', 4),
  ('Find Housing',
   'temporary-hotel-booking-com',
   'Booking.com',
   $h$
Booking website.
$h$,
   'Booking.com', 5),
  ('Find Housing',
   'temporary-hotel-hotels-com',
   'Hotels.com',
   $h$
Booking website.
$h$,
   'Hotels.com', 6),
  ('Find Housing',
   'temporary-hotel-trip-com',
   'Trip.com',
   $h$
Booking website.
$h$,
   'Trip.com', 7),
  ('Find Housing',
   'temporary-hotel-priceline',
   'Priceline',
   $h$
Booking website.
$h$,
   'Priceline', 8),
  ('Find Housing',
   'temporary-hotel-trivago',
   'Trivago',
   $h$
Hotel price comparison website.
$h$,
   'Trivago', 9),
  ('Find Housing',
   'temporary-airbnb',
   'Airbnb',
   $h$
Short-term residential rentals booked directly with local home hosts.
$h$,
   'Airbnb', 10),
  ('Find Housing',
   'short-term-airbnb-monthly',
   'Airbnb Monthly Stays',
   $h$
Furnished rooms and entire homes offered for stays of one month or longer; fees, rules, and cancellation terms vary by listing.
$h$,
   'Airbnb Monthly Stays', 11),
  ('Find Housing',
   'short-term-blueground',
   'Blueground Toronto',
   $h$
Professionally managed, move-in-ready furnished apartments for stays typically starting at 30 nights.
$h$,
   null, 12),
  ('Find Housing',
   'short-term-happipad',
   'Happipad',
   $h$
Home-sharing platform connecting renters with hosts, with ID verification and background checks on both sides.
$h$,
   'Happipad', 13),
  ('Find Housing',
   'short-term-roomies',
   'Roomies',
   $h$
Shared housing and room rentals. Optional phone, government-ID, credit, and background-check badges.
$h$,
   'Roomies', 14),
  ('Find Housing',
   'short-term-zumper',
   'Zumper',
   $h$
Rental marketplace with short-term and furnished options. The platform labels verified listings using a badge.
$h$,
   'Zumper', 15),
  ('Find Housing',
   'short-term-craigslist-sublets',
   'Craigslist Sublets',
   $h$
Peer-to-peer sublets and temporary rentals. It carries a higher scam risk. Verify the landlord, unit, and lease before transferring money.
$h$,
   'Craigslist', 16),
  ('Find Housing',
   'short-term-facebook-marketplace',
   'Facebook Marketplace',
   $h$
Peer-to-peer rooms, sublets, and lease takeovers. It carry a higher scam risk. Verify the landlord, unit, and lease before transferring money.
$h$,
   'Facebook Marketplace', 17),
  ('Find Housing',
   'long-term-marketplaces-intro',
   'Rental Marketplaces and Directories',
   $h$
Listings may be posted directly by landlords or property managers, by licensed agents on the landlord's behalf, or aggregated from other sites. The renter contacts the advertiser and applies directly
$h$,
   null, 18),
  ('Find Housing',
   'long-term-rentals-ca',
   'Rentals.ca',
   $h$
owns Rentfaster.ca, Rentboard.ca, RentCanada.com, TorontoRentals.com, Louer.ca.
$h$,
   'Rentals.ca', 19),
  ('Find Housing',
   'long-term-padmapper',
   'PadMapper',
   $h$
Map-based rental search tool, syndication/aggregation layer, so stale and duplicate listings exist.
$h$,
   'PadMapper', 20),
  ('Find Housing',
   'long-term-livrent',
   'liv.rent',
   $h$
all-in-one hub where landlords and tenants can handle the entire rental process—from initial listing and chat-based applications to electronic lease execution and automated payment processing
$h$,
   'liv.rent', 21),
  ('Find Housing',
   'long-term-apartments-com',
   'Apartments.com',
   $h$
Coverage is thin outside a few big cities in Canada.
$h$,
   'Apartments.com', 22),
  ('Find Housing',
   'long-term-viewit',
   'Viewit.ca',
   $h$
Apartment rental directory, especially useful for managed buildings.
$h$,
   'Viewit.ca', 23),
  ('Find Housing',
   'long-term-rentseeker',
   'RentSeeker',
   $h$
Rental listings for apartments and multi-family buildings.
$h$,
   'RentSeeker.ca', 24),
  ('Find Housing',
   'long-term-4rent',
   '4Rent.ca',
   $h$
Listings for apartments and managed rental buildings.
$h$,
   '4Rent.ca', 25),
  ('Find Housing',
   'long-term-kijiji-real-estate',
   'Kijiji Real Estate',
   $h$
Classified listings including private landlord rentals, higher scam risks.
$h$,
   'Kijiji Real Estate', 26),
  ('Find Housing',
   'agent-listed-intro',
   'Agent-Listed Rentals (MLS)',
   $h$
Rentals here are listed on MLS by brokerages. A tenant's agent handles viewings, the application, and the offer to lease — normally paid by the landlord's brokerage (about one month's rent, split), at no direct cost to you. Confirm this, since arrangements vary.

Before signing: ask if the representation agreement is exclusive, how long it runs, and whether you could owe a fee. In Ontario, no written agreement means you're a self-represented party — the agent owes you no duty of care.

Realtor.ca is operated by CREA and represents no one — enquiries go directly to the listing brokerage. The others are operated by brokerages: registering or requesting a viewing routes you to one of their agents, and their leased-price history is behind a free account. That history is the main reason to use them.
$h$,
   null, 27),
  ('Find Housing',
   'agent-listed-realtor-ca',
   'Realtor.ca',
   $h$
The national MLS portal. Not a brokerage; contact goes to the listing brokerage. Coverage is a subset of local board data, since syndication is opt-in.
$h$,
   'Realtor.ca', 28),
  ('Find Housing',
   'agent-listed-condos-ca',
   'Condos.ca',
   $h$
Same brokerage, two front-ends. Condo.ca focuses on condos, with building profiles, rental history, and market data.
$h$,
   'Condos.ca', 29),
  ('Find Housing',
   'agent-listed-property-ca',
   'Property.ca',
   $h$
Same brokerage, two front-ends. Property.ca has other types of properties like houses.
$h$,
   'Property.ca', 30),
  ('Find Housing',
   'agent-listed-strata-ca',
   'Strata.ca',
   $h$
Ontario condo, loft, and townhouse rentals with building data and agent assistance.
$h$,
   'Strata.ca', 31),
  ('Find Housing',
   'agent-listed-housesigma',
   'HouseSigma',
   $h$
Covers more than Ontario. Sale and rental listings with leased history, map tools, and estimates.
$h$,
   'HouseSigma', 32),
  ('Find Housing',
   'managed-buildings-intro',
   'Managed Buildings',
   $h$
Rental buildings are operated as rental properties by a company rather than rented by individual condo owners. They often use standardized applications, screening, leases, and maintenance processes. Applying through the operator's verified website can reduce scam risk, especially when renting from outside Toronto. Pricing may be less negotiable, although move-in promotions are sometimes available.
$h$,
   null, 33),
  ('Find Housing',
   'managed-rentcafe',
   'RentCafe',
   $h$
Yardi-operated rental portal where listings come directly from property managers. Many properties provide current availability, floor plans, tours, and online applications.
$h$,
   'RentCafe', 34),
  ('Find Housing',
   'managed-4rent',
   '4Rent.ca',
   $h$
Canadian rental portal connecting renters with property owners and managers, with many purpose-built apartment listings.
$h$,
   '4Rent.ca', 35),
  ('Find Housing',
   'managed-rentseeker',
   'RentSeeker.ca',
   $h$
Canadian rental directory covering apartments, condos, houses, and townhouses, including many professionally managed buildings.
$h$,
   'RentSeeker.ca', 36),
  ('Find Housing',
   'managed-capreit',
   'Capreit',
   $h$
Large operators list vacancies on their own sites first — the freshest inventory and no third-party middleman.
$h$,
   'Capreit', 37),
  ('Find Housing',
   'managed-bwalk',
   'Bwalk',
   $h$
Large operators list vacancies on their own sites first — the freshest inventory and no third-party middleman.
$h$,
   'Bwalk', 38),
  ('Find Housing',
   'managed-realstar',
   'Realstar',
   $h$
Large operators list vacancies on their own sites first — the freshest inventory and no third-party middleman.
$h$,
   'Realstar', 39),
  ('Find Housing',
   'managed-minto',
   'Minto Apartments',
   $h$
Large operators list vacancies on their own sites first — the freshest inventory and no third-party middleman.
$h$,
   'Minto Apartments', 40),
  ('Find Housing',
   'managed-greenwin',
   'Greenwin',
   $h$
Large operators list vacancies on their own sites first — the freshest inventory and no third-party middleman.
$h$,
   'Greenwin', 41),
  ('Find Housing',
   'private-landlords-intro',
   'Private landlords',
   $h$
Individual owners may rent out condos, houses, basements, or rooms directly. They may offer more flexibility on rent, move-in dates, lease length, or application documents, but screening and communication vary by landlord. Most Ontario tenancies still require the Ontario standard lease. On classified platforms, independently verify the advertiser's identity and authority to rent the property before paying.
$h$,
   null, 42),
  ('Find Housing',
   'private-livrent',
   'liv.rent',
   $h$
Rental platform for individual landlords and property managers. Verification badges identify landlords and listings validated using identification and property or business documents. Also supports applications and digital leases.
$h$,
   'liv.rent', 43),
  ('Find Housing',
   'private-facebook-marketplace',
   'Facebook Marketplace',
   $h$
General classifieds marketplace with listings from landlords, tenants, agents, and property managers. Do not assume the advertiser's identity or ownership has been verified.
$h$,
   'Facebook Marketplace', 44),
  ('Find Housing',
   'private-facebook-groups',
   'Facebook rental groups',
   $h$
Community-run, city- or neighbourhood-specific rental groups. Moderation and membership screening vary, and posts may come from landlords, agents, tenants, etc
$h$,
   null, 45),
  ('Find Housing',
   'private-kijiji',
   'Kijiji',
   $h$
Classified rental listings from private landlords, tenants, agents, and property managers. Inventory is broad, but listings require independent verification.
$h$,
   'Kijiji', 46),
  ('Find Housing',
   'private-craigslist',
   'Craigslist Toronto',
   $h$
Direct classifieds for apartments, houses, rooms, and other rentals.
$h$,
   'Craigslist', 47),
  ('Find Housing',
   'rooms-shared-intro',
   'Rooms and shared housing',
   $h$
Your rights in shared housing depend heavily on the arrangement. If you're required to share a kitchen or bathroom with the owner (or certain immediate family members of the owner who live in the building), the Residential Tenancies Act (RTA) generally does not apply. If you're moving into an existing tenant's home without becoming a tenant yourself, you may be an occupant/roommate rather than an RTA tenant.

Before paying a deposit, confirm who you're renting from, whether the owner lives there, what facilities you share, and whether you'll be named on the lease.
$h$,
   null, 48),
  ('Find Housing',
   'rooms-shared-types',
   'Rooms and shared housing — your legal position',
   $h$
| Type | Your legal position | Where to look |
| --- | --- | --- |
| Room in the owner's home (shared kitchen/bath) | Generally not covered by the RTA | [happipad.com](https://happipad.com/), [canadahomeshare.com](https://www.canadahomeshare.com/), Kijiji rooms |
| Joining an existing roommate household | May be a roommate/occupant rather than a tenant — confirm whether you'll be added to the lease | [roomies.ca](https://www.roomies.ca/), Facebook groups |
| Multi-tenant house | Four or more rooms rented separately to people who share a kitchen or bathroom but don't live as one household. Usually covered by the RTA | [kijiji.ca](https://www.kijiji.ca/), Facebook Marketplace/groups, [Roomies.ca](https://www.roomies.ca/) |
| Student housing | Varies; residence rules differ from RTA | University off-campus boards, [places4students.com](https://www.places4students.com/) |
$h$,
   null, 49),
  ('Find Housing',
   'university-boards',
   'University housing boards',
   $h$
| Institution | Website |
| --- | --- |
| University of Toronto | U of T Off-Campus Housing Finder |
| York University | York Off-Campus Housing |
| Toronto Metropolitan University (TMU) | TMU Off-Campus Housing |
| George Brown Polytechnic | George Brown Housing |
| Humber Polytechnic | Humber Off-Campus Life |
| OCAD University | OCAD Housing Resources |
$h$,
   null, 50),
  ('Find Housing',
   'avoiding-rental-scams',
   'Avoiding rental scams',
   $h$
Rental scams can appear on any platform. Peer-to-peer sites may provide fewer ways to verify advertisers, while agent-listed and professionally managed rentals are often easier to verify—but no channel is scam-proof.
$h$,
   null, 51),
  ('Find Housing',
   'scams-cafc',
   'Canadian Anti-Fraud Centre: Rental fraud',
   $h$
Official examples of rental-scam patterns, including copied photos, unusually low prices and pressure to pay quickly.
$h$,
   'Canadian Anti-Fraud Centre: Rental fraud', 52),
  ('Find Housing',
   'scams-competition-bureau',
   'Competition Bureau: Common scams',
   $h$
Federal guidance on recognizing and avoiding scams, including rental scams.
$h$,
   'Competition Bureau: Common scams', 53),
  ('Find Housing',
   'scams-reco',
   'RECO Registrant Search',
   $h$
Confirm that someone claiming to be an Ontario real estate agent or brokerage is currently registered. Registration alone does not confirm that a particular message or listing is genuine.
$h$,
   'RECO Registrant Search', 54),
  ('Find Housing',
   'scams-onland',
   'OnLand Property Search',
   $h$
Optional paid land-registry search that can help identify a property's registered owner. It does not prove that the person messaging you is the owner or is authorized to rent the property.
$h$,
   'OnLand Property Search', 55),
  ('Find Housing',
   'scams-standard-lease',
   'Ontario Standard Lease',
   $h$
Official standard lease required for most Ontario residential tenancies. A completed government form is not, by itself, proof that a listing is legitimate.
$h$,
   'Ontario Standard Lease', 56),
  ('Find Housing',
   'scams-privacy-commissioner',
   'Privacy Commissioner: Landlords and tenants',
   $h$
Guidance on credit checks, identification documents and requests for sensitive personal information.
$h$,
   'Privacy Commissioner: Landlords and tenants', 57),
  ('Find Housing',
   'scams-steps-to-justice',
   'Steps to Justice: Renting in Ontario',
   $h$
Plain-language information about Ontario tenancy rights. Better categorized as a legal-rights resource than a scam-detection resource.
$h$,
   'Steps to Justice: Renting in Ontario', 58),
  ('Find Housing',
   'scams-toronto-police',
   'Toronto Police: Online reporting',
   $h$
Report eligible non-emergency fraud that occurred in Toronto.
$h$,
   'Toronto Police: Online reporting', 59),

  -- Compare Options (Section 2 of Housing-content.docx)
  ('Compare Options',
   'evaluate-options',
   'Tips on evaluating housing options',
   $h$
Housing Basics

Commute & Transportation

Location & Daily Life

Condition & Building Quality

Lease Terms & Rent Control

Required Documents

Negotiation Opportunities

Application & Communication
$h$,
   null, 1),
  ('Compare Options',
   'living-alone-vs-sharing',
   'Living alone vs. sharing',
   $h$
Living alone usually costs more but offers greater privacy and control over your home environment. Sharing can lower costs, but discuss expectations and preferences about guests, cleaning, cooking, noise, and shared spaces before moving in.
$h$,
   null, 2),
  ('Compare Options',
   'maintenance-responsibilities',
   'Maintenance responsibilities',
   $h$
In Ontario, landlords are generally responsible for maintaining the property and completing repairs. Tenants must keep their unit reasonably clean and repair or pay for damage caused by them or their guests—not normal wear and tear. See details from the Ontario Landlord and Tenant Board.
$h$,
   null, 3),
  ('Compare Options',
   'total-housing-costs',
   'Total Housing Costs',
   $h$
Look beyond rent: confirm whether utilities like electricity (hydro), heat, and water are included. Budget for other recurring costs—such as internet, tenant insurance, parking, and laundry—and one-time move-in essentials.
$h$,
   null, 4),
  ('Compare Options',
   'public-transit-or-driving',
   'Public transit or Driving',
   $h$
For public transit, check walking distance, transfers, service frequency, and backup routes. For driving, check peak-hour congestion, highway access, and parking costs and availability.
$h$,
   null, 5),
  ('Compare Options',
   'winter-and-ttc-delays',
   'Winter and TTC Delays',
   $h$
Consider outdoor walking and wait times in winter. Allow extra time for bad weather, crowding, service disruptions, and detours.
$h$,
   null, 6),
  ('Compare Options',
   'rideshare',
   'Rideshare',
   $h$
Allow extra time and budget during rush hour and bad weather. ETAs can change, and drivers may cancel.
$h$,
   null, 7),
  ('Compare Options',
   'cycling',
   'Cycling',
   $h$
Check the entire route for bike lanes or multi-use trails. In Toronto, people aged 14 and older cannot cycle on sidewalks. City of Toronto
$h$,
   null, 8),
  ('Compare Options',
   'work',
   'Work',
   $h$
Consider commute time and access to transit or parking.
$h$,
   null, 9),
  ('Compare Options',
   'schools',
   'Schools',
   $h$
Check which public schools your kid is assigned to using your address.
$h$,
   null, 10),
  ('Compare Options',
   'childcare',
   'Childcare',
   $h$
Check nearby childcare availability, waitlists, hours, age groups served, and fees.
$h$,
   null, 11),
  ('Compare Options',
   'daily-needs',
   'Daily needs',
   $h$
Consider access to groceries, healthcare, parks, and other services your household uses regularly.
$h$,
   null, 12),
  ('Compare Options',
   'neighborhood-fit',
   'Neighborhood fit',
   $h$
If possible, visit at the times you'll typically be out. Consider traffic, noise, lighting, air quality, and the practicality of your everyday routes.
$h$,
   null, 13),
  ('Compare Options',
   'safety',
   'Safety',
   $h$
Use Check the Place to see neighborhood safety data for an address you're considering.
$h$,
   null, 14),
  ('Compare Options',
   'condition-building-quality',
   'Condition & Building Quality',
   $h$
Check for signs of pests, mould/water damage, poor heating/cooling, noise, appliance condition, and building maintenance. For apartments/condos, consider common areas, elevators, laundry, garbage facilities and building security.
$h$,
   null, 15),
  ('Compare Options',
   'lease-strategy',
   'Lease Strategy',
   $h$
Consider mid-term housing (3–6 months) before signing a 12-month lease, giving you time to settle in and explore neighbourhoods. Without a car, prioritize places close to frequent, reliable public transit routes. Shorter leases are less common and often more expensive because landlords generally prefer longer, more stable tenancies.
$h$,
   null, 16),
  ('Compare Options',
   'rent-control',
   'Rent Control',
   $h$
Verify when the unit was first occupied for residential use. Units first occupied after November 15, 2018 are generally exempt from Ontario's rent-increase guideline, so annual increases are not capped. Landlords must still generally wait 12 months between increases and provide at least 90 days' written notice.Ontario Landlord and Tenant Board
$h$,
   null, 17),
  ('Compare Options',
   'credit-employment-alternatives',
   'Alternatives to Canadian Credit and Employment',
   $h$
If you lack Canadian credit or employment history, provide proof of income or savings, bank statements, references, or a guarantor/co-signer. You may voluntarily offer prepaid rent, but verify the landlord and unit and sign the lease before paying. A landlord cannot require more than one month's rent as a deposit.Ontario Landlord and Tenant Board
$h$,
   null, 18),
  ('Compare Options',
   'required-documents',
   'Required Documents',
   $h$
Landlords commonly request a completed rental application, government-issued ID, proof of income or employment (such as pay stubs or an offer letter), consent to a credit check/credit scores, rental references, and recent bank statements showing sufficient funds.
$h$,
   null, 19),
  ('Compare Options',
   'property-market-conditions',
   'Property and Market Conditions',
   $h$
Negotiation (rent, lease term, requirements, etc) may be easier when a unit has been listed for a while, has less demand, is an older unit, or needs minor updates.
$h$,
   null, 20),
  ('Compare Options',
   'landlord-type',
   'Landlord Type',
   $h$
Individual landlords may have more flexibility on rent, move-in dates, lease length, parking, or furnishings. Professional property-management teams often follow standardized pricing and lease terms but may offer promotions like a free month on a 1 year lease.
$h$,
   null, 21),
  ('Compare Options',
   'application-communication',
   'Application & Communication',
   $h$
Position your application around common landlord priorities: reliable, on-time rent payments; responsible care of the property; and a move-in date and lease length that reduce vacancy risk. Support these points with documents, references, and clear communication.
$h$,
   null, 22),

  -- Check the Place
  ('Check the Place',
   'before-signing',
   'Before signing',
   $h$
Before signing: ask if the representation agreement is exclusive, how long it runs, and whether you could owe a fee. In Ontario, no written agreement means you are a self-represented party — the agent owes you no duty of care.
$h$,
   null, 1),
  ('Check the Place',
   'before-signing-realtor-ca',
   'Realtor.ca',
   $h$
The national MLS portal. Not a brokerage; contact goes to the listing brokerage. Coverage is a subset of local board data, since syndication is opt-in.
$h$,
   'Realtor.ca', 2),
  ('Check the Place',
   'before-signing-condos-ca',
   'Condos.ca',
   $h$
Same brokerage, two front-ends. Condo.ca focuses on condos, with building profiles, rental history, and market data.
$h$,
   'Condos.ca', 3),
  ('Check the Place',
   'before-signing-property-ca',
   'Property.ca',
   $h$
Same brokerage, two front-ends. Property.ca has other types of properties like houses.
$h$,
   'Property.ca', 4),
  ('Check the Place',
   'before-signing-strata-ca',
   'Strata.ca',
   $h$
Ontario condo, loft, and townhouse rentals with building data and agent assistance.
$h$,
   'Strata.ca', 5),
  ('Check the Place',
   'before-signing-housesigma',
   'HouseSigma',
   $h$
Covers more than Ontario. Sale and rental listings with leased history, map tools, and estimates.
$h$,
   'HouseSigma', 6)
) as v(subcategory, section_key, title, body_markdown, source_name, display_order)
on conflict (category, subcategory, section_key) do update set
  title = excluded.title,
  body_markdown = excluded.body_markdown,
  source_id = excluded.source_id,
  display_order = excluded.display_order,
  updated_at = now();

