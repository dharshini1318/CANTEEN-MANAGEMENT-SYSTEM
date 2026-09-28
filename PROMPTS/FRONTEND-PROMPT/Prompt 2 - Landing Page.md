# CampusBite — Prompt 2: Landing Page

Builds directly on Prompt 1's foundation — theme tokens (use the corrected
palette from the patch note alongside this file, not Prompt 1's original
values), the AnimatedOrbBackground, the fade/scroll-reveal utilities, and
the Button/Card primitives. This prompt covers the landing page only
(`/` route) — nothing else.

## Design grounding

CampusBite is a specific thing: a South Indian college cafeteria, not a
generic "food app." Let that show rather than defaulting to generic
food-app or SaaS-template choices:

- **Typography:** a warm, slightly characterful display serif — Fraunces
  (Google Fonts, one weight, used sparingly) — for the hero wordmark and
  headline only. Everything else — body text, UI, buttons, labels — stays
  in IBM Plex Sans, chosen for actual legibility under time pressure, not
  personality. Two typefaces, clearly distinct roles, never blended.
- **Motion:** this page gets exactly two deliberate motion moments, not a
  scattering of fade-ins on everything. (1) The hero's one staggered
  entrance sequence, on load. (2) One scroll-reveal on the Today's Special
  section as a whole, when it enters the viewport. Nothing inside Today's
  Special reveals individually — the section arrives as one composed
  moment, not card-by-card. Resist the urge to add more animated entrances
  than this.
- **No eyebrow labels, no ALL CAPS, no decorative chrome.** "Today's
  Special" is a heading, not a tracked-out label sitting above some other
  heading. Sentence case throughout. No middot-joined meta text, no arrow
  glyphs appended to button labels.

## 1. Hero section

- Near-full-viewport height. `AnimatedOrbBackground` (from Prompt 1)
  active behind it.
- "CampusBite" wordmark in Fraunces, one confident weight — not bold-ed
  further, not mixed with the sans anywhere in the wordmark itself.
- Headline, also Fraunces: "Your Campus. Your Food."
- Subtext, IBM Plex Sans: "Fresh food. Simple ordering."
- CTA button (Prompt 1's primary Button): "Explore Now" — routes to
  `/menu` via React Router. It's fine that `/menu` isn't fully built yet
  (that's Prompt 3); the route should exist and not throw.
- Entrance: wordmark → headline → subtext → button, each fading and
  sliding up roughly 80–100ms after the previous one, once, on mount.
  Must not replay if the user scrolls down and back up to the top.

## 2. Today's Special section

- Sits below the hero. Wrapped in the `useInView` hook from Prompt 1; the
  whole section fades + slides up together the first time it enters the
  viewport — once, not on every scroll past it.
- Heading: "Today's Special" — plain, nothing decorative above it.
- Data: add `getTodaysSpecial()` to `services/api.js`. For now, return
  mock data after an artificial ~600ms delay (so the loading state is
  actually visible to verify, not skipped past) — 2–3 items in the spirit
  of your own spec's own examples (Masala Dosa, Filter Coffee, Samosa work
  fine as placeholders). Shape the mock response the way a real
  `GET /api/menu?special=true` response would look (name, description,
  price, image), so wiring in the real backend later is a one-line swap
  inside this function, not a rewrite of anything that calls it.
- Each item shows name, a one-line description, and price. Skip the
  generic "identical rounded card + soft grey shadow" treatment — instead
  lay items out with generous whitespace and a thin top-edge accent in
  `--accent` (the turmeric tone), sitting flat rather than floating. No
  drop shadows here.
- Three states, using Prompt 1's `Skeleton` primitive for the first:
  **loading** (skeleton matching the real item layout), **populated**,
  and **empty** — "Nothing's marked as special today — the full menu's
  still open" (direct, not apologetic) if the array comes back empty.

## 3. Layout

- Single scrolling page, mobile-first — this is the customer-facing
  surface, so build for a phone screen first, then check wider.
- No other routes added in this prompt.

## Verify before moving on

- Both themes render correctly; the orb stays subtle enough not to
  compete with the hero text in either mode.
- Hero's entrance sequence fires once on load — scrolling back to the top
  afterward does not replay it.
- Today's Special's single reveal fires once, on first entering view, not
  again on subsequent scrolls past it.
- Skeleton is actually visible given the artificial delay — if it flashes
  by instantly, the delay got optimized away somewhere.
- Temporarily empty the mock array, confirm the empty state renders
  correctly and matches the interface's direct tone, then restore the
  mock data.
- CTA navigates to `/menu` with no console errors.
- No purple/violet, no eyebrow labels, no ALL CAPS labels, no arrow
  glyphs on the button — anywhere on the page.
- `prefers-reduced-motion: reduce` — both the hero entrance and the
  scroll-reveal should show their final state immediately, with no
  animation played.
- Checked at an actual mobile viewport width, not just a resized desktop
  window.