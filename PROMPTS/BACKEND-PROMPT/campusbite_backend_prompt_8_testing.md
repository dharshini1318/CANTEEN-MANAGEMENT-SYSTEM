# CampusBite Backend — Prompt 8: Testing

Builds on Prompts 1-7. Delivers a real backend test suite (pytest
against real MySQL), a compact frontend test set (Vitest + React
Testing Library), and the fixes those tests force. This prompt is
written to *find* bugs, and it opens with the ones already suspected.

Work in this order: infrastructure, invariants oracle, sequential
suites, concurrency suites, prove the tests can fail, frontend,
housekeeping.

## How to treat failures

- A failing test is one of three things: a real bug (fix the
  implementation, not the test), a bad test (fix the test), or a spec
  gap (the spec is silent or contradictory). For a spec gap, don't
  silently pick: apply the convention this prompt states if it states
  one, otherwise record the decision in `docs/decisions.md` and in a
  comment at the test.
- Never add sleeps, retries, or looser assertions to make a
  concurrency test pass. An intermittent race test is a real race.
- End with a short report: bugs found (test, cause, fix), decisions
  recorded, anything unresolved.

## 0. Known gaps in earlier prompts (fix as part of this work)

Writing this prompt surfaced problems in the earlier specs
themselves. Fix patterns are given here so failures don't need to be
re-litigated.

**0.1 One rule for every guarded change.** Each payment status
transition and each guarded counter change is a *single conditional
`UPDATE`*. Every side effect (converting or releasing stock, order
status, receipts, ledger rows, audit rows) runs only if that `UPDATE`
affected exactly one row, inside the same transaction. Confirm and
complete (Prompt 4) already do this. Prompt 3's **cancel** and
**`check_and_expire_if_needed`** were described in check-then-act
terms, and Prompt 4 then assumed the latter was already conditional.
Required shapes:

```sql
-- cancel
UPDATE payments SET status = 'CANCELLED', cancelled_at = :now
WHERE id = :pid AND status = 'AWAITING_CONFIRMATION';

-- expire (the lazy check and the sweep both call this)
UPDATE payments SET status = 'EXPIRED', expired_at = :now
WHERE id = :pid AND status = 'AWAITING_CONFIRMATION' AND expires_at < :now;
```

Without this, a cancel racing a cashier's confirmation can overwrite
`PAID` with `CANCELLED` after stock was already converted to a sale,
and the sweep racing a lazy check can release the same reservation
twice.

**0.2 UNSIGNED arithmetic.** `stock_total`, `reserved_quantity`, and
`sold_quantity` are `INT UNSIGNED`. When an expression on unsigned
columns would go negative, MySQL raises "BIGINT UNSIGNED value is out
of range" (a 500) instead of evaluating to false. Write every guard
with additions on both sides, for example
`stock_total >= reserved_quantity + sold_quantity + :qty` instead of
`(stock_total - reserved_quantity - sold_quantity) >= :qty`, or use
`CAST(... AS SIGNED)`. The admin stock-adjustment guard (Prompt 2)
must also be a conditional `UPDATE`, not a `SELECT` followed by an
`UPDATE`: a negative adjustment racing an order creation must never
leave `remaining < 0`, and a rejected adjustment is a clean 4xx,
never a 500.

**0.3 One clock, in UTC.** The architecture doc's SQL uses `NOW()`
while Python computes other timestamps itself. If expiry is computed
in UTC in Python but compared against `NOW()` on a MySQL server set
to IST (likely on a machine in India, since `time_zone` defaults to
the OS zone), every order counts as expired the instant it's created.
Fix: add `core/clock.py` with a timezone-aware `utcnow()`. Route all
business-logic time through it and pass it into SQL as a bound
parameter instead of `NOW()`. Set `created_at`, `paid_at`, and
`expires_at` explicitly from it wherever behavior depends on them (DB
defaults are fallback only). Pin every DB session to UTC
(`SET time_zone = '+00:00'`) as defense in depth. Side benefit: tests
can control time.

**0.4 Idempotent replay can't return the raw token.** Only its hash is
stored. A replayed `POST /api/orders` (same `Idempotency-Key`)
returns the original order's `publicOrderNumber`, `pickupCode`,
totals, and status *without* `accessToken`; the frontend keeps the
token from the first response. Known V1 limitation: a client that
never received the first response has an unreachable order that
expires in 15 minutes (worst case, a phantom reservation). For
concurrent requests with the same key: on the unique violation, roll
back and re-read the existing order in a *fresh* transaction. Under
REPEATABLE READ, a re-read inside the failed transaction can miss the
winner's row. The frontend must handle a response with no
`accessToken` (see the frontend section).

