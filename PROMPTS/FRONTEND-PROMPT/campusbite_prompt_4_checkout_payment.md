# CampusBite — Prompt 4: Checkout & Payment

Builds directly on Prompts 1-3 — theme tokens, typography, motion
conventions, the Skeleton primitive, Button/Card/Input, `formatPrice()`,
and CartContext. This prompt covers the checkout form (`/checkout`) and
the payment-waiting view at `/order/:token`. It does NOT build the full
order-tracking stepper or the receipt — Prompt 5 extends this same
`/order/:token` page to add those once payment is confirmed. For now,
once the mock payment is confirmed, a single plain message is enough;
don't build the stepper here.

## Design & architecture notes

- **Say what's actually happening.** There's no payment gateway in this
  project — both payment methods are confirmed by a cashier, not
  automated. UPI here means: the customer scans a QR and pays with their
  own UPI app, then waits for a cashier to see it and confirm — not
  instant automated verification. The copy below reflects that; don't
  drift toward language that implies otherwise ("Payment successful!"
  the moment the QR renders, for instance, would be actively wrong).
- **Cash and UPI share one mechanism.** Per the architecture, both are
  the same `AWAITING_CONFIRMATION` state with a `method` flag, same
  15-minute expiry, same cashier-confirms action. Build one shared
  "waiting for confirmation" shell and swap only the top portion (QR +
  scan instructions vs. plain pay-at-counter instructions) — don't build
  two parallel, diverging views.
- **New dependency:** `qrcode.react`, used only to render the UPI QR
  code. There's no reasonable way to generate a real scannable QR
  without a library; this is a narrow, single-purpose addition, not a
  general dependency creep.
- Motion here stays functional and action-triggered, consistent with
  Prompt 3 — nothing ambient or decorative on this page.

## Deliverables

### 1. Checkout form (`/checkout`)

- Read-only order summary from `CartContext` (items, quantities, prices
  via `formatPrice()`, subtotal) with an "Edit cart" link back to
  `/cart`. If the cart is empty when this page loads, show that plainly
  with a link to `/menu` instead of rendering an empty form.
- Customer name — text input, required. Validate on blur and on submit
  attempt (not on every keystroke): non-empty after trimming, reasonable
  max length (matches the backend's 100-character limit).
- Payment method — two options, UPI and Cash at Counter, presented as
  selectable cards (reuse Prompt 1's `Card`/`Button` primitives directly
  — this doesn't need Magic, it's simple enough to hand-build). No
  default selection; the person has to actively choose. Proper
  `role="radiogroup"` / `role="radio"` semantics, keyboard-operable.
  Brief, honest descriptions under each:
  - UPI: "Scan and pay with any UPI app, then a cashier confirms it."
  - Cash: "Pay in cash at the counter when you collect your order."
- "Place Order" button — disabled until both name and a method are
  provided.
- Error state: if order creation fails, show it inline ("Something went
  wrong placing your order — try again.") without clearing the name or
  selected method. To make this actually testable without relying on
  random chance, give `createOrder()` a deterministic failure trigger for
  development (e.g., entering the name `FAIL_TEST` forces the error
  path) — clearly commented as a testing aid, not real validation logic.

### 2. Order creation (mock service layer)

Add to `services/api.js`, matching the real backend's eventual shape so
swapping in actual calls later is a one-line change:

- `createOrder({ customerName, paymentMethod, items })` — generates a
  token, a public order number (`CB-XXXX` style), and a 4-digit pickup
  code; computes subtotal/total from the item prices already in paise;
  sets `paymentStatus: 'AWAITING_CONFIRMATION'`, `createdAt: now`,
  `expiresAt: now + 15 minutes` (an absolute ISO timestamp, not a
  countdown value — this matters, see below). Persist the created order
  to `localStorage` (namespaced, e.g. `campusbite_orders`, keyed by
  token) so it survives a refresh. ~700ms artificial delay. On clearing
  the cart after a successful call, navigate to `/order/:token`.
- `getOrderByToken(token)` — reads from that same store. Returns `null`
  for an unknown token; the page should show "We couldn't find that
  order" with a link to `/menu`, not an ugly error, if this happens.
- `confirmPayment(token)` / `expireOrder(token)` — update the stored
  order's status to `PAID` / `EXPIRED` respectively. These exist as real
  service functions (not just local component state) specifically
  because they're the seam that gets replaced with real API calls later.

### 3. Payment-waiting view (`/order/:token`)

Shown while `paymentStatus === 'AWAITING_CONFIRMATION'`:

- Order number, prominently.
- Method-specific content:
  - **UPI:** a real QR code (via `qrcode.react`) encoding a UPI payment
    URI with a placeholder VPA and the correct amount (e.g.,
    `upi://pay?pa=campusbite@upi&pn=CampusBite&am=125&tn=CB-7K42`) —
    swap the VPA for a real one once that's configured. Instruction text
    below it: "Scan to pay {amount} via any UPI app, then wait a
    moment — a cashier will confirm your payment."
  - **Cash:** "Please pay {amount} at the counter within 15 minutes."
- Shared below both: Order ID and Pickup Code, both large and clear —
  these matter for the physical handoff regardless of how someone paid.
- Countdown, "Expires in 14:32" style, recomputed from
  `expiresAt - now` — recalculating from the stored timestamp (not
  decrementing a local counter) means it's correct even after a refresh.
  Clear the interval on unmount.
- When `paymentStatus === 'PAID'`: replace the above with a single
  plain message — "Payment confirmed — your order is being prepared."
  (Prompt 5 replaces this with the real stepper.)
- When `paymentStatus === 'EXPIRED'`: "This order has expired. Reserved
  items have been released — you're welcome to place a new order,"
  with a button to `/menu`. No way to pay an expired order from here.

### 4. Dev-only simulation controls

On the waiting view, while `AWAITING_CONFIRMATION`, show two clearly
non-production-looking controls (dashed border, muted styling,
explicitly labeled "dev only") gated behind `import.meta.env.DEV`:
"Simulate cashier confirmation" (calls `confirmPayment`) and "Simulate
expiration" (calls `expireOrder`). These are the only way to exercise
the paid/expired states before a real backend and cashier exist — make
sure they're impossible to mistake for real UI.

## Verify before moving on

- Name validation fires correctly on blur/submit, not on every
  keystroke; payment method is required with no default; Place Order
  stays disabled until both are set.
- Reaching `/checkout` with an empty cart shows the empty state, not a
  blank form.
- Happy path: placing an order clears the cart, generates a realistic
  order number/token/pickup code, and lands on `/order/:token` in the
  `AWAITING_CONFIRMATION` view.
- Entering `FAIL_TEST` as the name triggers the error state without
  losing the selected payment method.
- UPI view renders an actual scannable QR (test it with a phone camera
  if you can) with the correct amount encoded.
- Cash view shows the correct amount, order ID, and pickup code.
- Countdown counts down correctly and still shows the correct remaining
  time after a full page refresh.
- "Simulate cashier confirmation" transitions to the confirmed message;
  "Simulate expiration" transitions to the expired message with no way
  to pay from that state.
- Visiting `/order/:token` with a made-up token shows "We couldn't find
  that order," not a crash or a blank page.
- Reloading `/order/:token` after the order was created still finds it
  (localStorage persistence working).
- Both themes correct; no purple/violet; no ALL CAPS or eyebrow-label
  chrome.
- `prefers-reduced-motion: reduce` respected for whatever transitions
  are used here.
- Full keyboard pass through the form, the payment-method radio group,
  and the dev controls.
- Checked at an actual mobile viewport width first.
