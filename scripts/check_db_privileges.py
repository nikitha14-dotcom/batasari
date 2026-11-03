#!/usr/bin/env python
"""Fail the build if any public table is left in an unsafe privilege state.

Run against a database rebuilt from migrations (see the db-guard job in
.github/workflows/ci.yml). Reads DATABASE_URL.

This exists because Supabase's default privileges grant the full set —
including TRUNCATE — to anon and authenticated on every table created in
`public`. RLS does not apply to TRUNCATE, so row policies do not save you.
One table was found in that state; the next one added would be too, unless
something checks. This is that check.

See ADR 0010.
"""

from __future__ import annotations

import os
import sys

import psycopg

# Verbs that must never reach the browser roles. DELETE is included because a
# table with no delete policy is protected by RLS today, but that protection
# disappears the moment someone adds a permissive policy — whereas simply not
# granting DELETE holds regardless.
FORBIDDEN = ("TRUNCATE", "DELETE")
BROWSER_ROLES = ("anon", "authenticated")

# The backend connects as service_role and needs these to function at all.
REQUIRED_SERVICE_ROLE = ("SELECT", "INSERT", "UPDATE")


def main() -> int:
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        print("DATABASE_URL is not set", file=sys.stderr)
        return 2

    failures: list[str] = []
    notes: list[str] = []

    with psycopg.connect(dsn, connect_timeout=30) as conn, conn.cursor() as cur:
        cur.execute(
            "select tablename, rowsecurity from pg_tables "
            "where schemaname = 'public' order by tablename"
        )
        tables = cur.fetchall()

        if not tables:
            # A false green is worse than no check. This runs against a database
            # rebuilt from migrations, so an empty `public` means the migrations
            # did not apply — exactly the case the guard exists to catch.
            print(
                "No tables found in `public`. Expected the schema to have been "
                "rebuilt from migrations before this runs, so this means the "
                "migrations did not apply.",
                file=sys.stderr,
            )
            return 1

        for table, rls_enabled in tables:
            qualified = f"public.{table}"

            # 1. Browser roles must not hold destructive privileges.
            for role in BROWSER_ROLES:
                for verb in FORBIDDEN:
                    cur.execute(
                        "select has_table_privilege(%s, %s, %s)", (role, qualified, verb)
                    )
                    if cur.fetchone()[0]:
                        if verb == "TRUNCATE":
                            why = (
                                "RLS does not apply to TRUNCATE at all, so the row "
                                "policies on this table will not prevent it"
                            )
                        else:
                            why = (
                                "currently blocked by RLS only because no delete "
                                "policy exists — that protection disappears the "
                                "moment someone adds a permissive one"
                            )
                        failures.append(
                            f"{qualified}: {role} has {verb}. {why}. "
                            f"Add: revoke {verb.lower()} on {qualified} from {role};"
                        )

            # 2. RLS must be on. Without it the row policies are inert.
            if not rls_enabled:
                failures.append(
                    f"{qualified}: row level security is disabled. "
                    f"Add: alter table {qualified} enable row level security;"
                )

            # 3. The backend must actually be able to use the table.
            missing = []
            for verb in REQUIRED_SERVICE_ROLE:
                cur.execute(
                    "select has_table_privilege('service_role', %s, %s)", (qualified, verb)
                )
                if not cur.fetchone()[0]:
                    missing.append(verb)
            if missing:
                notes.append(
                    f"{qualified}: service_role is missing {', '.join(missing)}. "
                    f"The API connects as service_role, so calls touching this table "
                    f"will fail with 42501. Add the grant if the backend uses it."
                )

    print(f"Checked {len(tables)} table(s) in `public`.\n")

    for n in notes:
        print(f"  WARN  {n}")
    for f in failures:
        print(f"  FAIL  {f}")

    if failures:
        print(f"\n{len(failures)} privilege problem(s). See ADR 0010.")
        return 1

    print("All tables pass: no destructive grants to browser roles, RLS enabled.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