**0.5 Conventions this prompt pins (previously unspecified).**
- Operating hours: open time inclusive, close time exclusive, so an
  order at exactly closing time is rejected. Hours gate order
  *creation* only. Confirmation, completion, and cancellation still
  work after closing time for orders created earlier (a 17:59 cash
  order must be confirmable at 18:05).
- Reject duplicate `menuItemId` lines in one order (400); cap distinct
  lines per order at 25 (400).

## 1. Test infrastructure

Layout: `tests/conftest.py`, `factories.py`, `invariants.py`,
`helpers.py`, and `test_*.py` files.

- **Real MySQL, dedicated database.** `DATABASE_URL_TEST`. The
  database name must end in `_test` or the fixtures refuse to run;
  truncation must never be able to touch dev data. No SQLite: race
  tests prove nothing without InnoDB's row locking, and CHECK
  constraints, JSON columns, and unique behavior must match
  production.
- The schema comes from `alembic upgrade head` on the empty test
  database at session start, so the migrations are tested too.
  Connection charset `utf8mb4`.
- Between tests: truncate everything (foreign key checks off) and
  re-seed only the admin. No per-test transaction rollback; the
  concurrency tests need real, independent commits.
- Test engine pool of at least 20 connections. If the pool is smaller
  than the thread count, requests queue for connections and the
  "concurrent" test isn't concurrent.
- API client helper: performs the real login flow, keeps cookies, and
  attaches the CSRF header on mutating requests. Base URL
  `https://testserver` so `Secure` cookies round-trip. One client per
  thread.
- Factories create data through the API where the path under test
  matters; direct DB writes only for back-dating and deliberate
  corruption.
- Time: a fixture over `core.clock` with `set` and `advance`. Tests
  advance time; nothing sleeps for 15 minutes. The sweep is called
  directly as a function; one separate test asserts the scheduler
  registered it at a 60-second interval and starts with the app.
- `run_concurrently(callables)`: a `threading.Barrier` releases all
  threads together. **Any 5xx response in a race test fails the
  test**; a 500 under contention is itself a bug. Every race test runs
  at least 20 iterations, each from fresh state, and carries
  `@pytest.mark.concurrency` so `pytest -m "not concurrency"` gives a
  fast loop.

## 2. The consistency oracle

`invariants.py` provides `assert_system_consistent()`, run by an
autouse teardown after **every** test. A test that passes its own
assertions but leaves the database inconsistent still fails.

*For each `QUANTITY_TRACKED` item, two independent derivations must
both match the stored counters:*
- **Ledger replay by type:** RESERVATION adds to reserved;
  RESERVATION_RELEASE subtracts from reserved; SALE subtracts from
  reserved and adds to sold; REFUND_RESTOCK subtracts from sold;
  INITIAL_STOCK, RESTOCK, MANUAL_ADJUSTMENT, and CORRECTION add their
  signed delta to `stock_total`. For the lifecycle types use the
  entry's magnitude, whatever sign convention was used.
- **Order-derived:** `reserved` equals the item's total quantity
  across orders whose payment is `AWAITING_CONFIRMATION`; `sold`
  equals its total across `PAID` orders minus quantities restocked by
  refunds.
- `remaining >= 0` and every counter `>= 0`.

*For every order:*
- (payment status, order status) must be one of: (AWAITING_CONFIRMATION,
  CREATED), (PAID, PREPARING), (PAID, COMPLETED), (PAID, CANCELLED,
  only if a refund row exists), (EXPIRED, CANCELLED), (CANCELLED,
  CANCELLED). Anything else fails.
- `PAID` implies `paid_at`, `confirmed_by_user_id`, exactly one
  `receipts` row, and exactly one `PAYMENT_CONFIRMED` audit row. Not
  `PAID` implies no receipt.
- A `PAID` payment has no `expired_at` or `cancelled_at`.
- `payments.amount_paise == orders.total_paise == sum of
  order_items.subtotal_paise`, and every item subtotal equals unit
  price times quantity.

