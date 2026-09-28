# CampusBite — Prompt 9: Workers, Analytics, Daily Closing, Audit Logs & Settings

Builds on Prompts 1-8 — the AdminLayout sidebar, admin table/stat-card
patterns from Prompt 7, and the mutable-store pattern from Prompt 8.
This is the last admin prompt; Prompt 10 is the cross-cutting QA pass
over the whole project.

## Design & architecture notes

- **Worker accounts become a real, mutable store**, same upgrade Prompt
  8 gave menu data — seeded with the two accounts from Prompt 6
  (`cashier1`, `foodservice1`), extendable here. Workers created,
  disabled, or role-changed on this page actually affect what
  `/worker/login` accepts.
- **Operating-hours enforcement, closing a real gap.** Nothing built so
  far actually checks cafeteria hours on the customer side, even though
  your spec is explicit that outside configured hours customers should
  see "Cafeteria Closed" and new orders should be rejected. This prompt
  adds a small `isWithinOperatingHours()` check, read from Settings,
  that the Menu and Checkout pages consult — not a large feature, just
  wiring an already-designed rule in for the first time.
- **Audit logging is scoped deliberately, not exhaustively.** Introduce
  `logAuditEvent()` and a mock log store, and wire it into a meaningful
  subset: cash/UPI confirmation (one more extension to
  `confirmPayment()` — the last one in this sequence), worker
  create/disable/role-change, and daily closing plus corrections. Full
  coverage of every mutating action in the app is real backend work and
  isn't being forced into this mock — your own spec explicitly says the
  event list should follow actual risk, not log every trivial action.
- **One more small loop closed:** Prompt 4's hardcoded UPI VPA
  (`campusbite@upi`) now reads from Settings instead, as flagged back
  when it was first introduced.
- Continues Admin's established register — functional typography,
  `elevated` Card reserved for stat cards, dense tables for lists.

## Deliverables

### 1. Workers (`/admin/workers`)

Table: username, role, status (active/disabled), last login. Actions:
create (username, role, initial password — mark the new account
`mustChangePassword: true`, matching the architecture doc's field, even
though a forced-change flow isn't being built in this mock), disable,
re-enable, change role, reset password (generates a new temporary
password, shown once). Every one of these actions logs an audit event.

### 2. Analytics (`/admin/analytics`)

Time range selector: Today / Week / Month / Custom (a plain date range
for Custom — optionally source an accessible date-range picker via the
21st.dev Magic MCP for just this control, not required otherwise here).

- Summary stat row, reusing Prompt 7's stat-card pattern: Revenue,
  Total Orders, Average Order Value, UPI Revenue, Cash Revenue — all
  computed from `getAllOrders()` filtered to the selected range.
- Orders-per-hour bar chart (Recharts), showing demand distribution
  across the selected range.
- Order outcomes: Completed / Cancelled / Expired counts, as a compact
  breakdown. Note: "Failed" payment isn't a reachable state in this
  system — there's no gateway that could report a failed attempt, so
  don't fabricate a bucket for it.
- Products table: name, quantity sold, revenue, and remaining stock
  where quantity-tracked — sortable by quantity or revenue, which
  covers "most sold" and "least sold" through sorting rather than
  needing two separate lists.

### 3. Daily Closing (`/admin/daily-closing`)

Summary for today's business date (`Asia/Kolkata`): total orders, UPI
total, cash total, total sales, cash order count, UPI order count,
expired order count — same computation as the dashboard stats, scoped
to today specifically.

- **"Close Day"** button creates a closing record (business date,
  totals, closed-by, closed-at) in its own store, keyed by business
  date — the same "row existence means closed" pattern from the
  architecture doc's schema. Logs an audit event.
- Once today is closed: the summary becomes read-only, the button
  disables, and a small "Add correction" form appears (description,
  amount adjustment, reason) for anything that needs fixing afterward —
  creates a correction record linked to the closing, never edits the
  original totals. Logs an audit event.
- A simple closing history list below — past closed days with their
  totals. (When seeding Prompt 7's historical mock orders, also create
  matching closed daily-closing records for each of those past dates,
  so this history isn't empty on first load.)

### 4. Audit Logs (`/admin/audit-logs`)

Dense table: actor, action, entity, timestamp, with before/after
values shown where the event has them (a price change, a role change).
Filterable by action type and date. This will only be as populated as
the scoped set of events wired in above — that's expected, not a gap
to fill further in this prompt.

### 5. Settings (`/admin/settings`)

- Cafeteria name (text).
- Operating hours: a 7-day table, open/close time per day or a
  "Closed" toggle (matching your spec's own example — Sunday closed,
  the rest with set hours).
- UPI VPA (text) — the value Prompt 4's QR code now reads instead of
  its hardcoded placeholder.

Enforcement: add `isWithinOperatingHours()`, checking the current time
(`Asia/Kolkata`) against the configured hours. Outside them, the
customer Menu page shows "Cafeteria Closed / Next opening: {day}
{time}" instead of the menu, and Checkout is blocked with the same
messaging if reached directly — matching your spec's copy and its
explicit instruction that this is enforced beyond just disabling a
button in the UI.

## Verify before moving on

- Creating a worker here actually allows login with those exact
  credentials at `/worker/login`; disabling one blocks it immediately.
- Changing a worker's role changes which dashboard they land on after
  login.
- Analytics: switching time ranges recalculates every stat, the chart,
  and the products table correctly — spot-check Today against the
  Dashboard's own Today figures from Prompt 7, they should match
  exactly since they're computed the same way.
- Products table sorts correctly by both quantity and revenue.
- Closing today's business day works once, then the button disables and
  the summary goes read-only; adding a correction afterward doesn't
  alter the original totals, only adds a linked record.
- Closing history shows the seeded past days from Prompt 7 immediately
  on first load, without needing to manually close anything first.
- Audit log shows entries for: a cash/UPI confirmation, a worker being
  created or disabled, and closing the day — each with a sensible
  actor, action, and timestamp.
- Setting the UPI VPA here and then checking `/checkout` → the UPI
  payment view shows the QR now encodes the updated VPA, not the old
  hardcoded one.
- Set today's operating hours to a window that excludes the current
  time, confirm the customer Menu page shows "Cafeteria Closed" with
  the correct next-opening message, and that `/checkout` is blocked
  too — then restore hours that include now, confirm both work normally
  again.
- Both themes correct; no purple/violet.
- Full keyboard pass through Workers, Analytics' range selector, Daily
  Closing, and Settings.
- Checked at a desktop viewport first, then confirm sensible
  degradation at laptop and tablet widths.
