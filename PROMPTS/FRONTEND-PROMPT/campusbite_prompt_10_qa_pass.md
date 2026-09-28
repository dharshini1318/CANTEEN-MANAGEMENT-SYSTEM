# CampusBite — Prompt 10: Cross-Cutting QA Pass

This prompt is verification and gap-fixing across everything built in
Prompts 1-9, not new features — with one exception: tracing through the
whole system surfaced a handful of genuine functional gaps, not just
things worth double-checking. Part A fixes those. Parts B-D verify
everything else.

Scope honesty up front: some of your spec's edge cases (two cashiers
confirming simultaneously, a payment provider going down, a database
failure mid-transaction) need a real backend to test meaningfully at
all — a single-browser, localStorage-backed mock can't simulate genuine
concurrency. Those stay explicitly out of scope here; they're real
backend work, covered in the notes at the end.

## Part A — Fix these identified gaps

### A1. Customer order-tracking polling (the important one)

`/order/:token` was never specified to poll for its own updates. As
built, a cashier confirming payment or food-service marking an order
picked up — both from a different tab or device — wouldn't show up for
the customer without a manual refresh. Add polling here, matching your
own spec's guidance exactly: poll `getOrderByToken()` every few seconds
while the order is in an active state, and stop polling once it reaches
`COMPLETED`, `EXPIRED`, or `CANCELLED`.

### A2. Customer cancellation

Never built. Per your spec, a customer should be able to cancel before
payment. Add a "Cancel order" action on `/order/:token`, visible only
while `AWAITING_CONFIRMATION`, calling a new `cancelOrder(token)` that
sets status to `CANCELLED`. Not available once paid — the button
shouldn't exist at all past that point, not just be disabled.

### A3. Re-validate at order creation, not just at add-to-cart

`createOrder()` (Prompt 4) was built trusting whatever the cart already
had — reasonable when menu data was static, no longer correct now that
Prompt 8 made it genuinely mutable. Cart items can keep showing the
price captured when they were added, for UX continuity — but
`createOrder()` should re-fetch each item's *current* price and
availability at the moment of creation, the same "backend recalculates,
never trusts stale client data" principle your spec applies everywhere
else. If something changed: don't silently adjust the order — reject it
and surface your spec's own checkout-error copy ("Some items changed
availability. {item} is no longer available in the requested quantity.
[ Review Cart ]").

### A4. Daily closing vs. a late confirmation

Extend `confirmPayment()` once more (last time): if today's business
date already has a closing record when a confirmation comes in, don't
silently fold it into that closed day's totals — create a
`daily_closing_corrections` entry against it instead, the same
mechanism Prompt 9 already built for manual corrections.

### A5. Worker session re-validation

Currently, disabling a worker (Prompt 9) only blocks their *next
login* — an already-open session in another tab keeps working. Add a
check (on route access, not just at login) that the session's account
is still active; if not, sign them out and redirect to
`/worker/login`.

## Part B — Design-system fidelity audit

Precise, checkable rules — search the codebase for violations rather
than eyeballing it:

- No purple, violet, or magenta anywhere, including inside anything
  sourced from 21st.dev Magic.
- `Fraunces` appears *only* on the Landing page hero — every other
  heading in the app, customer pages included, should be `IBM Plex
  Sans`. Audit Menu, Cart, Checkout, and Order Tracking specifically;
  they were never explicitly told to avoid it, so confirm they didn't
  pick it up by default.
- `IBM Plex Mono` appears only where explicitly specified: the receipt,
  and Order IDs/pickup codes in the worker and admin views.
- No `box-shadow` on any `Card` outside the sanctioned `elevated`
  variant (Prompt 7's dashboard stat cards only).
- The orb background renders only on the Landing page — nowhere else.
- `--accent` (turmeric) is used only for Special badges. `--warning`
  is used only for `AWAITING_CONFIRMATION`-adjacent status. Neither
  bleeds into general decoration.
- ALL CAPS text appears only in worker/admin status badges — nowhere
  on the customer-facing pages, and nowhere as a decorative label
  anywhere.

## Part C — Full end-to-end flow verification

Walk through each of these completely, using the real UI — not the
dev-simulate shortcuts, except where noted:

1. **UPI happy path, start to finish:** place an order as a customer
   with UPI → in a separate tab, log in as `cashier1` and confirm it
   ("UPI Received") → back in the customer tab, confirm the status
   updates *without a manual refresh* (this is A1 actually working) →
   in a third tab, log in as `foodservice1`, mark it picked up → customer
   tab shows Completed → download both the PNG and PDF receipt → check
   Admin: Dashboard, Orders (with correct timeline), Transactions (correct
   method and confirming worker), Analytics (Today range), and Daily
   Closing all reflect it correctly.
2. **Cash happy path:** same shape, through "Cash Received" instead.
3. **Expiry path:** place an order, let it expire (the dev-simulate
   button from Prompt 4 is fine here, for speed) — confirm the customer
   sees Expired, it shows under the cashier's Expired filter and *not*
   Awaiting Confirmation, and there's no way to confirm it after the
   fact from either side.
4. **Admin edit propagation:** change a menu item's price in Prompt 8's
   admin. Confirm the customer menu shows the new price. Add that item
   to a cart *before* changing the price again — confirm the cart still
   shows what it originally captured, but placing the order uses the
   *current* price (A3), not the stale cart value.

## Part D — Accessibility & responsive sweep

- Heading hierarchy is correct on every page (no skipped levels), with
  appropriate landmark regions (nav/main/header).
- One full keyboard-only run through each of the three flows in Part C
  — not just individual components in isolation.
- `prefers-reduced-motion: reduce` re-confirmed globally: orb, hero
  entrance, scroll-reveal, add-to-cart morph, cart drawer, stepper
  transitions, everything — all resolve instantly with it on.
- Every page checked at three widths: 375px, 768px, and 1440px. Admin
  and Worker are allowed to be denser at 1440px; nothing should
  overlap, clip, or require horizontal scrolling at any of the three on
  any page.
- Both themes checked across all three flows in Part C, not just
  individual pages in isolation.

## What this prompt does not cover

Real concurrency (two cashiers, simultaneous webhooks), a live payment
gateway, and actual per-token access control (right now, anyone with
browser access to this machine's localStorage can technically read any
order — there's no real backend enforcing that a token only unlocks its
own order, since there's no real backend at all yet) all need the
actual FastAPI implementation to test or to be true in any meaningful
sense. That, plus the RBAC matrix and exact API contracts that were
deferred back when this sequence turned toward the frontend, is the
next real body of work once this pass is done.