*For every daily closing:* `total_sales_paise == cash_total_paise +
upi_total_paise`.

**Test the oracle itself.** A test that corrupts state on purpose
(decrement `reserved_quantity` directly; mark an order `PAID` with no
receipt; duplicate a `SALE` row) and asserts the oracle *raises*. An
oracle that can't fail proves nothing. That test opts out of the
autouse teardown.

## 3. Critical cases from the original spec (§123), mapped to this architecture

| # | Spec case | What to test | Expected |
|---|---|---|---|
| 1 | Last item race | C1 | one order succeeds, the rest `409 INSUFFICIENT_STOCK` |
| 2 | Expired cash order | Advance the clock past 15:00: lazy expiry via `GET`; the sweep with nothing touching the order; parametrize `CASH` and `UPI` | `EXPIRED`, order `CANCELLED`, stock released exactly once. At 14:59 still awaiting. A fresh order is never instantly expired |
| 3 | Confirm at the expiry boundary | `expires_at - 1s` and `expires_at + 1s`; C4 | before: succeeds. After: `409`, order ends `EXPIRED`, stock released |
| 4 | Duplicate confirmation | C2 | exactly one success |
| 5 | Duplicate webhook | N/A (no gateway) | covered by C2 |
| 6 | Amount mismatch | N/A (the amount is never client- or provider-supplied). Confirm ignores any request body; money invariants live in the oracle | none |
| 7 | Payment for a cancelled order | Confirm on `CANCELLED` and `EXPIRED` returns 409 with no side effects; C3 | never a mixed end state |
| 8 | Price change after order | Admin changes the price after ordering | order, items, receipt data unchanged; new orders use the new price |
| 9 | Disabled menu item | Order, then disable the item and its category | order, receipt data, and admin detail still render from snapshots; new orders get `ITEM_UNAVAILABLE` |
| 10 | Closed cafeteria | Closed day; 1s before open; at open; 1s before close; at close; after | outside hours: `409 OUTSIDE_OPERATING_HOURS` with a next-opening time, no order and no reservation created |
| 11 | Closed business day | Daily-closing suite (§4) | corrections, never silent inclusion |
| 12 | Unauthorized worker | RBAC matrix (§4) | 403 |
| 13 | Anonymous order access | Token suite (§4) | identical 404s |
| 14 | Malicious customer name | Input suite (§4) and the frontend rendering test (§7) | stored verbatim, rendered as text |

## 4. Remaining suites

**Effective-state formula (Prompt 2).** Table-driven, not hand-picked:
schedule (none, or available T/F crossed with special T/F) crossed
with availability override (none, T, F) crossed with special override
(none, T, F) crossed with stock (untracked, tracked at 0, tracked
above 0). Compare `GET /api/menu` for every combination against a
short reference implementation of the formula written in the test
from the architecture doc, not imported from the service.

**Void and refund (Prompt 6).** State by restock matrix: unpaid gives
409; already cancelled gives 409; paid and preparing gives a refund
row and the order becomes `CANCELLED`; completed gives a refund row
and the order stays `COMPLETED`; `restock` true and false effects on
`sold` and the ledger. Void after the day is closed produces a
negative `daily_closing_corrections` row against the order's
`created_at` business date, and the closing's frozen totals never
change.

**Daily closing.** Attribution by `created_at` business date,
including the UTC/IST boundary (`18:29:59Z` belongs to one IST day,
`18:30:00Z` to the next). An order still pending at close counts
toward `total_orders` but no outcome count, and confirming it
afterward produces a correction, not a silent inclusion. Closing
twice gives `409 DAY_ALREADY_CLOSED` via the unique-constraint path.
History endpoint pagination.

**Auth and RBAC.**
- A matrix test generated from the RBAC table in the architecture
  doc: every (role, route) combination gives 401 unauthenticated, 403
  for a wrong role, and neither for the right role. Plus a guard test
  that enumerates `app.routes` and fails if any `/api/admin` or
  `/api/worker` route isn't in the matrix, so a newly added,
  unprotected endpoint fails the suite.
- CSRF: with a valid session, every mutating cookie-authenticated
  route rejects a missing or mismatched CSRF header (403). Public
  customer routes work without one.
- Login: unknown username, wrong password, and disabled account
  return identical status and body. The cookie is `HttpOnly`,
  `SameSite=Strict`, and `Secure`. Disabling a user invalidates their
  existing session on the next request. `mustChangePassword` is
  cleared only by change-password.

