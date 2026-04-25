# Nearnest / Medifind Design System

Premium · Light · Minimal · Medical Trust.

The goal is a clean, calm, clinically-trustworthy interface that feels closer to a premium health app than a generic e-commerce app. Every surface must communicate safety, clarity, and care.

## 0. Medifind mobile brand note

- **Medifind** is the customer-facing mobile app name. Use exact capitalization: `Medifind`.
- Nearnest remains the parent platform and store/admin brand. Do not use Nearnest as the primary wordmark on Medifind mobile entry screens.
- Primary mobile surfaces should say `Medifind`, not `Nearnest`. A subtle `by Nearnest` mark is reserved for About, legal, or provenance surfaces, not the main auth/onboarding hero.
- Medifind copy focuses on discovery: find a medicine, compare nearby verified stores, call the store, and open directions. Avoid delivery, checkout, and order promises in MVP copy.
- Keep the same color, type, radius, button, loading, and error tokens below for both Nearnest web and Medifind mobile.

## 1. Design principles
1. **Clarity over density.** Single primary action per screen. Generous whitespace.
2. **Trust signals everywhere.** Verified-store badges, approval states, delivery timestamps — always visible, never buried.
3. **Respect the gate.** Prescription-required medicines must look and feel clearly gated until approved — no ambiguity.
4. **Soft over sharp.** Rounded corners, subtle shadows, soft background tints — never harsh black-on-white dividers.
5. **Typography carries the brand.** Fewer components, better type.
6. **Motion with restraint.** Micro-interactions only where they confirm state (added to cart, approved, delivered).

## 2. Color palette (token suggestions)

```
/* Brand / trust */
--color-primary-50:  #F0F7F5;
--color-primary-100: #D6EDE6;
--color-primary-300: #7FC9B4;
--color-primary-500: #2F9E7E;   /* primary brand — calm teal-green */
--color-primary-600: #23886B;
--color-primary-700: #1A6A54;

/* Accent (sparingly) */
--color-accent-500:  #3A6FF8;   /* info / links */

/* Surfaces */
--color-bg:          #FBFBFA;   /* app background — near-white, slight warmth */
--color-surface:     #FFFFFF;
--color-surface-alt: #F4F5F3;
--color-border:      #E6E8E4;
--color-border-soft: #EFF1ED;

/* Text */
--color-text:        #14181A;   /* near-black, not pure black */
--color-text-muted:  #5C6570;
--color-text-soft:   #8A94A0;
--color-text-invert: #FFFFFF;

/* Status */
--color-success:     #2F9E7E;
--color-warning:     #C8791E;   /* warm amber, not yellow */
--color-danger:      #C24434;   /* brick red, not fire red */
--color-info:        #3A6FF8;

/* Prescription gate (reserved) */
--color-rx-bg:       #FFF7E6;
--color-rx-border:   #E9B96E;
--color-rx-text:     #8A5A12;
```

Dark mode tokens to be defined post-MVP. Light mode first.

## 3. Typography

- **Primary font:** Inter (fallback: system UI). Consider pairing with **Fraunces** or **Source Serif** for the headline on Home / empty states for a premium feel. Keep to two families max.
- **Weights used:** 400, 500, 600. Avoid 700/800 except on display sizes.

```
--font-display: 32 / 40 / 600   /* home hero, onboarding */
--font-h1:      24 / 32 / 600
--font-h2:      20 / 28 / 600
--font-h3:      17 / 24 / 600
--font-body:    15 / 22 / 400
--font-body-sm: 13 / 18 / 400
--font-caption: 12 / 16 / 500 (uppercase letter-spacing 0.04em for labels)
--font-mono:    13 / 20 / 500   /* order IDs, codes */
```

Line-height ratios above are desktop/mobile readable. Track -0.01em on display sizes for polish.

## 4. Spacing, radius, elevation

```
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px

--radius-sm: 8px
--radius-md: 12px
--radius-lg: 16px
--radius-xl: 20px
--radius-pill: 999px

--shadow-card:   0 1px 2px rgba(20,24,26,0.04), 0 4px 12px rgba(20,24,26,0.06);
--shadow-pop:    0 8px 24px rgba(20,24,26,0.10);
--shadow-focus:  0 0 0 3px rgba(47,158,126,0.25);
```

