# CampusBite Backend — Prompt 4: Payments

Builds on Prompts 1-3 — auth/RBAC, `inventory_service.release_reservation()`,
and `payment_service.check_and_expire_if_needed()`. This prompt
implements payment confirmation, order completion, the worker order
list, and finally activates the expiration sweep whose infrastructure
was stood up in Prompt 1.

## Correcting Part 1's confirmation-race SQL

Part 1's original statement was:
```sql
UPDATE payments SET status = 'PAID', ... WHERE id = :payment_id AND status = 'AWAITING_CONFIRMATION';
```
That only checks `status` — never `expires_at`. Fine under normal
conditions, since the lazy-check elsewhere keeps `status` honest
before anything reads it. But it's exactly wrong for the specific case
the original spec names directly (§123): a cashier confirming right at
the expiry boundary, before anything has gotten around to flipping the
status yet. As written, that request would incorrectly succeed —
paying an order that should already be dead. Fix: call
`check_and_expire_if_needed()` first, so `status` is already correctly
`EXPIRED` by the time the conditional `UPDATE` runs, rather than
bolting a second time-check onto the SQL and maintaining two places
that encode the same rule.

## Deliverables

### 1. POST /api/worker/orders/{id}/confirm-payment

Cashier or Admin only — `403` for Food-Service. No request body; reads
`method` off the order itself. Exact sequence, one transaction:

1. Look up the order by internal `id` (never the customer's access
   token — that stays strictly customer-side, a completely separate
   trust domain from worker tooling).
2. Call `check_and_expire_if_needed()` on its payment first — see the
   correction above.
3. Attempt the conditional `UPDATE`:
   ```sql
   UPDATE payments
   SET status = 'PAID', paid_at = NOW(), confirmed_by_user_id = :worker_id
   WHERE id = :payment_id AND status = 'AWAITING_CONFIRMATION';
   ```
4. **Zero rows affected** → `409 ORDER_NOT_AWAITING_CONFIRMATION` —
   covers "someone else just confirmed it" and "it just expired"
   identically; the two are indistinguishable at this point and, per
   Part 2, don't need to be.
5. **One row affected** → proceed, still in the same transaction:
   - Convert each order item's reservation to a sale:
     `reserved_quantity -= qty; sold_quantity += qty`, one `SALE`
     ledger entry per item.
   - `orders.order_status` moves `CREATED → PREPARING` — automatic,
     no separate worker action, per the already-frozen decision.
   - Create the `receipts` row (`receipt_number =
     public_order_number`).
   - Write an `order_status_history` entry
     (`actor_type = WORKER, actor_id = <confirming worker>`).
   - Write an `audit_logs` entry
     (`action = PAYMENT_CONFIRMED`).
6. Commit. Return the updated order/payment state.

### 2. POST /api/worker/orders/{id}/complete

Food-Service or Admin only — `403` for Cashier. Same conditional-update
pattern, applied here too even though the original spec doesn't name
this specific race by name — it's the same class of problem (two
food-service workers marking the same order picked up at once), and
the fix is the same one line:
```sql
UPDATE orders SET order_status = 'COMPLETED', completed_at = NOW()
WHERE id = :order_id AND order_status = 'PREPARING';
```
Zero rows → `409`. One row → `order_status_history` entry, `audit_logs`
entry (`action = ORDER_COMPLETED`).

### 3. GET /api/worker/orders

Cashier, Food-Service, or Admin. Query params: `status`, `search`
(order number or customer name).

- Before serializing the response, call `check_and_expire_if_needed()`
  on every `AWAITING_CONFIRMATION` row in the result set — a worker
  looking at their list shouldn't see a stale "awaiting confirmation"
  order that's actually already timed out.
- **Role-scoped server-side, not just in the query params:**
  Food-Service gets `paymentStatus = PAID` forced onto the query
  regardless of what was requested — a Food-Service token asking for
  `status=AWAITING_CONFIRMATION` explicitly should still get nothing,
  because the endpoint itself refuses to return it, not because the
  frontend chose not to ask. Cashier and Admin: unrestricted.

### 4. Activate the expiration sweep

The `apscheduler` instance from Prompt 1 now gets an actual job,
running once a minute:

1. Query for payment IDs where `status = 'AWAITING_CONFIRMATION' AND
   expires_at < NOW()`.
2. For each one found, call `check_and_expire_if_needed()` — re-fetching
   the row fresh rather than reusing anything held from step 1, since
   this is the same race-safe conditional-update function used
   everywhere else. This is deliberately not a separate bulk
   update-then-release implementation: reusing the already-correct
   per-row function means the sweep can never race against a
   simultaneous lazy-check (from some customer's `GET
   /api/orders/{token}` landing at the same moment) — whichever gets
   there first wins the conditional update, the other sees zero rows
   affected and does nothing. One correctness argument, not two.

## Verify before moving on

- **The core correctness test:** fire two near-simultaneous
  confirm-payment requests at the same order. Exactly one returns
  success; the other gets a clean `409`. Check the database directly
  afterward — one `SALE` ledger entry per item, one receipt, one audit
  log entry, not two of anything.
- **The expiry-boundary test, specifically:** create an order,
  back-date its `expires_at` to a few seconds in the past directly in
  the database, then immediately call confirm-payment. It must return
  `409`, not succeed — this is the exact case Part 1's original SQL
  would have gotten wrong.
- Confirming a `CASH` order and a `UPI` order both work through this
  same endpoint with no request body either way.
- Food-Service calling confirm-payment gets `403`; Cashier calling
  complete gets `403`.
- After a successful confirmation: `inventory.reserved_quantity` goes
  down and `sold_quantity` goes up by the same amount for each item,
  `order_status` is `PREPARING`, and `GET
  /api/orders/{token}/receipt` — which correctly 404'd in Prompt 3 —
  now returns real data.
- `GET /api/worker/orders` as Food-Service, explicitly requesting
  `status=AWAITING_CONFIRMATION`, still returns nothing in that
  status — confirm the server-side override, not just the
  documented behavior.
- Two near-simultaneous "mark complete" requests on the same order:
  exactly one succeeds.
- Create an order, back-date its `expires_at`, then *wait* for the
  sweep's normal one-minute interval without touching it manually —
  confirm it flips to `EXPIRED` and its inventory is released on its
  own.
- Time a `GET /api/orders/{token}` request to land close to when the
  sweep would process that same expired order — confirm the
  reservation gets released exactly once either way, never twice
  (check that `reserved_quantity` doesn't go negative or get
  decremented by the same order twice).