**Anonymous access and tokens.** Unknown, malformed, truncated,
10,000-character, SQL-injection-shaped, and other-order tokens, plus
the public order number and the pickup code used as tokens: all
return the identical `404`. The raw token exists nowhere in the
database after creation (scan every text column of every table for
it).

**Input validation.** Quantity: 0, -1, 51, 10^9, `"2"`, `2.5`, null,
missing. Empty items, duplicate lines, more than 25 lines. Customer
name: empty, whitespace-only, 100 characters (accepted), 101
(rejected), control characters (rejected), surrounding whitespace
trimmed. **Unicode round-trip:** Tamil script and emoji names come
back intact, and length limits count characters, not bytes
(`utf8mb4`). Script and HTML payloads are stored and returned
verbatim as JSON strings; escaping is the renderer's job (see the
frontend tests). SQL-injection-shaped `search` params on the menu,
worker, and admin lists return normal results, never a 500.

**Error envelope.** Provoke each error class (validation, where
FastAPI's default 422 must be converted; 401; 403; 404; an unknown
route; the 409s; and an injected unexpected exception) and assert
every response matches `{ "error": { "code", "message" } }`, with no
stack trace or SQL in any 5xx body.

**Fault injection (§127 #20).** Force an exception after the
reservation `UPDATE` but before commit during order creation: full
rollback, an envelope 500, no leaked reservation, no partial order.

**Time correctness.** After startup, a connection from the app's pool
reports `@@session.time_zone = '+00:00'`. Run the expiry suite once
with the MySQL server's default time zone set to `+05:30` and confirm
nothing changes.

**Other spec edge cases (§127).**
- #2 and #3: at 10 minutes the order is still awaiting with the same
  `expiresAt`; at 16 minutes it is expired on the next read.
- #11: two consecutive `GET`s are identical and side-effect-free apart
  from lazy expiry.
- #13: override an item unavailable after the customer loaded the
  menu, then create the order: `ITEM_UNAVAILABLE`.
- #15: an order created before closing time is confirmable and
  completable after it.
- #23: two orders back to back get distinct numbers and pickup codes.

**N/A here (no gateway, webhook, or provider):** §123 cases 5 and 6
(covered in spirit by C2 and the money invariants), and §127 #8, #9,
#10, #19.

## 5. Concurrency suites

Each one: N threads via `run_concurrently`, at least 20 iterations
from fresh state, a final `assert_system_consistent()`, and no 5xx.

| ID | Race | Setup | Expected |
|---|---|---|---|
| C1 | Last item | stock 1; 10 threads create orders for it. Variant: an order with A (stock 1) and B (plenty), 10 in parallel | exactly one 201, the rest 409; `reserved == 1`; in the variant the losers leave no reservation on B |
| C2 | Duplicate confirm | one awaiting order; 10 threads (same cashier, and two cashiers) | exactly one 200, the rest 409; one `SALE` row per item; one receipt; one audit row; `sold` not doubled |
| C3 | Cancel vs confirm | one awaiting order; the customer's cancel and a cashier's confirm released together | exactly one wins; end state is either (PAID, PREPARING, stock sold) or (CANCELLED, CANCELLED, stock released), never mixed. Expected to fail against a check-then-act cancel (§0.1) |
| C4 | Confirm vs expiry | an order already past `expires_at` but still `AWAITING_CONFIRMATION`; 3 confirms, 1 sweep, and 3 `GET`s together | the order ends `EXPIRED`, never `PAID`; every confirm gets 409; stock released exactly once |
| C5 | Sweep vs lazy check | several overdue orders across items; a `GET` on each plus two sweeps simultaneously | each order expires once, each reservation is released exactly once; no negative counters |
| C6 | Duplicate complete | one `PREPARING` order; 10 threads (two food-service accounts) | exactly one 200, the rest 409; one history row; one audit row |
| C7 | Double close | 10 threads call close | exactly one success, the rest `409 DAY_ALREADY_CLOSED`; one closing row |
| C8 | Same idempotency key | 10 threads, identical key and body | all succeed with the same `publicOrderNumber`; exactly one order and one reservation; exactly one response contains `accessToken` |
| C9 | Adjust vs reserve | item with `stock_total` 10; five adjustments of -4 racing ten orders of quantity 1 | `remaining >= 0` at the end; every response is a success or a clean 4xx |

## 6. Prove the tests can fail

A race test that can't fail proves nothing. For C1, C2, C3, C5, C8,
C9 and the expiry-boundary test: on a scratch branch (never
committed), swap the real implementation for a naive check-then-act
version and confirm the test **fails**. Then revert and confirm it
passes. Record each result (test, mutation, failed as expected) in
`docs/test-mutation-log.md`.

## 7. Frontend tests

Vitest, React Testing Library, user-event, jsdom. These are dev
dependencies for a requirement in your original spec (§122), not
general additions. Mock the API client module; don't add a mock
server library. Keep this set compact.

- **Cart:** reducer add, update, remove, and clear; totals are integer
  paise math; persistence survives a reload, and a corrupt stored
  value falls back to an empty cart instead of crashing.
- **Price utilities:** `parsePrice(formatPrice(x))` round-trips for
  integer paise. Non-whole rupees never lose paise (4550 never
  displays as ₹45). Invalid input returns a defined failure value,
  never a silent 0.
- **Checkout:** name and method required; Place Order disabled until
  both are valid and while a submit is in flight (no double submit);
  each of `OUTSIDE_OPERATING_HOURS`, `ITEM_UNAVAILABLE`, and
  `INSUFFICIENT_STOCK` shows its own message with the form preserved;
  a create-order response with no `accessToken` (§0.4) shows "We
  couldn't confirm your order, please try again" and does not
  navigate.
- **Auth UI:** generic login error; each route guard redirects
  logged-out users and wrong roles; `mustChangePassword` forces the
  change-password screen; a 401 from any API call flips `AuthContext`
  to logged out.
- **API client:** attaches the CSRF header on mutating methods only,
  sends credentials, and normalizes the error envelope.
- **Order tracking:** the stepper renders correctly for every allowed
  (payment, order) pair; the countdown derives from `expiresAt`
  (fake timers; remounting shows the same remaining time); polling
  stops on terminal states.
- **Receipt:** correct rows and totals; date and time in
  `Asia/Kolkata` when run under `TZ=UTC` and under
  `TZ=America/Los_Angeles`; a failed export shows the error and leaves
  order state untouched.
- **XSS rendering:** names like `<img src=x onerror=alert(1)>` and
  `<script>alert(1)</script>` render as literal text on the order page,
  the worker dashboard row, the admin order detail, and the receipt,
  with no such element in the DOM. Plus a static test that
  `dangerouslySetInnerHTML` appears nowhere in `src/`.

A browser-level end-to-end test (Playwright) of the customer, cashier,
and kitchen flow is worth adding later; it's deliberately not part of
this prompt.

## 8. Housekeeping

Update `AGENTS.md`:
- The exact commands to run the backend suite (including creating the
  `_test` database) and the frontend suite.
- Correct every statement that is no longer true now that a real
  backend exists (the "frontend-only prototype," "mock service layer,"
  and "known gaps" sections).
- Add two durable rules so later changes can't quietly regress them:
  (1) every guarded state or counter change is a single conditional
  `UPDATE`, with side effects only when it affected a row; (2) all
  business-logic time goes through `core/clock.py`, never SQL `NOW()`.

## Verify before moving on

- The suite is green from a completely empty MySQL test database
  (migrations run inside the session fixture), twice in a row.
- The `_test` guard actually refuses a dev database URL. Try it.
- The oracle self-test passes: deliberate corruption makes the oracle
  fail.
- The mutation checks in §6 are done and logged, and each failed as
  expected against the naive version.
- Every concurrency test passes across three consecutive full runs.
  Any intermittent failure is a real bug, not test noise.
- The expiry suite passes with the MySQL server's default time zone
  set to `+05:30`.
- `pytest --cov=app/services` shows every branch in the order,
  payment, inventory, daily-closing, and menu services exercised.
  List uncovered lines with a reason. No percentage target: a low
  number is a finding, a high one isn't proof.
- Frontend: `npm test` is green. The XSS test fails when
  `dangerouslySetInnerHTML` is introduced experimentally, proving it
  can fail.
- `AGENTS.md` reflects reality.
- The final report lists every bug found and fixed. The §0 items are
  expected to appear in it.

## Deliberately not covered here

Rate limiting, structured logging, and security headers are Prompt 9,
and deployment comes after that. This suite assumes those don't exist
yet.
