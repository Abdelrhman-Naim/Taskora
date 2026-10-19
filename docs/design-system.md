# Taskora Design System — Obsidian Ledger

The Taskora Design System embodies the **Obsidian Ledger** design philosophy: an editorial luxury aesthetic inspired by private banking ledgers, tactile publishing, and horological precision. It pairs classical display typography (**Fraunces** for Latin, **Amiri** for Arabic) with modern humanist sans-serifs (**Instrument Sans** for Latin, **IBM Plex Sans Arabic** for Arabic). It provides bilingual parity (English & Arabic with full RTL support) and strict WCAG AA contrast across both dark (Obsidian) and light (Pearl & Bronze) themes.

---

## 1. Design Direction & Core Identity

- **The Ledger Principle:** Tasks and projects are rendered as an elegant ledger: clean rows separated by hairlines (`--line`), tabular numbers in high-contrast serif display, and at most two raised surfaces per page. No redundant card-chopping.
- **Single Focal Hero Metric:** Visual energy is deliberately concentrated into a single, high-contrast hero numeral in the dashboard header with a thin champagne hairline rule beneath.
- **Rationed Accent (Champagne Gold):** The brand accent appears in only three places: the single primary affirmative action, the active navigation marker, and a single focal chart data point.
- **Persistent Obsidian Sidebar:** The navigation sidebar remains deep obsidian (`#11100E`) across both dark and light modes, creating institutional gravity and brand cohesion.
- **Bilingual & Bidi-Safe:** Built entirely with CSS logical properties (`margin-inline-start`, `padding-inline`, `inset-inline-start`), with `<bdi>` isolation for all user strings and lining tabular numerals.

---

## 2. Tokens Reference

### Palette & Roles

| Token | Light (Pearl & Bronze) | Dark (Obsidian Ledger) | Semantic Role | WCAG Contrast |
|---|---|---|---|---|
| `--bg` | `#F4F4F2` | `#0C0B0A` | Canvas background | Base canvas |
| `--surface` | `#FFFFFF` | `#141211` | Primary panels & ledger rows | Base surface |
| `--surface-2` | `#EDECE8` | `#1C1A17` | Raised ledger wells & segments | Secondary surface |
| `--surface-overlay` | `#FFFFFF` | `#26231F` | Modal dialogs and popovers | Overlaid surface |
| `--surface-hover` | `#E8E6E0` | `#1E1C19` | Interactive hover feedback | Subtle shift |
| `--line` | `#DDDAD3` | `#2C2824` | Hairline dividers & boundaries | Hairline rule |
| `--line-strong` | `#C4C0B6` | `#3A352F` | Emphasized structural borders | Boundary rule |
| `--control-border`| `#736B5E` | `#736B5E` | Input & button boundaries | ≥ 3.0:1 UI (AA) |
| `--text` | `#1B1915` | `#EFE9DD` | Primary text | ≥ 14.3:1 (AAA) |
| `--text-2` | `#5A5348` | `#B5AC9C` | Secondary text & labels | ≥ 6.4:1 (AA) |
| `--text-3` | `#736B5E` | `#9A9183` | Metadata & hints | ≥ 4.5:1 (AA) |
| `--accent` | `#7A5818` (Bronze) | `#D4B26E` (Champagne) | Primary calls-to-action | ≥ 6.4:1 (AA) |
| `--on-accent` | `#FFFFFF` | `#1A1408` | Text on primary buttons | ≥ 6.4:1 (AA) |
| `--sidebar-bg` | `#11100E` | `#11100E` | Persistent dark sidebar | Deep Obsidian |
| `--sidebar-text` | `#EFE9DD` | `#EFE9DD` | Sidebar navigation labels | ≥ 15.7:1 (AAA) |
| `--sidebar-active-bg` | `#1C1A17` | `#1C1A17` | Sidebar active item background | Raised surface |
| `--sidebar-active-text`| `#D4B26E` | `#D4B26E` | Sidebar active item text | ≥ 8.5:1 (AAA) |

### Status & Priority Tokens

| Kind | Text/Border Token (Light / Dark) | Background Token (Light / Dark) | Indicator Style |
|---|---|---|---|
| `todo` | `--st-todo-fg` (`#5A5348` / `#B3AC9E`) | `--st-todo-bg` (`#EDECE8` / `#26231F`) | Solid circular dot + text |
| `in_progress` | `--st-progress-fg` (`#1E4D8A` / `#8DB4E8`) | `--st-progress-bg` (`#E3EDF8` / `#142136`) | Ring indicator + text |
| `done` | `--st-done-fg` (`#235832` / `#9CC5A1`) | `--st-done-bg` (`#E1EFE4` / `#152618`) | Checkmark icon + text |
| `overdue` | `--st-overdue-fg` (`#9C2E1F` / `#EE8A78`) | `--st-overdue-bg` (`#FCE8E5` / `#331915`) | Clock icon + text |
| `low` | `--pr-low-fg` (`#5A5348` / `#B5AC9C`) | Soft surface background | 1-bar icon + text |
| `medium` | `--pr-medium-fg` (`#1E4D8A` / `#8DB4E8`) | Soft surface background | 2-bar icon + text |
| `high` | `--pr-high-fg` (`#9C2E1F` / `#EE8A78`) | Soft surface background | 3-bar icon + text |

### Chart Tokens

