# Architectural Decision Records

Each ADR captures a decision that shapes the system. Format: context →
decision → consequences. Numbered in order of decision. Status of all: Accepted.

---

## ADR-001 — No LLM, use static rule-based scoring with baseline lookup

**Context**
The initial design proposed a hybrid Risk Engine: rule-based scoring as the
primary signal plus an LLM commentary layer for qualitative analysis. This
would add per-lead cost (฿1–3 per LLM call), latency (seconds), and
non-determinism that complicates audit.

**Decision**
Drop the LLM layer entirely. Replace with a Static Baseline composed of
three structured layers, all sourced from internal data:
1. Historical benchmark (win rate, avg deal cycle for the agency)
2. Percentile ranking vs won deals
3. Triggered guidance keyed to red/yellow factors, served from an
   admin-editable `guidance_templates` table

**Consequences**
- ✅ Fully deterministic — same input always produces same output
- ✅ Sub-100ms latency, no external API dependency
- ✅ Zero variable cost
- ✅ Every decision is explainable from rules + lookup tables, ideal for
  government audit
- ❌ Cannot extract nuance from free-text notes Sales writes
- ❌ Guidance is templated — less personalized than LLM commentary
- 🔁 Reversible: LLM layer can be added later as an optional add-on without
  changing the data model. Hook point would be in the Risk Engine response
  payload.

---

## ADR-002 — Append-only audit log with forever retention

**Context**
Government deals can be audited years after the fact. The company needs to
prove who decided what and when, for both internal compliance and any
external review. The owner explicitly chose "forever" retention.

**Decision**
- Audit log is append-only at the DB level via Postgres trigger that raises
  on any UPDATE or DELETE
- Leads use soft delete via `deleted_at` column, never hard DELETE
- After 24 months, leads are migrated to a cold storage Postgres partition
  but remain queryable via the Archive Search page
- Hard purge is possible only via an Admin action that requires 2-step
  confirmation, and the purge itself produces an audit row before the data
  is removed

**Consequences**
- ✅ Auditable history of every state change
- ✅ Compliance-ready out of the box
- ❌ Audit log table will grow large — partitioning strategy needed by year 2
- ❌ Storage cost grows monotonically; cold partition mitigates but doesn't
  eliminate
- ❌ GDPR-style "right to be forgotten" requests are awkward (the explicit
  Admin purge path is the answer if it ever applies — but government
  customer data is generally not subject to such requests)

---

## ADR-003 — Sequential tier approval with admin-configurable hierarchy

**Context**
Risk-medium leads need someone above the Sales rep to bless the conversion.
A flat "one manager approves everything" model doesn't fit the company —
larger deals warrant more senior eyes. The owner asked for tiers that can
be reconfigured without code changes.

**Decision**
- Tiers are defined by deal value range and a sequential list of approver
  roles
- Default 4 tiers: ≤฿2M / ฿2M–10M / ฿10M–30M / >฿30M with progressively
  more senior approvers
- Each tier signs off in order from lowest-ranked to highest. Any rejection
  halts the flow
- All tier configuration lives in a `approval_tiers` table, edited via the
  Settings UI by Admin/COO role only
- Every change to tier config is itself audited

**Consequences**
- ✅ Matches company hierarchy and risk appetite
- ✅ Owner can adapt to org changes without redeploy
- ✅ Audit trail covers both decisions and the policy under which they
  were made (the tier config at the time)
- ❌ Sequential approval is slower than parallel — at high deal value, four
  approvers must each act in turn. Acceptable because high-value deals are
  rare and warrant deliberation
- ❌ If an approver is unavailable, flow stalls. Need a "delegate" feature
  in Phase 2 to nominate a substitute

---

## ADR-004 — LINE OA for notifications only, never for state changes

**Context**
LINE is the dominant messaging platform in Thailand. The owner wants
notifications to land where the team already lives. However, allowing
state changes (approve, reject, edit) via LINE creates a parallel control
plane that's harder to secure and audit.