## 5. Cards

- Default card: `--color-surface`, `--radius-lg`, `--shadow-card`, 16–20px padding.
- Hover/press (mobile): scale 0.99 + slightly darker surface.
- **Store card:** thumbnail (4:3), store name (h3), verified badge, distance + delivery time, rating.
- **Product card:** square image, name (body), price (h3, tabular-nums), Rx badge if prescription-required.
- **Order card:** order #, store name, status pill, ETA, price. Status pill uses status color + soft bg.

## 6. Buttons

Hierarchy (high → low):
1. **Primary** — filled `--color-primary-500`, white text, `--radius-md`, full height 48 on mobile / 40 on web.
2. **Secondary** — 1px border `--color-border`, `--color-text` label, same sizing.
3. **Ghost** — no border, `--color-primary-700` label, used for inline actions.
4. **Destructive** — filled `--color-danger`, reserved for cancel / delete confirmations.

Rules:
- Only **one** primary button per screen.
- Always provide a pressed/loading/disabled state. Loading shows a spinner + label, never just a spinner.
- Minimum touch target: 44×44 on mobile.

## 7. Prescription warning UI pattern

Any time a product, cart, or checkout includes a prescription-required item, surface the gate using this pattern — never a generic warning.

```
┌──────────────────────────────────────────────┐
│  ℞  Prescription required                    │
│                                              │
│  This medicine needs an approved             │
│  prescription before it can be delivered.    │
│                                              │
│  Status: Pending review · uploaded 2h ago    │
│                                              │
│  [  Upload prescription  ]  [ View details ] │
└──────────────────────────────────────────────┘
```

Visual rules:
- Background: `--color-rx-bg`, border 1px `--color-rx-border`, radius `--radius-md`.
- Icon: `℞` (or a prescription icon) in `--color-rx-text`.
- Title: h3 weight 600 in `--color-rx-text`.
- Status chip inline: colored pill matching state (`--color-warning` pending, `--color-success` approved, `--color-danger` rejected).
- CTA is **not** a primary button — use secondary to signal "this is a safety step, not the main flow".
- On cart + checkout, checkout's primary button is **disabled until every Rx item is approved**, and shows helper text: *"Approve your prescription to checkout."*

## 8. Order / delivery status UI pattern

Use a horizontal stepper on order detail and a compact pill on cards.

States + color:
- `pending`     → `--color-text-muted`
- `paid`        → `--color-info`
- `preparing`   → `--color-warning`
- `out_for_delivery` → `--color-primary-500`
- `delivered`   → `--color-success`
- `cancelled`   → `--color-danger`
- `refunded`    → `--color-text-muted`

**Stepper (order detail):**
```
●───●───●───○───○
paid  prep  out  delivered
```
- Solid dot = reached; outline = upcoming.
- Each reached step shows the timestamp beneath in `--font-caption`.
- Live step (current) pulses softly (1.4s loop, 0.6→1.0 opacity).

**Pill (on cards):**
- Pill bg: status color at 12% alpha.
- Pill label: status color at 100%, `--font-caption`, uppercased.
- Include an icon left of label for quick scan (`•` pending, `✓` delivered, `↺` refunded, `⚠` cancelled).

**Delivery map (out_for_delivery only):**
- Full-width map, 240px tall, rounded `--radius-lg`.
- Driver pin animates along the path when location updates.
- ETA chip pinned top-right: `--color-surface` + `--shadow-pop`.

## 9. Iconography
- Web uses `lucide-react`. Mobile should use `lucide-react-native` for parity.
- Stroke 1.75, rounded linecaps.
- Reserved custom glyphs: Rx (prescription), ShieldCheck (verified store), Truck (delivery), Receipt (order).

## 10. Empty, loading, error states
- **Empty:** illustration-lite (a single lucide icon in a soft tinted circle) + one-sentence message + one primary CTA.
- **Loading:** skeletons with `--color-surface-alt`. Avoid full-screen spinners.
- **Error:** inline, red, with a retry. Never a red toast for a recoverable error.

## 11. Accessibility
- Minimum contrast AA against `--color-bg` for text and against buttons for labels.
- Visible focus ring using `--shadow-focus`.
- All icons used without a label get an accessible name.
- Dynamic type: respect OS font scaling on mobile up to 130%.

