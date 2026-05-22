# CRM Government Leads

Custom CRM system for a Thai system integrator. Customers are Thai
government agencies (กระทรวง / กรม / รัฐวิสาหกิจ / อปท. / มหาวิทยาลัยรัฐ).

The system replaces a manual Excel-based workflow with a four-part platform:

1. **Government Lead Screening** — screen leads against a risk rubric before
   they become deals
2. **Sellable Product / Vendor Management** — track stock, vendor sources,
   and supplier cost comparison
3. **Customer Management with Credit Terms** — credit-aware customer profiles,
   integrate with public credit data sources
4. **Sales Performance Tracking** — weekly lead-gen ranking and activity search

## Status

Design phase. **System 1 Phase 1 is fully specified** and ready for build.
Other phases and systems are in various stages of design.

## Quick links

| Document | Purpose |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Context entry point for AI assistants |
| [Business context](docs/BUSINESS_CONTEXT.md) | Persona, raw requirements, control variables |
| [System 1 spec](docs/SYSTEM_1_SPEC.md) | Government Lead Screening — full design |
| [Roadmap](docs/ROADMAP.md) | All phases and future systems |
| [Decisions](docs/DECISIONS.md) | Architectural decision records |
| [API contract](api/openapi.yaml) | OpenAPI 3.1 — Phase 1 endpoints |

## Build order

System 1 Phase 1 → System 1 Phase 2 → System 1 Phase 3 → System 1 Phase 4 →
System 2 → System 3 → System 4

## Control variables (non-negotiable)

1. Intelligence stays on CRM core, then sync outward
2. No LLM — static rule-based scoring only
3. LINE OA for notifications only, never for state changes
4. Retention forever (soft delete + append-only audit log)
5. Master agency data from data.go.th + manual top-up

## Tech stack (recommended)

Next.js 14 + NestJS + PostgreSQL 16 + Typesense + LINE Messaging API.
Final stack to be confirmed with owner.
