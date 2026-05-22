#!/usr/bin/env bash
# =============================================================================
# tests/run_all.sh
# =============================================================================
# Recreates the DB, applies migrations in order, runs invariant tests.
# =============================================================================

set -u

DB="${PGDATABASE:-crm_leads_test}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIG_DIR="$SCRIPT_DIR/../migrations"
TEST_SQL="$SCRIPT_DIR/tests.sql"

# Detect how to invoke psql as the postgres user
if command -v sudo &> /dev/null && sudo -n true 2>/dev/null; then
  RUN_AS_PG="sudo -u postgres"
else
  RUN_AS_PG="su - postgres -c"
fi

run_psql() {
  if [ "$RUN_AS_PG" = "sudo -u postgres" ]; then
    sudo -u postgres psql "$@"
  else
    # Build single command string for su -c
    local args=()
    for arg in "$@"; do
      args+=("$(printf '%q' "$arg")")
    done
    su - postgres -c "psql ${args[*]}"
  fi
}

echo "=== Recreating database: $DB ==="
run_psql -c "DROP DATABASE IF EXISTS $DB;" > /dev/null
run_psql -c "CREATE DATABASE $DB;" > /dev/null

echo ""
echo "=== Running migrations ==="
for f in "$MIG_DIR"/V*.sql; do
  name=$(basename "$f")
  output=$(run_psql -d "$DB" -v ON_ERROR_STOP=1 -f "$f" 2>&1)
  if echo "$output" | grep -qE "^(psql:.*)?ERROR:"; then
    echo "✗ $name FAILED"
    echo "$output" | grep "ERROR:" | head -3 | sed 's/^/    /'
    exit 1
  else
    echo "✓ $name"
  fi
done

echo ""
echo "=== Running invariant tests ==="
run_psql -d "$DB" -f "$TEST_SQL" 2>&1 | grep -E "PASS|FAIL|^=== TEST|^ERROR" | head -80

echo ""
echo "=== Done ==="
