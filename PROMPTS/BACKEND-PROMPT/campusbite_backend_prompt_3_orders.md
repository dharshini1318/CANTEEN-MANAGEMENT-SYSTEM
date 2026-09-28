# CampusBite Backend — Prompt 3: Orders & Anonymous Access

Builds on Prompts 1-2 — auth/RBAC/error envelope, the database session
pattern, and `menu_service`'s effective-state computation (reused here
for re-validation at order creation). This is the highest-stakes
prompt in the backend sequence: getting the order-creation transaction
sequencing right is what actually prevents overselling and stale
pricing, not just a nice-to-have.

## Schema additions (Part 1 didn't anticipate these)

**`settings`** — singleton row (always `id = 1`): `cafeteria_name`,
`upi_vpa`. **`operating_hours`** — one row per `day_of_week` (1-7,
same convention as `menu_schedules`): `open_time TIME NULL`,
`close_time TIME NULL`, `is_closed BOOLEAN`. Order creation needs to
check hours, so these need to exist now even though the full settings
*management* endpoints (`PATCH /api/admin/settings`, etc.) are Backend
Prompt 5's job — for now, just the tables plus a read path this
prompt depends on. Requires a new Alembic migration on top of
Prompt 1's initial one. Extend Prompt 1's seed script to seed
reasonable default hours (Mon-Sat 08:00-18:00, Sunday closed, matching
the original spec's own example) and a placeholder UPI VPA.

**`orders.idempotency_key`** — `VARCHAR(64) NULL UNIQUE`. Simpler than
Part 2's "dedupe within 60 seconds" framing suggested: a permanent
unique mapping from key to order achieves the same protection, since a
legitimate client only reuses a key when genuinely retrying the same
submission, never for an unrelated later order.

## Shared service functions (build once, reuse across this prompt and Prompt 4)

- `inventory_service.release_reservation(order_id)` — reverses a
  reservation (`reserved_quantity -= qty` per item, a
  `RESERVATION_RELEASE` ledger entry each). Used by cancellation here
  today, and by the expiry sweep in Prompt 4 tomorrow — build it once.
- `payment_service.check_and_expire_if_needed(payment)` — the lazy
  half of the two-layer expiration mechanism from §3.6: if a payment
  is `AWAITING_CONFIRMATION` and past `expires_at`, flip it to
  `EXPIRED` and call the release function above, before the caller
  does anything else with it. Used by `GET /api/orders/{token}` here;
  Prompt 4 reuses it in the worker order list and the confirm-payment
  endpoint.

## Deliverables

### 1. POST /api/orders

Route handler stays thin; the real logic lives in
`order_service.create_order()`, per the architecture doc's own
layering principle (route → service → repository). Exact sequence,
all inside one database transaction:

1. If `Idempotency-Key` is present: check for an existing order with
   that key first. If found, return it — don't proceed to create a
   new one.
2. Check operating hours (`Asia/Kolkata`) — `409
   OUTSIDE_OPERATING_HOURS` if closed, with a next-opening time in the
   message (the frontend's already-built `getNextOpening()` logic is a
   reasonable reference for the calculation).
3. Validate the request body: `customerName` non-empty and ≤100
   chars, `items` non-empty, each `quantity` 1-50.
4. For each item: re-fetch its *current* row from the database —
   price, `is_active`, effective state via `menu_service`'s formula
   from Prompt 2. `404`/`409 ITEM_UNAVAILABLE` if inactive or not
   effectively available. The unit price used from here on is always
   the value just re-fetched — never anything the client sent.
5. For each `QUANTITY_TRACKED` item: the atomic reservation `UPDATE`
   from §3.4 (`WHERE (stock_total - reserved_quantity -
   sold_quantity) >= :qty`). Zero rows affected on *any* item →
   `409 INSUFFICIENT_STOCK`, roll back the *entire* transaction —
   including reservations that already succeeded earlier in this same
   loop. A 3-item order where only item 2 fails should leave items 1
   and 3 unreserved too, not partially committed.
6. Compute `subtotal_paise` / `total_paise` from the re-fetched prices
   — no tax, no discount.
7. Generate identifiers per §4: `public_order_number` (retry on the
   rare collision), a raw `access_token` (`secrets.token_urlsafe(32)`)
   with only its SHA-256 hash stored, and a `pickup_code` (regenerated
   on collision against *other currently-active* orders only, not
   globally unique).
8. Insert `orders`, `order_items` (with the immutable snapshot fields
   — name, price, quantity, subtotal — never re-read from `menu_items`
   again after this point), and `payments`
   (`status = AWAITING_CONFIRMATION`, `expires_at = now + 15 minutes`).
9. Commit. Return the response exactly per §9.2 — including the raw
   access token, shown this one time only.

### 2. GET /api/orders/{token}

Hash the incoming token, look up by `access_token_hash` — there is no
stored plaintext to compare against, so this is enforced by the schema
itself, not just a coding discipline. An unknown token and a
malformed-looking token both return the *identical* `404 NOT_FOUND` —
don't let a format check short-circuit into an earlier, distinguishable
response before the database lookup even happens.

Call `check_and_expire_if_needed()` on the payment before building the
response, so a customer polling this endpoint sees `EXPIRED` the
moment their 15 minutes are up, without waiting on the backstop sweep
(which doesn't exist until Prompt 4 anyway).

Returns full order detail — this is the endpoint the frontend's order
status page polls.

### 3. GET /api/orders/{token}/receipt

`404 NOT_FOUND` if `payments.status != 'PAID'` — matches §36, a
receipt simply doesn't exist before that. Otherwise returns the
underlying order/items/payment data for the frontend to render
client-side into the paper-style receipt, exactly as already built —
no server-side PDF or image generation here.

### 4. POST /api/orders/{token}/cancel

Same token-hash lookup. Lazy-expire first, same as the GET endpoint.
`409 ORDER_NOT_AWAITING_CONFIRMATION` if the payment isn't
`AWAITING_CONFIRMATION` (covers already-paid, already-expired, and
already-cancelled uniformly — the customer doesn't need a different
message per cause). On success: call `release_reservation()`, set
`payments.status = CANCELLED` and `orders.order_status = CANCELLED`,
both with a `cancelled_at` timestamp.

## Verify before moving on

- **The core correctness test:** create a `QUANTITY_TRACKED` item with
  `stock_total = 1`. Fire two order-creation requests for it as close
  to simultaneously as you can manage (a small script firing both at
  once is more reliable than two manual clicks). Exactly one should
  succeed; the other should get a clean `409 INSUFFICIENT_STOCK`, not
  an error, not a duplicate reservation.
- Submitting the same `POST /api/orders` twice with the same
  `Idempotency-Key` returns the identical order both times — check the
  database directly to confirm only one order and one reservation
  exist, not two.
- Change an item's price via Prompt 2's admin endpoint, then place an
  order for it using a client that still has the *old* price cached —
  confirm the order charges the current price, not the stale one.
- Ordering a sold-out or inactive item returns `ITEM_UNAVAILABLE` with
  no order created at all — not a partial one.
- Set today's operating hours to exclude the current time; confirm
  order creation is rejected with `OUTSIDE_OPERATING_HOURS` and a
  sensible next-opening time in the message. Restore normal hours,
  confirm it works again.
- `GET /api/orders/{garbage-token}` and
  `GET /api/orders/{well-formed-but-wrong-token}` return byte-for-byte
  identical `404` responses.
- Create an order, manually back-date its `expires_at` to the past
  directly in the database, then `GET` it — confirm it flips to
  `EXPIRED` on that read and the reserved inventory is released (check
  `inventory.remaining` went back up).
- Cancel works correctly while `AWAITING_CONFIRMATION` and releases
  inventory; attempting to cancel an already-expired or
  already-cancelled order returns `409` cleanly, doesn't double-release
  anything.
- `GET /api/orders/{token}/receipt` returns `404` for an unpaid order
  (full "renders correctly once paid" verification comes in Prompt 4,
  once confirm-payment exists to actually produce a paid order).
- Force a mid-transaction failure on a multi-item order (e.g., make
  the second item insufficient-stock) and confirm the *first* item's
  reservation also rolls back — check `inventory.reserved_quantity`
  directly, don't just trust the API's error response.