---

# Discovery Redesign 2026-04-25 (authoritative — Medifind mobile)

This appendix adds the component tokens, motion rules, and accessibility variants needed by the Medifind discovery redesign (see `docs/MOBILE_UI_SCREEN_SPECS.md`). Tokens above remain canonical for both Nearnest web and Medifind mobile; the additions below are mobile-first.

## R1. Why this palette signals "medical + trustworthy + calm"

The base palette (sections 2–4 above) was chosen against three failure modes a medicine app must avoid:

- **"Loud grocery" failure** (Blinkit/Zepto). Solved by avoiding saturated reds/yellows for primary surfaces, by using warm-amber rather than fire-red for warnings, and by capping accent uses to inline information.
- **"Cold institutional" failure** (insurance / hospital portals). Solved by `--color-bg: #FBFBFA` (a near-white with slight warmth) instead of pure white, plus rounded radii and soft shadows.
- **"Wellness pastel" failure** (cosmetic apps pretending to be medical). Solved by a calm teal-green primary that reads as clinical without reading as cosmetic — `#2F9E7E` is darker than typical wellness greens and pairs against neutral text rather than coloured headings.

The Rx palette (`--color-rx-*`, warm amber on cream) is a legibility decision: warning yellow is illegible, brick red implies failure. Warm amber communicates "attention, not panic". This is critical because most users see the Rx warning when nothing has gone wrong.

## R2. Type scale + large-type variant

Base scale is unchanged (section 3). The redesign adds **one** mobile-only variant:

```
/* Large-type variant — applied when users/{uid}.preferences.largeType === true.
 * All sizes scale by 1.15. Line heights scale by 1.10 to preserve density. */
--font-display-lt: 37 / 44 / 600
--font-h1-lt:      28 / 36 / 600
--font-h2-lt:      23 / 31 / 600
--font-h3-lt:      20 / 26 / 600
--font-body-lt:    17 / 24 / 400
--font-body-sm-lt: 15 / 20 / 400
--font-caption-lt: 14 / 18 / 500
```

Implementation: a single `useFontScale()` hook reading the preference plus the OS-level dynamic type, multiplied (clamped to 200% total). Layouts are required to reflow at 200% without clipping any primary copy or CTA label. Truncation on store names and medicine names is allowed at the absolute maximum scale, but never on CTA labels — those wrap to two lines instead.

## R3. Motion rules (calm, not bouncy)

- **Default duration:** 220 ms in, 180 ms out. No spring physics on primary surfaces.
- **Default easing:** standard ease-out (`cubic-bezier(0.2, 0, 0, 1)`), never bounce/back/elastic curves.
- **No animation longer than 300 ms** on any user-initiated transition. Splash brand fade is the one exception (320 ms allowed for the entrance to feel premium).
- **No animated illustrations.** No Lottie above 60 KB. No parallax.
- **Pressed state.** All buttons and tappable cards: `scale 0.99` + 8% opacity step + 80 ms duration. Maximum.
- **Bottom sheet drag.** Spring is allowed only for the sheet handle drag (because it must feel physical). Damping 28, stiffness 200, mass 1; no overshoot.
- **Skeleton shimmer.** A 1.4 s linear opacity loop between 0.55 and 0.95. No diagonal sweep.

If a designer is tempted to add a celebratory animation, the answer is no — this is healthcare, not delivery.

## R4. Dark mode policy

**Decision:** dark mode is **deferred** past MVP launch.

Rationale: a medicine app's first-launch impression must communicate clinical trust. Dark UIs in medicine (1mg's dark surfaces, several wellness apps) read as either "telehealth chat" or "premium beauty", neither of which we want. Light-mode-first also reduces design + QA scope by ~30% for a single-engineer mobile build.

What we do today to avoid painting ourselves into a corner:
- All colours are tokenised; nothing is hard-coded as `#FFFFFF` in components.
- No assumption of light surfaces in component contracts (a `Card` accepts a `surface` token, not a hex).
- Status bar style is a screen-level prop, not global — already true in the existing `_layout.tsx`.

