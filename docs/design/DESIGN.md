---
name: Obsidian Ledger
colors:
  surface: '#141211'
  surface-dim: '#0C0B0A'
  surface-bright: '#1C1A17'
  surface-container-lowest: '#0C0B0A'
  surface-container-low: '#11100E'
  surface-container: '#141211'
  surface-container-high: '#1C1A17'
  surface-container-highest: '#26231F'
  on-surface: '#EFE9DD'
  on-surface-variant: '#B5AC9C'
  inverse-surface: '#EDECE8'
  inverse-on-surface: '#1B1915'
  outline: '#2C2824'
  outline-variant: '#3A352F'
  surface-tint: '#D4B26E'
  primary: '#D4B26E'
  on-primary: '#1A1408'
  primary-container: '#2C2415'
  on-primary-container: '#E2C282'
  inverse-primary: '#7A5818'
  secondary: '#B5AC9C'
  on-secondary: '#141211'
  secondary-container: '#1C1A17'
  on-secondary-container: '#EFE9DD'
  tertiary: '#9A9183'
  on-tertiary: '#141211'
  tertiary-container: '#26231F'
  on-tertiary-container: '#EDE8DF'
  error: '#EE8A78'
  on-error: '#1A0C0A'
  error-container: '#331915'
  on-error-container: '#FFDAD4'
  background: '#0C0B0A'
  on-background: '#EFE9DD'
  surface-variant: '#1C1A17'
typography:
  display-lg:
    fontFamily: Fraunces
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Fraunces
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Fraunces
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Instrument Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Instrument Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Instrument Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Instrument Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.005em
  label-md:
    fontFamily: Instrument Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Instrument Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  code-sm:
    fontFamily: monospace
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 4px
  DEFAULT: 6px
  md: 6px
  lg: 10px
  xl: 14px
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-desktop: 2rem
  margin: 1rem
  margin-desktop: 2.5rem
  space-2xs: 2px
  space-xs: 4px
  space-sm: 8px
  space-md: 12px
  space-base: 16px
  space-lg: 24px
  space-xl: 32px
  space-2xl: 48px
---

## Brand & Style

**Obsidian Ledger** is an editorial luxury design language created for Taskora. It draws direct inspiration from high-end private banking ledgers, horological craftsmanship, and tactile publishing. It rejects standard SaaS tropes in favor of quiet luxury, calculated density, and structural restraint.

The interface treats information as a refined financial ledger: data rows separated by hairline rules, large tabular display numerals, and calm surfaces. The visual weight is focused on a single **Hero Metric** in the header. Everything surrounding it is disciplined and unobtrusive.

---

## Colors

### Dark Mode (Primary Baseline)
- **Canvas Background (`--bg`):** Deep Obsidian `#0C0B0A`.
- **Standard Surfaces (`--surface`):** Near-black `#141211`.
- **Raised Surfaces (`--surface-raised`):** Warm Charcoal `#1C1A17` (max two raised surfaces per page).
- **Overlay Surfaces (`--surface-overlay`):** Deep Stone `#26231F` for dialogs and popovers.
- **Hairlines & Dividers (`--line` / `--line-strong`):** `#2C2824` / `#3A352F`.
- **Typography:**
  - Primary text (`--text`): Warm Ivory `#EFE9DD`.
  - Secondary text (`--text-2`): Muted Sand `#B5AC9C`.
  - Tertiary metadata (`--text-3`): Warm Slate `#9A9183`.
- **Brand Accent (Champagne Gold):**
  - Primary Accent (`--accent`): `#D4B26E`.
  - Hover Accent (`--accent-hover`): `#E2C282`.
  - On-Accent text (`--on-accent`): Deep Umber `#1A1408` (contrast > 9:1).
- **Status Identifiers (Text + Icon mandatory):**
  - Todo: `#B3AC9E`
  - In Progress: `#8DB4E8`
  - Done: `#9CC5A1`
  - Overdue: `#EE8A78`
- **Sidebar (`--sidebar-bg` / `--sidebar-text`):** `#11100E` with `#EFE9DD` text. **Always dark in both themes.**

### Light Mode ("Pearl & Bronze")
- **Canvas Background:** `#F4F4F2`.
- **Surfaces:** `#FFFFFF`, sunken wells `#EDECE8`, dividers `#DDDAD3`.
- **Typography:** Primary `#1B1915`, Secondary `#5A5348`, Tertiary `#736B5E`.
- **Brand Accent (Bronze):** Deep Bronze `#7A5818` for text and interactive buttons (contrast 6.49:1 on white). Line accent `#B88A3A` for non-text borders.
- **Sidebar:** Remains dark `#11100E` with `#EFE9DD` text for institutional gravity.

