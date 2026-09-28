# CampusBite Backend — Prompt 2: Menu, Categories & Inventory

Builds on Prompt 1's foundation — auth, RBAC, database session, error
envelope. This prompt implements the public menu endpoints and the
admin catalog-management endpoints. Orders and payments are Prompts 3
and 4.

The frontend mock (frontend Prompts 3 and 8) already simulated this
exact logic client-side, as a useful behavioral reference for what
"correct" looks like — but Architecture Specification §2 and §9 remain
the actual source of truth for schema and contract shape; don't derive
field names or behavior from the mock's JS conventions.

## Gap being closed

Architecture Specification §9.4 specified the admin *write* endpoints
for menu management but never specified the *read* endpoints the admin
UI actually needs — an oversight in that document, not something to
quietly work around. This prompt adds `GET /api/admin/menu`,
`GET /api/admin/menu/{id}`, and `GET /api/admin/categories`,
shaped to match exactly what the frontend's admin list and per-item
detail views need.

## Deliverables

### 1. Effective-state computation

One SQL query per request, joining today's `menu_schedules` row
(filtered on the correct `day_of_week` for `Asia/Kolkata`'s current
date) and today's `menu_special_overrides` rows (filtered on
`Asia/Kolkata`'s current date) onto each menu item — then a small,
separately-testable Python function applies the actual formula from
§2:

```
effective_available = override(AVAILABILITY) ?? schedule.is_available ?? TRUE
effective_special    = override(SPECIAL)      ?? schedule.is_special    ?? FALSE
```

For `QUANTITY_TRACKED` items, AND `effective_available` with
`inventory.remaining > 0` (`stock_total - reserved_quantity -
sold_quantity`). Keep this formula in one place — a `menu_service.py`
function both the public and admin endpoints call — not duplicated
between them.

### 2. Public endpoints (no auth)

**GET /api/menu** — active items only (`is_active = true`), with
effective state computed as above. Response shape exactly matches
§9.1: camelCase, `pricePaise`, `imageUrl`, `inventoryMode`,
`effectiveAvailable`, `effectiveSpecial`, `remaining` (populated only
for `QUANTITY_TRACKED`, `null` otherwise).

**GET /api/menu/categories** — active categories, ordered by
`display_order`.

### 3. Admin read endpoints (role=ADMIN, filling the gap above)

**GET /api/admin/menu** — every item regardless of `is_active` (admin
needs to see disabled ones too), with the same effective-state fields
as the public endpoint so the list's status badges can render. Query
params: `search` (name), `category` filter.

**GET /api/admin/menu/{id}** — bundles everything the frontend's
four-tab detail view needs into one response, not four round trips —
the item's own fields, its inventory record if `QUANTITY_TRACKED`, its
full week of schedule entries (including the implied defaults for days
with no explicit row, so the 7-day grid renders completely), its
current and future overrides, and its recent `inventory_transactions`
entries (most recent 50 is enough). Same "one page, one request"
principle already used for `GET /api/admin/analytics` in the
architecture doc.

**GET /api/admin/categories** — admin's own list: every category
regardless of `is_active`, with an item count per category.

### 4. Admin write endpoints (role=ADMIN)

**POST /api/admin/categories** — `{ name, displayOrder }`.
**PATCH /api/admin/categories/{id}** — partial update. Disabling a
category with active items attached still succeeds (matches the
frontend's warn-not-block UX) but writes an audit log entry.

**POST /api/admin/menu** — full item payload. For `QUANTITY_TRACKED`
items, also accepts `initialStock`, creating the linked `inventory`
row in the *same transaction* — if either insert fails, both roll
back; never leave a menu item with no inventory record or vice versa.

**PATCH /api/admin/menu/{id}** — partial update. Price and
inventory-mode changes get an audit log entry with before/after
values; routine edits (description, image) don't — matches "based on
actual risk," not logging every trivial change. Price changes never
touch historical `order_items` snapshots — this is true automatically
by the schema design, not something that needs special-casing in this
endpoint's logic.

**POST /api/admin/menu/{id}/disable** — soft delete
(`is_active = false`); logged.

**POST /api/admin/menu/{id}/inventory/adjust** — `{ quantityDelta,
reason }`. `reason` required and non-empty — `400 VALIDATION_ERROR`
without one. Applies only to `stock_total`, never directly to
`reserved_quantity` or `sold_quantity` (those are only ever touched by
the order lifecycle, Prompt 3's territory). Reject an adjustment that
would drive `remaining` negative — that's a logically impossible
state, not just an unusual one. Writes an `inventory_transactions` row
(`type = MANUAL_ADJUSTMENT`) and an audit log entry in the same
transaction.

**PUT /api/admin/menu/{id}/schedule** — full week payload,
`[{ dayOfWeek, isAvailable, isSpecial }]`. For each day: if the value
matches the default (`isAvailable: true, isSpecial: false`), *delete*
any existing row for that item/day rather than storing an explicit
default row; otherwise upsert. Getting this backwards — storing every
day explicitly — breaks the "absent row = default" pattern the whole
schema was designed around. Logged.

**POST /api/admin/menu/{id}/overrides** — `{ overrideDate,
overrideType, overrideValue }`. Upsert on the existing
`(menu_item_id, override_date, override_type)` unique constraint —
posting again for the same date and type updates it rather than
erroring or duplicating. Logged.

**DELETE /api/admin/menu/{id}/overrides/{overrideId}** — "revert to
schedule." Logged.

## Verify before moving on

- **The core correctness test, now server-side:** schedule an item
  special on today's weekday, confirm `GET /api/menu` shows
  `effectiveSpecial: true`. Add an override removing today's special.
  Confirm it now shows `false`, with the schedule row still intact
  underneath. Delete the override. Confirm it's back to `true`. This
  is the same test the frontend mock passed in Prompt 8 — now proving
  the real formula, not the simulated one.
- A `QUANTITY_TRACKED` item with `remaining = 0` shows
  `effectiveAvailable: false` even when its schedule/override would
  otherwise say available.
- Creating a `QUANTITY_TRACKED` item with `initialStock` creates both
  the menu item and its inventory row atomically — force a failure
  partway through (e.g., an invalid category id) and confirm neither
  row gets created, not just one.
- Inventory adjustment: empty reason rejected; a valid adjustment
  updates `stock_total` and writes a ledger entry; an adjustment that
  would make `remaining` negative is rejected.
- Schedule `PUT`: setting a day back to the default removes its row
  rather than leaving an explicit default row behind — check the
  database directly, not just the API response.
- Posting the same override twice updates it in place rather than
  erroring or creating a duplicate.
- Audit log shows entries for price changes, inventory-mode changes,
  inventory adjustments, schedule changes, and override changes — with
  correct before/after data where specified — and does *not* show
  entries for routine description/image edits.
- Every admin endpoint here rejects a cashier or food-service token
  with `403 FORBIDDEN` (test with the seed worker accounts from
  Prompt 1).
- `GET /api/admin/menu/{id}` returns everything the four-tab frontend
  view needs in one call — item fields, inventory, all 7 schedule
  slots (real or defaulted), overrides, and recent ledger entries.
