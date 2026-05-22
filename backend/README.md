# Backend — CRM Government Leads API

NestJS + PostgreSQL REST API for System 1 (Government Lead Screening).
Phase 1 scope. Implements the contract in `../api/openapi.yaml`.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# edit .env if your database differs from defaults

# 3. Make sure the database is up (see ../database/README.md)
cd ../database && ./init.sh && cd ../backend

# 4. Build and run
npm run build
npm run start:prod      # or: npm run start:dev  for watch mode
```

API runs at `http://localhost:3001/api/v1`.
Swagger UI at `http://localhost:3001/api/docs`.

## Smoke test

With the server running and a freshly seeded database:

```bash
./test/smoke.sh
```

Runs 12 end-to-end checks: health, auth, RLS, lead lifecycle, audit,
soft delete. Exit code 0 = all passed.

## Architecture

```
src/
├── main.ts                  # Bootstrap: prefix, validation, Swagger, CORS
├── app.module.ts            # Root module, registers global guards
├── health.controller.ts     # GET /health
├── config/                  # (reserved for typed config)
├── database/
│   ├── database.service.ts  # pg pool + withContext() RLS pattern
│   └── database.module.ts   # global module
├── common/
│   ├── decorators/          # @CurrentUser, @Public, @Roles
│   ├── guards/              # JwtAuthGuard, RolesGuard
│   └── filters/             # AllExceptionsFilter (pg error -> API error)
└── modules/
    ├── auth/                # login, refresh, JWT
    ├── users/               # /me, /me/stats
    ├── agencies/            # Smart Search, agency detail, suggest
    ├── leads/               # lead CRUD, qualify, audit
    └── contacts/            # nested under /leads/:id/contacts
```

## The RLS pattern — read this before adding queries

Row-Level Security in the database depends on two session variables that
identify the current user. **Every query against an RLS-protected table
must run inside `DatabaseService.withContext()`**, which opens a
transaction and sets them:

```typescript
await db.withContext(ctx, async (client) => {
  // app.current_user_id and app.current_user_role are set here.
  // RLS policies in Postgres read them. Outside withContext, RLS
  // returns zero rows.
  const r = await client.query('SELECT * FROM leads');
  return r.rows;
});
```

`ctx` (a `RequestContext`) is built by `JwtAuthGuard` from the bearer
token and injected into controllers with the `@CurrentUser()` decorator.

The only queries that may skip context are login (looking up a user by
email — no identity exists yet) and the health check. Use
`queryUnscoped()` for those, nothing else.

### Views and RLS

Postgres views run with the view owner's privileges by default, which
bypasses RLS. All three views are created with `security_invoker = true`
(migration V013) so they respect the caller. If you add a new view over
an RLS-protected table, set `security_invoker` on it too.

## Authentication

- `POST /auth/login` exchanges email + password for an access token
  (1 hour) and refresh token (30 days).
- All other routes require `Authorization: Bearer <token>` unless marked
  `@Public()`.
- `@Roles('admin')` restricts a route to specific roles. This is a coarse
  gate; RLS still applies on top for row-level scoping.

### Dev users

All have password `devpassword` (see `../database/migrations/V009`).

| Email | Role |
|---|---|
| admin@dev.local | admin |
| manager@dev.local | manager |
| somchai.p@dev.local | sales |
| nattaya.k@dev.local | sales |
| akarat.w@dev.local | sales |
| auditor@dev.local | auditor |

Note: the dev seed stores bcrypt hashes. `AuthService.verifyPassword`
has a dev-only shortcut for them. Before production, switch the seed to
argon2 hashes and remove that shortcut.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| POST | /auth/login | public |
| POST | /auth/refresh | public |
| GET | /health | public |
| GET | /me | current user |
| PATCH | /me | update display name |
| GET | /me/stats | this-month activity |
| GET | /agencies/search | Smart Search |
| GET | /agencies/:id | agency detail + stats |
| POST | /agencies/suggest | submit new agency for review |
| GET | /leads | list, RLS-scoped, paginated |
| POST | /leads | create (draft) |
| GET | /leads/:id | detail + agency + contacts |
| PATCH | /leads/:id | partial update |
| DELETE | /leads/:id | soft delete |
| POST | /leads/:id/qualify | draft -> qualified |
| GET | /leads/:id/audit | audit history |
| POST | /leads/:id/contacts | add contact |
| PATCH | /leads/:id/contacts/:cid | update contact |
| DELETE | /leads/:id/contacts/:cid | remove contact |

## Error format

All errors return the shape defined in the OpenAPI contract:

```json
{ "code": "VALIDATION_FAILED", "message": "...", "details": { } }
```

`AllExceptionsFilter` maps Postgres errors automatically:
unique_violation -> 409, foreign_key/check/not_null -> 422,
the append-only audit trigger -> 403.

## Phase 1 scope and what is deferred

Implemented: auth, agency Smart Search (Postgres trigram), lead CRUD,
manual qualify, contacts, audit trail, RLS for all four roles.

Deferred to later phases:

- **Risk Engine** (Phase 2) — `qualify` is manual now; Phase 2 routes the
  convert action through scoring and the decision gate.
- **Typesense** — Smart Search uses Postgres trigram. Production swaps in
  Typesense behind the same `AgenciesService.search()` signature (ADR-005).
- **LINE notifications** (Phase 3) — no outbox/worker yet.
- **Agency suggestion review endpoints** (`/agency-suggestions`) — the
  submit side exists; the admin approve/reject side is Phase 2.
- **LINE account linking** (`/me/line/link`) — Phase 3.
- **Refresh token rotation / blacklist** — refresh works but tokens are
  not yet tracked for revocation.

## Tech

NestJS 10, TypeScript 5.6, node-postgres (pg) 8, JWT auth, class-validator.
No ORM by design — RLS needs explicit transaction control that ORMs make
awkward (see ADR in `../docs/DECISIONS.md`).