### Three Sacred Accent Placements
The champagne gold accent is strictly restricted to:
1. The single primary affirmative action button on the screen.
2. The active navigation indicator (1px hairline rule + active text).
3. A single data highlight in charts/progress.

---

## Typography

- **Display, Page Titles & KPI Numerals:** **Fraunces** (variable, large optical size `opsz`, lining and tabular figures via `font-variant-numeric: lining-nums tabular-nums`).
- **Body & Controls:** **Instrument Sans** (crisp, humanist geometric sans-serif).
- **Arabic Script:**
  - Headlines & Titles: **Amiri**.
  - Body & Form Controls: **IBM Plex Sans Arabic**.
  - Numbers in Arabic context remain Latin tabular digits (`latn`).
- **No Third Latin Family:** Inter, Roboto, Geist, Newsreader, and Hanken Grotesk are strictly banned.

---

## Layout & Spatial Composition

- **Desktop (≥ 1280px):**
  - Persistent 264px dark navigation sidebar on the start edge.
  - Active navigation item indicated by a 1px champagne start-edge rule (`inset-inline-start`).
  - Top bar with section title, language toggle, theme toggle, and user avatar.
  - Page header featuring the **Hero Numeral** (large completion percentage with thin champagne divider rule).
  - Main workplane formatted as continuous ledger rows separated by 1px hairlines.
- **Tablet / Mobile (< 1024px):**
  - Sidebar folds into an off-canvas modal drawer.
  - Top bar provides hamburger trigger and condensed brand title.
  - Ledger rows stack fluidly with comfortable touch targets (minimum 44px).

---

## Elevation & Depth

- **Dark Mode:** No drop shadows. Spatial depth is established strictly through tonal surface layering (`--bg` → `--surface` → `--surface-raised`) complemented by a subtle inner top highlight: `box-shadow: inset 0 1px 0 rgba(239, 233, 221, 0.04)`.
- **Light Mode:** Flat clean surfaces bounded by hairlines (`#DDDAD3`). A single soft ambient drop shadow `0 12px 32px -12px rgba(27, 25, 21, 0.18)` is permitted only on elevated modal overlays.

---

## Components

### Buttons
- **Primary:** Solid Champagne `#D4B26E` background, dark umber text `#1A1408`, 6px corner radius, font weight 600.
- **Secondary / Ledger Action:** Transparent background, hairline border `#2C2824`, text `#EFE9DD`. Hover shifts to `#1C1A17`.
- **Ghost:** Transparent background, text `#B5AC9C`. Hover shifts to `#1C1A17` and text `#EFE9DD`.
- **Destructive:** Warm coral outline/wash `#EE8A78`, text `#EE8A78`.

### Ledger Rows & Panels
- Replaces standard cards. Sections are bounded by 1px hairlines (`#2C2824`).
- Hovering interactive rows triggers a calm surface shift to `#181614` without displacement.

### Form Inputs
- Height 40px, 6px corner radius, background `#141211`, 1px border `#2C2824`.
- Focus state: border turns to `#D4B26E` with a subtle 2px champagne ring (`rgba(212, 178, 110, 0.2)`).

---

## Strict Do / Don't Rules (Forbidden List)

### DO:
- Maintain calm, spacious, editorial luxury with generous white space.
- Use tabular figures for all data and KPIs.
- Ensure all status indicators combine clear text and icons.
- Support bidirectional layout (LTR & RTL) through logical CSS properties.

### DON'T (Strictly Forbidden):
- **NO Teal, Jade, or Petrol:** `#0d5c5a`, `#13966F`, `#22A67F` or any green/teal shades are forbidden.
- **NO Inter font:** Inter and its variants are completely banned.
- **NO Default Tailwind Blue/Purple:** `#6366F1`, `#3B82F6` are forbidden.
- **NO Card Soup:** Do not chop pages into identical rounded white rectangles with 1px gray borders.
- **NO Wide Colored Gradients or Neon:** No glowing cyber buttons or neon highlights.
- **NO Spaced-Out Uppercase Labels:** Do not use `text-transform: uppercase` with wide letter-spacing.
- **NO Middle Dots (`·`):** Do not place bullet dots between metadata items.
- **NO Arrow Icons (`→`):** Do not append directional arrows to buttons.
- **NO Command Palette (Cmd + K):** No global omnisearch or quick-switcher.
- **NO Global Search Bar:** Search is strictly scoped inside project task lists.
- **NO Notification Bell:** No notification center or alert popovers.
- **NO Billing / Upgrade Banners:** Taskora is a focused team task manager, not a commercial SaaS tier funnel.
- **NO Growth Percentages:** No `+12% vs last month` speculative metrics.
- **NO Detail Inspector Pane:** No third column inspector or tree-view sidebars.
