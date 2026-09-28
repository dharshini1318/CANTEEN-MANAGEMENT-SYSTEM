# CampusBite — Prompt 7: Admin Login, Dashboard, Orders & Transactions

Builds on Prompts 1-6 — theme tokens, the `elevated` Card variant from
Prompt 1 (unused until now), the mock order service layer, and the
worker login/route-protection pattern from Prompt 6, reused here for the
single admin account. This prompt covers admin login, the dashboard
overview, and the Orders/Transactions views. Menu/Inventory/Scheduling
is Prompt 8; Workers/Analytics/Daily Closing/Audit Logs/Settings is
Prompt 9.

## Design & architecture notes

- **The third visual register.** Admin is desktop-first, data-centric,
  and structured — closer to the customer side's restraint than the
  worker side's boldness, but its own thing. No Fraunces here either
  (stays functional, like Worker) — the distinction from Worker comes
  from layout and surface treatment, not typography: more breathing
  room, a persistent sidebar, and — deliberately, for the first time in
  this sequence — the `elevated` (glass) Card variant from Prompt 1,
  used specifically for dashboard stat cards. Restrained: subtle blur
  and translucency, not the excessive-blur, low-contrast pattern your
  own spec explicitly warns against.
- **Live data where it's genuinely live, static where it genuinely
  isn't.** Sales, order counts, and transaction data come from the real
  mock order store built in Prompts 4-6 — this dashboard should reflect
  actual activity, not placeholder numbers. Inventory widgets (low
  stock, sold out) read Prompt 3's seed menu data as a snapshot — full
  reservation/decrement-on-order simulation is real backend logic and
  isn't being retrofitted into the frontend mock.
- **One more service-layer extension**, following the same pattern as
  Prompts 5 and 6: `confirmPayment(token)` now also records which
  worker confirmed the order (read from the logged-in worker's mock
  session). This is the third time this function has grown — expected,
  not a sign anything was under-designed; each new surface reveals a
  field the mock didn't need until now.
- Full sidebar navigation gets built now, even though most of its
  sections (Menu, Workers, Analytics, etc.) aren't built until Prompts
  8-9 — same "route exists, page comes later" pattern used everywhere
  else in this sequence.

## Deliverables

### 1. Admin login (`/admin/login`) and route protection

One seed admin account in `services/api.js` (clearly commented as
placeholder dev credentials): `admin` / `admin123`. Reuse the login
form pattern from Prompt 6's worker login rather than rebuilding it —
same shape, separate route, separate session check (role `ADMIN`
specifically). No sign-up link or registration path anywhere near
this — per your own spec, there's exactly one admin account and it's
never created through the UI.

`ProtectedAdminRoute`, same logic as `ProtectedWorkerRoute`: no session
→ redirect to `/admin/login`; session persists across refresh; logout
clears it.

### 2. AdminLayout shell

A persistent sidebar (desktop) listing all admin sections — Dashboard,
Orders, Transactions (built now); Menu, Categories, Inventory,
Schedules, Specials, Workers, Analytics, Daily Closing, Audit Logs,
Settings (routes exist, pages come in Prompts 8-9). Active section
highlighted. On narrower viewports the sidebar collapses to a
drawer/hamburger pattern rather than breaking the layout — use the
21st.dev Magic MCP (`/ui`) to source this specifically, an admin
sidebar with responsive collapse is exactly the kind of pattern worth
not hand-building from scratch. Recolor to the project's tokens once
pulled in.

### 3. Seed some history

On first load, if the mock order store is empty, seed 15-20 historical
mock orders dated across the past 6 days (varied methods, amounts, and
outcomes — mostly `PAID`/`COMPLETED`, a couple `EXPIRED`) directly into
the `localStorage` store — otherwise the dashboard and its chart are
empty until someone manually places 20 orders first. Only seed when the
store is genuinely empty; never overwrite real testing data on
subsequent visits.

### 4. Dashboard overview (`/admin/dashboard`)

Stat cards (the `elevated` Card variant), computed from `getAllOrders()`
filtered to today's business date (`Asia/Kolkata`, matching the
architecture doc):
- Today's Sales, Today's Orders, Average Order Value
- UPI Sales, Cash Sales (split by method)
- Active Orders (count of `AWAITING_CONFIRMATION` + `PREPARING`)

A small bar chart (Recharts) of the last 7 days' sales — the one chart
in this prompt; the fuller analytics suite is Prompt 9.

From Prompt 3's seed menu data (snapshot, not live):
- Low Stock — quantity-tracked items with `remaining` ≤ 8
- Sold Out — items with `is_available: false`
- Today's Special — items with `is_special: true`

Live Orders — a compact list of the 5 most recent
`AWAITING_CONFIRMATION`/`PREPARING` orders, read-only here (taking
action on them is the worker dashboards' job, not admin's — admin's
view is oversight, not operations).

### 5. Orders (`/admin/orders`)

Extends the order-list pattern from Prompt 6's cashier dashboard —
reuse it, don't rebuild it — with broader scope (every order, not just
actionable ones) and more filters: date range, payment method, payment
status, order status, plus the existing Order ID / customer name
search. No action buttons here (see note above); clicking a row opens a
detail view instead:

- Full item list with price snapshots
- A simple timeline derived from the order's existing timestamps
  (`createdAt`, `paidAt`, `expiredAt`/`cancelledAt`, `completedAt`) —
  "Created at X → Paid at Y → Completed at Z" — this satisfies your
  spec's "review status history" using data the mock already has,
  without needing a separate history log.
- A "View Receipt" link to `/receipt/:token` for any paid order.

### 6. Transactions (`/admin/transactions`)

Same underlying order data as Orders, viewed through a financial lens
rather than an operational one: payment method, amount, status, the
confirming worker's username (from the extension in the notes above),
and timestamp. Filterable by method and status; searchable by Order ID.

## Verify before moving on

- Admin login works with the seed account and fails cleanly with wrong
  credentials; no registration path exists anywhere near it.
- `/admin/*` routes redirect to `/admin/login` when logged out, and
  persist the session across a refresh.
- On first load with an empty order store, 15-20 seeded historical
  orders appear, spread across the past 6 days with varied outcomes;
  reloading afterward doesn't re-seed or duplicate them.
- Dashboard stat cards reflect real activity: place and confirm an
  order through the actual customer/worker flows, then confirm Today's
  Sales/Orders/Active Orders update correctly.
- The 7-day sales chart renders with the seeded data and updates when a
  new order is added today.
- Low Stock and Sold Out widgets correctly reflect Prompt 3's seed menu
  data (not live order activity).
- Orders page: all filters (date range, payment method, payment status,
  order status) and search work correctly and can combine.
- Clicking an order shows the correct item snapshot and a sensible,
  correctly-ordered timeline.
- Transactions page correctly shows which worker confirmed each order
  (test with both seed worker accounts from Prompt 6, confirming
  different orders, and check both show up correctly here).
- Sidebar shows all sections; the ones not yet built don't error when
  clicked, and the active section is visually clear.
- Sidebar collapses correctly to a drawer on a narrower viewport.
- `elevated` Card variant is used only for the dashboard stat cards —
  restrained, not applied everywhere out of habit.
- Both themes correct; no purple/violet.
- Full keyboard pass through login, the sidebar, and the Orders filters.
- Checked at a desktop viewport first (this role's primary device),
  then confirm it degrades sensibly on a laptop-width and tablet-width
  screen.
