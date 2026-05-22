-- =============================================================================
-- V007__views.sql
-- =============================================================================
-- Convenience views used by application queries and reports
-- =============================================================================

-- -----------------------------------------------------------------------------
-- leads_active
-- Default base view that hides soft-deleted rows.
-- Application code should query this instead of leads when listing.
-- -----------------------------------------------------------------------------
CREATE VIEW leads_active AS
  SELECT * FROM leads WHERE deleted_at IS NULL;

COMMENT ON VIEW leads_active IS 'Leads excluding soft-deleted rows; use as default base view';

-- -----------------------------------------------------------------------------
-- leads_with_primary_contact
-- Denormalized view for the Lead List page. Joins agency, owner, and primary
-- contact in one row per lead. Excludes soft-deleted.
-- -----------------------------------------------------------------------------
CREATE VIEW leads_with_primary_contact AS
  SELECT
    l.id,
    l.lead_code,
    l.project_name,
    l.budget_thb,
    l.submission_date,
    l.customer_control,
    l.status,
    l.owner_id,
    l.agency_id,
    l.created_at,
    l.updated_at,
    a.official_name_th       AS agency_name_th,
    a.short_name             AS agency_short_name,
    a.agency_type            AS agency_type,
    c.name                   AS primary_contact_name,
    c.role_title             AS primary_contact_role,
    c.email                  AS primary_contact_email,
    c.mobile                 AS primary_contact_mobile,
    u.display_name           AS owner_name,
    u.email                  AS owner_email,
    (l.submission_date - CURRENT_DATE) AS days_until_submission
  FROM leads l
  JOIN agencies a ON a.id = l.agency_id
  JOIN users u    ON u.id = l.owner_id
  LEFT JOIN contacts c ON c.lead_id = l.id AND c.is_primary = TRUE
  WHERE l.deleted_at IS NULL;

COMMENT ON VIEW leads_with_primary_contact IS 'Denormalized for Lead List page';

-- -----------------------------------------------------------------------------
-- agencies_with_stats
-- Agency master enriched with lead history aggregates.
-- Drives Smart Search ranking (frequency/recency signals) and Lead Detail
-- "Past leads" badge.
-- -----------------------------------------------------------------------------
CREATE VIEW agencies_with_stats AS
  SELECT
    a.*,
    COALESCE(stats.lead_count, 0)  AS past_leads_count,
    COALESCE(stats.won_count, 0)   AS past_leads_won,
    stats.last_lead_at
  FROM agencies a
  LEFT JOIN (
    SELECT
      agency_id,
      COUNT(*)                                      AS lead_count,
      COUNT(*) FILTER (WHERE status = 'converted')  AS won_count,
      MAX(created_at)                               AS last_lead_at
    FROM leads
    WHERE deleted_at IS NULL
    GROUP BY agency_id
  ) stats ON stats.agency_id = a.id;

COMMENT ON VIEW agencies_with_stats IS 'Agency with rolling lead/win history for Smart Search ranking';
