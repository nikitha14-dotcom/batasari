"""
load_trusted_sources.py: load the restricted websites into the Supabase table
`trusted_sources`. No page content is scraped or stored.

Schema (from migration 20260907090000_claim_store_and_static_content.sql):
trusted_sources has id, name, url, authority_tier, jurisdiction, notes,
created_at -- no category/label/license columns. Since the table has one row
per url (no category column), sites that repeat across categories in
sites_config are merged into a single row here: the best (lowest-letter) tier
across their categories is used for authority_tier, and every category they
appear in (with its own tier/licence) is recorded in notes so nothing is lost.
jurisdiction has a NOT NULL DEFAULT 'Ontario' in the migration, so it's left
unset here -- but note this defaults every site to 'Ontario' even federal
ones (e.g. jobbank.gc.ca, canada.ca), which may not be what you want; set it
explicitly per site if that distinction matters downstream.

Usage:
    python3 load_trusted_sources.py            # dry run: shows what would be inserted (read-only)
    python3 load_trusted_sources.py --apply    # inserts the missing rows

.env must contain NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
Rows already in the table (same url) are never modified.
"""

import argparse
import os
from collections import defaultdict

from dotenv import load_dotenv
from supabase import create_client

from app.rag.sites_config import RESTRICTED_SITES

load_dotenv()

TABLE = "trusted_sources"
TIER_ORDER = {"A": 0, "B": 1, "C": 2, "D": 3}
BATCH_SIZE = 100
PAGE_SIZE = 1000


def merge_by_url(sites: list[dict]) -> list[dict]:
    """Collapse sites_config entries into one row per url, since trusted_sources has
    no category column. Picks the best (lowest-letter) tier across categories and
    keeps every category's own tier/licence in notes. Returns the merged rows plus,
    as a side channel, the list of urls that had a real tier conflict to report."""
    by_url = defaultdict(list)
    for s in sites:
        by_url[s["url"]].append(s)

    merged = []
    for url, group in by_url.items():
        best = min(group, key=lambda s: TIER_ORDER[s["tier"]])
        parts = []
        for s in group:
            bit = f'{s["category"]}: {s["tier"]}'
            if "licence" in s:
                bit += f' ({s["licence"]})'
            parts.append(bit)
        merged.append(
            {
                "name": best["label"],
                "url": url,
                "authority_tier": best["tier"],
                "notes": "; ".join(parts),
                "_categories": {s["category"]: s["tier"] for s in group},
            }
        )
    return merged


def report_conflicts(merged: list[dict]) -> None:
    conflicts = [m for m in merged if len(set(m["_categories"].values())) > 1]
    if not conflicts:
        return
    print(f"{len(conflicts)} url(s) have different tiers across categories "
          "(using the best one; full detail goes into notes):")
    for m in conflicts:
        print(f"  {m['url']}: {m['_categories']}")
    print()


def fetch_existing_urls(supabase) -> set:
    urls, start = set(), 0
    while True:
        page = (
            supabase.table(TABLE).select("url").range(start, start + PAGE_SIZE - 1).execute().data
            or []
        )
        urls.update(r["url"] for r in page)
        if len(page) < PAGE_SIZE:
            break
        start += PAGE_SIZE
    return urls


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--apply", action="store_true", help="insert the missing rows (default: dry run)"
    )
    args = parser.parse_args()

    merged = merge_by_url(RESTRICTED_SITES)
    report_conflicts(merged)

    supabase = create_client(
        os.getenv("NEXT_PUBLIC_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    )
    existing_urls = fetch_existing_urls(supabase)

    # NOTE: 'jurisdiction' is omitted here and will default to 'Ontario' in the database.
    # Jurisdiction is not yet set per site in this loader; do not rely on it for accuracy.

    to_insert = [
        {k: v for k, v in m.items() if k != "_categories"}
        for m in merged
        if m["url"] not in existing_urls
    ]

    print(f"Sites in sites_config (merged by url): {len(merged)}")
    print(f"Already in {TABLE}: {len(merged) - len(to_insert)}")
    print(f"To insert: {len(to_insert)}")

    if not args.apply:
        print("\nDry run: nothing was inserted. Use --apply to insert the missing rows.")
        for row in to_insert[:5]:
            print("  e.g.", row)
        return

    for i in range(0, len(to_insert), BATCH_SIZE):
        supabase.table(TABLE).insert(to_insert[i : i + BATCH_SIZE]).execute()
    print(f"\nInserted {len(to_insert)} rows into {TABLE}.")


if __name__ == "__main__":
    main()

