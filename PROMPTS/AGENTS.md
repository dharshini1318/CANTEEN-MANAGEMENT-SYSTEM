# AGENTS.md — CampusBite

## Project overview

CampusBite is a single-college cafeteria ordering system: anonymous
customer ordering, staff-confirmed payment (cash and UPI — no payment
gateway), worker dashboards (Cashier, Food-Service), and an admin
console. Full requirements live in
`CampusBite_Complete_Project_Specification.md`; the frozen database
schema and state machines are in the published architecture doc. The
current build is a **frontend-only prototype** — React talking to a
mock, `localStorage`-backed service layer deliberately shaped to match
the real API contracts, so the real backend can be swapped in later
without restructuring anything.

## Where the detailed build instructions live

This file is always-on context — relevant to every change. The
step-by-step build instructions are separate: ten prompt files
(`campusbite_prompt_1_...md` through `campusbite_prompt_10_...md`),
each covering one part of the app in the order it was built. Before
improvising a design or architecture decision this file doesn't cover,
check whether the relevant prompt file already settled it — most
non-obvious choices in this codebase (the color palette, the
schedule-plus-override model, the payment flow) were deliberate, not
defaults, and are explained in whichever prompt introduced them.

## Tech stack

- React (JavaScript, not TypeScript — one scoped exception below),
  Vite, Tailwind CSS, React Router.
- State: React Context + `useReducer`/`useState` — no Redux, no
  Zustand.
- Data: native `fetch()`, wrapped in `services/api.js` — no Axios, no
  TanStack Query.
- Charts: Recharts.
- **The one TypeScript exception:** components sourced via the
  21st.dev Magic MCP come in as `.tsx` using shadcn/ui + Radix, since
  that's the stack Magic generates. Scoped deliberately — shadcn's
  minimal footprint only; pages, routing, state, and API calls stay
  plain `.jsx`. Use Magic for genuinely complex, easy-to-get-wrong
  accessible patterns (a responsive sidebar, a slide-in panel with
  focus-trap) — not reflexively for everything. Simple things (radio
  groups, basic forms) are usually better hand-built with this
  project's own primitives.
- Justified, narrow dependencies beyond the above: `qrcode.react` (UPI
  QR rendering), `html2canvas` + `jsPDF` (receipt export). Each exists
  for exactly one purpose — don't reach for them, or anything else,
  outside that.
- Eventual backend (not yet built): Python, FastAPI, Pydantic,
  SQLAlchemy, Alembic, MySQL, Argon2id password hashing.

## Setup

```
npm install
npm run dev
```

## Code conventions

- Functional components and hooks throughout.
- Folders: `components/`, `pages/`, `layouts/` (Customer/Worker/
  Admin), `services/`, `hooks/`, `context/`, `utils/`.
- Money is always integer paise (`price_paise`, `amount_paise`) — never
  floats. Display via `formatPrice()`, parse form input back with
  `parsePrice()` — never ad hoc `/ 100` or inline string formatting.
