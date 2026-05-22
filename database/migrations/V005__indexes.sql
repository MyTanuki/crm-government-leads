-- =============================================================================
-- V005__indexes.sql
-- =============================================================================
-- Performance indexes for the hot paths defined in SYSTEM_1_SPEC.md
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Smart Search trigram indexes
-- Postgres fallback for when Typesense is unavailable. Production Smart Search
-- goes through Typesense; these indexes still make ad-hoc Postgres queries fast.
-- -----------------------------------------------------------------------------
CREATE INDEX idx_agencies_name_th_trgm
  ON agencies USING gin (official_name_th gin_trgm_ops);

CREATE INDEX idx_agencies_short_name_trgm
  ON agencies USING gin (short_name gin_trgm_ops)
  WHERE short_name IS NOT NULL;

CREATE INDEX idx_agency_aliases_alias_trgm
  ON agency_aliases USING gin (alias gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- Agency lookups
-- -----------------------------------------------------------------------------
CREATE INDEX idx_agencies_parent
  ON agencies (parent_agency_id)
  WHERE parent_agency_id IS NOT NULL;

CREATE INDEX idx_agencies_type_status
  ON agencies (agency_type, status);

CREATE INDEX idx_agencies_tax_id
  ON agencies (tax_id)
  WHERE tax_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Lead list and filter
-- All partial indexes exclude soft-deleted rows to keep them small
-- -----------------------------------------------------------------------------
CREATE INDEX idx_leads_owner_status
  ON leads (owner_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_leads_agency
  ON leads (agency_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_leads_submission_date
  ON leads (submission_date)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_leads_created_at
  ON leads (created_at DESC)
  WHERE deleted_at IS NULL;

-- Archive search: find soft-deleted leads
CREATE INDEX idx_leads_deleted
  ON leads (deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

-- Free-text search on project name (List page filter input)
CREATE INDEX idx_leads_project_name_trgm
  ON leads USING gin (project_name gin_trgm_ops)
  WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- Contact lookups
-- -----------------------------------------------------------------------------
CREATE INDEX idx_contacts_lead
  ON contacts (lead_id);

-- -----------------------------------------------------------------------------
-- Audit log lookups
-- -----------------------------------------------------------------------------
CREATE INDEX idx_audit_entity
  ON audit_log (entity_type, entity_id, occurred_at DESC);

CREATE INDEX idx_audit_actor
  ON audit_log (actor_id, occurred_at DESC);

CREATE INDEX idx_audit_occurred
  ON audit_log (occurred_at DESC);

-- -----------------------------------------------------------------------------
-- Agency suggestion review queue
-- -----------------------------------------------------------------------------
CREATE INDEX idx_suggestions_pending
  ON agency_suggestions (created_at DESC)
  WHERE status = 'pending';

-- -----------------------------------------------------------------------------
-- User lookups
-- -----------------------------------------------------------------------------
CREATE INDEX idx_users_role
  ON users (role)
  WHERE is_active = TRUE;

CREATE INDEX idx_users_line_user
  ON users (line_user_id)
  WHERE line_user_id IS NOT NULL;
