# CampusBite — Prompt 6: Worker Dashboard

Builds on Prompts 1-5 — theme tokens, the mock order service layer
(`createOrder`, `getOrderByToken`, `confirmPayment`, `completeOrder`)
and its `localStorage`-backed store. This prompt covers worker login,
route protection, and the two worker dashboards — Cashier and
Food-Service. Admin (Prompt 7) is separate and comes next.

One scope note: the formal RBAC matrix and API contracts (the second
half of the architecture doc) haven't been written yet — the role
boundaries here follow directly from the original spec's cashier/
food-service capability lists, which are precise enough to build from.
Worth circling back to formalize once the frontend side is done.

## Design & architecture notes

- **This is the pivot the last four prompts were building toward.**
  Worker UI is dense, high-contrast, and fast — the opposite instinct
  from the customer side. No orb background, no Fraunces anywhere (IBM
  Plex Sans only, for everything). Less padding, tighter layout, more
  visible at once. Minimal transitions — button press feedback is still
  fine, but no staggered entrances, no reveal choreography. Speed and
  scannability beat polish here.
- **Color gets used boldly, not restrained** — the inverse of the
  customer side, deliberately. Customer UI held color back to keep
  browsing calm; this is a fast-triage tool, so status color should be
  immediate and obvious. Same token system, different intensity, because
  the goal of each surface is different — not an inconsistency.
- **One new token:** `--warning` (`#B15A1E` light / `#D68A4C` dark) for
  "needs attention now" status — orders `AWAITING_CONFIRMATION`. Distinct
  from `--accent` (turmeric), which stays reserved for Special badges
  only. Never rely on color alone for status — always pair it with the
  text label.
- **Status badges may use compact caps treatment** (`PAID`, `PREPARING`,
  etc.) — unlike the customer pages, this is a dense data-scanning tool,
  and small-caps status labels are a functional dashboard convention,
  not decorative chrome. Everything else — buttons, headings, nav — stays
  sentence case.
- Order IDs and pickup codes use `IBM Plex Mono` (same as the receipt),
  for the same reason: these are values people scan and match, not read
  as prose.

## Deliverables

### 1. Mock accounts and login (`/worker/login`)

Two hardcoded mock accounts in `services/api.js` (clearly commented as
placeholder dev credentials, not real security):
- `cashier1` / `cashier123` → role `CASHIER`
- `foodservice1` / `foodservice123` → role `FOOD_SERVICE`

A plain, fast login form — username, password, error state for wrong
credentials. On success, store a mock session (`{ username, role }`) in
`localStorage` and redirect to the matching dashboard.

### 2. Route protection

A `ProtectedWorkerRoute` wrapper: no session → redirect to
`/worker/login`. Valid session but wrong role for the route (e.g., a
`FOOD_SERVICE` account hitting the cashier URL) → redirect to that
account's own dashboard, not a raw error. Session persists across a
refresh. A logout action clears it and returns to `/worker/login`.

A minimal `WorkerLayout` shell: small CampusBite wordmark (plain text,
not the hero treatment), logged-in name and role, logout button.

### 3. Service layer additions

- `getAllOrders()` — returns everything in the mock order store.
  Dashboards filter/search this client-side, the same pattern as the
  menu search in Prompt 3 — no need for query-parameter mock plumbing at
  this scale.
- Both dashboards poll `getAllOrders()` on an interval (5-10s) so an
  order placed from the customer side while a worker screen is open
  shows up without a manual refresh — implements the short-polling
  approach the architecture doc already settled on, not WebSockets.

### 4. Cashier dashboard (`/worker/cashier`)

Dense list of all orders. Each row: Order ID (mono), customer name,
item count (expandable for the full list, not inline by default),
total, payment method, status badge, time (absolute — "12:41 PM", not
relative; useful across a whole shift), pickup code.

- Filters: **All, Awaiting Confirmation, Preparing, Completed,
  Expired.** ("Awaiting Confirmation" replaces "Cash Pending" from your
  original spec's wording — UPI orders sit in that same state now too,
  so a cash-specific name would be misleading.)
- Search: Order ID and customer name, live filter.
- For any `AWAITING_CONFIRMATION` order: a large, unmistakable button —
  **"Cash Received"** for cash orders, **"UPI Received"** for UPI ones —
  calling the existing `confirmPayment(token)`. On tap, it disables and
  updates immediately (optimistic), so a double-tap can't fire twice; a
  second attempt on an already-confirmed order should just no-op rather
  than error, mirroring the backend's idempotent design even though this
  mock can't fully simulate two concurrent cashiers.

### 5. Food-service dashboard (`/worker/food-service`)

Narrower by design — per your own spec, only orders where payment is
already confirmed. Never show `AWAITING_CONFIRMATION` orders here at
all; there's nothing for this role to do with them.

Default view: `PREPARING` orders — the active queue. Each row shows the
full item list with quantities (not summarized — this role needs to
know exactly what to make), customer name, Order ID, pickup code.

- One action per row: **"Mark as picked up,"** calling the existing
  `completeOrder(token)`.
- A small toggle/filter can reveal recently-completed orders for
  reference, but the default view stays focused on active work — no
  analytics, no extra chrome, per your own spec's instruction to avoid
  unnecessary analytics here.

## Verify before moving on

- Login succeeds with both seed accounts and fails cleanly with wrong
  credentials.
- Visiting `/worker/cashier` or `/worker/food-service` logged out
  redirects to login; visiting the wrong role's URL while logged in
  redirects to your own dashboard, not an error page.
- Session and logout both work correctly across a refresh.
- Place a real order through the actual customer flow (Prompts 3-4, not
  the dev-simulate buttons) — confirm it appears on the cashier
  dashboard within one poll interval, without a manual refresh.
- "Cash Received" / "UPI Received" shows the right label for the right
  method, confirms correctly, and immediately disables — tapping again
  doesn't double-fire. Check the same order's `/order/:token` page in
  another tab afterward: it should now show Payment Confirmed and
  Preparing.
- Food-service dashboard never shows an unpaid order, even if you
  refresh right after placing one.
- "Mark as picked up" works, and the same order shows Completed on the
  customer's tracking page in another tab.
- Filters and search both work correctly on the cashier dashboard.
- Visually distinct from every customer-facing page: no orb, no
  Fraunces, denser spacing, bolder status color.
- `--warning` only appears on `AWAITING_CONFIRMATION` status — never
  colliding with `--accent` anywhere on this page (there's nothing
  "Special" here to begin with).
- Both themes correct; no purple/violet.
- Full keyboard pass through login, both dashboards' filters/search, and
  the confirm/complete actions.
- Checked at a tablet-width viewport first (this role's primary device),
  then phone width.