- Timestamps are interpreted in `Asia/Kolkata` for business-date logic
  (today's sales, daily closing, operating hours) — don't let this
  silently fall back to the browser's local timezone.
- Mock service functions (`services/api.js`) are written to match the
  shape the real API will eventually have, so swapping in real `fetch`
  calls later is a small, localized change. Keep any new mock function
  to that same discipline.

## Design system — read this before touching any UI

Three deliberately distinct visual registers. Getting a page's
register wrong is the most common way to make this codebase look
inconsistent:

| | Customer | Worker | Admin |
|---|---|---|---|
| Feel | Premium, calm, visual | Dense, fast, high-contrast | Structured, data-centric |
| Typography | `Fraunces` for hero/headlines, `IBM Plex Sans` elsewhere | `IBM Plex Sans` only | `IBM Plex Sans` only |
| Motion | Restrained — one entrance moment, one scroll-reveal per page | Minimal — instant state changes | State-change-triggered only |
| Orb background | Landing page only | Never | Never |
| Card surface | Flat, bordered | Flat, dense table rows | Flat, except `elevated` (glass) on dashboard stat cards only |

**Never:** purple, violet, or magenta anywhere, in anything — including
whatever the 21st.dev Magic MCP generates by default. Recolor Magic's
output to this project's tokens; don't accept its defaults as-is.

**Color tokens** (`src/index.css`, shadcn variable convention,
`darkMode: 'class'`):

```css
:root {
  --background: #F1F2ED;  --foreground: #241A12;
  --primary: #4A6741;     --primary-foreground: #FFFFFF;
  --muted: #E4E6DC;       --muted-foreground: #4A4438;
  --border: #D3D6C8;
  --success: #5B8C5A;     --destructive: #A83A2C;
  --accent: #C99A2E;      /* turmeric — Special badges only, nowhere else */
  --warning: #B15A1E;     /* awaiting-confirmation status only */
}
.dark {
  --background: #1C1712;  --foreground: #EDEAE2;
  --primary: #6B9160;     --primary-foreground: #1C1712;
  --muted: #2A231C;       --muted-foreground: #B8AF9F;
  --border: #3A3128;
  --success: #6FA36C;     --destructive: #C24E3A;
  --accent: #E0B646;      --warning: #D68A4C;
}
```

Grounded in the actual subject — filter-coffee brown, banana-leaf
green, turmeric, dried-chili red — not a generic "food app" or
"AI-tool" default. If a genuinely new token is ever needed, follow the
same grounding rather than reaching for an arbitrary hex value.

`IBM Plex Mono` for anything meant to be scanned or matched rather than
read as prose — Order IDs, pickup codes, the receipt.

Sentence case everywhere except worker/admin status badges (`PAID`,
`PREPARING`), which may use compact caps for fast scanning — a
functional dashboard convention, not decorative chrome. No eyebrow
labels above headings, anywhere in the app.

`prefers-reduced-motion: reduce` must be respected by every animation
in the app, without exception.

## Architecture rules

- **Payment is staff-confirmed, not automated.** Cash and UPI are the
  same underlying mechanism (`AWAITING_CONFIRMATION` → `PAID`, one
  `confirmPayment()` call, a `method` field distinguishing them) — a
  cashier confirms both. There is no payment gateway in this project.
  Never write copy or code implying automated or instant payment
  verification for UPI.
- **Backend-authoritative pricing**, even in the mock: order creation
  re-fetches current price and availability rather than trusting
  whatever the cart captured earlier.
- **Effective state, not raw flags**, for menu availability and
  specials — always compute through the schedule-plus-override
  formula; never read `is_special`/`is_available` directly off a menu
  item.
- **Soft delete only** for anything with historical references (menu
  items, worker accounts) — `is_active`, never a real delete.
- **Refunds and corrections are audited additions, never edits** — a
  paid order's original totals are never modified; a correction is a
  separate, linked record.

## Boundaries — do not

- Do not add Redux, Zustand, TanStack Query, Framer Motion, Next.js,
  or Docker without a concrete requirement that specifically demands
  it — "it's popular" or "it's more professional" is not one.
- Do not add a payment gateway, customer accounts or login, discounts,
  coupons, or tax calculation — all explicitly out of scope for this
  project.
- Do not hardcode secrets, and do not add authentication complexity
  (refresh tokens, OAuth) beyond simple session-based login until the
  real backend's auth strategy is actually decided.
- Do not silently change an established color, font, or spacing
  convention to fix a one-off visual issue — fix the specific issue
  within the existing system instead.

## Testing

No automated test suite is set up yet — the build so far has used
manual "Verify" checklists at the end of each prompt file. Once the
real backend exists, prioritize the critical cases the architecture
doc calls out explicitly: inventory race conditions, duplicate payment
confirmation, cash/UPI expiry boundaries, and price immutability on
historical orders.

## Known gaps (by design, for now)

No real backend — everything is mocked via `localStorage`. No real
per-token access control (anything is technically readable from this
browser's own storage). No live inventory-decrement simulation tied to
order placement. These are acceptable for a frontend prototype and are
explicitly *not* things to patch over with fake enforcement — they get
resolved for real once the FastAPI backend is built.
