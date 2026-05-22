-- =============================================================================
-- V013__security_invoker_views.sql
-- =============================================================================
-- By default a Postgres view runs with the privileges and RLS context of the
-- view OWNER, not the querying user. That means RLS on the underlying `leads`
-- table is bypassed when querying through `leads_with_primary_contact`.
--
-- PostgreSQL 15+ supports `security_invoker` which makes the view run RLS as
-- the calling user. We enable it on every view that touches RLS-protected
-- tables.
--
-- Reference: https://www.postgresql.org/docs/16/sql-createview.html
-- =============================================================================

ALTER VIEW leads_active             SET (security_invoker = true);
ALTER VIEW leads_with_primary_contact SET (security_invoker = true);
ALTER VIEW agencies_with_stats      SET (security_invoker = true);

-- Note: agencies_with_stats aggregates from `leads`. With security_invoker on,
-- a sales user's past_leads_count now reflects only THEIR leads. For Smart
-- Search ranking that is acceptable in Phase 1 (popular-with-me ranking).
-- Phase 2 may introduce a SECURITY DEFINER function if global counts are
-- needed for the Static Baseline layer.
