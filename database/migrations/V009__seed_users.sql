-- =============================================================================
-- V009__seed_users.sql
-- =============================================================================
-- Development users covering all four roles
-- Password for all dev users: 'devpassword' (bcrypt-hashed below)
-- Change/disable these before any production deployment.
-- =============================================================================

-- bcrypt hash of 'devpassword' (cost 10)
-- generated with: htpasswd -bnBC 10 "" devpassword | tr -d ':\n'
INSERT INTO users (id, email, display_name, role, password_hash, is_active) VALUES
  -- Admin
  ('10000000-0000-4000-8000-000000000001',
   'admin@dev.local', 'Admin User', 'admin',
   '$2y$10$pNVO5XzCDvFRSv/q7HhHGuyEKHQGZJ8VgKqHHJvFGGZxJD/F4cKqi', TRUE),

  -- Manager
  ('10000000-0000-4000-8000-000000000002',
   'manager@dev.local', 'Sales Manager', 'manager',
   '$2y$10$pNVO5XzCDvFRSv/q7HhHGuyEKHQGZJ8VgKqHHJvFGGZxJD/F4cKqi', TRUE),

  -- Sales reps
  ('10000000-0000-4000-8000-000000000003',
   'somchai.p@dev.local', 'Somchai Phakdi', 'sales',
   '$2y$10$pNVO5XzCDvFRSv/q7HhHGuyEKHQGZJ8VgKqHHJvFGGZxJD/F4cKqi', TRUE),

  ('10000000-0000-4000-8000-000000000004',
   'nattaya.k@dev.local', 'Nattaya Khamphan', 'sales',
   '$2y$10$pNVO5XzCDvFRSv/q7HhHGuyEKHQGZJ8VgKqHHJvFGGZxJD/F4cKqi', TRUE),

  ('10000000-0000-4000-8000-000000000005',
   'akarat.w@dev.local', 'Akarat Wongsri', 'sales',
   '$2y$10$pNVO5XzCDvFRSv/q7HhHGuyEKHQGZJ8VgKqHHJvFGGZxJD/F4cKqi', TRUE),

  -- Auditor
  ('10000000-0000-4000-8000-000000000006',
   'auditor@dev.local', 'Compliance Auditor', 'auditor',
   '$2y$10$pNVO5XzCDvFRSv/q7HhHGuyEKHQGZJ8VgKqHHJvFGGZxJD/F4cKqi', TRUE);
