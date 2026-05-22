-- =============================================================================
-- V006__rls_policies.sql
-- =============================================================================
-- Row-Level Security implements the permission matrix in SYSTEM_1_SPEC.md
--
-- Application contract:
--   At the start of each transaction, the backend MUST set:
--     SET LOCAL app.current_user_id   = '<uuid>';
--     SET LOCAL app.current_user_role = '<role>';
--   These are read by current_user_id() / current_user_role() helpers below.
--
-- Permission matrix:
--   Role     | List          | Detail | Edit          | Delete        | Audit
--   ---------|---------------|--------|---------------|---------------|------
--   sales    | own           | own    | own           | own (soft)    | own
--   manager  | all           | all    | all           | all           | all
--   admin    | all           | all    | all           | all           | all
--   auditor  | all (read)    | all    | -             | -             | all
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Session context helpers
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION current_user_role() RETURNS user_role AS $$
  SELECT NULLIF(current_setting('app.current_user_role', TRUE), '')::user_role;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION current_user_id IS 'Reads app.current_user_id session var set by backend';
COMMENT ON FUNCTION current_user_role IS 'Reads app.current_user_role session var set by backend';

-- -----------------------------------------------------------------------------
-- Enable RLS
-- -----------------------------------------------------------------------------
ALTER TABLE leads     ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- LEADS policies
-- -----------------------------------------------------------------------------

-- Sales: only their own leads
CREATE POLICY leads_sales_own ON leads
  FOR ALL TO PUBLIC
  USING (
    current_user_role() = 'sales' AND owner_id = current_user_id()
  )
  WITH CHECK (
    current_user_role() = 'sales' AND owner_id = current_user_id()
  );

-- Manager: all leads
CREATE POLICY leads_manager_all ON leads
  FOR ALL TO PUBLIC
  USING (current_user_role() = 'manager')
  WITH CHECK (current_user_role() = 'manager');

-- Admin: all leads
CREATE POLICY leads_admin_all ON leads
  FOR ALL TO PUBLIC
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

-- Auditor: read-only on all leads
CREATE POLICY leads_auditor_read ON leads
  FOR SELECT TO PUBLIC
  USING (current_user_role() = 'auditor');

-- -----------------------------------------------------------------------------
-- CONTACTS policies — inherit visibility from lead
-- The EXISTS subquery is itself subject to leads RLS, so contacts are only
-- visible if the underlying lead is.
-- -----------------------------------------------------------------------------
CREATE POLICY contacts_through_lead ON contacts
  FOR ALL TO PUBLIC
  USING (
    EXISTS (SELECT 1 FROM leads l WHERE l.id = contacts.lead_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM leads l WHERE l.id = contacts.lead_id)
  );

-- -----------------------------------------------------------------------------
-- AUDIT LOG policies
-- -----------------------------------------------------------------------------

-- Sales: see only events where they were the actor
CREATE POLICY audit_sales_own ON audit_log
  FOR SELECT TO PUBLIC
  USING (
    current_user_role() = 'sales' AND actor_id = current_user_id()
  );

-- Manager / Admin / Auditor: read all
CREATE POLICY audit_privileged_read ON audit_log
  FOR SELECT TO PUBLIC
  USING (current_user_role() IN ('manager', 'admin', 'auditor'));

-- Any authenticated user may INSERT audit entries (writes are controlled
-- by which paths call log_audit() in application code, not by RLS)
CREATE POLICY audit_insert ON audit_log
  FOR INSERT TO PUBLIC
  WITH CHECK (current_user_id() IS NOT NULL);
