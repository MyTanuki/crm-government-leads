#!/usr/bin/env bash
# =============================================================================
# test/smoke.sh
# =============================================================================
# End-to-end smoke test against a running backend.
# Starts nothing — assumes the API is up at $API_BASE.
#
# Usage:
#   API_BASE=http://localhost:3001/api/v1 ./test/smoke.sh
#
# Exit code 0 = all passed, 1 = a test failed.
# =============================================================================

set -u

API="${API_BASE:-http://localhost:3001/api/v1}"
PASS=0
FAIL=0

check() {
  local label="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo "  PASS  $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $label (expected $expected, got $actual)"
    FAIL=$((FAIL + 1))
  fi
}

jq_get() { python3 -c "import json,sys; print(json.load(sys.stdin).get('$1',''))"; }

echo "=== Smoke test against $API ==="
echo ""

# Health
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API/health")
check "health endpoint reachable" "200" "$HTTP"

# Login
curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"somchai.p@dev.local","password":"devpassword"}' -o /tmp/smoke_login.json
TOKEN=$(jq_get access_token < /tmp/smoke_login.json)
[ -n "$TOKEN" ] && check "login returns token" "yes" "yes" \
  || check "login returns token" "yes" "no"
AUTH="Authorization: Bearer $TOKEN"

# Login with wrong password
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"somchai.p@dev.local","password":"wrongpassword"}')
check "wrong password rejected" "401" "$HTTP"

# Me
ROLE=$(curl -s "$API/me" -H "$AUTH" | jq_get role)
check "GET /me returns role" "sales" "$ROLE"

# No token
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API/me")
check "no token rejected" "401" "$HTTP"

# Smart search
Q=$(python3 -c "import urllib.parse; print(urllib.parse.quote('กรม'))")
COUNT=$(curl -s "$API/agencies/search?q=$Q&limit=5" -H "$AUTH" \
  | python3 -c "import json,sys; print(len(json.load(sys.stdin)['results']))")
[ "$COUNT" -gt 0 ] && check "smart search returns hits" "yes" "yes" \
  || check "smart search returns hits" "yes" "no"

# Create lead
curl -s -X POST "$API/leads" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "agency_id": "00000001-0000-4004-8000-000000000004",
  "project_name": "Smoke test lead project name",
  "budget_thb": 1500000,
  "submission_date": "2026-12-31",
  "customer_control": "know_contact",
  "primary_contact": {"name": "Smoke Tester", "mobile": "0891112222"}
}' -o /tmp/smoke_lead.json
LEAD_ID=$(jq_get id < /tmp/smoke_lead.json)
LEAD_STATUS=$(jq_get status < /tmp/smoke_lead.json)
check "create lead -> draft" "draft" "$LEAD_STATUS"

# Reject short project name
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/leads" -H "$AUTH" \
  -H "Content-Type: application/json" -d '{
  "agency_id": "00000001-0000-4004-8000-000000000004",
  "project_name": "short",
  "budget_thb": 1000000,
  "submission_date": "2026-12-31",
  "customer_control": "know_contact",
  "primary_contact": {"name": "X", "mobile": "0891112222"}
}')
check "short project_name rejected" "400" "$HTTP"

# Qualify
NEW_STATUS=$(curl -s -X POST "$API/leads/$LEAD_ID/qualify" -H "$AUTH" | jq_get status)
check "qualify -> qualified" "qualified" "$NEW_STATUS"

# Audit trail
AUDIT_COUNT=$(curl -s "$API/leads/$LEAD_ID/audit" -H "$AUTH" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['meta']['total'])")
[ "$AUDIT_COUNT" -ge 2 ] && check "audit trail has events" "yes" "yes" \
  || check "audit trail has events" "yes" "no"

# Soft delete
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API/leads/$LEAD_ID" -H "$AUTH")
check "soft delete -> 204" "204" "$HTTP"

# Deleted lead is gone
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API/leads/$LEAD_ID" -H "$AUTH")
check "deleted lead -> 404" "404" "$HTTP"

echo ""
echo "=== $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
