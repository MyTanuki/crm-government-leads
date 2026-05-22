-- =============================================================================
-- V004__audit_log.sql
-- =============================================================================
-- Append-only audit log enforced at DB trigger level
-- This is a CONTROL VARIABLE — must never be loosened.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- audit_log
-- Polymorphic event store. Every state change in the system writes one row.
-- -----------------------------------------------------------------------------
CREATE TABLE audit_log (
  id            BIGSERIAL PRIMARY KEY,
  entity_type   audit_entity_type NOT NULL,
  entity_id     UUID NOT NULL,
  action        VARCHAR(50) NOT NULL,
  actor_id      UUID REFERENCES users(id),
  field_name    VARCHAR(80),
  before_value  JSONB,
  after_value   JSONB,
  description   TEXT NOT NULL,
  ip_address    INET,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_log IS 'Append-only event store. UPDATE and DELETE forbidden by trigger.';
COMMENT ON COLUMN audit_log.entity_id IS 'Polymorphic FK — no DB constraint, validated by entity_type';
COMMENT ON COLUMN audit_log.before_value IS 'JSON snapshot of field(s) before change, NULL for created/deleted events';
COMMENT ON COLUMN audit_log.after_value IS 'JSON snapshot of field(s) after change';

-- -----------------------------------------------------------------------------
-- Append-only enforcement
-- Any attempt to UPDATE or DELETE an audit row raises an exception.
-- Application code with full DB credentials cannot bypass this.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only; UPDATE and DELETE forbidden';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_no_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER trg_audit_no_delete
  BEFORE DELETE ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_modification();

-- -----------------------------------------------------------------------------
-- Helper function: write an audit entry
-- Usage from application:
--   SELECT log_audit('lead', '<uuid>', 'updated', '<actor>', 'Budget changed',
--                    'budget_thb', '{"value":1000000}'::jsonb,
--                    '{"value":2000000}'::jsonb);
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_audit(
  p_entity_type audit_entity_type,
  p_entity_id   UUID,
  p_action      VARCHAR,
  p_actor_id    UUID,
  p_description TEXT,
  p_field_name  VARCHAR DEFAULT NULL,
  p_before      JSONB   DEFAULT NULL,
  p_after       JSONB   DEFAULT NULL,
  p_ip          INET    DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
  v_id BIGINT;
BEGIN
  INSERT INTO audit_log (
    entity_type, entity_id, action, actor_id,
    description, field_name, before_value, after_value, ip_address
  )
  VALUES (
    p_entity_type, p_entity_id, p_action, p_actor_id,
    p_description, p_field_name, p_before, p_after, p_ip
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_audit IS 'Application-facing helper for writing audit entries';
