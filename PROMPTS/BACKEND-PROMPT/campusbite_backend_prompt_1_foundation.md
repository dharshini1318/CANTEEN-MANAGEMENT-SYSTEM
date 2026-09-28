# CampusBite Backend — Prompt 1: Foundation, Database & Auth

Implements the foundation everything else builds on: the FastAPI
project itself, the database matching the architecture doc's schema
exactly, and authentication matching Part 2's exact contract. No
business-logic endpoints yet (menu, orders, payments) — those are
Prompts 2-4.

## Before anything else

Check what's already there before creating or overwriting anything —
is there already a backend project folder, even partially set up? Is a
local MySQL instance already running and reachable? Build on whatever
exists rather than assuming an empty slate; if there's genuinely
nothing yet, start fresh using everything below.

If no local MySQL instance is running yet: either install it directly,
or run one via `docker run` purely as a local dev convenience — that's
a different thing from the project's "no Docker in production"
decision, which was about deployment architecture, not local tooling.
Either is fine; pick whichever is less friction.

## Ground rules

- Python, FastAPI, Pydantic, SQLAlchemy, Alembic, MySQL — no
  deviation from this stack without a concrete reason.
- Every table, column, type, constraint, and relationship must match
  **Architecture Specification §2 (Database Schema)** exactly — don't
  approximate or simplify field names/types; that document is the
  source of truth, not a paraphrase target.
- Every auth behavior must match **§7 (Authentication)** exactly —
  cookie strategy, JWT payload shape, the disabled-account re-check
  behavior, the identical error for bad-username vs. bad-password.
- Every error response uses the envelope from **§8** —
  `{ "error": { "code": "...", "message": "..." } }` — from the first
  endpoint built, not retrofitted later.

## Deliverables

### 1. Project structure

Following the architecture doc's own suggested layout:
```
app/
  main.py
  core/
    config.py      # pydantic-settings, reads from .env
    security.py     # password hashing, JWT, CSRF
  db/
    session.py       # engine, session factory, get_db dependency
    base.py           # declarative Base
  models/             # one file per table group
  schemas/            # Pydantic request/response models
  services/
  api/
    auth.py
alembic/
```

### 2. Dependencies

FastAPI, Pydantic v2, SQLAlchemy 2.0-style, Alembic, a MySQL driver
(`PyMySQL` or `mysqlclient`), `argon2-cffi` (Argon2id hashing),
`python-jose` or `PyJWT`, `python-dotenv` / `pydantic-settings`,
`uvicorn`, `apscheduler` (infrastructure for the expiration sweep —
stood up now, the actual sweep logic lands in Prompt 4 once payments
exist).

### 3. Configuration

`.env`-driven settings: `DATABASE_URL`, `JWT_SECRET`, `CSRF_SECRET`,
`FRONTEND_URL` (for CORS), `ENVIRONMENT` (dev/prod). No secret ever
hardcoded in source — matches §97 of the original spec exactly.

### 4. SQLAlchemy models — all 16 tables

`users`, `menu_categories`, `menu_items`, `inventory`,
`inventory_transactions`, `menu_schedules`, `menu_special_overrides`,
`orders`, `payments`, `order_items`, `refund_records`, `receipts`,
`order_status_history`, `daily_closings`, `daily_closing_corrections`,
`audit_logs` — every column, type, FK, index, and constraint exactly
as specified in Architecture Specification §2. Don't re-derive field
lists from memory or approximate them here; open that document and
match it precisely, table by table.

### 5. Alembic

`alembic init`, configured to read `Base.metadata` and the app's
settings. Generate the initial migration creating all 16 tables. Run
it against the local database and confirm it applies cleanly.

### 6. Password hashing & JWT/CSRF utilities (`core/security.py`)

- `hash_password()` / `verify_password()` — Argon2id via `argon2-cffi`.
- `create_access_token()` — payload exactly `{ sub: user_id, role,
  username }`, 2-hour expiry, matching §7.
- Cookie settings: `HttpOnly`, `Secure`, `SameSite=Strict`.
- CSRF: a double-submit token issued at login, verified against the
  cookie's value on every mutating request.
- `get_current_user` dependency: decodes the cookie, **re-checks
  `is_active` from the database on every call** — not just at token
  issue. This is the specific behavior that makes a disabled worker's
  existing session stop working immediately, not just block their next
  login attempt.
- `require_role(*roles)` dependency factory for endpoint-level RBAC.

### 7. Auth endpoints (`api/auth.py`)

Exactly the four from §7:
- `POST /api/auth/login` — `{ username, password }` → sets the cookie,
  returns `{ username, role, mustChangePassword }`. Bad credentials
  *and* a disabled account both return the identical `401
  UNAUTHENTICATED` — no distinguishing response that could be used to
  enumerate valid usernames.
- `POST /api/auth/logout` — clears the cookie.
- `GET /api/auth/me` — current session or `401`.
- `POST /api/auth/change-password` — `{ currentPassword, newPassword
  }`, requires the current password, clears `must_change_password` on
  success.

### 8. Global error handling

A FastAPI exception handler producing the §8 envelope for every error
path — validation errors, auth failures, not-found, conflicts — so
every endpoint built from here on inherits consistent error shapes
rather than each one improvising its own.

### 9. CORS

Configured to the actual frontend origin specifically — never
`allow_origins=["*"]` with credentials enabled, per §96 of the
original spec.

### 10. Seed script

Creates exactly one admin account (credentials from environment
variables, never hardcoded), plus two sample worker accounts and a
handful of sample categories/menu items for local development —
doesn't need to match the frontend mock's seed data exactly, just
needs to exist so the next few prompts have something real to work
against.

## Verify before moving on

- Server starts cleanly; a basic health-check endpoint responds.
- The migration applies cleanly to a real MySQL instance; spot-check a
  few constraints directly in the database — `payments.status`'s enum
  values, the `UNIQUE` on `orders.access_token_hash`, the `CHECK` on
  `order_items.quantity` — confirm they're actually enforced, not just
  present in the model.
- Seed script runs and creates the admin account correctly; that
  account can log in.
- After login, inspect the cookie in the browser: it should be
  `HttpOnly` — confirm `document.cookie` in the dev console does *not*
  show it.
- `GET /api/auth/me` returns the right data when authenticated, `401`
  when not.
- Logging in with a wrong password and logging in with a nonexistent
  username return byte-for-byte identical error responses.
- Manually flip a seeded worker's `is_active` to false directly in the
  database while they're logged in (cookie still valid) — their very
  next authenticated request should fail, not just their next login
  attempt.
- A request from an unexpected origin is rejected by CORS.
- Trigger one deliberate validation error (e.g., a malformed login
  body) and confirm the response matches the §8 envelope exactly.
