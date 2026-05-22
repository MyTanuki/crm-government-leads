-- =============================================================================
-- V011__seed_sample_leads.sql
-- =============================================================================
-- Sample leads across the lifecycle for development and testing.
-- Uses subquery lookups by unique short_name OR official_name_th so the seed
-- is robust against renumbering of agency UUIDs.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Leads
-- ---------------------------------------------------------------------------
INSERT INTO leads (
  id, lead_code, agency_id, project_name, budget_thb, submission_date,
  customer_control, status, owner_id, created_at
) VALUES
  -- Draft, low value, กรมสรรพากร
  ('20000000-0000-4000-8000-000000000001'::uuid, 'LD-2026-0001',
   (SELECT id FROM agencies WHERE official_name_th = 'กรมสรรพากร'),
   'ติดตั้งจอ LED แสดงผลในห้องประชุมใหญ่ ชั้น 12',
   1850000, '2026-08-15', 'reach_user', 'draft',
   '10000000-0000-4000-8000-000000000003', NOW() - INTERVAL '2 days'),

  -- Qualified, medium, จุฬาฯ
  ('20000000-0000-4000-8000-000000000002', 'LD-2026-0002',
   (SELECT id FROM agencies WHERE official_name_th = 'จุฬาลงกรณ์มหาวิทยาลัย'),
   'Smart classroom Interactive Flat Panel 75 นิ้ว 24 ห้อง คณะวิศวกรรมศาสตร์',
   8400000, '2026-07-30', 'reach_decision_maker', 'qualified',
   '10000000-0000-4000-8000-000000000003', NOW() - INTERVAL '7 days'),

  -- Qualified, มช.
  ('20000000-0000-4000-8000-000000000003', 'LD-2026-0003',
   (SELECT id FROM agencies WHERE official_name_th = 'มหาวิทยาลัยเชียงใหม่'),
   'ระบบเสียงประกาศห้องประชุมและหอประชุมรวม 6 อาคาร iTC/Audac',
   4250000, '2026-09-20', 'reach_user', 'qualified',
   '10000000-0000-4000-8000-000000000004', NOW() - INTERVAL '5 days'),

  -- Pending review, large LED, กฟน.
  ('20000000-0000-4000-8000-000000000004', 'LD-2026-0004',
   (SELECT id FROM agencies WHERE official_name_th = 'การไฟฟ้านครหลวง'),
   'จอ LED Outdoor P4 ขนาด 18 ตารางเมตร อาคารสำนักงานใหญ่ Leyard',
   12500000, '2026-10-10', 'know_contact', 'pending_review',
   '10000000-0000-4000-8000-000000000005', NOW() - INTERVAL '12 days'),

  -- Pending review, Aver UC, กรมสรรพสามิต
  ('20000000-0000-4000-8000-000000000005', 'LD-2026-0005',
   (SELECT id FROM agencies WHERE official_name_th = 'กรมสรรพสามิต'),
   'อุปกรณ์ Smart Meeting Room Aver 18 ห้อง พร้อมระบบ video conference',
   6850000, '2026-08-25', 'reach_user', 'pending_review',
   '10000000-0000-4000-8000-000000000003', NOW() - INTERVAL '15 days'),

  -- Blocked, อบจ.เชียงใหม่
  ('20000000-0000-4000-8000-000000000006', 'LD-2026-0006',
   (SELECT id FROM agencies WHERE official_name_th = 'องค์การบริหารส่วนจังหวัดเชียงใหม่'),
   'ระบบ CCTV และ Access Control ครอบคลุม 12 สาขา จ.เชียงใหม่',
   3200000, '2026-06-15', 'no_contact', 'blocked',
   '10000000-0000-4000-8000-000000000004', NOW() - INTERVAL '20 days'),

  -- Converted, กรมศุลกากร
  ('20000000-0000-4000-8000-000000000007', 'LD-2025-0089',
   (SELECT id FROM agencies WHERE official_name_th = 'กรมศุลกากร'),
   'ระบบ Digital Signage 24 จุด ด่านศุลกากร 8 ด่านหลัก',
   5400000, '2025-12-15', 'reach_decision_maker', 'converted',
   '10000000-0000-4000-8000-000000000003', NOW() - INTERVAL '90 days'),

  -- Converted big, กทม.
  ('20000000-0000-4000-8000-000000000008', 'LD-2025-0102',
   (SELECT id FROM agencies WHERE official_name_th = 'กรุงเทพมหานคร'),
   'จอ LED Indoor P2.5 ห้องประชุมสภา กทม. และ video wall ห้อง command',
   18900000, '2025-11-20', 'reach_decision_maker', 'converted',
   '10000000-0000-4000-8000-000000000005', NOW() - INTERVAL '120 days'),

  -- Lost, กรมการขนส่งทางบก
  ('20000000-0000-4000-8000-000000000009', 'LD-2025-0156',
   (SELECT id FROM agencies WHERE official_name_th = 'กรมการขนส่งทางบก'),
   'ระบบเสียงประกาศและจอแสดงผลคิว สำนักงานขนส่งจังหวัด 12 สาขา',
   4750000, '2025-09-30', 'know_contact', 'lost',
   '10000000-0000-4000-8000-000000000004', NOW() - INTERVAL '180 days'),

  -- Recent draft, กรมการแพทย์
  ('20000000-0000-4000-8000-000000000010', 'LD-2026-0010',
   (SELECT id FROM agencies WHERE official_name_th = 'กรมการแพทย์'),
   'ระบบประกาศและจอแสดงคิวห้องตรวจ โรงพยาบาลศูนย์ 6 แห่ง',
   7350000, '2026-11-05', 'reach_user', 'draft',
   '10000000-0000-4000-8000-000000000003', NOW() - INTERVAL '1 day');

