-- =============================================================================
-- tests.sql
-- =============================================================================
-- Invariant tests for the migrations.
-- Each negative test wraps the failing statement in a DO block + EXCEPTION
-- so we can RAISE NOTICE 'PASS' explicitly.
-- =============================================================================

\echo
\echo === TEST 1: audit_log rejects UPDATE ===
INSERT INTO audit_log (entity_type, entity_id, action, description)
VALUES ('lead'::audit_entity_type, uuid_generate_v4(), 'test', 'fixture-for-update-test');

DO $$
BEGIN
  UPDATE audit_log SET description = 'tampered' WHERE description = 'fixture-for-update-test';
  RAISE EXCEPTION 'FAIL: UPDATE on audit_log should have been blocked';
EXCEPTION WHEN raise_exception THEN
  IF SQLERRM LIKE '%append-only%' THEN
    RAISE NOTICE 'PASS';
  ELSE
    RAISE EXCEPTION 'FAIL: blocked but with wrong error: %', SQLERRM;
  END IF;
END $$;

\echo
\echo === TEST 2: audit_log rejects DELETE ===
DO $$
BEGIN
  DELETE FROM audit_log WHERE description = 'fixture-for-update-test';
  RAISE EXCEPTION 'FAIL: DELETE on audit_log should have been blocked';
EXCEPTION WHEN raise_exception THEN
  IF SQLERRM LIKE '%append-only%' THEN
    RAISE NOTICE 'PASS';
  ELSE
    RAISE EXCEPTION 'FAIL: blocked but with wrong error: %', SQLERRM;
  END IF;
END $$;

\echo
\echo === TEST 3: lead project_name minimum length ===
DO $$
BEGIN
  INSERT INTO leads (agency_id, project_name, budget_thb, submission_date, customer_control, owner_id)
  VALUES (
    (SELECT id FROM agencies LIMIT 1),
    'Too short',
    1000000, '2027-01-01', 'know_contact'::customer_control,
    '10000000-0000-4000-8000-000000000003'::uuid
  );
  RAISE EXCEPTION 'FAIL: short project_name should have been rejected';
EXCEPTION WHEN check_violation THEN
  IF SQLERRM LIKE '%project_name_min%' THEN
    RAISE NOTICE 'PASS';
  ELSE
    RAISE EXCEPTION 'FAIL: wrong constraint: %', SQLERRM;
  END IF;
END $$;

\echo
\echo === TEST 4: lead budget must be > 0 ===
DO $$
BEGIN
  INSERT INTO leads (agency_id, project_name, budget_thb, submission_date, customer_control, owner_id)
  VALUES (
    (SELECT id FROM agencies LIMIT 1),
    'Valid length project name here',
    0, '2027-01-01', 'know_contact'::customer_control,
    '10000000-0000-4000-8000-000000000003'::uuid
  );
  RAISE EXCEPTION 'FAIL: zero budget should have been rejected';
EXCEPTION WHEN check_violation THEN
  IF SQLERRM LIKE '%budget_positive%' THEN
    RAISE NOTICE 'PASS';
  ELSE
    RAISE EXCEPTION 'FAIL: wrong constraint: %', SQLERRM;
  END IF;
END $$;

\echo
\echo === TEST 5: contact requires email OR mobile ===
DO $$
BEGIN
  INSERT INTO contacts (lead_id, name, is_primary)
  VALUES (
    '20000000-0000-4000-8000-000000000001'::uuid,
    'No Channels Person',
    FALSE
  );
  RAISE EXCEPTION 'FAIL: contact without channel should have been rejected';
EXCEPTION WHEN check_violation THEN
  IF SQLERRM LIKE '%at_least_one_channel%' THEN
    RAISE NOTICE 'PASS';
  ELSE
    RAISE EXCEPTION 'FAIL: wrong constraint: %', SQLERRM;
  END IF;
END $$;

\echo
\echo === TEST 6: only one primary contact per lead ===
DO $$
BEGIN
  INSERT INTO contacts (lead_id, name, mobile, is_primary)
  VALUES (
    '20000000-0000-4000-8000-000000000001'::uuid,
    'Second Primary',
    '0899999999',
    TRUE
  );
  RAISE EXCEPTION 'FAIL: second primary contact should have been rejected';
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'PASS';
END $$;

\echo
\echo === TEST 7: lead_code auto-generated ===
DO $$
DECLARE
  new_id UUID;
  new_code VARCHAR;
BEGIN
  INSERT INTO leads (agency_id, project_name, budget_thb, submission_date, customer_control, owner_id)
  VALUES (
    (SELECT id FROM agencies LIMIT 1),
    'Auto-generated lead code test',
    500000, '2027-01-01', 'know_contact'::customer_control,
    '10000000-0000-4000-8000-000000000001'::uuid  -- admin, not somchai
  )
  RETURNING id, lead_code INTO new_id, new_code;
  IF new_code ~ '^LD-20[0-9]{2}-[0-9]{4}$' THEN
    RAISE NOTICE 'PASS: %', new_code;
  ELSE
    RAISE EXCEPTION 'FAIL: bad lead_code format: %', new_code;
  END IF;
END $$;

\echo
\echo === TEST 8: RLS sales (somchai) sees 5 leads ===
DO $$
DECLARE
  visible INT;
BEGIN
  PERFORM set_config('app.current_user_id', '10000000-0000-4000-8000-000000000003', TRUE);
  PERFORM set_config('app.current_user_role', 'sales', TRUE);
  SET LOCAL ROLE crm_app;
  SELECT COUNT(*) INTO visible FROM leads;
  RESET ROLE;
  IF visible = 5 THEN
    RAISE NOTICE 'PASS: %', visible;
  ELSE
    RAISE EXCEPTION 'FAIL: expected 5, got %', visible;
  END IF;
END $$;

\echo
\echo === TEST 9: RLS manager sees all 10+ leads ===
DO $$
DECLARE
  visible INT;
BEGIN
  PERFORM set_config('app.current_user_id', '10000000-0000-4000-8000-000000000002', TRUE);
  PERFORM set_config('app.current_user_role', 'manager', TRUE);
  SET LOCAL ROLE crm_app;
  SELECT COUNT(*) INTO visible FROM leads;
  RESET ROLE;
  IF visible >= 10 THEN
    RAISE NOTICE 'PASS: %', visible;
  ELSE
    RAISE EXCEPTION 'FAIL: expected >= 10, got %', visible;
  END IF;
END $$;

\echo
\echo === TEST 10: agency seed loaded (>= 300) ===
DO $$
DECLARE
  cnt INT;
BEGIN
  SELECT COUNT(*) INTO cnt FROM agencies;
  IF cnt >= 300 THEN
    RAISE NOTICE 'PASS: %', cnt;
  ELSE
    RAISE EXCEPTION 'FAIL: expected >= 300, got %', cnt;
  END IF;
END $$;

\echo
\echo === TEST 11: soft delete hides from leads_active view ===
DO $$
DECLARE
  visible INT;
BEGIN
  UPDATE leads SET deleted_at = NOW() WHERE id = '20000000-0000-4000-8000-000000000001'::uuid;
  SELECT COUNT(*) INTO visible FROM leads_active
    WHERE id = '20000000-0000-4000-8000-000000000001'::uuid;
  IF visible = 0 THEN
    RAISE NOTICE 'PASS';
  ELSE
    RAISE EXCEPTION 'FAIL: soft-deleted lead still visible';
  END IF;
END $$;

\echo
\echo === Test suite finished ===
