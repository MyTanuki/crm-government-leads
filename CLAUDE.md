# CRM Government Leads — Claude Code Context

> This file is auto-loaded by Claude Code. Read this first.
> Then read referenced docs as needed.

## Project at a glance

Custom CRM for a Thai system integrator that sells IT infrastructure, AV
solutions, audio systems, and unified communications to government customers
(กระทรวง / กรม / รัฐวิสาหกิจ / อปท. / มหาวิทยาลัยรัฐ).

Brand focus areas the company carries: Leyard, Maxhub, Gygar (displays),
iTC, Audac (audio/PA), Aver (UC), plus generic IT/security/networking.

Four major subsystems being designed in sequence:

1. **System 1 — Government Lead Screening** ← current focus
2. **System 2 — Sellable Product / Vendor Management** ← not started
3. **System 3 — Customer Management with Credit Terms** ← not started
4. **System 4 — Sales Performance Tracking** ← not started

## Current state of design

| Item | Status |
|---|---|
| System 1 Phase 1 — Lead form + Smart Search + Audit foundation | ✅ Design complete |
| System 1 Phase 1 — **Database layer** | ✅ Built and tested (13 migrations, 11/11 invariant tests pass) |
| System 1 Phase 1 — **Backend API** | ✅ Built and tested (NestJS, 18 routes, 12/12 smoke tests pass) |
| System 1 Phase 1 — **Frontend** | ✅ Built (Next.js 14, 6 pages, build passes) |
| System 1 Phase 2 — Risk Engine + Tier Approval + Static Baseline | 🟡 High-level designed, UI not detailed |
| System 1 Phase 3 — LINE OA Integration | 🟡 Architecture decided, Flex templates not designed |
| System 1 Phase 4 — Calibration dashboard | ⚪ Not started |
| System 2/3/4 | ⚪ Not started |

See `docs/ROADMAP.md` for full phasing and what each phase contains.

## Critical control variables (MUST NOT VIOLATE)

These were explicitly set by the company owner. When in doubt, defer to these:

1. **Intelligence stays on CRM core, then sync outward**
   No logic on external workflow tools (Zapier, n8n, Power Automate). All
   decisioning runs in our backend so we control it and can iterate fast.

2. **No LLM — use static rule-based scoring + static baseline lookup**
   Owner decided LLM is out of scope. Risk Engine is deterministic, auditable,
   zero variable cost, sub-100ms latency. Do not propose LLM-based features
   unless owner explicitly reverses this decision.

3. **LINE OA for notifications only, never for state-changing actions**
   Approve/reject/edit/convert all happen on the CRM web UI. LINE pushes
   notifications and deep-links back to CRM. Do not design LINE bot commands
   that change state.

4. **Retention forever**
   Leads soft-deleted via `deleted_at`, audit log append-only enforced at DB
   trigger level, no hard purge except via explicit Admin action (itself
   audited). Cold storage partition after 24 months but record still queryable.

5. **Master agency data from official source + manual top-up**
   Source: data.go.th. Sales suggests new entries via the Smart Search
   "Suggest" button → Admin reviews and approves → agency record created.

## Architectural decisions

See `docs/DECISIONS.md` for full ADRs with rationale. Quick summary:

- ADR-001: No LLM, static baseline only
- ADR-002: Append-only audit log + forever retention (DB trigger enforced)
- ADR-003: Sequential tier approval, admin-configurable hierarchy
- ADR-004: LINE OA for notifications only
- ADR-005: Typesense over Elasticsearch for Smart Search
- ADR-006: Master data from data.go.th + manual top-up via Admin review
- ADR-007: Soft delete via `deleted_at` column, never hard DELETE

## Tech stack (recommended, not yet final)

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js 14 + Tailwind + shadcn/ui | App Router, SSR for initial paint |
| Backend | NestJS (TypeScript) | OpenAPI-first, REST |
| Database | PostgreSQL 16 | RLS for permission, JSONB for audit values |
| Search | Typesense (self-hosted) | Thai tokenizer built in, <50ms latency |
| Notifications | LINE Messaging API | via company's existing OA |
| Hosting | TBD | Owner has not decided on-prem vs cloud |

Owner is open to alternatives if there's a good reason. Don't lock in stack
before getting their sign-off.

## Conventions

- **API path prefix**: `/api/v1`
- **IDs**: UUID v4 everywhere except `audit_log.id` which is BIGINT sequential
- **Timestamps**: ISO 8601 UTC
- **Money**: integer THB (no decimals — Thai government deals are always whole baht)
- **Sort syntax in API**: `-prefix` for descending (`-created_at`)
- **Soft delete**: `deleted_at` column, never DELETE
- **Validation errors**: API returns 422 with `details` keyed by field name
- **Sentence case in UI text**, never Title Case
- **Thai for user-facing labels where natural**, English for all code/IDs/enums

## Where to find what

- **Business context, persona, raw requirements** → `docs/BUSINESS_CONTEXT.md`
- **System 1 complete specification** → `docs/SYSTEM_1_SPEC.md`
  - Includes: decision flow, 6 required fields, risk scoring rubric, tier
    approval design, static baseline layers, UI pages, data model, index
    strategy, audit triggers, permission matrix
- **Phases and what's next** → `docs/ROADMAP.md`
- **Architectural decisions with rationale** → `docs/DECISIONS.md`
- **API contract (OpenAPI 3.1, 21 endpoints)** → `api/openapi.yaml`
- **Database** → `database/` (see `database/README.md`)
  - 13 SQL migrations applied in order
  - `database/init.sh` is the one-shot setup
  - `database/tests/run_all.sh` runs 11 invariant tests
- **Backend** → `backend/` (see `backend/README.md`)
  - NestJS + node-postgres, 18 routes, JWT auth, RLS-aware data layer
  - `backend/src/database/database.service.ts` — the `withContext()` RLS pattern
  - Run: `cd backend && npm install && npm run start:dev`

## How to continue this work

Phase 1 database and backend are both built and tested. The backend exposes
18 working REST endpoints with JWT auth and verified RLS. Next step:

1. **Frontend scaffold** — Next.js 14 + Tailwind + shadcn/ui. Build the 3
   main pages (List, Create, Detail) and 3 utility pages (Agency Suggestions,
   User Profile, Archive Search) per `docs/SYSTEM_1_SPEC.md`. The backend is
   ready to call at `http://localhost:3001/api/v1` — no mocks needed.

2. **Continue Phase 2 design** — Risk Engine UI, Admin Tuning page, Guidance
   Library editor. Adds new migration with risk-engine tables.

Default recommendation: Frontend next, so there is a working UI to show the
owner and to exercise the backend end-to-end.

Backend gaps still open for later phases: agency suggestion review/approve
endpoints (Phase 2), risk scoring + convert flow (Phase 2), LINE
notifications and `/me/line/link` (Phase 3).

## Things NOT to do

- Don't add LLM features (see control variable 2)
- Don't bypass the audit log (every state change must produce an audit entry)
- Don't propose tools that move intelligence outside the CRM core
- Don't design free-text agency input (must always go through Smart Search → agency_id)
- Don't add hard DELETE anywhere except Admin's purge action
- Don't change the 6 required fields without explicit owner approval
- Don't introduce new tech stack components without flagging the decision
