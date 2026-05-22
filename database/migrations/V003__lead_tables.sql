-- =============================================================================
-- V003__lead_tables.sql
-- =============================================================================
-- Leads, contacts, and lead_code auto-generation
-- =============================================================================

-- Sequence for human-readable lead_code (LD-YYYY-NNNN)
CREATE SEQUENCE lead_code_seq START 1;

-- -----------------------------------------------------------------------------
-- leads
-- Core entity. Hard-checklist 6 required fields enforced via NOT NULL + CHECKs
-- -----------------------------------------------------------------------------
CREATE TABLE leads (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_code         VARCHAR(20) UNIQUE NOT NULL,
  agency_id         UUID NOT NULL REFERENCES agencies(id) ON DELETE RESTRICT,
  project_name      VARCHAR(200) NOT NULL,
  budget_thb        BIGINT NOT NULL,
  submission_date   DATE NOT NULL,
  customer_control  customer_control NOT NULL,
  status            lead_status NOT NULL DEFAULT 'draft',
  owner_id          UUID NOT NULL REFERENCES users(id),
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT leads_project_name_min  CHECK (LENGTH(TRIM(project_name)) >= 10),
  CONSTRAINT leads_project_name_max  CHECK (LENGTH(project_name) <= 200),
  CONSTRAINT leads_budget_positive   CHECK (budget_thb > 0),
  CONSTRAINT leads_budget_max        CHECK (budget_thb <= 9999999999),
  CONSTRAINT leads_submission_window CHECK (submission_date >= '2020-01-01')
);

COMMENT ON TABLE leads IS 'Government project lead — checklist enforced at column level';
COMMENT ON COLUMN leads.deleted_at IS 'Soft delete; application code never issues DELETE';
COMMENT ON COLUMN leads.lead_code IS 'Human-readable identifier, format LD-YYYY-NNNN';
COMMENT ON COLUMN leads.budget_thb IS 'Whole THB only — Thai government deals do not use decimals';

-- -----------------------------------------------------------------------------
-- Auto-generate lead_code from sequence + current year
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_lead_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lead_code IS NULL OR NEW.lead_code = '' THEN
    NEW.lead_code := 'LD-'
                  || EXTRACT(YEAR FROM NOW())::TEXT
                  || '-'
                  || LPAD(NEXTVAL('lead_code_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_leads_lead_code
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION generate_lead_code();

-- -----------------------------------------------------------------------------
-- contacts
-- Multiple contact points per lead. Exactly one is_primary per lead enforced
-- via partial unique index.
-- -----------------------------------------------------------------------------
CREATE TABLE contacts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id     UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  name        VARCHAR(120) NOT NULL,
  role_title  VARCHAR(120),
  email       VARCHAR(254),
  mobile      VARCHAR(20),
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contacts_name_min CHECK (LENGTH(TRIM(name)) >= 2),
  CONSTRAINT contacts_at_least_one_channel CHECK (
    email IS NOT NULL OR mobile IS NOT NULL
  ),
  CONSTRAINT contacts_email_lower CHECK (
    email IS NULL OR email = LOWER(email)
  )
);

-- Exactly one primary contact per lead
CREATE UNIQUE INDEX uq_contacts_one_primary
  ON contacts (lead_id)
  WHERE is_primary = TRUE;

COMMENT ON TABLE contacts IS 'Multiple contacts per lead, exactly one marked primary';