-- Advance the lead_code sequence past the manually-assigned codes so future
-- auto-generated codes (LD-YYYY-NNNN) do not collide.
SELECT setval('lead_code_seq', 200);

-- ---------------------------------------------------------------------------
-- Primary contacts
-- ---------------------------------------------------------------------------
INSERT INTO contacts (lead_id, name, role_title, email, mobile, is_primary) VALUES
  ('20000000-0000-4000-8000-000000000001'::uuid, 'คุณวีระ จันทร์ทอง',
   'หัวหน้าฝ่ายเทคโนโลยีสารสนเทศ', 'weera.j@rd.go.th', '0812345001', TRUE),
  ('20000000-0000-4000-8000-000000000002', 'รศ.ดร.สมชาย วงศ์ไพศาล',
   'รองคณบดีฝ่ายวิชาการ คณะวิศวฯ', 'somchai.w@chula.ac.th', '0812345002', TRUE),
  ('20000000-0000-4000-8000-000000000003', 'คุณนพดล อินทร์งาม',
   'ผู้อำนวยการกองกายภาพ', 'noppadon.i@cmu.ac.th', '0812345003', TRUE),
  ('20000000-0000-4000-8000-000000000004', 'คุณธีระ ศรีสวัสดิ์',
   'รองผู้ว่าการ ฝ่ายบริหาร', 'theera.s@mea.or.th', '0812345004', TRUE),
  ('20000000-0000-4000-8000-000000000005', 'คุณพรพิมล รัตนพันธ์',
   'ผู้อำนวยการกองเทคโนโลยีสารสนเทศ', 'pornpimon.r@excise.go.th', '0812345005', TRUE),
  ('20000000-0000-4000-8000-000000000006', 'คุณสมศักดิ์ ทองดี',
   'นักวิเคราะห์นโยบาย', NULL, '0812345006', TRUE),
  ('20000000-0000-4000-8000-000000000007', 'คุณวิชัย เกตุแก้ว',
   'ผู้อำนวยการสำนักเทคโนโลยีสารสนเทศ', 'wichai.k@customs.go.th', '0812345007', TRUE),
  ('20000000-0000-4000-8000-000000000008', 'คุณดวงใจ สุขสมบูรณ์',
   'ผู้อำนวยการสำนักงานเลขานุการสภา กทม.', 'duangjai.s@bangkok.go.th', '0812345008', TRUE),
  ('20000000-0000-4000-8000-000000000009', 'คุณประยุทธ์ มีชัย',
   'หัวหน้ากลุ่มงานเทคโนโลยี', 'prayut.m@dlt.go.th', '0812345009', TRUE),
  ('20000000-0000-4000-8000-000000000010', 'พญ.อรวรรณ สมบูรณ์',
   'รองอธิบดี ฝ่ายบริการ', 'orawan.s@dms.go.th', '0812345010', TRUE);

