# sites_config.py
# Aggregates the restricted sites of every category. The sites live in one file per category:
#   sites_housing.py, sites_work.py, sites_education_family.py, sites_finance.py
#
# Every site ends up with a tier (A/B/C/D). Sites without an explicit tier in their
# sites_*.py file are defaulted to D automatically below (trusted_sources.authority_tier
# is NOT NULL; Wissem confirmed untiered sites get D) -- category files don't need to
# set "tier": "D" by hand, just omit the key entirely.
# Tier A = rule-makers (IRCC, LTB, OHRC) - primary source, highest weight
# Tier B = official statistics (CMHC, Stats Canada) - reliable secondary source
# Tier C = reputable tertiary sources (lawyers, tenant organizations)
# Tier D = lower-trust sources (e.g. Craigslist/Kijiji-type listing platforms)
#
# To add a site, edit the file of its category. Each entry has: url, label,
# category, tier(plus licence when known).

from app.rag.sites_education_family import EDUCATION_FAMILY_SITES
from app.rag.sites_finance import FINANCE_SITES
from app.rag.sites_housing import HOUSING_SITES
from app.rag.sites_work import WORK_SITES

SITES_BY_CATEGORY = {
    "Housing": HOUSING_SITES,
    "Work": WORK_SITES,
    "Education & Family": EDUCATION_FAMILY_SITES,
    "Finance": FINANCE_SITES,
}

RESTRICTED_SITES = [site for sites in SITES_BY_CATEGORY.values() for site in sites]

# Any site with no tier set in its sites_*.py file defaults to D here, automatically.
# (trusted_sources.authority_tier is NOT NULL; untiered sites get D.) This means category
# files no longer need to spell out "tier": "D" by hand -- just omit the key.
for _site in RESTRICTED_SITES:
    _site.setdefault("tier", "D")

# Sanity checks (fail at import time, not in production)
_seen = set()
for _category, _sites in SITES_BY_CATEGORY.items():
    for _s in _sites:
        if _s["category"] != _category:
            raise ValueError(
                f"{_s['url']} is in the {_category} file but has category {_s['category']!r}"
            )
        if _s["tier"] not in {"A", "B", "C", "D"}:
            raise ValueError(f"Invalid tier for {_s['url']}: {_s['tier']!r}")
        _key = (_s["url"], _category)
        if _key in _seen:
            raise ValueError(f"Duplicate entry: {_key}")
        _seen.add(_key)

