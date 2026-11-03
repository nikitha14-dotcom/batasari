#!/usr/bin/env python
"""Export public.feedback to a CSV that is safe to open in a spreadsheet.

Read-only. Run it whenever you want a fresh export -- it is a reporting tool,
not a setup step, and it changes nothing in the database.

Which environment it reads is decided by SUPABASE_URL in the .env it loads, so
point that at Dev or at staging and run it again for the other one.

Usage, from the repo root:

    python api/scripts/export_feedback.py
    python api/scripts/export_feedback.py --out ~/Desktop/feedback.csv
    python api/scripts/export_feedback.py --since 2026-09-01

Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, which the repo's .env
already has. The key is read from the environment and never printed.
"""

from __future__ import annotations

import argparse
import csv
import os
import sys
from datetime import date, datetime
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

# api/scripts/export_feedback.py -> repo root
REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "api"))

from app.services.csv_safe import csv_safe  # noqa: E402

COLUMNS = ("id", "created_at", "user_id", "rating", "feedback_type", "message")

# Supabase caps a single PostgREST response; page rather than silently
# exporting only the first slice, which is the kind of bug you only notice
# when someone asks why the numbers do not add up.
PAGE_SIZE = 1000


def _client():
    load_dotenv(REPO_ROOT / ".env")

    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        sys.exit(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set "
            f"(looked in {REPO_ROOT / '.env'})."
        )

    # Host only -- the project ref tells you which environment you just read,
    # and the key never appears anywhere.
    print(f"Reading {url}", file=sys.stderr)
    return create_client(url, key)


def _fetch(sb, since: str | None) -> list[dict]:
    rows: list[dict] = []
    start = 0

    while True:
        query = sb.table("feedback").select(",".join(COLUMNS))
        if since:
            query = query.gte("created_at", since)

        result = query.order("created_at", desc=True).range(start, start + PAGE_SIZE - 1).execute()
        page = result.data or []
        rows.extend(page)

        if len(page) < PAGE_SIZE:
            return rows
        start += PAGE_SIZE


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out",
        default=None,
        help="Output path. Defaults to feedback-<today>.csv in the current directory.",
    )
    parser.add_argument(
        "--since",
        default=None,
        help="Only rows created on or after this ISO date, e.g. 2026-09-01.",
    )
    args = parser.parse_args()

    if args.since:
        try:
            datetime.fromisoformat(args.since)
        except ValueError:
            sys.exit(f"--since must be an ISO date, got {args.since!r}")

    out = Path(args.out) if args.out else Path.cwd() / f"feedback-{date.today()}.csv"

    sb = _client()
    try:
        rows = _fetch(sb, args.since)
    except Exception as exc:  # noqa: BLE001 -- the message is for a person, not a caller
        sys.exit(
            f"Could not read public.feedback: {exc}\n"
            "If this says the relation does not exist, the migration has not been "
            "applied to this project yet: run `supabase db push`."
        )

    # newline="" is required by the csv module; without it Windows-style line
    # endings inside a message split one row into several.
    with out.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(COLUMNS)
        for row in rows:
            writer.writerow([csv_safe(row.get(column)) for column in COLUMNS])

    print(f"Wrote {len(rows)} row(s) to {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

