# Roadmap

Order of delivery across all four systems. Phase timing assumes a small team
(~2 frontend, 2 backend, 1 DBA, 1 QA).

---

## System 1 — Government Lead Screening

### Phase 1 — Lead form + Smart Search + Audit foundation (4–6 weeks)

**Status**: ✅ Design complete, ready to build

Scope:
- 3 main pages: Lead List, Create Lead, Lead Detail
- 3 utility pages: Agency Suggestions Review, User Profile, Archive Search
- Smart Search via Typesense
- 6 required field hard checklist
- Append-only audit log foundation
- RLS-based permission model
- LINE OAuth flow for account linking only (notifications come later)
- Manual "Mark as Qualified" action (Risk Engine not yet built)

Deliverables: see `SYSTEM_1_SPEC.md` Phase 1 deliverable checklist.

---

### Phase 2 — Risk Engine + Tier Approval + Static Baseline (3–4 weeks)

**Status**: 🟡 High-level designed, UI pages not yet detailed

Scope:
- Risk scoring questionnaire UI (8 factors, configurable)
- Decision gate logic (Low / Medium / High thresholds)
- Static Baseline insights panel on Lead Detail:
  - Historical benchmark for the agency
  - Percentile ranking vs won deals
  - Triggered guidance based on red/yellow factors
- Sequential tier approval workflow
- Admin pages:
  - Risk Engine — adjust weights, thresholds, raw-score mappings
  - Tier Approval Settings — reorder tiers, edit ranges, edit approvers
  - Guidance Library — edit triggered guidance templates
- Lead Convert button becomes fully wired through Risk Engine

New data model entities required:
- `risk_factor_definitions` — config-managed factor schema
- `lead_risk_scores` — snapshot of score at decision time (immutable)
- `approval_requests` — open + closed approval states per lead
- `approval_actions` — every approve/reject by every approver (audit)
- `guidance_templates` — admin-editable triggered guidance

API additions:
- `POST /leads/{id}/risk-score` — compute or recompute
- `POST /leads/{id}/convert` — full convert with decision gate
- `GET /approval-requests` — list visible to current user
- `POST /approval-requests/{id}/approve` and `/reject`
- `GET/PATCH /settings/risk-engine` — admin only
- `GET/PATCH /settings/approval-tiers` — admin only
- `GET/POST/PATCH/DELETE /guidance-templates` — admin only

---

### Phase 3 — LINE OA Integration (2–3 weeks)

**Status**: 🟡 Architecture decided, Flex templates not designed

Scope:
- Outbox pattern: CRM emits domain events, worker consumes and posts to LINE
- Flex Message templates per event type (see SYSTEM_1_SPEC.md notification table)
- LINE webhook endpoint to receive read receipts and any user-initiated commands
  (currently no user commands planned — read-only on LINE side)
- Rich Menu category "CRM" on the company's existing OA with shortcuts
  to Open My Leads, My Approvals, My Profile
- Per-user notification preferences page (which events to receive)
- Retry + DLQ for failed LINE deliveries

New data model entities:
- `notification_outbox` — events waiting to send
- `notification_log` — sent records with LINE message_id for trace
- `user_notification_preferences` — per-user opt-in/out per event type

API additions:
- `GET/PATCH /me/notification-preferences`
- `GET /notification-log` — admin only, for debugging

---

### Phase 4 — Calibration dashboard (2 weeks)

**Status**: ⚪ Not started

Scope:
- Dashboard for COO/Admin showing:
  - Risk score distribution histogram
  - Actual conversion rate by score band
  - Predicted vs actual delta over rolling windows
  - Per-factor signal strength (which factors actually correlate with wins)
- Suggested weight adjustments based on data
- Export to CSV/PDF for monthly review
- Ongoing — used to tune the Risk Engine over time

---

## System 2 — Sellable Product / Vendor Management

**Status**: ⚪ Not started — needs discovery before designing

Owner's original requirements (from kickoff message):
- Module to view what's ready to sell
- For each item, check whether the vendor is on the approved Vendor List;
  if not, run financial / other due-diligence
- Store supplier cost with credit terms
- Store quotations
- Comparative cost evaluation across multiple suppliers for the same item

Open questions before design can start:
1. Definition of "ready to sell" — stock on hand? Vendor-confirmed availability?
2. Is "approved Vendor List" already curated somewhere, or does this system
   own it?
3. Due-diligence flow — what artifacts? Who reviews?
4. Quotation format — internal-only or shared with customer?
5. Cost comparison — per-item or per-bundle?
6. Sync direction with System 3 — does cost data flow into customer-facing
   quotes, or stay vendor-side only?

Recommend starting with a 30–60 min discovery with the owner before designing.

---

## System 3 — Customer Management with Credit Terms

**Status**: ⚪ Not started — needs discovery

Owner's original requirements:
- Credit terms central to customer record
- Connect to external API for credit data
- Bonus: pull customer financials from กรมบัญชีกลาง
- Replace manual accountant review (Sales forwards docs → Accountant approves)

Open questions:
1. Which external API for credit data? Bureau? Bank? Custom?
2. Is the กรมบัญชีกลาง integration via an official API, scraping, or manual
   reference? (Probably manual reference; verify.)
3. How does System 3 relate to leads in System 1 — does a customer record
   exist before or after Lead conversion?
4. Workflow for accountant approval — keep human in the loop, or fully
   automate based on score?
5. Credit limit enforcement — soft warning or hard block on quotations?

---

## System 4 — Sales Performance Tracking

**Status**: ⚪ Not started — needs discovery

Owner's original requirements:
- Weekly lead count per salesperson
- Ranking with rewards
- Activity search by Deal or Customer

Open questions:
1. Metric definitions — count of leads created? Qualified? Won? Multi-metric
   ranking?
2. Reward mechanism — automated payout, leaderboard only, gamification?
3. Activity definition — every audit event? Specific subset (call, meeting,
   email)?
4. Time window for ranking — weekly only, or also monthly/quarterly?
5. Reporting destination — COO dashboard? Slack/LINE broadcast?

---

## Dependency graph

```
System 1 Phase 1 (foundation)
        ↓
    ┌───┴───┐
    ↓       ↓
Phase 2   Phase 3
    ↓       ↓
    └───┬───┘
        ↓
    Phase 4
        ↓
    System 2 ←──── relates to Phase 2 (quotations affect pricing in deals)
        ↓
    System 3 ←──── needs customer entity defined; affects all 3 others
        ↓
    System 4 ←──── aggregates activity from all preceding systems
```

System 3 (customer) ideally comes before System 2 (vendors) because
quotations point to customers. However, owner originally listed them in the
order System 2 → System 3, so confirm before reordering.

---

## Time horizon

| Milestone | Estimated start | Estimated duration |
|---|---|---|
| System 1 Phase 1 | ASAP after stack confirmation | 4–6 weeks |
| System 1 Phase 2 | + 4–6 weeks | 3–4 weeks |
| System 1 Phase 3 | + 7–10 weeks | 2–3 weeks |
| System 1 Phase 4 | + 9–13 weeks | 2 weeks ongoing |
| System 2 discovery | + 11 weeks | 1–2 weeks |
| System 2 design + build | + 13 weeks | 8–12 weeks |
| System 3 design + build | + 21 weeks | 8–12 weeks |
| System 4 design + build | + 29 weeks | 6–8 weeks |

Total ~9 months for the full suite, assuming the recommended team and no
major scope changes.
