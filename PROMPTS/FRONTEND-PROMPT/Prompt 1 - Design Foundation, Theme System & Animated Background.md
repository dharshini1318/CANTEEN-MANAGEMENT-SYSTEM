# CampusBite — Prompt 1: Design Foundation, Theme System & Animated Background

Context: CampusBite is a React (JavaScript) + Vite + Tailwind CSS frontend
for a single-cafeteria ordering system. Three distinct experiences share
one codebase: Customer (mobile-first, premium/visual), Worker (dense,
fast, high-contrast), Admin (desktop-first, data-heavy). This prompt
covers ONLY the shared design foundation everything else builds on — no
pages yet.

This is the complete, corrected version of Prompt 1 — it supersedes any
earlier draft. If you already ran an earlier version, the only functional
differences are the color values in step 1 and the addition of a type
system; the toggle, orb mechanics, skeleton primitive, and component
structure are unchanged.

## Ground rules (for the whole project, not just this prompt)

- Stay in plain JavaScript (.jsx) everywhere, EXCEPT: components sourced
  via the 21st.dev Magic MCP may come in as TypeScript (.tsx) using
  shadcn/ui + Radix, since that's the stack Magic generates. Keep this
  scoped — install shadcn/ui's minimal footprint (the components/ui
  folder convention, the cn() utility, only the Radix packages actual
  components need) but do NOT convert pages, routing, state, or API
  calls to TypeScript. .tsx and .jsx coexist fine in Vite.
- No purple, violet, or magenta anywhere — not in gradients, accents, or
  the orb background. Watch this even in whatever Magic generates —
  recolor its output to the tokens below rather than accepting its
  defaults as-is.
- No Framer Motion, no 3D (no Three.js, no 3D transforms/tilts). CSS
  keyframes/transitions plus one small IntersectionObserver hook is
  genuinely enough for fade, scroll-reveal, and floating orbs — no extra
  dependency needed.
- Every animation respects `prefers-reduced-motion` — freeze or simplify
  it, don't force motion on people who've turned it off.

## Deliverables

### 1. Design tokens — color and type

CampusBite is a specific thing (a South Indian college cafeteria), not a
generic "food app" — the choices below are grounded in that rather than
defaults.

**Color** — CSS custom properties in `src/index.css`, using shadcn's
variable convention so anything pulled from Magic plugs straight in:

```css
:root {
  --background: #F1F2ED;
  --foreground: #241A12;
  --primary: #4A6741;
  --primary-foreground: #FFFFFF;
  --muted: #E4E6DC;
  --muted-foreground: #4A4438;
  --border: #D3D6C8;
  --success: #5B8C5A;
  --destructive: #A83A2C;
  --accent: #C99A2E;       /* turmeric — reserved for "Special" badges */
}
.dark {
  --background: #1C1712;
  --foreground: #EDEAE2;
  --primary: #6B9160;
  --primary-foreground: #1C1712;
  --muted: #2A231C;
  --muted-foreground: #B8AF9F;
  --border: #3A3128;
  --success: #6FA36C;
  --destructive: #C24E3A;
  --accent: #E0B646;
}
```

(Filter-coffee brown, banana-leaf green, turmeric, dried-chili red — real
reference points, not an arbitrary "avoid purple" substitute.) Wire these
into `tailwind.config.js` via `theme.extend.colors` referencing the vars,
and set `darkMode: 'class'`.

**Type** — two typefaces, clearly distinct roles, loaded via Google
Fonts:
- **Fraunces** — a warm, slightly characterful display serif. Used only
  for hero wordmarks and page headlines. One weight is enough; don't
  reach for it anywhere else.
- **IBM Plex Sans** — body text, UI labels, buttons, every functional
  surface. Chosen for legibility under time pressure (this app gets used
  at a busy counter), not personality. Load regular and medium/semibold
  weights.

Set both as CSS variables (`--font-display`, `--font-sans`) and wire them
into Tailwind's `fontFamily` config so later prompts reference them by
name rather than hardcoding font stacks.

### 2. Theme toggle

A `ThemeContext` (React Context) toggling a `dark` class on `<html>`,
persisted in `localStorage`, defaulting to the OS's `prefers-color-scheme`
on first visit. A toggle component with a smooth icon crossfade, not an
abrupt swap.

### 3. Animated background — the "orb" system

An `AnimatedOrbBackground` component: 3 large (300–500px), heavily
blurred (`filter: blur(60–90px)`), low-opacity (0.3–0.5) circular gradient
shapes using `--primary` and `--muted` at different alphas — reading from
the CSS variables, not hardcoded hex values, so any future palette change
propagates automatically. Absolutely positioned behind content (negative
z-index, `pointer-events: none`), each drifting independently via CSS
keyframes (translate + slight scale, 20–30s loops, staggered
`animation-delay` so they never move in sync). Sits behind calm/spacious
screens (landing page etc.) — not behind the dense worker/admin views.
Use the 21st.dev Magic MCP (`/ui`) to source this — ask for an
aurora/gradient-orb animated background — then recolor its output to the
tokens above rather than keeping whatever it generates by default.

### 4. Skeleton loading primitive

A base `Skeleton` component: a pulsing shimmer block, theme-aware
(different shimmer contrast in light vs dark), that later prompts compose
into specific shapes (menu-card skeleton, stat-card skeleton, etc.). Build
the primitive only here.

### 5. Core primitives

- **Button** — primary/secondary/ghost variants, ~150–200ms ease-out
  hover/press transitions, visible keyboard focus ring. Label text in
  IBM Plex Sans medium.
- **Card** — rounded, subtle border. Flat by default, no drop shadow —
  most of this app's surfaces should sit flush, not float. Add an
  `elevated` variant (shadow + slight lift) as an explicit opt-in for the
  few places that genuinely need it (dropdowns, modals), not the default
  treatment for every card in the app.
- **Input** — clear focus and error states.

Just enough for later prompts to build on, not a full component library.

### 6. Fade + scroll-reveal utilities

A `.fade-in` CSS animation utility, and a small zero-dependency
`useInView` hook (IntersectionObserver) that later prompts use to wrap
sections so they fade + slide up as they scroll into view. A utility for
later prompts to use deliberately and sparingly — not something every
section should automatically get.

### 7. Micro-interaction baseline

Note the standard transition timing so later prompts stay consistent:
~150ms for hover states, ~200–250ms for reveals, `ease-out` for
entrances, `ease-in-out` for looping ambient motion like the orbs.

## Verify before moving on

- Dev server runs clean, no console errors/warnings.
- Toggle light/dark — every token-driven surface actually switches;
  nothing hardcoded slips through.
- Fraunces and IBM Plex Sans are both actually loading (check the
  rendered font, not just that the CSS references them) — no silent
  fallback to system fonts.
- Orb animation loops smoothly with no visible seam, reads its colors
  from the CSS variables (not hardcoded hex), and freezes when
  `prefers-reduced-motion: reduce` is simulated.
- No purple/violet anywhere, including inside whatever Magic generated.
- Skeleton shimmer is visible and theme-aware in both modes.
- Card renders flat (no shadow) by default; the `elevated` variant only
  shows a shadow when explicitly used.
- Button/Card/Input hover, focus, and press states all work and look
  intentional, not default-browser.