| Token | Light | Dark | Semantic Role |
|---|---|---|---|
| `--chart-todo` | `#736B5E` | `#9A9183` | To-do segments in stacked bars |
| `--chart-progress` | `#2D5FA8` | `#8DB4E8` | In-progress segments |
| `--chart-done` | `#7A5818` | `#D4B26E` | Completed segments (Champagne / Bronze) |
| `--chart-neutral` | `#5A5348` | `#6B665D` | Baseline & neutral data |
| `--chart-grid` | `#DDDAD3` | `#2C2824` | Grid lines and hairline separators |

### Radii Hierarchy

- `--radius-sm` (4px): Checkboxes, compact tags.
- `--radius-md` (6px): Form inputs, buttons, select menus, toast notifications.
- `--radius-lg` (10px): Ledger panels, content surfaces.
- `--radius-xl` (14px): Dialog modals, sheet overlays.
- `--radius-pill` (9999px): Status badges, progress tracks, avatars.

---

## 3. Primitives & Components

### `Avatar`
- Initials-based avatar component supporting English ("Sara Ali" → "SA") and Arabic ("أحمد محمد" → "أم").
- Sizes: `sm` (24px) for ledger rows and tables, `md` (32px) for user menu and headers.
- Background `--surface-2`, border `--line`, centered bold text with `<bdi>` wrapping.

### `Checkbox`
- Custom accessible checkbox element with hidden native input (`aria-checked`, focus ring).
- Minimum touch target 44px block-size container, high-contrast checkmark in `--on-accent`.

### `Badge`
- Pill-shaped status and priority indicators with distinct icons for color-blind accessibility. Never relies on color alone.

### Application Shell (`AppShell`)
- **Desktop Sidebar:** Fixed inline-start sidebar (264px) on wide viewports (≥1025px), displaying the Fraunces brand title, navigation ledger items with hairline dividers, and active champagne indicator.
- **Mobile Drawer:** Accessible slide-in dialog (`role="dialog"`, `aria-modal="true"`) for viewports ≤1024px with focus trapping, backdrop click dismissal, and `Escape` key support.
- **TopBar:** Sticky top bar housing section title, language switcher (`LocaleSwitcher`), theme switcher (`ThemeToggle`), and `UserMenu`.

### Accessible Charts (`src/components/charts/`)
- Pure HTML/CSS relative layouts with zero canvas/SVG coordinate hardcoding, automatically adapting to LTR and RTL.
- Every chart panel includes a Segmented toggle to switch between visual bars and an accessible `<table>` with identical data.

---

## 4. Typography & Arabic Text Guidelines

1. **Display & Headings (`--font-display`):**
   - Font family: `Fraunces` for Latin, `Amiri` for Arabic, `serif`.
   - Used for main section titles, dashboard headings, project titles, and metric callouts.
   - For numbers, use the `.num` helper class: `font-variant-numeric: lining-nums tabular-nums;` to guarantee column alignment.

2. **Interface Body (`--font-body`):**
   - Font family: `Instrument Sans` for Latin, `IBM Plex Sans Arabic` for Arabic, `system-ui`, `sans-serif`.
   - Used for labels, buttons, navigation, table cells, and user-generated text.
   - Arabic line-height is tuned to `1.7`–`1.75` for comfortable ascender and descender clearance.

---

## 5. Logical CSS & RTL Guidelines

- **Zero Physical Layout Properties:** Never use `left`, `right`, `margin-left`, `padding-right`, `border-left`, or `float`.
- **Use Logical Properties Exclusively:**
  - `margin-inline-start`, `margin-inline-end`, `margin-block-start`, `margin-block-end`
  - `padding-inline`, `padding-block`
  - `inline-size`, `min-inline-size`, `block-size`, `min-block-size`
  - `inset-inline-start`, `inset-inline-end`, `inset-block-start`, `inset-block-end`
  - `border-inline-start`, `border-inline-end`
- **Directional Icons:**
  - Chevron (`chevron`), back arrow (`arrow`), and logout (`logout`) flip automatically in RTL via:
    ```css
    :global([dir="rtl"]) .dirIcon { transform: scaleX(-1); }
    ```

### Bidi Isolation Rules (`<bdi>`):
1. **Dynamic User Text:** Always wrap user-entered strings (project names, task titles, descriptions, usernames) inside `<bdi dir="auto">` to prevent bidirectional spillover when mixed languages appear.
2. **Technical Strings:** Email addresses, dates, and code snippets must always be isolated with `dir="ltr"`.
3. **Numerals:** Numbers and percentages must use the `.num` class and Latin numbering (`NUMBERING='latn'`).

---

## 6. Strict Forbidden List

- **NO Teal, Jade, or Petrol:** Legacy green, jade, and teal palette accents are strictly forbidden.
- **NO Default Template Fonts:** Generic sans-serif defaults and old palette typography are completely banned.
- **NO Default Tailwind Blue/Purple:** `#6366F1`, `#3B82F6` are forbidden.
- **NO Card Soup:** Pages must not be broken into identical rounded rectangles with gray borders.
- **NO Wide Gradients or Neon:** No glowing buttons, gradients, or cyberpunk accents.
- **NO Spaced-Out Uppercase Labels:** Avoid spaced-out capitalized metadata labels.
- **NO Middle Dots (`·`):** Avoid decorative bullet points between metadata.
- **NO Arrow Icons (`→`):** Do not append directional arrows to buttons.
- **NO Command Palette (Cmd + K):** No global omnisearch or quick-switcher.
- **NO Global Search Bar:** Search is strictly scoped inside project task lists.
- **NO Notification Bell:** No notification center or alert popovers.
- **NO Billing / Upgrade Banners:** Taskora is a focused team task manager, not a commercial SaaS tier funnel.
- **NO Growth Percentages:** No speculative metrics.
- **NO Detail Inspector Pane:** No third column inspector or tree-view sidebars.
