-- =============================================================================
-- V001__extensions_and_enums.sql
-- =============================================================================
-- Enable required extensions and define custom ENUM types used across schema
-- =============================================================================

-- Extensions
-- pg_trgm: trigram similarity (used by GIN indexes for Smart Search fallback)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- uuid-ossp: UUID generation (uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM types
-- These map 1:1 with OpenAPI schema enums in api/openapi.yaml

-- Role-based access control
CREATE TYPE user_role AS ENUM (
  'sales',
  'manager',
  'admin',
  'auditor'
);

-- Government agency classification
CREATE TYPE agency_type AS ENUM (
  'ministry',         -- กระทรวง
  'department',       -- กรม, สำนัก
  'state_enterprise', -- รัฐวิสาหกิจ
  'local_admin',      -- อปท. (อบจ., เทศบาล, อบต., กทม., เมืองพัทยา)
  'university',       -- มหาวิทยาลัยรัฐ
  'other'             -- หน่วยงานอิสระ, ศาล, รัฐสภา, etc.
);

CREATE TYPE agency_status AS ENUM (
  'active',
  'deprecated'
);

-- Lead lifecycle stages
CREATE TYPE lead_status AS ENUM (
  'draft',           -- being filled in
  'qualified',       -- passed checklist, ready to risk-score
  'pending_review',  -- risk-medium, waiting tier approval
  'blocked',         -- risk-high, blocked from convert
  'converted',       -- became a deal
  'lost'             -- explicitly closed lost
);

-- Sales relationship strength with customer
CREATE TYPE customer_control AS ENUM (
  'no_contact',           -- ไม่มี
  'know_contact',         -- รู้จัก
  'reach_user',           -- เข้าถึงผู้ใช้
  'reach_decision_maker'  -- เข้าถึงผู้ตัดสินใจ
);

CREATE TYPE suggestion_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

-- Polymorphic reference for audit_log
CREATE TYPE audit_entity_type AS ENUM (
  'lead',
  'agency',
  'contact',
  'user',
  'agency_suggestion',
  'settings'
);

CREATE TYPE alias_source AS ENUM (
  'official',      -- from data.go.th
  'common',        -- nickname / common usage
  'abbreviation',  -- เช่น สพฐ., อย., DSI
  'misspelling'    -- sales-submitted typo corrections
);