-- ---------------------------------------------------------------------------
-- Audit log entries
-- ---------------------------------------------------------------------------

-- Creation events for all sample leads
INSERT INTO audit_log (entity_type, entity_id, action, actor_id, description, after_value, occurred_at)
SELECT
  'lead'::audit_entity_type, l.id, 'created', l.owner_id,
  'Lead created: ' || l.project_name,
  jsonb_build_object(
    'lead_code', l.lead_code,
    'agency_id', l.agency_id,
    'project_name', l.project_name,
    'budget_thb', l.budget_thb,
    'status', l.status::text
  ),
  l.created_at
FROM leads l
WHERE l.id::TEXT LIKE '20000000-%';

-- Status changes that show the lifecycle
INSERT INTO audit_log (entity_type, entity_id, action, actor_id, description, field_name, before_value, after_value, occurred_at)
VALUES
  ('lead', '20000000-0000-4000-8000-000000000007', 'status_changed',
   '10000000-0000-4000-8000-000000000003',
   'Status changed from qualified to converted',
   'status', '{"status": "qualified"}'::jsonb, '{"status": "converted"}'::jsonb,
   NOW() - INTERVAL '70 days'),
  ('lead', '20000000-0000-4000-8000-000000000008', 'status_changed',
   '10000000-0000-4000-8000-000000000005',
   'Status changed from pending_review to converted',
   'status', '{"status": "pending_review"}'::jsonb, '{"status": "converted"}'::jsonb,
   NOW() - INTERVAL '100 days'),
  ('lead', '20000000-0000-4000-8000-000000000006', 'status_changed',
   '10000000-0000-4000-8000-000000000004',
   'Status changed from draft to blocked (high risk score)',
   'status', '{"status": "draft"}'::jsonb, '{"status": "blocked"}'::jsonb,
   NOW() - INTERVAL '18 days'),
  ('lead', '20000000-0000-4000-8000-000000000004', 'updated',
   '10000000-0000-4000-8000-000000000005',
   'Budget revised after technical review',
   'budget_thb', '{"value": 11000000}'::jsonb, '{"value": 12500000}'::jsonb,
   NOW() - INTERVAL '8 days');

-- ---------------------------------------------------------------------------
-- Sample agency suggestions (pending)
-- ---------------------------------------------------------------------------
INSERT INTO agency_suggestions (
  suggested_name, evidence_url, note, status, suggested_by, created_at
) VALUES
  ('องค์การบริหารส่วนตำบลบางพลีน้อย',
   'https://www.data.go.th/dataset/lao-listing',
   'เพิ่งได้คุยกับ อบต. นี้สำหรับงาน CCTV — อยู่ใน อ.บางพลี สมุทรปราการ ยังไม่อยู่ใน master',
   'pending',
   '10000000-0000-4000-8000-000000000003',
   NOW() - INTERVAL '2 hours'),
  ('สำนักงานพัฒนาธุรกรรมทางอิเล็กทรอนิกส์',
   NULL,
   'หรือ ETDA — เป็นองค์การมหาชนภายใต้กระทรวงดีอี งานสมาร์ทออฟฟิศ',
   'pending',
   '10000000-0000-4000-8000-000000000004',
   NOW() - INTERVAL '1 day');
