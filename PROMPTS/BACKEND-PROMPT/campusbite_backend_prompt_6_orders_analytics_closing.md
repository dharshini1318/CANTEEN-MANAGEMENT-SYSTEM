# CampusBite Backend — Prompt 6: Admin Orders, Analytics & Daily Closing

Builds on Prompts 1-5. This prompt covers the pieces with genuine
correctness complexity that Workers/Settings/Transactions didn't have —
voiding a paid order, multi-dimension analytics, and the daily closing
ritual, all of which turn out to share one underlying mechanism.

## The shared correction mechanism

Extract `daily_closing_service.apply_correction_if_needed(order,
amount_adjustment_paise, description, actor_user_id)`: checks whether
`orders.created_at`'s `Asia/Kolkata` business date already has a
`daily_closings` row; if so, creates a `daily_closing_corrections`
entry against it rather than letting the closed day's frozen totals
silently misrepresent what happened. **Retrofit Prompt 4's
confirm-payment endpoint to call this same function** for the
late-confirmation-after-close case, rather than leaving whatever inline
version it has today — one function, two call sites, not two versions
of the same rule.

**Attribution rule, stated once and applied everywhere:** an order
belongs to the business day it was *created* on — not paid, not
expired, not completed. This is what makes the correction mechanism
make sense: an order created before closing but confirmed after
belongs to the day it was created, and the correction is what trues up
that day's numbers once the late outcome is known. Apply this
consistently across every count and total below.

## Corrections to Part 2's own contracts

- **`POST /api/admin/daily-closing/{id}/correction`** — Part 2's
  listed request body `{ description, amountAdjustmentPaise, reason }`
  doesn't match `daily_closing_corrections`' actual schema, which only
  has `description` and `amount_adjustment_paise` — no separate
  `reason` column. Body is `{ description, amountAdjustmentPaise }`,
  two fields, matching the table exactly.
- **`GET /api/admin/daily-closing`** (no path suffix) — a history
  listing of past closed days, paginated, most recent first. Part 2
  specified `/today` but never a history endpoint, even though the
  frontend's admin closing page needs one.
