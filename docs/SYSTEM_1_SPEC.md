# System 1 — Government Lead Screening

Complete specification. Phase 1 is ready to build; later phases are designed
at varying levels of detail (see ROADMAP.md).

---

## Problem statement

Sales reps create leads for government projects. Many never become deals,
and the company wants to filter them earlier to focus effort on winnable
deals. The owner wants a structured Convert step that:

1. Requires complete information (6 mandatory fields)
2. Scores the lead's risk against a known rubric
3. Routes high-risk leads to manager approval or blocks them
4. Notifies stakeholders via LINE OA
5. Logs every decision for audit

---

## Decision flow

```
Lead entry (Smart Search agency)
        ↓
   Click "Convert"
        ↓
Required field checklist (6 fields)
        ↓     ← reject if missing
Rule-based risk score (0–100)
        ↓
   Risk gate
   ├─ 0–30  Low     → Auto-convert to Deal
   ├─ 31–60 Medium  → Tier approval workflow
   └─ 61–100 High   → Block + show suggested actions
        ↓
LINE notification fired to relevant party
        ↓
Audit log row written
```

---

## The six required fields (Hard Checklist)

These block the Convert action if any are missing. Validation runs both
client-side (for UX) and server-side (for safety).

| Field | Rule |
|---|---|
| Organisation | Must reference an `agency_id` from Smart Search — free text rejected |
| Project name | 10–200 characters, trim whitespace both ends |
| Budget (THB) | Integer > 0, max 9,999,999,999 |
| Submission date | Future date, ≤ 24 months from today |
| Contact point | Name + role + at least one of (email, mobile) |
| Customer control | One of: `no_contact`, `know_contact`, `reach_user`, `reach_decision_maker` |

---

## Risk scoring rubric

Sales answers an 8-factor questionnaire (system pre-fills from existing lead
data where possible). Each factor has a raw score 0–10, weighted, and the
weighted sum is normalized to 0–100.

| Factor | Weight | Raw score mapping examples |
|---|---|---|
| Budget confidence | 20 | Approved=0, In plan=4, Not yet approved=10 |
| Procurement method | 15 | เฉพาะเจาะจง=2, คัดเลือก=4, e-bidding=6, e-market=8 |
| TOR / spec status | 15 | Favors us=0, Generic=5, Favors a named competitor=10 |
| Customer relationship | 15 | Reach decision-maker=0, Reach user=5, No contact=10 |
| Technical fit | 10 | ≥90% in portfolio=0, 50–90%=5, <50%=10 |
| Payment terms | 10 | ≤30 days=0, 60 days=4, ≥90 days=8 |
| Competitive landscape | 8 | 0–1 competitors=0, 2–3=4, ≥4=8 |
| Timeline pressure | 7 | ≥60 days=0, 30–60=4, <30=8 |

**Score formula**: `score = Σ(weight × raw_score) / 10`, capped at 0–100.

**Decision thresholds**:

| Score | Band | Action |
|---|---|---|
| 0–30 | Low | Auto-convert to Deal, LINE notification to Sales |
| 31–60 | Medium | Open Approval Request, route through Tier hierarchy |
| 61–100 | High | Block conversion, show suggested actions, LINE notification to Sales + Manager |

All weights and thresholds are configurable via Admin UI (Phase 2).

---

## Tier approval design

Triggered when risk score is Medium. Sequential — each tier signs off in
order from lowest-ranked to highest. A rejection at any tier halts the
flow.

Default tiers (admin-configurable via Settings):

| Tier | Deal value | Approvers (sequential) |
|---|---|---|
| Tier 1 | ≤ ฿2M | Sales Manager |
| Tier 2 | ฿2M – ฿10M | Sales Manager → Pre-sales Director |
| Tier 3 | ฿10M – ฿30M | Sales Manager → Pre-sales Director → COO |
| Tier 4 | > ฿30M | Sales Manager → Pre-sales Director → COO → CEO |

Settings page allows: drag to reorder, edit range, add/remove approvers,
delete tier. All settings changes are themselves audited.

---

## Static baseline layer (replaces LLM commentary)

Three structured layers, all data sourced from internal system — no external
calls.

| Layer | What it shows | Source |
|---|---|---|
| Historical benchmark | Win rate and avg deal cycle for this agency | Internal `leads` table aggregation |
| Percentile ranking | "Score 42 is in Xth percentile vs won deals" | Score distribution of past won deals |
| Triggered guidance | Pre-written advice keyed to red/yellow factors | `guidance_templates` table, admin-editable |

Example triggered guidance for "Payment terms = High":

> เครดิตเทอม 90 วันสูงกว่า threshold บริษัท ก่อนยื่นเสนอแนะนำ (1) ขอ cashflow analysis
> จากฝ่ายบัญชี (2) เจรจาขอ down-payment 30% (3) ตรวจสอบ credit history ของหน่วยงานใน System 3

