# CampusBite Backend — Prompt 7: Frontend Integration

Swaps the frontend's mock service layer for real calls to the backend
built in Prompts 1-6. Structured around the API Contract Alignment
Audit as the primary checklist — its six points are referenced by
number below rather than restated in full. This prompt adds what that
audit didn't cover: the shared API client, CSRF wiring, removing
mock-only scaffolding, and reconnecting existing error-state UI to
real error codes.

## 1. The shared API client (foundation for everything else)

Replace the scattered mock functions in `services/api.js` with one
small `fetch()` wrapper (per the original spec's own §104), used by
every request from here on:

- Base URL from an environment variable, not hardcoded.
- `credentials: 'include'` on every request, so the HttpOnly auth
  cookie actually gets sent.
- **CSRF, the piece the audit didn't mention:** the double-submit
  pattern from the architecture doc needs a *second* cookie — not the
  HttpOnly auth one — carrying the CSRF token, specifically so
  JavaScript can read its value. Read it and attach it as a header on
  every mutating request (`POST`/`PATCH`/`PUT`/`DELETE`). Easy to miss
  entirely, since nothing breaks until the backend actually enforces
  it — then every mutation silently fails.
- Parse the `{ error: { code, message } }` envelope on any non-2xx
  response and throw a normalized error the rest of the app can catch
  and branch on by `code` — not five different ad hoc error-shape
  assumptions scattered across components.

## 2. Remove mock-only scaffolding

- Every "Simulate cashier confirmation," "Simulate expiration," and
  "Simulate marking as picked up" dev-only button, entirely — not
  hidden, removed. They're not just unnecessary now; a button that
  fakes local state while bypassing the real backend would actively
  mislead whoever's testing against it.
- The `localStorage`-backed mock stores for orders, menu data, and
  worker accounts — all state now lives server-side, fetched fresh
  through the API client. (Theme preference stays in `localStorage` —
  that was always a legitimate per-viewer convenience, not mock
  scaffolding.)
- The artificial ~500-700ms delays built into various mock functions
  specifically to make skeleton states visible during frontend-only
  testing — remove them. Real network latency does that job now, and
  stacking an artificial delay on top just adds unnecessary lag.

## 3. Auth & sessions (audit point 1, plus one new flow)

- `AuthContext` establishes session state from `GET /api/auth/me` on
  mount, not from `localStorage`. This also means a disabled worker's
  stale frontend state self-corrects automatically — the backend
  already rejects the request, `AuthContext` just needs to react to
  that `401` by treating the session as logged out.
- Remove every `localStorage` read/write for the worker/admin session,
  including whatever's currently storing a full user object — that
  was flagged as a hygiene issue when the audit came in and should be
  gone now regardless of anything else in this prompt.
- **New flow, not a refactor:** when login or `GET /api/auth/me`
  returns `mustChangePassword: true`, redirect to a forced
  change-password screen before allowing access to anything else in
  the worker/admin UI. This never existed in the mock — there was no
  real backend to make "just logged in" and "must change password
  first" meaningfully different states until now.
- Logout calls `POST /api/auth/logout`, then clears `AuthContext`
  state — the cookie itself clears server-side.

## 4. Menu & effective state (audit point 2)

Remove `getEffectiveState()` entirely. Update every component that
reads menu item fields — `MenuCard`, the admin menu list and detail
view, the Today's Special section, the dashboard's low-stock/sold-out
widgets — to read `effectiveAvailable`, `effectiveSpecial`,
`pricePaise`, `imageUrl`, `inventoryMode` directly from the API
response. Worth noting: the *original* Prompt 3 spec already called
for `pricePaise` and camelCase throughout — if the current
implementation drifted to `price`/`inventory_mode` along the way, this
pass is also where that reconciles back, now that the real backend's
shape makes the correct convention unambiguous either way.

## 5. Orders (audit points 4 and 5)

- `CheckoutPage` maps cart items to exactly
  `{ menuItemId: item.id, quantity: item.quantity }` before calling
  `POST /api/orders` — strip everything else the cart carries for
  display purposes.
- `Idempotency-Key`: generate via `crypto.randomUUID()` once per
  checkout attempt, sent as a header. It's optional, not required —
  its absence shouldn't break anything; when present it adds
  duplicate-submission protection, it isn't load-bearing for basic
  correctness.
- Wire the checkout error state to the real codes the endpoint can now
  return — `OUTSIDE_OPERATING_HOURS`, `ITEM_UNAVAILABLE`,
  `INSUFFICIENT_STOCK` — each with its own message, matching the
  original spec's own copy pattern ("Some items changed availability.
  {item} is no longer available... [ Review Cart ]") rather than the
  one generic error message the mock's `FAIL_TEST` trigger ever
  produced.

## 6. Worker actions (audit point 3)

`GET /api/worker/orders` includes each order's internal `id`.
`CashierDashboard` and `FoodServiceDashboard` use `order.id` for
confirm-payment and complete calls — never a token, which shouldn't be
present in this response at all, reinforcing that a customer's access
token stays strictly customer-side.

## 7. Admin routes (audit point 6)

Replace the monolithic mock functions (`saveMenuItem`,
`updateMenuSchedule`, `addMenuOverride`, and the rest) with a 1:1
mapping to the real endpoints built across Prompts 2, 5, and 6 — that
endpoint list is the reference, not restated here.

## 8. Reconnect existing error-state UI

This is a review pass, not a rebuild: every error state already built
across the frontend prompts should now correctly display real backend
messages instead of assuming the mock's narrower, simplified error
paths were representative.

## 9. Verify polling against real rate limits

The order-tracking page's poll interval (a few seconds) and the worker
dashboards' (5-10s) were both reasonable guesses against a mock with no
real limits. Confirm the order-tracking interval stays under §10's
30/minute limit on token-based lookups (a 3-second interval is 20/min,
comfortably under). Worker/admin endpoints weren't given specific rate
limits in Part 2, being authenticated staff tooling rather than
anonymous public surfaces — no change needed there.

## Verify before moving on

- Grep the codebase: zero dev-only simulate buttons remain, zero
  `localStorage` keys for order/menu/worker data remain (theme
  preference is the one legitimate survivor).
- Full login flow against the real backend: login, `GET /me` confirms
  the session, `mustChangePassword: true` correctly triggers the
  forced flow before anything else is reachable.
- Disable a worker while they're actively logged in through the real
  frontend (not a manual database edit) — their next action correctly
  fails and reflects as logged-out.
- Re-run the schedule-plus-override correctness test (Backend Prompt 2's
  core test) through the real customer-facing Menu page this time, not
  the mock or a raw API call — confirm the UI reflects the exact same
  effective-state behavior end to end.
- Checkout surfaces `OUTSIDE_OPERATING_HOURS`, `ITEM_UNAVAILABLE`, and
  `INSUFFICIENT_STOCK` with distinct, correct messaging for each —
  trigger all three deliberately.
- Inspect network requests directly to confirm Cashier/Food-Service
  actions send `id`, never a token.
- Temporarily strip the CSRF header from a mutating request (a browser
  devtools override is enough) and confirm the backend actually
  rejects it — proving the wiring is enforced, not just present.
- Spot-check several admin pages (menu edit, schedule grid, worker
  creation, settings) against their real endpoints — full coverage of
  every admin route isn't necessary here, but enough to confirm the
  1:1 mapping pattern is actually followed throughout, not just in a
  few places.
- **The full end-to-end flow, for real this time:** place a UPI order
  as a customer in one browser tab, confirm it via a real cashier login
  in another, mark it picked up via a real food-service login in a
  third, watch the customer's tab update through polling without a
  manual refresh, download the receipt, and confirm it all shows up
  correctly in Admin's Dashboard, Orders, Transactions, Analytics, and
  Daily Closing. This is the identical flow frontend Prompt 10 already
  verified against the mock — now prove it against the real backend,
  start to finish.
