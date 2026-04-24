# Nearnest — Design System

Premium · Light · Minimal · Medical Trust.

The goal is a clean, calm, clinically-trustworthy interface that feels closer to a premium health app than a generic e-commerce app. Every surface must communicate safety, clarity, and care.

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