Guidance Library is editable via Admin UI without redeploying code.

---

## UI pages (Phase 1)

### Main pages

1. **Lead List** (`/leads`)
   - 4-card stats summary (Open, Pending review, Pipeline value, This week)
   - Filter chip row by status
   - Table columns: Project + Agency, Budget, Status pill, Submission date
   - Row click → Lead Detail
   - Status pill colors: Draft=gray, Qualified=green, Pending=amber, Blocked=red

2. **Create Lead Form** (`/leads/new`)
   - Required field counter "0 of 6" top-right
   - Section: Organisation with Smart Search (debounce 300ms, min 2 chars,
     top 8 results, highlights match, keyboard navigation, "Suggest new
     agency" link)
   - Section: Project (name, budget, submission date)
   - Section: Contact point (name, role, email, mobile)
   - Section: Customer control (4 radio cards)
   - Footer: Cancel / Save draft / Save and continue
   - "Save and continue" disabled until all 6 required fields valid

3. **Lead Detail** (`/leads/{id}`)
   - Header: lead_code, status pill, project name, agency, owner, action
     buttons (Edit, Delete, Convert)
   - Layout: 65/35 split
   - Left: Organisation section (auto-filled fields with sparkle badge),
     Project section (budget, submission, days left), Contact point,
     Customer control
   - Right: Audit timeline (vertical, dot+line, newest first), View full
     history link
   - Timeline dot colors: green=state change, blue=link agency, gray=field
     change, black=created

### Utility pages

4. **Settings · Agency Suggestions Review** (`/settings/agency-suggestions`)
   - Admin-only
   - 3 stat cards: Pending, Approved this month, Rejected this month
   - Filter chips by status
   - List of suggestion cards: suggested name, suggester, time, note, evidence
     link, Reject / Review and approve buttons
   - "Review and approve" opens modal where Admin fills in agency_type,
     tax_id, ministry, aliases before creating
   - "Sync data.go.th" button for manual re-sync

5. **User Profile** (`/me`)
   - Avatar + name + email + role badge
   - LINE integration card: linked status with LINE ID and unlink button,
     or "Link LINE account" button
   - This month stats: Leads, Qualified, Pipeline value, Suggestions count
   - Active sessions list with Revoke per non-current session
   - Change password link
   - Sign out

6. **Archive Search** (`/archive`)
   - For finding soft-deleted leads or leads in cold storage (> 24 months)
   - Search bar + 4 filter dropdowns (agency, status, owner, year range)
   - Include deleted / Include cold storage checkboxes (both default on)
   - Result rows show archive reason chip: snowflake=cold, trash=deleted
   - Restore action only available for deleted (admin only)
   - Cold storage records read-only

---

## Data model

7 entities. See `api/openapi.yaml` for the full field-level schema; this is
the structural overview.

### `users`
Authenticated CRM users.
- `id` (UUID PK), `email` (unique), `display_name`, `role`
  (sales/manager/admin/auditor), `line_user_id`, `is_active`, `created_at`

### `agencies`
Government agency master data. Sourced from data.go.th plus manual top-up.
- `id` (UUID PK), `official_name_th`, `official_name_en`, `short_name`,
  `tax_id` (unique), `gfmis_code`, `agency_type` (ministry / department /
  state_enterprise / local_admin / university / other), `parent_agency_id`
  (self-FK for hierarchy), `province`, `default_address`, `status`
  (active / deprecated)

### `agency_aliases`
Alternative names, abbreviations, common misspellings for Smart Search.
- `id`, `agency_id` (FK), `alias`, `source` (official / common / abbreviation
  / misspelling)

### `agency_suggestions`
Pending requests from Sales to add new agencies.
- `id`, `suggested_name`, `suggested_by` (FK users), `reviewed_by` (FK users),
  `status` (pending / approved / rejected), `evidence_url`, `note`,
  `review_reason`, `created_at`, `reviewed_at`

### `leads`
The core entity.
- `id` (UUID PK), `lead_code` (unique, format LD-YYYY-NNNN), `agency_id`
  (FK), `project_name`, `budget_thb` (BIGINT), `submission_date`,
  `customer_control` (enum), `status` (draft / qualified / pending_review
  / blocked / converted / lost), `owner_id` (FK users), `deleted_at`
  (nullable for soft delete), `created_at`, `updated_at`

### `contacts`
Multiple contact points per lead.
- `id`, `lead_id` (FK), `name`, `role_title`, `email`, `mobile`,
  `is_primary`, `created_at`

### `audit_log`
Append-only event store.
- `id` (BIGINT sequential PK), `entity_type` (lead / agency / contact /
  user / agency_suggestion / settings), `entity_id` (UUID, polymorphic ref),
  `action`, `actor_id` (FK users), `field_name` (nullable), `before_value`
  (JSONB), `after_value` (JSONB), `description`, `occurred_at`, `ip_address`

---

## Index strategy

```sql
-- Smart Search hot path (uses pg_trgm extension)
CREATE INDEX idx_agency_aliases_alias_trgm
  ON agency_aliases USING gin (alias gin_trgm_ops);
CREATE INDEX idx_agencies_name_trgm
  ON agencies USING gin (official_name_th gin_trgm_ops);

-- Lead list and filter (partial index on active rows)
CREATE INDEX idx_leads_owner_status
  ON leads (owner_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_agency
  ON leads (agency_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_submission_date
  ON leads (submission_date) WHERE deleted_at IS NULL;

-- Audit lookup
CREATE INDEX idx_audit_entity
  ON audit_log (entity_type, entity_id, occurred_at DESC);
CREATE INDEX idx_audit_actor
  ON audit_log (actor_id, occurred_at DESC);
```

Note: agency Smart Search is served primarily by Typesense, not Postgres
trigram. The Postgres index above is a fallback if Typesense is unavailable.

---

## Append-only audit enforcement

```sql
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER no_update_audit
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
```

This is DB-level. App-level append-only is not sufficient because any
backend service with credentials could bypass it.

---

## Permission matrix (Row-Level Security)

| Role | List view | Detail view | Edit | Delete | Audit |
|---|---|---|---|---|---|
| Sales | Own leads | Own leads | Own leads | Own (soft) | Own |
| Manager | Team + own | All | Team + own | Team + own | All |
| Admin | All | All | All | All | All |
| Auditor | All (read) | All (read) | — | — | All |

Implemented via Postgres RLS policies on `leads` and `audit_log`. Backend
sets `app.current_user_id` per request and policies filter accordingly.

---

## Smart Search behavior detail

- **Engine**: Typesense, with Thai locale tokenizer
- **Trigger**: ≥ 2 characters typed
- **Debounce**: 300ms
- **Result count**: top 8
- **Ranking signals**:
  - Exact match boost (weight 5×)
  - Past-leads frequency boost (weight 3×)
  - Recency of last lead (weight 2×)
  - Trigram similarity (base)
- **Result row shows**: name with matched span highlighted, parent ministry,
  agency_type label, tax_id, past_leads_count badge if > 0
- **Keyboard nav**: ↑↓ to move, Enter to select, Esc to close
- **Suggest new agency**: link at bottom of dropdown opens a small modal
  pre-populated with the current query
- **Caching**: results cached client-side for the duration of the session,
  keyed by query string
- **Maintenance**: nightly cron re-syncs from data.go.th, then re-indexes
  Typesense. Admin can trigger manual sync from Settings page.

---

## LINE notification events (Phase 3 detail, listed here for completeness)

| Event | Recipient | Format |
|---|---|---|
| Lead created | Sales owner | Flex card with summary + Open button |
| Auto-convert (low risk) | Sales owner | Flex card "Deal created" with deep-link |
| Approval requested (medium) | Manager | Flex card with score breakdown + Review button |
| Convert blocked (high) | Sales + Manager | Flex card with reasons + suggested actions |
| Approval decision | Sales owner | Text update with link |
| Lead idle > 14 days | Sales owner | Nudge reminder |

Every Line message has a deep-link back to the CRM. State changes
(approve, reject) happen only on the CRM UI — LINE is read-only with regard
to state.

---

## Phase 1 deliverable checklist

| # | Item | Owner | Output |
|---|---|---|---|
| 1 | data.go.th master data import + manual top-up flow | Data engineer | `agencies` table populated, Typesense indexed |
| 2 | 3 main pages built (List, Create, Detail) | Frontend dev | Working pages matching mockup spec |
| 3 | 3 utility pages built (Agency Suggestions, Profile, Archive) | Frontend dev | Working pages |
| 4 | API endpoints per OpenAPI spec | Backend dev | All 21 endpoints + auto-generated docs |
| 5 | Audit log trigger + soft delete + RLS policies | DBA | DB migration + tested rollback path |
| 6 | LINE OA OAuth flow for account linking | Backend dev | `/me/line/link` working end-to-end |
| 7 | Smart Search via Typesense | Backend dev | <50ms p95 latency, fallback to Postgres trigram |
| 8 | E2E test suite | QA | Playwright suite covering full lead lifecycle |

---

## What Phase 1 explicitly does NOT have

These are deferred to later phases but the data model and UI have hooks
for them:

- **Risk Engine** — questionnaire UI, scoring, decision gate (Phase 2)
- **Tier approval workflow** — sequential signoff (Phase 2)
- **Static baseline insights** — historical benchmark + percentile +
  triggered guidance (Phase 2)
- **LINE notifications** — webhook endpoint stub only (Phase 3)
- **Calibration dashboard** — actual vs predicted conversion (Phase 4)
