# CampusBite — Prompt 8: Menu, Categories, Inventory, Schedules & Specials

Builds on Prompts 1-7 — theme tokens, the AdminLayout sidebar shell, and
`formatPrice()`. This prompt covers `/admin/categories`, `/admin/menu`,
and the per-item detail view at `/admin/menu/:id` (with Details,
Inventory, Schedule, and Overrides sections). Workers, Analytics, Daily
Closing, Audit Logs, and Settings are Prompt 9.

## Design & architecture notes

- **The menu data store gets upgraded.** Prompt 3's `getMenu()` and
  `getCategories()` were a static in-memory array. They become a real,
  mutable `localStorage`-backed store now (seeded once from the
  original static data, then read/written by everything from here on).
  This matters beyond this prompt: the customer-facing `/menu` page and
  this admin surface now read and write the *same* data, so admin's
  price changes, new items, and availability edits actually show up
  when you test both sides together.
- **Effective state, not raw flags.** The whole point of the
  schedule-plus-override model from the architecture doc is that
  customers see the *effective* state, computed from schedule and
  override together — never a raw `is_special`/`is_available` flag
  read directly. Update Prompt 3's customer menu to compute effective
  state via the exact formula below, rather than reading the raw
  fields. This is the one required change to already-shipped code in
  this prompt — everything else here is new.
- **Information architecture:** categories are their own flat CRUD list
  (simple, standalone). Menu items live in a list page plus a detail
  view per item; inventory, schedule, and overrides are all read and
  edited from tabs *inside* that one item's detail view, not as
  separate top-level pages — they're properties of one item, not
  independent resources, and presenting them that way keeps the
  override system comprehensible instead of requiring you to
  cross-reference several disconnected screens.
- Admin's established register continues: functional typography, `Card`
  flat by default, `elevated` reserved for dashboard stat cards from
  Prompt 7 — don't spread it here out of habit.

## Deliverables

### 1. Categories (`/admin/categories`)

Flat list: name, item count, up/down reorder controls (adjusting
`display_order` — plain buttons, not a drag-and-drop library; this
doesn't need that complexity), and a disable toggle. Create/rename via
a small inline form or modal. If disabling a category that still has
active items, show a plain warning first ("This category has {n} active
items — they'll no longer be filterable by category on the customer
menu, but will still appear under 'All'") rather than a silent action.

### 2. Menu item list (`/admin/menu`)

A table: image thumbnail, name, category, price, inventory mode, a
badge showing current *effective* availability/special state (computed
the same way the customer menu will show it), and a disable toggle.
Search by name, filter by category. "+ Add Item" opens the detail view
in create mode.

### 3. Menu item detail (`/admin/menu/:id`) — Details tab

- Name, description, price (entered in ₹, converted to `price_paise`
  internally — add a `parsePrice()` utility as the inverse of
  `formatPrice()`, completing that round-trip).
- Image: a small preset picker of placeholder food images (a handful of
  South-Indian-dish-appropriate stock photos is enough) plus a custom
  URL field for flexibility — no upload infrastructure; per your own
  spec, this only ever needs to store a URL/reference, not the image
  itself.
- Category (dropdown from the categories store).
- Inventory mode: `AVAILABILITY_ONLY` or `QUANTITY_TRACKED`. Choosing
  `QUANTITY_TRACKED` on a *new* item reveals an initial stock quantity
  field right here — creating the item also creates its corresponding
  inventory record in the same action, not as a separate step.
- `is_available` toggle — shown only for `AVAILABILITY_ONLY` items; for
  `QUANTITY_TRACKED` items this field isn't authoritative and shouldn't
  appear here at all (availability is derived from remaining stock).
- **"Disable item"** is a distinct, separately-labeled action from the
  availability toggle, with its own brief confirmation — this
  soft-deletes (`is_active: false`) and is for retiring an item for
  good, not for day-to-day unavailability. Conflating the two is
  exactly the mistake your own spec calls out explicitly.

### 4. Inventory tab

Visible only for `QUANTITY_TRACKED` items. Shows remaining / reserved /
sold as clear numbers, an "Adjust Stock" action (a signed quantity plus
a required reason — matches the architecture's ledger, which requires a
reason for manual adjustments), and the activity log below it: a dense
table of ledger entries (type, quantity change, reason, timestamp),
newest first.

### 5. Schedule tab

A 7-column grid (Monday through Sunday), two toggles per day —
Available and Special. No row in the underlying `menu_schedules` table
means the default (available, not special); toggling a day back to
exactly that default should remove its row rather than storing a
redundant explicit-default one, keeping the "no row = default" pattern
from the architecture doc honest.

### 6. Overrides tab

Show today's effective state plainly first ("Effective today:
Special", or whichever it resolves to), then the layers that produce
it — what the schedule says for today's weekday, and whether an
override exists on top of it. One clear, contextual action rather than
a generic form:
- If today is scheduled Special and there's no override: **"Remove
  today's special."**
- If today isn't scheduled Special and there's no override: **"Make
  today's special."**
- If an override already exists for today: show what it does and offer
  **"Revert to schedule"** (deletes the override row).
- Same contextual pattern for the Availability dimension.
- Below that, a plain date-based form for scheduling a one-day override
  on a *different* date (planning a future day's special ahead of
  time) — this doesn't need to be as guided as the "today" case, a
  simple date picker plus type/value is fine. (Optionally source a
  proper accessible date picker via the 21st.dev Magic MCP for this one
  field if you want — genuinely fiddly to get right from scratch, not
  required otherwise in this prompt.)

## Verify before moving on

- Categories: create, rename, reorder, and disable all work; disabling
  a category with active items shows the warning first.
- Menu items: create (both inventory modes), edit, and disable all
  work — disabling never removes the item, just flags it inactive.
- Entering a price like ₹45 round-trips correctly through
  `parsePrice()`/`formatPrice()` everywhere it's displayed.
- Creating a `QUANTITY_TRACKED` item with an initial stock value
  creates a correctly-linked inventory record in the same action.
- Stock adjustment updates remaining correctly, requires a reason, and
  appears immediately in the activity log.
- Schedule grid: toggling a day creates/updates a schedule row;
  toggling back to the default removes it rather than leaving a
  redundant row behind.
- **The core correctness test:** schedule an item as Special on today's
  weekday. Confirm "Effective today: Special." Use "Remove today's
  special." Confirm it now shows "Effective today: Not special," with
  the schedule still showing Special underneath. Use "Revert to
  schedule." Confirm it's back to "Effective today: Special." This is
  your own spec's Dosa/Monday example, made real.
- The "make special" / "remove special" action offered matches whether
  today is actually scheduled special or not — never both options
  shown at once, never the wrong one.
- **The closed-loop test:** change a price, toggle an item unavailable,
  and add a new item here, then check the customer-facing `/menu` page
  (Prompt 3) in another tab — all three changes should be reflected
  there without needing a rebuild.
- The customer menu's special badge and sold-out state now reflect
  *effective* state (schedule + override), not a raw flag — confirm
  this by overriding an item's special status here and watching the
  customer menu update to match.
- Both themes correct; no purple/violet.
- Full keyboard pass through the category list, menu item form, and all
  four detail-view tabs.
- Checked at a desktop viewport first, then confirm it degrades
  sensibly at laptop and tablet widths.