- **Dashboard's 7-day series** — analytics now always includes a
  `dailySeries` (the last 7 days' sales, one entry per day) *regardless*
  of the selected range, alongside the range-scoped `hourlySeries` Part
  2 already specified. Serves the frontend Dashboard's trend chart
  without a separate endpoint.

## Deliverables

### 1. GET /api/admin/orders

Every filter from §9.6: date range, payment method, payment status,
order status, search (order number or customer name) — combinable.
Each order includes a status-history array derived purely from
existing timestamp columns (`orders.created_at`, `payments.paid_at`,
`orders.completed_at`, `orders.cancelled_at`, `payments.expired_at`) —
no separately-maintained log, the same simplification already used
elsewhere.

### 2. GET /api/admin/orders/{id}

Full detail: order fields, every order item with its snapshot, payment
detail. Admin has no way to use the customer's receipt URL — only the
access token's *hash* is ever stored, the raw token was shown to the
customer exactly once and never persisted. So this response includes
everything the frontend's existing receipt-rendering component needs
(items, totals, payment method, pickup code) so admin can view the
same receipt layout sourced from this endpoint's data instead, by
internal `id` rather than the customer's token.

### 3. POST /api/admin/orders/{id}/void

`{ reason, restock }`. Behavior depends on the order's current state —
this isn't one uniform action:

- **`AWAITING_CONFIRMATION`** (unpaid) → `409`. Nothing to void; an
  unpaid order gets cancelled through the customer's own cancel
  endpoint or left to expire, not voided by admin.
- **Already `CANCELLED`** → `409`. Nothing to void twice.
- **`CREATED` or `PREPARING`** (paid, not yet handed out) → create the
  `refund_records` entry *and* transition `order_status` to
  `CANCELLED` — the food was never actually served.
- **`COMPLETED`** → create the `refund_records` entry only.
  `order_status` stays `COMPLETED` — it factually happened; a
  same-day complaint or mistake doesn't retroactively un-complete an
  order. Voiding and completion status are related but separate facts.

Always refunds the full order total — there's no partial-refund amount
in the request body, matching Part 2's contract; this is a deliberate
V1 scope decision, not an oversight.

If `restock: true`, reverse each item's sale
(`sold_quantity -= qty`, a `REFUND_RESTOCK` ledger entry each). If
`false`, inventory is untouched — the food was already made or
consumed.

Call `apply_correction_if_needed()` from above. Write the
`refund_records` row, the `audit_logs` entry
(`action = ORDER_VOIDED`), and whichever `order_status` transition
applies — all in one transaction.

### 4. GET /api/admin/analytics

Query params: `range` (`today`/`week`/`month`/`custom`),
`from`/`to` for custom. `week` and `month` are rolling windows (last 7
/ last 30 days from today), not calendar week/month — simpler and more
consistently useful for a small operation checking "how's the past
week looked," regardless of what day it currently is.

Bundled response, one round trip:
- Sales summary: revenue, total orders, average order value, UPI
  revenue, cash revenue — for the selected range.
- `dailySeries` — always the last 7 days, regardless of `range` (the
  fix described above).
- `hourlySeries` — orders-per-hour distribution within the selected
  range.
- Order outcomes: Completed / Cancelled / Expired counts within the
  range.
- Products table: name, quantity sold, revenue, remaining stock where
  tracked — sortable by quantity or revenue.

### 5. Daily Closing

**GET /api/admin/daily-closing/today** — if a `daily_closings` row
exists for today's business date, return it (closed, frozen totals).
Otherwise compute and return the same aggregation live, unfrozen, with
a flag indicating it isn't closed yet.

**GET /api/admin/daily-closing** — history: past closed days,
paginated, most recent first (the endpoint Part 2 never specified).

**POST /api/admin/daily-closing/close** — computes today's totals via
one aggregation query (per the attribution rule above:
`orders.created_at`'s business date determines which orders count),
then attempts to `INSERT` the `daily_closings` row directly. Race
safety here comes from `business_date`'s `UNIQUE` constraint, not a
separate check-then-insert: catch the unique-violation from a
concurrent or repeated close attempt and translate it to `409
DAY_ALREADY_CLOSED`, rather than doing a `SELECT` first that would
itself have its own race window between the check and the insert. Same
underlying principle as the payment-confirmation race fix — let the
database's own atomicity do the work. Logged.

**POST /api/admin/daily-closing/{id}/correction** — `{ description,
amountAdjustmentPaise }` (corrected shape, above). Logged.

## Verify before moving on

- **The core correctness test:** close today's business day. Then void
  a paid order that was created earlier today, before closing.
  Confirm: a `refund_records` entry exists, the order's status
  transitions correctly for its case, *and* a
  `daily_closing_corrections` entry appears against today's closing
  with a negative amount matching what was voided.
- Void a `COMPLETED` order specifically — `order_status` stays
  `COMPLETED`, doesn't revert; `refund_records` is still created
  correctly.
- Voiding an `AWAITING_CONFIRMATION` or already-`CANCELLED` order
  returns `409` in both cases.
- `restock: true` increases `inventory.remaining` for each item
  (`sold_quantity` down, `REFUND_RESTOCK` ledger entry); `restock:
  false` leaves it untouched.
- `GET /api/admin/orders` filters correctly across every dimension,
  individually and combined.
- `GET /api/admin/orders/{id}` produces a correctly-ordered timeline
  from existing timestamps alone, and admin can view full order/receipt
  detail without ever touching the customer's access token.
- Analytics: all four ranges compute correctly; `dailySeries` always
  shows the last 7 days regardless of the selected range; `range=today`'s
  sales summary matches what `daily-closing/today` shows before closing.
- Close today once — succeeds. Immediately attempt to close it again —
  `409 DAY_ALREADY_CLOSED`, and confirm (via logs or a breakpoint) it's
  actually going through the unique-constraint-violation path, not a
  separate pre-check.
- An order still `AWAITING_CONFIRMATION` at the exact moment of closing
  counts toward `total_orders` but none of the four resolved-outcome
  counts — confirm this directly and treat it as correct, not a bug.
- Later confirm that same pending order through Prompt 4's endpoint —
  confirm it now correctly creates a correction against the already-
  closed day (this re-verifies Prompt 4's behavior, now that a real
  closed day exists to check against for the first time).
- `POST .../correction` accepts exactly the two-field body — confirm
  the endpoint rejects or ignores a stray `reason` field rather than
  silently expecting it.
- `GET /api/admin/daily-closing` returns past closed days correctly,
  paginated, newest first.
- Every endpoint here rejects a Cashier or Food-Service token with
  `403 FORBIDDEN`.
