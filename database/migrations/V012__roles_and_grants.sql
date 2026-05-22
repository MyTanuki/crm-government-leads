-- =============================================================================
-- V012__roles_and_grants.sql
-- =============================================================================
-- Application database role and per-table grants
--
-- The backend connects as `crm_app` and uses SET LOCAL to communicate the
-- current user and role to RLS policies. This separation means RLS, not
-- table-level grants, governs row visibility.
-- =============================================================================

-- Create the application role if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'crm_app') THEN
    CREATE ROLE crm_app WITH LOGIN PASSWORD 'devpassword';
  END IF;
END $$;

-- Schema usage
GRANT USAGE ON SCHEMA public TO crm_app;

-- Table permissions (RLS filters which rows are visible)
GRANT SELECT, INSERT, UPDATE, DELETE ON
  users, agencies, agency_aliases, agency_suggestions,
  leads, contacts, audit_log
TO crm_app;

-- Sequences (for SERIAL/BIGSERIAL columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO crm_app;

-- Views
GRANT SELECT ON
  leads_active, leads_with_primary_contact, agencies_with_stats
TO crm_app;

-- Functions
GRANT EXECUTE ON FUNCTION
  current_user_id(),
  current_user_role(),
  log_audit(audit_entity_type, UUID, VARCHAR, UUID, TEXT, VARCHAR, JSONB, JSONB, INET)
TO crm_app;

-- Future tables created in this schema also grant to crm_app
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO crm_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO crm_app;

COMMENT ON ROLE crm_app IS
  'Application role used by backend. Row visibility controlled by RLS, not grants.';
