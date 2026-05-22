#!/usr/bin/env bash
# =============================================================================
# init.sh
# =============================================================================
# One-shot database setup: drop, create, migrate, seed, verify.
#
# Usage:
#   ./init.sh                  # uses defaults
#   PGDATABASE=crm_dev ./init.sh
#
# Environment variables:
#   PGDATABASE   target database name (default: crm_leads_dev)
#   PGUSER       postgres superuser (default: postgres)
#   PGHOST       postgres host (default: empty = local socket)
# =============================================================================

set -euo pipefail

DB="${PGDATABASE:-crm_leads_dev}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIG_DIR="$SCRIPT_DIR/migrations"

echo "=============================================="
echo "CRM Government Leads — Database Initialization"
echo "=============================================="
echo "Target DB: $DB"
echo ""

# Determine psql invocation
if command -v sudo &> /dev/null && sudo -u postgres true 2>/dev/null; then
  PSQL() { sudo -u postgres psql "$@"; }
elif command -v su &> /dev/null && id postgres &> /dev/null; then
  PSQL() {
    local cmd="psql"
    for arg in "$@"; do
      cmd+=" $(printf '%q' "$arg")"
    done
    su - postgres -c "$cmd"
  }
else
  PSQL() { psql "$@"; }
fi

echo "Step 1: Recreating database..."
PSQL -c "DROP DATABASE IF EXISTS $DB;" > /dev/null
PSQL -c "CREATE DATABASE $DB;" > /dev/null
echo "  ✓ Database $DB created"

echo ""
echo "Step 2: Applying migrations..."
for f in "$MIG_DIR"/V*.sql; do
  basename_f=$(basename "$f")
  output=$(PSQL -d "$DB" -f "$f" 2>&1)
  if echo "$output" | grep -qE "^ERROR:|^psql:.*ERROR:"; then
    echo "  ✗ $basename_f"
    echo "$output" | grep -E "ERROR" | head -3
    exit 1
  else
    echo "  ✓ $basename_f"
  fi
done

echo ""
echo "Step 3: Verifying data..."
PSQL -d "$DB" -t -c "
  SELECT
    '  Users:          ' || COUNT(*) FROM users
  UNION ALL SELECT
    '  Agencies:       ' || COUNT(*) FROM agencies
  UNION ALL SELECT
    '  Aliases:        ' || COUNT(*) FROM agency_aliases
  UNION ALL SELECT
    '  Leads:          ' || COUNT(*) FROM leads
  UNION ALL SELECT
    '  Contacts:       ' || COUNT(*) FROM contacts
  UNION ALL SELECT
    '  Audit entries:  ' || COUNT(*) FROM audit_log
  UNION ALL SELECT
    '  Suggestions:    ' || COUNT(*) FROM agency_suggestions
  ;
"

echo ""
echo "=============================================="
echo "Database ready: $DB"
echo ""
echo "Connect as application:"
echo "  psql postgresql://crm_app:devpassword@localhost/$DB"
echo ""
echo "Dev users (password: devpassword):"
echo "  admin@dev.local       (admin)"
echo "  manager@dev.local     (manager)"
echo "  somchai.p@dev.local   (sales)"
echo "  nattaya.k@dev.local   (sales)"
echo "  akarat.w@dev.local    (sales)"
echo "  auditor@dev.local     (auditor)"
echo "=============================================="
