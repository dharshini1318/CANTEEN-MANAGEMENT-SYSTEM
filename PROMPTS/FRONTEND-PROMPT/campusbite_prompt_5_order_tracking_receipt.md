# CampusBite — Prompt 5: Order Tracking & Receipt

Builds directly on Prompt 4 — the mock order service layer, the
payment-waiting view at `/order/:token`, and the dev-only simulation
pattern. This prompt replaces Prompt 4's placeholder "payment confirmed"
message with the real status stepper, adds the final PREPARING →
COMPLETED step, and builds the receipt at `/receipt/:token`.

## Design & architecture notes

- **PREPARING starts automatically.** Per the architecture, there's no
  separate worker "Start Preparing" action — the order moves to
  PREPARING the instant payment is confirmed. Extend Prompt 4's
  `confirmPayment()` to set `orderStatus: 'PREPARING'` at the same time
  it sets `paymentStatus: 'PAID'`, rather than treating these as two
  separate transitions.
- **The receipt is a receipt, not a card.** Per your own spec, this
  should look like an actual paper/thermal receipt — narrow, monospace,
  dashed dividers — not a glassmorphism panel with rounded corners. Use
  `IBM Plex Mono` (same family as the rest of the UI's sans, keeping one
  consistent type system) specifically for this page.
- **Two more scoped dependencies**, same justification as
  `qrcode.react` in Prompt 4: `html2canvas` (captures the receipt DOM
  node as an image) and `jsPDF` (wraps that into a downloadable PDF).
  There's no reasonable way to rasterize a DOM node or generate a PDF
  from scratch — used only for this export, nowhere else.
- Motion stays state-change-triggered: a step's icon animating from a
  dot to a checkmark when it completes, nothing ambient.

## Deliverables

### 1. Extend the mock service layer

- `confirmPayment(token)` (from Prompt 4): now also sets
  `orderStatus: 'PREPARING'` in the same update, not a separate call.
- `completeOrder(token)` (new): sets `orderStatus: 'COMPLETED'`.
- Both continue to persist to the same `localStorage`-backed order
  store from Prompt 4.

### 2. Status stepper (on `/order/:token`)

Replace Prompt 4's placeholder message with a vertical 4-step stepper,
reflecting `paymentStatus`/`orderStatus` — deliberately no 5th "Ready"
step and no preparation timer, matching your own spec exactly:

```
✓ Order Created
✓ Payment Confirmed
● Preparing
○ Completed
```

- Completed steps: checkmark. Current step: filled dot. Upcoming steps:
  hollow circle. The connecting line between steps fills in as each one
  completes.
- When a step actually completes (triggered by the dev-simulate
  controls below), animate that one transition — dot to checkmark,
  brief and satisfying — rather than a static instant swap.
- Semantic structure: an ordered list with `aria-current="step"` on the
  active one, not just a visual-only treatment.
- Once `paymentStatus === 'PAID'` (regardless of `orderStatus`), show a
  persistent "View Receipt" button routing to `/receipt/:token`. It
  doesn't wait for `COMPLETED` — the receipt exists as soon as payment
  is confirmed, per your own spec.

### 3. Dev-only "mark as picked up" control

Extend Prompt 4's dev-only control pattern: while `orderStatus` is
`PREPARING`, show one more clearly-dev-labeled button, "Simulate
marking as picked up," calling `completeOrder()`. Same styling
treatment (dashed border, muted, gated behind `import.meta.env.DEV`) as
the confirm/expire controls from Prompt 4.

### 4. Receipt page (`/receipt/:token`)

If the order isn't `PAID` yet, don't render a receipt — show "Your
receipt will be available once payment is confirmed" with a link back
to `/order/:token`.

Otherwise, render the receipt matching your spec's own layout closely:

```
CAMPUSBITE
CAMPUS CAFETERIA
--------------------------
Order ID: CB-7K42
Name: [customer name]
Date: [date]         Time: [time]
--------------------------
ITEM          QTY   AMT
[item rows, name / qty / amount via formatPrice()]
--------------------------
TOTAL              [total]
Payment: [UPI / Cash]
Status: ✓ PAID
--------------------------
PICKUP CODE
[pickup code, large]
--------------------------
Thank You!
```

- `IBM Plex Mono`, narrow max-width (roughly 320–380px, centered on the
  page, echoing an actual thermal-paper width), dashed divider lines,
  no color beyond the theme's foreground/background — this page
  intentionally sits outside the rest of the app's visual language.
- Format the date/time in `Asia/Kolkata`, matching the architecture
  doc's timezone decision — don't let this silently fall back to
  whatever timezone the browser happens to be in.
- Content should read sensibly for a screen reader in document order,
  not rely purely on visual column alignment to convey which number
  belongs to which item.

### 5. Download as PNG and PDF

Two buttons below the receipt, each with a clear accessible label (not
icon-only):
- **PNG:** `html2canvas` captures the receipt element, downloads as
  `CampusBite_{orderNumber}.png`.
- **PDF:** `jsPDF`, sized narrow (around 80mm width, height fit to
  content) — explicitly not A4, per your own spec — downloads as
  `CampusBite_{orderNumber}.pdf`.

Wrap both in proper error handling. If either export fails, show an
inline "Couldn't generate the download — try again" message — the
on-screen receipt and the order's paid status are completely unaffected
either way; a failed export is never a reason to touch order or payment
state.

## Verify before moving on

- Simulating cashier confirmation (from Prompt 4) now correctly sets
  both payment and order status together — stepper shows steps 1-2
  checked, step 3 active, immediately after.
- "View Receipt" appears as soon as payment is confirmed, not only
  after marking as picked up.
- "Simulate marking as picked up" transitions the stepper to all 4
  steps checked, and the connecting-line/checkmark animation plays once
  per transition, not on every re-render.
- Visiting `/receipt/:token` for an order that isn't paid yet shows the
  "not available yet" message, not a broken or empty receipt.
- Receipt content matches the order exactly — items, quantities, prices
  via `formatPrice()`, total, payment method, pickup code — for both a
  UPI-paid and a Cash-paid mock order.
- Date/time on the receipt is in Asia/Kolkata regardless of the testing
  machine's local timezone.
- PNG download produces a correct, legible image; PDF download produces
  a narrow, receipt-shaped PDF — open it and confirm it isn't rendering
  as a mostly-blank A4 page.
- Temporarily break the export (e.g., comment out the html2canvas call)
  to confirm the error message appears without affecting the order's
  displayed status.
- Both themes correct on both the tracking page and the receipt page.
- No purple/violet, no ALL CAPS/eyebrow-label chrome.
- `prefers-reduced-motion: reduce` — step transitions resolve instantly,
  no animation played.
- Full keyboard pass: stepper is announced sensibly by a screen reader,
  both download buttons are reachable and correctly labeled.
- Checked at an actual mobile viewport width first, then wider.
