# sites_education_family.py: Education & Family sites (domain level).
# "A/B" in the source tables was set to B. licence: link_only = link to the site,
# don't store its content.
# Sites that appear in both source tables (canada.ca, ontario.ca, settlement.org, 211ontario.ca)
# are listed once.
# Tier D: booster/discovery domains added later 
# (Restricted website Education and Family.pdf, section 2),
# which have no A/B/C tier in that doc 
# (trusted_sources.authority_tier is NOT NULL; untiered sites get D).

EDUCATION_FAMILY_SITES = [
    # From the Education table
    {
        "url": "https://canada.ca/",
        "tier": "A",
        "label": "canada.ca",
        "category": "Education & Family",
        "licence": "restate_only",
    },
    {
        "url": "https://ontario.ca/",
        "tier": "A",
        "label": "ontario.ca",
        "category": "Education & Family",
        "licence": "restate_only",
    },
    {
        "url": "https://ontario.ca/laws",
        "tier": "A",
        "label": "ontario.ca/laws",
        "category": "Education & Family",
        "licence": "reproduce_free (legal text; confirm)",
    },
    {
        "url": "https://edu.gov.on.ca/",
        "tier": "A",
        "label": "edu.gov.on.ca",
        "category": "Education & Family",
        "licence": "restate_only",
    },
    {
        "url": "https://tdsb.on.ca/",
        "tier": "A",
        "label": "tdsb.on.ca",
        "category": "Education & Family",
        "licence": "restate_only",
    },
    {
        "url": "https://tcdsb.org/",
        "tier": "A",
        "label": "tcdsb.org",
        "category": "Education & Family",
        "licence": "restate_only",
    },
    {
        "url": "https://eqao.com/",
        "tier": "B",
        "label": "eqao.com",
        "category": "Education & Family",
        "licence": "restate_only",
    },
    {
        "url": "https://open.toronto.ca/",
        "tier": "B",
        "label": "open.toronto.ca",
        "category": "Education & Family",
        "licence": "OGL-Toronto",
    },
    {
        "url": "https://cmec.ca/",
        "tier": "B",
        "label": "cmec.ca",
        "category": "Education & Family",
        "licence": "restate_only",
    },
    {
        "url": "https://educanada.ca/",
        "tier": "B",
        "label": "educanada.ca",
        "category": "Education & Family",
        "licence": "restate_only",
    },
    {
        "url": "https://ouac.on.ca/",
        "tier": "B",
        "label": "ouac.on.ca",
        "category": "Education & Family",
        "licence": "restate_only",
    },
    {
        "url": "https://ouinfo.ca/",
        "tier": "B",
        "label": "ouinfo.ca",
        "category": "Education & Family",
        "licence": "restate_only",
    },
    {
        "url": "https://ontariocolleges.ca/",
        "tier": "B",
        "label": "ontariocolleges.ca",
        "category": "Education & Family",
        "licence": "restate_only",
    },
    {
        "url": "https://osap.gov.on.ca/",
        "tier": "A",
        "label": "osap.gov.on.ca",
        "category": "Education & Family",
        "licence": "restate_only",
    },
    {
        "url": "https://red-seal.ca/",
        "tier": "A",
        "label": "red-seal.ca",
        "category": "Education & Family",
        "licence": "restate_only",
    },
    {
        "url": "https://skilledtradesontario.ca/",
        "tier": "A",
        "label": "skilledtradesontario.ca",
        "category": "Education & Family",
        "licence": "restate_only",
    },
    {
        "url": "https://settlement.org/",
        "tier": "C",
        "label": "settlement.org",
        "category": "Education & Family",
        "licence": "link_only",
    },
    {
        "url": "https://211ontario.ca/",
        "tier": "C",
        "label": "211ontario.ca",
        "category": "Education & Family",
        "licence": "link_only",
    },
    {
        "url": "https://fraserinstitute.org/",
        "tier": "C",
        "label": "fraserinstitute.org",
        "category": "Education & Family",
        "licence": "link_only",
    },
    {
        "url": "https://ourkids.net/",
        "tier": "C",
        "label": "ourkids.net",
        "category": "Education & Family",
        "licence": "link_only",
    },
    {
        "url": "https://timeshighereducation.com/",
        "tier": "C",
        "label": "timeshighereducation.com",
        "category": "Education & Family",
        "licence": "link_only",
    },
    {
        "url": "https://topuniversities.com/",
        "tier": "C",
        "label": "topuniversities.com",
        "category": "Education & Family",
        "licence": "link_only",
    },
    {
        "url": "https://jobbank.gc.ca/",
        "tier": "A",
        "label": "jobbank.gc.ca",
        "category": "Education & Family",
        "licence": "restate_only",
    },
    {
        "url": "https://data.ontario.ca/",
        "tier": "B",
        "label": "data.ontario.ca",
        "category": "Education & Family",
        "licence": "OGL-Ontario / reproduce_free",
    },
    {
        "url": "https://canada.ca/en/revenue-agency",
        "tier": "A",
        "label": "canada.ca/en/revenue-agency",
        "category": "Education & Family",
        "licence": "restate_only",
    },
    {
        "url": "https://toronto.ca/",
        "tier": "A",
        "label": "toronto.ca",
        "category": "Education & Family",
        "licence": "restate_only (check per page)",
    },
    {
        "url": "https://health811.ontario.ca/",
        "tier": "A",
        "label": "health811.ontario.ca",
        "category": "Education & Family",
        "licence": "restate_only",
    },
    {
        "url": "https://publichealthontario.ca/",
        "tier": "B",
        "label": "publichealthontario.ca",
        "category": "Education & Family",
        "licence": "restate_only",
    },
    {
        "url": "https://justice.gc.ca/",
        "tier": "A",
        "label": "justice.gc.ca",
        "category": "Education & Family",
        "licence": "restate_only",
    },
    {
        "url": "https://kidshelpphone.ca/",
        "tier": "C",
        "label": "kidshelpphone.ca",
        "category": "Education & Family",
        "licence": "link_only",
    },
    {
        "url": "https://cmho.org/",
        "tier": "C",
        "label": "cmho.org",
        "category": "Education & Family",
        "licence": "link_only",
    },
    {
        "url": "https://ymcagta.org/",
        "tier": "C",
        "label": "ymcagta.org",
        "category": "Education & Family",
        "licence": "link_only",
    },
    {
        "url": "https://familyservicetoronto.org/",
        "tier": "C",
        "label": "familyservicetoronto.org",
        "category": "Education & Family",
        "licence": "link_only",
    },
    {
        "url": "https://torontopubliclibrary.ca/",
        "tier": "B",
        "label": "torontopubliclibrary.ca",
        "category": "Education & Family",
        "licence": "restate_only (check terms)",
    },
    # From the booster/discovery table (section 2)
    {
        "url": "https://cicic.ca/",
        "label": "cicic.ca",
        "category": "Education & Family",
    },  # Education-system info and links to provincial/territorial education authorities
    {
        "url": "https://cais.ca/",
        "label": "cais.ca",
        "category": "Education & Family",
    },  # Independent-school discovery and CAIS accreditation info
    {
        "url": "https://univcan.ca/",
        "label": "univcan.ca",
        "category": "Education & Family",
    },  # University info, member institutions and scholarship resources
    {
        "url": "https://collegesinstitutes.ca/",
        "label": "collegesinstitutes.ca",
        "category": "Education & Family",
    },  # Discover colleges, institutes and career-focused education
    {
        "url": "https://educationplannerbc.ca/",
        "label": "educationplannerbc.ca",
        "category": "Education & Family",
    },  # BC college/university program exploration and applications
    {
        "url": "https://sram.qc.ca/",
        "label": "sram.qc.ca",
        "category": "Education & Family",
    },  # Quebec CEGEP program and admission info
    {
        "url": "https://language.ca/",
        "label": "language.ca",
        "category": "Education & Family",
    },  # Canadian Language Benchmarks and assessment context
    {
        "url": "https://languagescanada.ca/",
        "label": "languagescanada.ca",
        "category": "Education & Family",
    },  # Find French/ESL language programs; not proof of funding eligibility
    {
        "url": "https://211.ca/",
        "label": "211.ca",
        "category": "Education & Family",
    },  # Discover local language classes and community services
    {
        "url": "https://tradesecrets.alberta.ca/",
        "label": "tradesecrets.alberta.ca",
        "category": "Education & Family",
    },  # Alberta trades training, apprenticeship and certification pathways
    {
        "url": "https://skilledtradesbc.ca/",
        "label": "skilledtradesbc.ca",
        "category": "Education & Family",
    },  # BC apprenticeship and certification requirements
    {
        "url": "https://findingqualitychildcare.ca/",
        "label": "findingqualitychildcare.ca",
        "category": "Education & Family",
    },  # Parent guidance on choosing childcare and provincial differences
    {
        "url": "https://childcarecanada.org/",
        "label": "childcarecanada.org",
        "category": "Education & Family",
    },  # Childcare research and policy context
]

