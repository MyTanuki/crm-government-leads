-- =============================================================================
-- V002__core_tables.sql
-- =============================================================================
-- Users, agency master data, aliases, and suggestion queue
-- =============================================================================

-- -----------------------------------------------------------------------------
-- users
-- CRM authenticated users with role-based access
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(254) NOT NULL UNIQUE,
  display_name    VARCHAR(80)  NOT NULL,
  role            user_role    NOT NULL DEFAULT 'sales',
  line_user_id    VARCHAR(64),
  password_hash   VARCHAR(255),
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT users_email_lower CHECK (email = LOWER(email)),
  CONSTRAINT users_line_user_unique UNIQUE (line_user_id)
);

COMMENT ON TABLE users IS 'CRM users with role-based access';
COMMENT ON COLUMN users.line_user_id IS 'Bound via LINE Login OAuth, NULL until linked';
COMMENT ON COLUMN users.password_hash IS 'bcrypt or argon2 hash; never plaintext';

-- -----------------------------------------------------------------------------
-- agencies
-- Government agency master data sourced from data.go.th + manual top-up
-- -----------------------------------------------------------------------------
CREATE TABLE agencies (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  official_name_th    VARCHAR(255) NOT NULL,
  official_name_en    VARCHAR(255),
  short_name          VARCHAR(100),
  tax_id              VARCHAR(13),
  gfmis_code          VARCHAR(20),
  agency_type         agency_type NOT NULL,
  parent_agency_id    UUID REFERENCES agencies(id) ON DELETE SET NULL,
  province            VARCHAR(50),
  default_address     TEXT,
  status              agency_status NOT NULL DEFAULT 'active',
  source              VARCHAR(50) DEFAULT 'data.go.th',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT agencies_tax_id_format CHECK (
    tax_id IS NULL OR tax_id ~ '^[0-9]{13}$'
  ),
  CONSTRAINT agencies_tax_id_unique UNIQUE (tax_id)
);

COMMENT ON TABLE agencies IS 'Government agency master data';
COMMENT ON COLUMN agencies.parent_agency_id IS 'Self-reference for hierarchy (กระทรวง -> กรม -> สำนัก)';
COMMENT ON COLUMN agencies.tax_id IS '13-digit Thai tax ID, validated by format';
COMMENT ON COLUMN agencies.gfmis_code IS 'GFMIS unit code for government accounting integration';

-- -----------------------------------------------------------------------------
-- agency_aliases
-- Alternative names, abbreviations, common misspellings
-- Used by Smart Search to match user input to canonical agencies
-- -----------------------------------------------------------------------------
CREATE TABLE agency_aliases (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id   UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  alias       VARCHAR(255) NOT NULL,
  source      alias_source NOT NULL DEFAULT 'common',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT agency_aliases_unique UNIQUE (agency_id, alias)
);

COMMENT ON TABLE agency_aliases IS 'Alternative names for Smart Search matching';

-- -----------------------------------------------------------------------------
-- agency_suggestions
-- Sales requests for adding new agencies; reviewed by Admin
-- -----------------------------------------------------------------------------
CREATE TABLE agency_suggestions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggested_name  VARCHAR(255) NOT NULL,
  evidence_url    TEXT,
  note            TEXT,
  status          suggestion_status NOT NULL DEFAULT 'pending',
  suggested_by    UUID NOT NULL REFERENCES users(id),
  reviewed_by     UUID REFERENCES users(id),
  review_reason   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ,
  CONSTRAINT agency_suggestions_review_consistency CHECK (
    (status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL) OR
    (status IN ('approved', 'rejected') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
  )
);

COMMENT ON TABLE agency_suggestions IS 'Sales-submitted requests for new agencies, pending Admin review';
