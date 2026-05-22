# Database

PostgreSQL 16 schema for the CRM Government Leads system. Plain SQL
migrations, Flyway-compatible naming.

## Quick start

```bash
# Apply all migrations and seed data
./init.sh

# Run invariant tests
./tests/run_all.sh
```

Requires PostgreSQL 16 and `psql` accessible as the `postgres` superuser
(either via `sudo -u postgres` or `su - postgres`).

## Layout

```
database/
├── init.sh                     # One-shot drop + migrate + verify
├── migrations/                 # Versioned SQL, applied in order
│   ├── V001__extensions_and_enums.sql
│   ├── V002__core_tables.sql
│   ├── V003__lead_tables.sql
│   ├── V004__audit_log.sql
│   ├── V005__indexes.sql
│   ├── V006__rls_policies.sql
│   ├── V007__views.sql
│   ├── V008__updated_at_triggers.sql
│   ├── V009__seed_users.sql
│   ├── V010__seed_agencies.sql
│   ├── V011__seed_sample_leads.sql
│   └── V012__roles_and_grants.sql
├── seed/
│   └── generate_agencies_seed.py
└── tests/
    ├── run_all.sh
    └── tests.sql
```

## Migration philosophy

- **Forward-only.** Migrations are applied in order, never modified after
  release. Schema changes ship as new migration files.
- **Numbered with leading zeros** so they sort correctly.
- **Pure SQL.** No ORM-specific syntax — any tool that applies SQL files in
  order (Flyway, sqitch, raw psql) will work.

## Schema overview

7 entities matching the OpenAPI contract in `../api/openapi.yaml`.
See `../docs/SYSTEM_1_SPEC.md` for the full data model rationale.

| Entity | Rows in seed | Purpose |
|---|---|---|
| users | 6 | CRM authenticated users, four roles |
| agencies | 346 | Government agency master data |
| agency_aliases | 363 | Smart Search alt-names and abbreviations |
| agency_suggestions | 2 | Sales-submitted agency add requests |
| leads | 10 | Sample leads across the lifecycle |
| contacts | 10 | Primary contact per lead |
| audit_log | 14 | Lead-creation events plus state changes |

## Control variables enforced at DB level

These are structural guarantees — application bugs cannot violate them.

| Control variable | Enforcement |
|---|---|
| Audit log is append-only | Trigger on UPDATE/DELETE raises exception |
| Soft delete only | `leads_active` view filters by deleted_at IS NULL |
| Agency reference required | leads.agency_id NOT NULL + FK |
| 6 required checklist fields | Column NOT NULL + CHECK constraints |
| Exactly one primary contact | Partial unique index on is_primary |
| Permission matrix | RLS policies on leads, audit_log |

## Permission model — Row-Level Security

The application connects as `crm_app` and at the start of each transaction
must execute:

```sql
SET LOCAL app.current_user_id   = '<uuid>';
SET LOCAL app.current_user_role = '<role>';
```

RLS policies read those values via helper functions. Four roles:

| Role | Leads view | Audit view |
|---|---|---|
| sales | Own leads only | Own actions only |
| manager | All leads | All audit |
| admin | All leads | All audit |
| auditor | All (read-only) | All audit |

## Dev users

All have password `devpassword` (bcrypt hash in V009).

| Email | Role |
|---|---|
| admin@dev.local | admin |
| manager@dev.local | manager |
| somchai.p@dev.local | sales |
| nattaya.k@dev.local | sales |
| akarat.w@dev.local | sales |
| auditor@dev.local | auditor |

Change or remove these before any production deployment.

## Regenerating agency seed

```bash
python3 seed/generate_agencies_seed.py > migrations/V010__seed_agencies.sql
```

UUIDs are deterministic so re-running with the same data produces the same SQL.

## Testing

`tests/run_all.sh` runs 11 invariant tests covering append-only audit,
column constraints, RLS, soft delete, and seed counts. Run on every PR
that touches migrations.

## What's not in Phase 1

The data model has space for these but they are added in later phases:

- Risk Engine tables (Phase 2): risk_factor_definitions, lead_risk_scores,
  approval_requests, approval_actions, guidance_templates
- LINE notification tables (Phase 3): notification_outbox, notification_log,
  user_notification_preferences
- Calibration tables (Phase 4): risk_calibration_snapshots
