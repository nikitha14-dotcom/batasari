# sites_housing.py: Housing sites (url, authority tier, label, category, licence).
# Aligned with the Housing doc and the eval's allowed_domains list.
# licence values for the core rows come from the doc (its own note: the
# author's reading, not legal advice).

HOUSING_SITES = [
    #  Tier A: rule-makers -----------------
    {
        "url": "https://www.ohrc.on.ca/en/policy-human-rights-and-rental-housing",
        "tier": "A",
        "label": "OHRC - Rental Housing Policy",
        "category": "Housing",
    },
    {
        "url": "https://www.ohrc.on.ca/en/human-rights-tenants-brochure",
        "tier": "A",
        "label": "OHRC - Human Rights for Tenants",
        "category": "Housing",
    },
    {
        "url": "https://tribunalsontario.ca/ltb/",
        "tier": "A",
        "label": "Landlord and Tenant Board",
        "category": "Housing",
    },
    {
        "url": "https://www.ontario.ca/page/renting-ontario-your-rights",
        "tier": "A",
        "label": "Ontario.ca - Renting: Your Rights",
        "category": "Housing",
    },
    {
        "url": "https://www.ontario.ca/page/residential-tenancy-agreement-standard-lease",
        "tier": "A",
        "label": "Ontario Standard Lease",
        "category": "Housing",
    },
    {
        "url": (
            "https://www.toronto.ca/community-people/housing-shelter/"
            "rental-housing-tenant-information/"
        ),
        "tier": "A",
        "label": "City of Toronto - Rental Housing",
        "category": "Housing",
    },
    {
        "url": (
            "https://www.toronto.ca/community-people/housing-shelter/"
            "rental-housing-rights-information/housing-property-standards/"
            "apartment-building-standards/rentsafeto-for-tenants/"
        ),
        "tier": "A",
        "label": "RentSafeTO - For Tenants",
        "category": "Housing",
    },
    # New Tier A
    {
        "url": "https://www.ontario.ca/laws",
        "tier": "A",
        "label": "Ontario e-Laws",
        "category": "Housing",
        "licence": "reproduce_free",
    },
    {
        "url": "https://tribunalsontario.ca/en/",
        "tier": "A",
        "label": "Tribunals Ontario",
        "category": "Housing",
        "licence": "decisions: reproduce_free; brochures: restate_only",
    },
    # NOTE: ontario.ca content that isn't legislation requires a licence - confirm before storing.
    {
        "url": "https://www.ontario.ca/page/government-ontario",
        "tier": "A",
        "label": "Government of Ontario",
        "category": "Housing",
        "licence": "restate_only",
    },
    {
        "url": "https://www.ohrc.on.ca/en",
        "tier": "A",
        "label": "Ontario Human Rights Commission",
        "category": "Housing",
        "licence": "restate_only",
    },
    {
        "url": "https://www.toronto.ca/",
        "tier": "A",
        "label": "City of Toronto",
        "category": "Housing",
        "licence": "check per page",
    },
    {
        "url": "https://www.ola.org/",
        "tier": "A",
        "label": "Legislative Assembly of Ontario",
        "category": "Housing",
        "licence": "reproduce_free",
    },
    {
        "url": "https://antifraudcentre-centreantifraude.ca/index-eng.htm",
        "tier": "A",
        "label": "Canadian Anti-Fraud Centre",
        "category": "Housing",
        "licence": "restate_only",
    },
    {
        "url": "https://www.canada.ca/en/financial-consumer-agency.html",
        "tier": "A",
        "label": "Financial Consumer Agency of Canada",
        "category": "Housing",
        "licence": "restate_only",
    },
    {
        "url": "http://priv.gc.ca/",
        "tier": "A",
        "label": "Office of the Privacy Commissioner of Canada",
        "category": "Housing",
        "licence": "restate_only",
    },
    {
        "url": "https://www.condoauthorityontario.ca/",
        "tier": "A",
        "label": "Condominium Authority of Ontario",
        "category": "Housing",
        "licence": "restate_only",
    },
    {
        "url": "https://canlii.org/",
        "tier": "A",
        "label": "CanLII",
        "category": "Housing",
        "licence": "decisions: reproduce_free",
    },
    #  Tier B: official statistics -----------------
    {
        "url": (
            "https://www.cmhc-schl.gc.ca/en/professionals/housing-markets-data-and-research/"
            "housing-data/rental-market"
        ),
        "tier": "B",
        "label": "CMHC - Rental Market Data",
        "category": "Housing",
    },
    {
        "url": "https://www.cmhc-schl.gc.ca/",
        "tier": "B",
        "label": "CMHC",
        "category": "Housing",
        "licence": "restate_only",
    },
    {
        "url": "https://open.toronto.ca/",
        "tier": "B",
        "label": "City of Toronto Open Data",
        "category": "Housing",
        "licence": "OGL-Toronto",
    },
    # NOTE: data.tps.ca licence unconfirmed (ArcGIS Hub does not carry the City's OGL licence).
    {
        "url": "https://data.tps.ca/",
        "tier": "B",
        "label": "Toronto Police Service Data Portal",
        "category": "Housing",
        "licence": "confirm: ArcGIS Hub may not carry the City's OGL",
    },
    {
        "url": "https://www.statcan.gc.ca/en/start",
        "tier": "B",
        "label": "Statistics Canada",
        "category": "Housing",
        "licence": "open licence (confirm)",
    },
    #  Tier C: reputable tertiary sources -----------------
    {
        "url": "https://www.torontotenants.org/do_i_have_rights",
        "tier": "C",
        "label": "Toronto Tenants - Do I Have Rights?",
        "category": "Housing",
    },
    {
        "url": "https://stepstojustice.ca/",
        "tier": "C",
        "label": "Steps to Justice",
        "category": "Housing",
        "licence": "link_only",
    },
    {
        "url": "https://settlement.org/",
        "tier": "C",
        "label": "Settlement.Org",
        "category": "Housing",
        "licence": "link_only",
    },
    #  Supporting sites (Housing core table, no tier)
    # No tier in the doc, so "tier" is omitted here: sites_config.py defaults
    # untiered sites to D (trusted_sources.authority_tier is NOT NULL).
    {"url": "https://211ontario.ca/", "label": "211ontario.ca", "category": "Housing"},
    {"url": "https://acto.ca/", "label": "acto.ca", "category": "Housing"},
    {"url": "https://legalaid.on.ca/", "label": "legalaid.on.ca", "category": "Housing"},
    {
        "url": "https://housingrightscanada.com/",
        "label": "housingrightscanada.com",
        "category": "Housing",
    },
    {"url": "https://ibc.ca/", "label": "ibc.ca", "category": "Housing"},
    {"url": "https://lso.ca/", "label": "lso.ca", "category": "Housing"},
    {"url": "https://tarion.com/", "label": "tarion.com", "category": "Housing"},
    {"url": "https://mpac.ca/", "label": "mpac.ca", "category": "Housing"},
    {"url": "https://torontohousing.ca/", "label": "torontohousing.ca", "category": "Housing"},
    {"url": "https://oeb.ca/", "label": "oeb.ca", "category": "Housing"},
    {"url": "https://torontohydro.com/", "label": "torontohydro.com", "category": "Housing"},
    {"url": "https://trreb.ca/", "label": "trreb.ca", "category": "Housing"},
    {"url": "https://urbanation.ca/", "label": "urbanation.ca", "category": "Housing"},
    #  Commute and weather
    # No tier in the doc, so "tier" is omitted here: sites_config.py defaults
    # untiered sites to D (trusted_sources.authority_tier is NOT NULL).
    {"url": "https://ttc.ca/", "label": "ttc.ca", "category": "Housing"},
    {"url": "https://metrolinx.com/", "label": "metrolinx.com", "category": "Housing"},
    {"url": "https://gotransit.com/", "label": "gotransit.com", "category": "Housing"},
    {"url": "https://weather.gc.ca/", "label": "weather.gc.ca", "category": "Housing"},
    #  GTA location packs (append only the pack for the requested municipality)
    # No tier in the doc, so "tier" is omitted here: sites_config.py defaults
    # untiered sites to D (trusted_sources.authority_tier is NOT NULL).
    {"url": "https://peelregion.ca/", "label": "peelregion.ca", "category": "Housing"},
    {"url": "https://mississauga.ca/", "label": "mississauga.ca", "category": "Housing"},
    {"url": "https://brampton.ca/", "label": "brampton.ca", "category": "Housing"},
    {"url": "https://caledon.ca/", "label": "caledon.ca", "category": "Housing"},
    {"url": "https://peelpolice.ca/", "label": "peelpolice.ca", "category": "Housing"},
    {"url": "https://miway.ca/", "label": "miway.ca", "category": "Housing"},
    {"url": "https://york.ca/", "label": "york.ca", "category": "Housing"},
    {"url": "https://markham.ca/", "label": "markham.ca", "category": "Housing"},
    {"url": "https://vaughan.ca/", "label": "vaughan.ca", "category": "Housing"},
    {"url": "https://richmondhill.ca/", "label": "richmondhill.ca", "category": "Housing"},
    {"url": "https://yrp.ca/", "label": "yrp.ca", "category": "Housing"},
    {"url": "https://yrt.ca/", "label": "yrt.ca", "category": "Housing"},
    {"url": "https://durham.ca/", "label": "durham.ca", "category": "Housing"},
    {"url": "https://ajax.ca/", "label": "ajax.ca", "category": "Housing"},
    {"url": "https://pickering.ca/", "label": "pickering.ca", "category": "Housing"},
    {"url": "https://whitby.ca/", "label": "whitby.ca", "category": "Housing"},
    {"url": "https://oshawa.ca/", "label": "oshawa.ca", "category": "Housing"},
    {"url": "https://drps.ca/", "label": "drps.ca", "category": "Housing"},
    {
        "url": "https://durhamregiontransit.com/",
        "label": "durhamregiontransit.com",
        "category": "Housing",
    },
    {"url": "https://halton.ca/", "label": "halton.ca", "category": "Housing"},
    {"url": "https://oakville.ca/", "label": "oakville.ca", "category": "Housing"},
    {"url": "https://burlington.ca/", "label": "burlington.ca", "category": "Housing"},
    {"url": "https://milton.ca/", "label": "milton.ca", "category": "Housing"},
    {"url": "https://haltonhills.ca/", "label": "haltonhills.ca", "category": "Housing"},
    {"url": "https://haltonpolice.ca/", "label": "haltonpolice.ca", "category": "Housing"},
    #  Discovery-only: listing, hotel and university housing platforms
    # No tier in the doc, so "tier" is omitted here: sites_config.py defaults
    # untiered sites to D (trusted_sources.authority_tier is NOT NULL).
    # Doc rule: only for finding listings and estimating prices, never for
    # legal, safety or eligibility facts.
    {"url": "https://hostelworld.com/", "label": "hostelworld.com", "category": "Housing"},
    {"url": "https://airbnb.com/", "label": "airbnb.com", "category": "Housing"},
    {"url": "https://trivago.ca/", "label": "trivago.ca", "category": "Housing"},
    {"url": "https://expedia.ca/", "label": "expedia.ca", "category": "Housing"},
    {"url": "https://booking.com/", "label": "booking.com", "category": "Housing"},
    {"url": "https://ca.hotels.com/", "label": "ca.hotels.com", "category": "Housing"},
    {"url": "https://trip.com/", "label": "trip.com", "category": "Housing"},
    {"url": "https://priceline.com/", "label": "priceline.com", "category": "Housing"},
    {"url": "https://happipad.com/", "label": "happipad.com", "category": "Housing"},
    {"url": "https://roomies.ca/", "label": "roomies.ca", "category": "Housing"},
    {"url": "https://zumper.com/", "label": "zumper.com", "category": "Housing"},
    {"url": "https://craigslist.org/", "label": "craigslist.org", "category": "Housing"},
    {"url": "https://facebook.com/", "label": "facebook.com", "category": "Housing"},
    {"url": "https://viewit.ca/", "label": "viewit.ca", "category": "Housing"},
    {"url": "https://rentseeker.ca/", "label": "rentseeker.ca", "category": "Housing"},
    {"url": "https://4rent.ca/", "label": "4rent.ca", "category": "Housing"},
    {"url": "https://rentals.ca/", "label": "rentals.ca", "category": "Housing"},
    {"url": "https://liv.rent/", "label": "liv.rent", "category": "Housing"},
    {"url": "https://kijiji.ca/", "label": "kijiji.ca", "category": "Housing"},
    {"url": "https://realtor.ca/", "label": "realtor.ca", "category": "Housing"},
    {"url": "https://condos.ca/", "label": "condos.ca", "category": "Housing"},
    {"url": "https://strata.ca/", "label": "strata.ca", "category": "Housing"},
    {"url": "https://housesigma.com/", "label": "housesigma.com", "category": "Housing"},
    {"url": "https://property.ca/", "label": "property.ca", "category": "Housing"},
    {"url": "https://padmapper.com/", "label": "padmapper.com", "category": "Housing"},
    {"url": "https://apartments.com/", "label": "apartments.com", "category": "Housing"},
    {
        "url": "https://offcampushousing.utoronto.ca/",
        "label": "offcampushousing.utoronto.ca",
        "category": "Housing",
    },
    {"url": "https://yorku.ca/", "label": "yorku.ca", "category": "Housing"},
    {"url": "https://torontooffcampus.ca/", "label": "torontooffcampus.ca", "category": "Housing"},
    {"url": "https://admissions.ocadu.ca/", "label": "admissions.ocadu.ca", "category": "Housing"},
]

