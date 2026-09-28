# CampusBite — Prompt 3: Menu & Cart

Builds directly on Prompts 1 and 2 — theme tokens, typography, the
Skeleton primitive, the Button/Card primitives, and the `/menu` route
stubbed by Prompt 2's CTA. This prompt covers the Menu page (`/menu`)
and Cart (`/cart`) — checkout comes in Prompt 4.

## Design notes

- No orb background here — the orb belongs to calm, spacious screens
  (landing). Menu and Cart are dense and functional; keep backgrounds
  plain so food photography and text stay the clear focus.
- Almost every animation on this page responds to something the person
  just did — adding to cart, opening the cart, removing an item — which
  is the kind of motion this project's approach actually encourages,
  unlike ambient reveals. Don't add scroll-reveal to individual menu
  cards as they load in; that's the generic "fade-slide-up on
  everything" pattern already flagged and avoided in Prompt 2. The
  skeleton-to-content swap is a plain, quick crossfade, not a staggered
  entrance.
- Sentence case throughout — category labels, badges, button text. No
  ALL CAPS anywhere on this page.

## Deliverables

### 1. Price formatting utility

Add `formatPrice(pricePaise)` to `utils/` — converts integer paise to a
displayed rupee string (e.g., `4500` → `"₹45"`). Every component that
shows a price on this page (and later, cart/checkout/receipt) uses this,
not ad hoc division or formatting inline.

### 2. Mock menu data

Add `getMenu()` and `getCategories()` to `services/api.js`, each
returning after an artificial ~500ms delay (so loading states are
actually visible to verify). Shape the response the way the real
`GET /api/menu` and `GET /api/menu/categories` endpoints will eventually
look, so swapping in the real calls later is a one-line change, not a
rewrite:

- Categories: All, Breakfast, Meals, Snacks, Drinks
- At least 10–12 items spread across those categories, drawn from your
  own spec's examples (Idli, Dosa, Vada, Samosa, Filter Coffee, Tea, a
  couple of meal items) rather than generic placeholder names
- Mix of `inventory_mode: 'QUANTITY_TRACKED'` (with a `remaining` count
  — include at least one item with remaining ≤ 8, to exercise the
  low-stock state) and `'AVAILABILITY_ONLY'`
- At least one item `is_available: false` (sold out) and at least one
  `is_special: true`

### 3. Category filter

A horizontally-scrollable row of category pills. Active pill uses
`--primary` fill; inactive pills are outlined/ghost. Selecting a
category filters the visible items. Proper button semantics with
`aria-pressed` reflecting the active state, not just a visual change.

### 4. Search

A search input above or alongside the category row. Filters items by
name live, as the person types — no debounce needed, this is filtering
data already in memory, not a network call. **When search has text, it
searches the full menu regardless of the selected category** (so
searching "dosa" works even if "Drinks" is selected) — category
filtering only applies when search is empty. A clear ("×") control
appears once there's text. Proper label (visible text or `aria-label`)
on the input.

### 5. Menu card

Row-oriented card (image left, ~35–40% width; content right), built from
Prompt 1's `Card` primitive (flat, no shadow) — stacks single-column on
mobile, can move to a two-column grid at wider viewports. Each card
shows:

- Image
- Name (IBM Plex Sans medium)
- One-line description, truncated
- Price via `formatPrice()`
- **Special badge**, only if `is_special` — small and quiet: a dot plus
  "Special" in `--accent`, not a ribbon or star icon, and not overused —
  it should mean something precisely because it's rare on the page.
- **Availability:**
  - Sold out (`is_available: false`, or `remaining: 0` for
    quantity-tracked): card dims slightly, the add-to-cart control is
    replaced with a plain "Sold out" label — no button, nothing to tap.
  - Low stock (quantity-tracked, `remaining` ≤ 8): a small, quiet
    "Only {n} left" note near the price — informational, not an
    urgency/countdown treatment.
- **Add-to-cart control:** starts as a compact "Add" button. On tap, it
  morphs (width-animates, ~200ms) into a quantity stepper (− / count /
  +) starting at 1, and the cart indicator (below) updates with a small
  confirming motion. This is the one piece of specific interaction
  choreography on this page — get it feeling genuinely satisfying, it's
  the moment people will tap most.

### 6. Cart state

A `CartContext` (React Context + `useReducer`, matching this project's
existing Context pattern) holding cart items (menu item id, name, unit
price in paise, quantity). Actions: add item, update quantity, remove
item, clear cart. Persist to `localStorage` on every change and
initialize from it on load, so a refresh doesn't wipe someone's cart —
this is a client-side convenience, not the backend cart authority the
spec describes; the backend still recalculates everything at order time.

### 7. Cart indicator

A floating bar or button, fixed near the bottom of the screen, appearing
only once the cart has at least one item (fades/slides in on that
transition, fades out if the cart empties). Shows item count and
subtotal via `formatPrice()`. Tapping it navigates to `/cart`.

### 8. Cart page/drawer (`/cart`)

Use the 21st.dev Magic MCP (`/ui`) to source this specifically — ask for
a shadcn Sheet-style slide-in panel. This is exactly the kind of
component worth pulling rather than hand-building: proper focus trap,
Escape-to-close, backdrop click, and correct ARIA (`role="dialog"`,
labelled) are easy to get subtly wrong from scratch. Recolor it to the
project's tokens once pulled in, the same way the orb background was
handled in Prompt 1.

Route it at `/cart` (a real, linkable route — not only reachable by
clicking through from the menu) so it also renders sensibly on a direct
load or refresh, just without the opening slide-in transition since
there's nothing to open from in that case.

Contents:
- List of cart items: name, unit price, an in-cart quantity stepper,
  line subtotal, a remove action. Removing an item fades and collapses
  its row rather than snapping away instantly.
- Overall subtotal via `formatPrice()`.
- Empty state: "Your cart's empty" with a way back to `/menu` — direct,
  not apologetic.
- "Proceed to Checkout" button, routing to `/checkout`. Fine that it
  isn't built yet (Prompt 4); the route should exist and not throw.

## Verify before moving on

- Search filters correctly and live; typing "dosa" finds it regardless
  of which category pill is active.
- Category pills filter correctly; active state is both visually clear
  and reflected in `aria-pressed`.
- Add-to-cart morph plays correctly, and the cart indicator appears and
  updates in step with it.
- Sold-out items show the dimmed treatment and a plain label, with no
  tappable control. Low-stock items show "Only {n} left" only when
  `remaining` is actually ≤ 8.
- Special badge only appears on the one seeded special item, using
  `--accent`.
- Cart drawer opens and closes correctly from the indicator; loading
  `/cart` directly (or refreshing on it) also renders correctly, without
  erroring over the missing "open" transition.
- Removing a cart item animates out rather than disappearing instantly;
  the subtotal updates correctly afterward.
- Cart contents survive a page refresh.
- Empty cart and empty search-results states both render correctly and
  match the direct, non-apologetic tone established in Prompt 2.
- Skeleton loading is card-shaped (image block + text lines + price
  line) and actually visible given the artificial delay, not a generic
  gray rectangle.
- Keyboard-only pass: tab through category pills, search, an
  add-to-cart control end to end, and the open cart drawer — focus
  should be trapped inside the drawer while it's open and return to its
  trigger on close.
- Both themes correct; no purple/violet; no ALL CAPS or eyebrow-label
  chrome anywhere on the page.
- `prefers-reduced-motion: reduce` — the add-to-cart morph, cart
  indicator transition, drawer open/close, and item-removal collapse
  should all resolve instantly rather than animating.
- Checked at an actual mobile viewport width first, then wider.