When dark mode lands (post-MVP), the new palette will mirror the existing semantic tokens (`bg`, `surface`, `surface-alt`, `text`, `text-muted`, `text-soft`, `border`, `border-soft`) plus a dark Rx variant. No component needs to change.

## R5. Component tokens (new for redesign)

All sizes are based on the existing spacing/radius scale (section 4). Tokens here name the *intent* used by the screen specs.

### ProductCard (medicine card)
Two sizes: large (used as Group A in search results) and compact (used in groups B/C/D, similar rail, category grid).

```
ProductCard.large
  width: 100% of content area
  padding: --space-5 (20px)
  radius: --radius-lg (16px)
  background: --color-surface
  border: 1px --color-borderSoft
  shadow: --shadow-card
  imageSize: 96x96 left, --color-surfaceAlt fallback bg
  imageRadius: --radius-md (12px)
  textGap: --space-2 (8px)
  badgeRow gap: --space-2

ProductCard.compact
  width: 100% of content area
  padding: --space-4 (16px)
  radius: --radius-md (12px)
  background: --color-surface
  border: 1px --color-borderSoft
  shadow: none
  imageSize: 56x56 left
  imageRadius: --radius-sm (8px)
  textGap: --space-1 (4px)

ProductCard grid tile (Category browse)
  aspectRatio: image 1:1
  imageSize: 100% width, height auto
  padding: --space-4
  radius: --radius-md
  background: --color-surface
  border: 1px --color-borderSoft
  shadow: --shadow-card
```

Image fallback: `--color-surfaceAlt` background with the medicine's first letter in `--color-text-muted` at `--font-h2`.

### StoreCard

```
StoreCard
  padding: --space-5 (20px)
  radius: --radius-lg (16px)
  background: --color-surface
  border: 1px --color-borderSoft
  shadow: --shadow-card
  titleRow gap: --space-3 (12px) — name on left, verified pill right
  metaRow color: --color-text-muted, font: --font-body-sm
  freshnessRow:
    fresh   (≤ 24h)  -> color: --color-success
    stale   (24-72h) -> color: --color-warning
    old     (> 72h)  -> color: --color-text-soft
  actionRow:
    height: 48px
    gap: --space-2
    each button: equal width, 1px --color-border, radius --radius-md, label --color-text
```

### CategoryCard
```
CategoryCard
  size: 1/4 of grid width, 84px tall (rounds up under large-type)
  radius: --radius-md
  background: --color-primary-50
  iconCircle: 40x40, radius pill, background --color-surface
  iconColor: --color-primary-700
  label: --font-body-sm, --color-text, weight 500
  pressed: scale 0.99 + 8% opacity
```

### SearchBar (sticky and pressable variants)

```
SearchBar.pressable (Home → tap to open Search)
  height: 56px
  radius: --radius-lg
  background: --color-surface
  border: 1px --color-border
  paddingX: --space-5
  iconLeft: --color-text-muted
  placeholderColor: --color-textSoft

SearchBar.input (focused field, Search screen)
  height: 56px
  radius: --radius-lg
  background: --color-surface
  border: 1px --color-primary-300 (focus)
  shadow: --shadow-focus when focused
```

### ModeToggle

```
ModeToggle
  width: 100% of content area
  height: 48px
  radius: --radius-pill
  background: --color-surfaceAlt
  segments: 2, equal width
  selected segment:
    background: --color-surface
    shadow: --shadow-card
    label: --color-text, weight 600
  unselected segment:
    background: transparent
    label: --color-text-muted, weight 500
  iconSize: 18px, alignment: leading next to label
```

### BottomSheet (Nearby stores screen)

```
BottomSheet
  background: --color-surface
  topRadius: --radius-xl (20px)
  shadow: --shadow-pop
  defaultHeight: 60% of viewport
  collapsedHeight: 25% of viewport (when toggled to "Map")
  expandedHeight: 95% of viewport (drag-up max)
  handle:
    width: 32, height: 4, radius: --radius-pill
    color: --color-borderSoft
  contentPadding: --space-5
```

### Chip
```
Chip
  height: 36px (44px under large-type)
  radius: --radius-pill
  paddingX: --space-4
  background: --color-surface
  border: 1px --color-border
  label: --font-body-sm, --color-text, weight 500
  pressed: scale 0.99 + 8% opacity
  Rx variant: background --color-rx-bg, border --color-rx-border, label --color-rx-text
```

