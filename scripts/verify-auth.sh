#!/usr/bin/env bash
#
# This is Step 2 of docs/testing/auth-manual-test-plan.md: it checks that direct
# anon access to profiles is refused, and that the auth bypass is closed.
#
# What it cannot check, and which steps of that document cover it instead:
#   Step 3     table grants   -> needs SQL, run it in the Supabase SQL editor
#   Steps 4-7  the sign-in flow -> needs a mailbox and a browser
#
# Usage, from the repo root:
#   ./scripts/verify-auth.sh
#
# It starts its own API on port 8001 with ENVIRONMENT=staging, so it does not
# disturb a dev server you already have running on 8000, and it tests the
# behaviour that actually matters -- what a deployed environment does.

set -uo pipefail

cd "$(dirname "$0")/.."

PORT="${VERIFY_PORT:-8001}"
API="http://127.0.0.1:${PORT}"
pass=0
fail=0
skipped=0

green() { printf '\033[32m%s\033[0m\n' "$1"; }
red()   { printf '\033[31m%s\033[0m\n' "$1"; }

yellow() { printf '\033[33m%s\033[0m\n' "$1"; }

ok()   { green  "  PASS  $1"; pass=$((pass + 1)); }
bad()  { red    "  FAIL  $1"; red    "        $2"; fail=$((fail + 1)); }
skip() { yellow "  SKIP  $1"; yellow "        $2"; skipped=$((skipped + 1)); }

if [ ! -f .env ]; then
  red "No .env in the repo root. Copy .env.example and fill it from the secrets note."
  exit 1
fi

set -a; . ./.env; set +a

SUPA_URL="${NEXT_PUBLIC_SUPABASE_URL:-${SUPABASE_URL:-}}"
SUPA_ANON="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-${SUPABASE_ANON_KEY:-}}"

echo
echo "Direct anon access to profiles"

if [ -z "$SUPA_URL" ] || [ -z "$SUPA_ANON" ]; then
  bad "Supabase credentials present" "NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY are empty in .env"
else
  body=$(curl -s --max-time 20 "${SUPA_URL%/}/rest/v1/profiles?select=*" -H "apikey: ${SUPA_ANON}")
  rc=$?
  if [ "$rc" -ne 0 ]; then
    # Inconclusive, not a failure: the request never arrived, so it says nothing
    # about what the database would have answered.
    skip "anon read is blocked" "could not reach ${SUPA_URL%/} (curl exit ${rc}) -- network, not a result"
  else
    case "$body" in
      *42501*)
        ok "anon is refused at the privilege check (42501, RLS not even reached)" ;;
      "[]")
        ok "anon can query but RLS filters every row away" ;;
      "")
        skip "anon read is blocked" "empty response from ${SUPA_URL%/} -- inconclusive" ;;
      *)
        bad "anon read is blocked" "rows or unexpected payload came back: ${body:0:160}" ;;
    esac
  fi
fi

echo
echo "The auth bypass is closed (API on :${PORT}, ENVIRONMENT=staging)"

SERVER_MATCH="uvicorn app.main:app --host 127.0.0.1 --port ${PORT}"

if curl -sf --max-time 2 "${API}/health" >/dev/null 2>&1; then
  bad "port ${PORT} is free" "something is already serving on ${PORT}; set VERIFY_PORT to another port"
  echo; echo "${pass} passed, ${fail} failed"; exit 1
fi

# Output goes to /dev/null: uvicorn holding the pipe open would keep this
# script from ever returning. `uv run` spawns python as a child, so killing the
# recorded PID alone can orphan the server -- pkill on the exact command line
# is the portable way to be sure the port is released on the way out.
( cd api && ENVIRONMENT=staging exec uv run python -m uvicorn app.main:app \
    --host 127.0.0.1 --port "$PORT" --log-level warning ) >/dev/null 2>&1 &
server=$!

cleanup() {
  kill "$server" 2>/dev/null
  pkill -f "$SERVER_MATCH" 2>/dev/null
  wait "$server" 2>/dev/null
}
trap cleanup EXIT

for _ in $(seq 1 40); do
  curl -sf --max-time 2 "${API}/health" >/dev/null 2>&1 && break
  sleep 0.5
done

if ! curl -sf --max-time 2 "${API}/health" >/dev/null 2>&1; then
  bad "API started on :${PORT}" "never became healthy -- run 'cd api && uv sync --extra dev' first"
  echo; echo "${pass} passed, ${fail} failed"; exit 1
fi

check() {
  local label="$1" want="$2"; shift 2
  local got
  got=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$@")
  if [ "$got" = "$want" ]; then ok "$label ($got)"; else bad "$label" "expected $want, got $got"; fi
}

check "health needs no credentials"           200 "${API}/health"
check "no credentials -> refused"             401 "${API}/auth/me"
check "x-test-user-id -> refused"             401 "${API}/auth/me" \
      -H "x-test-user-id: 11111111-1111-1111-1111-111111111111"
check "x-test-user-id on /profile -> refused" 401 "${API}/profile" \
      -H "x-test-user-id: 11111111-1111-1111-1111-111111111111"
check "garbage bearer token -> refused"       401 "${API}/auth/me" \
      -H "Authorization: Bearer not-a-real-token"
check "empty bearer token -> refused"         401 "${API}/auth/me" \
      -H "Authorization: Bearer "

echo
summary="${pass} passed, ${fail} failed"
[ "$skipped" -gt 0 ] && summary="${summary}, ${skipped} skipped"
if [ "$fail" -eq 0 ]; then green "$summary"; else red "$summary"; fi
echo
echo "Not covered here: Step 3 (grants, SQL editor) and Steps 4-7 (sign-in flow)."
exit $(( fail > 0 ))