**Decision**
- LINE OA pushes notifications only
- Every notification includes a deep-link back to the CRM web UI
- All state-changing actions happen on the CRM UI, never via LINE bot
  commands
- LINE webhook is implemented but only consumes read receipts and
  link-click telemetry — no command interpretation

**Consequences**
- ✅ Single source of truth for authentication and authorization (CRM)
- ✅ Single audit pipeline (CRM)
- ✅ Easier to add or remove notification channels in the future without
  rewiring business logic
- ❌ Slightly worse UX — approvers can't approve in-thread. Mitigation:
  one-tap deep-link is fast in practice
- 🔁 Reversible: if owner later wants LINE-based approval, we'd add a
  signed-token deep-link that opens an approval page; still routes through
  CRM, just with the auth pre-completed

---

## ADR-005 — Typesense over Elasticsearch for Smart Search

**Context**
Agency master data is on the order of 20,000–30,000 records. Sales needs
typeahead with sub-50ms response and good Thai-language handling. The
Smart Search is the most visible feature of Phase 1 — slow or inaccurate
search will define the user's first impression.

**Decision**
Use Typesense self-hosted. Postgres trigram is the fallback if Typesense
is unavailable.

**Why not Elasticsearch**: ES is heavier ops, more memory, more knobs to
tune. For our scale (sub-100k docs) Typesense is faster to set up, has
Thai locale tokenization built in (`locale=th`), and the ranking story is
clearer (typo tolerance, exact-match boost, custom signals — all in config).

**Why not Postgres trigram alone**: works but ranking sophistication is
limited. Past-leads frequency boost and recency are easier to express in
Typesense's ranking model.

**Why not Azure AI Search / OpenSearch**: deferred — happy to switch if the
team's hosting context pushes that way, but Typesense default is the
safest start.

**Consequences**
- ✅ Fast, low-overhead, Thai-friendly
- ✅ Easy to onboard (single binary, well-documented)
- ❌ Smaller ecosystem than ES
- ❌ Adds one more piece of infrastructure to operate
- 🔁 Reversible: search interface in code is abstracted behind a
  `SearchProvider` interface, swap implementation if needed

---

## ADR-006 — Master agency data from data.go.th + manual top-up

**Context**
Thai government agency data is fragmented across multiple official sources
(data.go.th, GD-Catalog, สถ. for local government). The list changes
occasionally as agencies are created, merged, or renamed. Sales encounters
new agencies (especially small อปท.) that aren't yet in any master list.

**Decision**
- Primary source: data.go.th — snapshot imported quarterly via cron
- Manual top-up: Sales suggests new agency via "Suggest new agency" link in
  Smart Search dropdown → Admin reviews in Settings page → approved
  suggestion creates an agency record
- Approved agencies enrich aliases over time as Sales submits common
  misspellings

**Consequences**
- ✅ Authoritative baseline with flexibility for the long tail
- ✅ Admin review prevents garbage entries from polluting master data
- ❌ Quarterly sync means new agencies created between syncs are not
  visible until either the next sync or a manual suggestion
- ❌ data.go.th data quality is inconsistent — some entries lack tax_id or
  GFMIS code. Acceptable for Phase 1; revisit if becomes a blocker

---

## ADR-007 — Soft delete via deleted_at, never hard DELETE in app code

**Context**
Combined with the forever retention decision (ADR-002), we need a deletion
strategy that's both user-friendly (Sales can "delete" a mistaken lead)
and audit-compliant (the record still exists).

**Decision**
- Application code never issues `DELETE FROM leads`
- The DELETE endpoint sets `deleted_at = NOW()` instead
- All queries filter `WHERE deleted_at IS NULL` by default
- RLS policies respect this filter for non-admin roles
- Hard DELETE is reserved for Admin's explicit purge action (very rare)
- The `restore` endpoint nulls `deleted_at` and is admin-only

**Consequences**
- ✅ Forever retention is enforced by default behavior, not by discipline
- ✅ Mistakes are recoverable
- ❌ Storage grows monotonically (acceptable, audit-driven)
- ❌ Every query must remember the filter — mitigated by always using
  a `lead_active` view that pre-applies it