### Badge variants

```
Badge.rx
  padding: 2px 8px
  radius: --radius-pill
  background: --color-rx-bg
  border: 1px --color-rx-border
  label: 'Rx', --font-caption, weight 600, --color-rx-text

Badge.verified
  padding: 2px 8px
  radius: --radius-pill
  background: --color-primary-50
  border: 1px --color-primary-300
  label: 'Verified', --font-caption, weight 600, --color-primary-700
  leadingIcon: tiny check (10px), same colour

Badge.availableNearby
  padding: 2px 8px
  radius: --radius-pill
  background: --color-primary-50
  label: 'Available at {n} nearby', --font-caption, weight 500, --color-primary-700

Badge.callToConfirm
  padding: 2px 8px
  radius: --radius-pill
  background: --color-surfaceAlt
  label: 'Call to confirm', --font-caption, weight 500, --color-textMuted
```

### EmptyState / ErrorState container

```
EmptyState | ErrorState
  paddingX: --space-6
  paddingY: --space-10
  alignItems: center
  iconCircle: 56x56, radius pill
    Empty bg: --color-primary-50, icon color: --color-primary-700
    Error bg: --color-surfaceAlt, icon color: --color-danger
  title: --font-h3, weight 600, --color-text
  body: --font-body-sm, --color-textMuted, lineHeight 18, textAlign center
  cta: secondary button, full width on small screens, max 320px on tablet
  gap: --space-4 between elements
```

## R6. Iconography rules (medicine context)

- Continue with `lucide-react-native` for parity (section 9).
- **Medicine images** are real product photography (or square placeholder when missing). Never a lucide icon stand-in — generic icons make a medicine card look like a category card and break trust.
- **Category icons** are lucide glyphs in a circle (e.g. `Pill` for Pain Relief, `ThermometerSun` for Cold & Cough, `Activity` for Diabetes). Stroke 1.75 unchanged.
- **System icons** (back, share, search, filter, chevron-down) are lucide.
- **Brand mark `M`** in the splash brand-circle is a typographic mark for now; reserve a custom mark for post-MVP brand pass.
- **Rx symbol** is a stylised `Rx` text glyph (not the lucide pill icon). Distinct from the medicine-form pill so users do not confuse Rx-required with "tablet form".

## R7. Image asset rules

- Medicine product photos: 1:1 ratio, 512×512 source minimum, `image/png` or `image/webp`, white background or transparent. App renders at 96×96 (compact card), 152×152 (grid tile), 180×180 (medicine detail hero).
- All images served via signed URL or static bundled asset; never inline base64. (Will route through Storage when backend lands; mock data uses bundled placeholders.)
- Always provide an `alt`/a11y label that includes name + form + pack size.

## R8. Component naming + file mapping (mobile)

The following names are the contract between docs and code. Codex implements components under `apps/mobile/components/` using these names exactly.

| Token name | Existing? | File hint |
|---|---|---|
| `ProductCard` (large + compact + grid) | new | `components/ProductCard.tsx` (variants) |
| `StoreCard` | partial (in home) | `components/StoreCard.tsx` (extract) |
| `CategoryCard` | new | `components/CategoryCard.tsx` |
| `SearchBar` | partial | `components/SearchBar.tsx` (Pressable + Input variants) |
| `ModeToggle` | new | `components/ModeToggle.tsx` |
| `BottomSheet` | new | `components/BottomSheet.tsx` |
| `Chip` | partial | `components/Chip.tsx` |
| `Badge` | new | `components/Badge.tsx` (variants: rx, verified, availableNearby, callToConfirm) |
| `EmptyState` | new | `components/EmptyState.tsx` |
| `ErrorState` | new | `components/ErrorState.tsx` |
| `OfflineBanner` | new | `components/OfflineBanner.tsx` |
| `StaleDataBanner` | new | `components/StaleDataBanner.tsx` |
| `MapPlaceholder` | new | `components/MapPlaceholder.tsx` (mock; replaced by `react-native-maps` later) |

Existing `Screen` and `ActionButton` are unchanged.
