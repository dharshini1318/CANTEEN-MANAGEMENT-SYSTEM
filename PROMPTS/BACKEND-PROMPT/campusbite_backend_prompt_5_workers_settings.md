# CampusBite Backend — Prompt 5: Workers, Settings, Transactions & Audit Logs

Builds on Prompts 1-4 — auth/RBAC, `hash_password()`, the audit-log
pattern already used throughout. This prompt covers the more
mechanical, lower-risk admin surfaces. Admin Orders (including
voiding), Analytics, and Daily Closing — genuinely more complex, and
sharing a correction mechanism with each other — are Prompt 6.

All endpoints below: role=ADMIN only.

## Deliverables

### 1. Workers

**GET /api/admin/workers** — username, role, `is_active`,
`last_login_at` for every worker.

**POST /api/admin/workers** — `{ username, role, initialPassword }`.
Hash via `hash_password()`, set `must_change_password: true`,
`is_active: true`. `username` must be unique (`409` if taken). `role`
must be `CASHIER` or `FOOD_SERVICE` — **reject `ADMIN` explicitly.**
There's exactly one admin account, manually seeded, and no endpoint
should ever be able to create a second one. Audit log entry.

**POST /api/admin/workers/{id}/disable** / **/re-enable** — flips
`is_active`. Audit log. Disabling takes effect immediately on an
already-logged-in worker's *next* request — this needs no new code
here, it's Prompt 1's `get_current_user` re-check doing its job; worth
explicitly verifying it still holds now that it's being exercised
through a real admin action instead of a manual database edit.

**POST /api/admin/workers/{id}/reset-password** — generates a new
random temporary password, hashes and stores it, sets
`must_change_password: true`. Returns the **plaintext** temporary
password in the response body exactly once — never logged, never
stored anywhere in plaintext, and never included in the audit log's
before/after data (§77's rule: secrets are never logged, no
exceptions).

**PATCH /api/admin/workers/{id}/role** — `{ role }`, same
`CASHIER`/`FOOD_SERVICE`-only validation as creation. Audit log with
before/after role.

**Defense in depth:** every one of these four mutating endpoints
should also reject outright if the target user's *current* role is
`ADMIN` — belt-and-suspenders against ever disabling or modifying the
one admin account through worker-management tooling that was never
meant to touch it.

### 2. Settings

**GET /api/admin/settings** — `cafeteriaName`, `upiVpa`, and all 7
`operatingHours` rows.

**PATCH /api/admin/settings** — partial update. If `operatingHours` is
included, it's a full 7-entry array
(`[{ dayOfWeek, openTime, closeTime, isClosed }]`) that replaces the
table's rows entirely — same "full week payload" pattern as the menu
schedule endpoint from Prompt 2. Audit log entries for changes to
`operatingHours` and `upiVpa` specifically; a `cafeteriaName` change on
its own isn't logged — matches Part 2's own "based on actual risk"
framing exactly.

### 3. Transactions

**GET /api/admin/transactions** — orders joined with their payment and
the confirming worker's username (`payments.confirmed_by_user_id →
users.username`), shaped for the financial view: method, amount,
status, `confirmedByUsername`, timestamp. Filterable by method and
status, searchable by order number. This stands alone — it doesn't
need Admin Orders (Prompt 6) to exist first, though the two will
naturally share some query-building logic once both exist.

### 4. Audit Logs

**GET /api/admin/audit-logs** — filterable by action type and date
range, paginated (`limit`/`offset`, default limit 50) — this table
only grows, so an unbounded response isn't acceptable even at this
project's scale.

## Verify before moving on

- Create a worker, log in with their initial password immediately —
  confirm the login response correctly reports
  `mustChangePassword: true`.
- Attempting to create or PATCH a worker with `role: "ADMIN"` is
  rejected on both endpoints.
- Disable a currently-logged-in worker (their cookie still valid in
  another session) — confirm their very next request fails, not just
  their next login attempt.
- Reset a worker's password: the plaintext temporary password appears
  in the response exactly once — grep the application logs and the
  `audit_logs` table's `before_data`/`after_data` afterward and
  confirm it appears in neither.
- Update operating hours via Settings, then place an order (Prompt 3)
  at a time now outside those hours — confirm it's correctly rejected,
  proving the two prompts are actually wired together, not just
  independently correct.
- Change the UPI VPA — confirm an audit log entry appears. Change only
  the cafeteria name — confirm no audit log entry appears for that
  change alone.
- Confirm a cash order via Prompt 4's endpoint, then check
  `GET /api/admin/transactions` — the confirming worker's username
  should appear correctly as `confirmedByUsername`.
- Audit log pagination: with more than 50 entries logged, confirm the
  endpoint returns a bounded page, not everything at once.
- Every endpoint here rejects a Cashier or Food-Service token with
  `403 FORBIDDEN`.
