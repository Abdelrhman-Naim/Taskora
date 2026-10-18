# Taskora Design System

The Taskora Design System provides an intentional, bespoke aesthetic combining classical editorial typography (Newsreader serif & Amiri) with functional modern interface principles, bilingual parity (English & Arabic with full RTL), and WCAG AA accessible contrast in both Light and Dark themes.

---

## 1. Design Direction & Core Identity

- **The Bespoke Anchor (The "One Bold Thing"):** The dashboard ledger bar featuring large serif numerals in Newsreader / Amiri with lining and tabular numerals (`.num`), paired with a solitary Brass hairline accent rule (`--brass`).
- **Restraint:** No gratuitous shadows, glow effects, or decorative clutter. Surfaces are calm and tactile (`--surface`, `--border`).
- **Cohesive Motion:** A single coordinated micro-moment (the Brass hairline drawing across the header in `--dur-rule` ≤ 600ms on load), paired with responsive, snappy interaction feedback (120–200ms) that respects `prefers-reduced-motion`.

---

## 2. Tokens Reference

### Palette & Roles

| Token | Light | Dark | Semantic Role | WCAG Contrast |
|---|---|---|---|---|
| `--bg` | `#F4F5F2` (Pearl) | `#0A1514` (Petrol) | Application background | Base canvas |
| `--surface` | `#FFFFFF` (Porcelain) | `#101F1D` (Deep) | Cards, panels, inputs | Base surface |
| `--surface-2` | `#EAECE7` | `#152826` | Elevated cards, avatars | Secondary surface |
| `--surface-hover` | `#F8F9F7` | `#1B312E` | Hover states | Interactive feedback |
| `--text` | `#0F1E1C` (Ink) | `#EAF0EC` (Mist) | Primary body & heading text | ≥ 13.8:1 (AAA) |
| `--text-muted` | `#52605D` | `#9DB0AA` | Subtitles, hints, labels | ≥ 4.5:1 (AA) |
| `--accent` | `#0E6B5C` (Jade) | `#5CCBAE` (Mint) | Primary calls-to-action | ≥ 4.6:1 (AA) |
| `--on-accent` | `#FFFFFF` | `#06231D` | Text on primary buttons | ≥ 4.5:1 (AA) |
| `--brass` | `#B08D45` | `#C9A55A` | Signature hairline rule only | ≥ 3.0:1 UI (AA) |
| `--border` | `#D8DFDC` | `#25403C` | Card borders, dividers | Structural containment |
| `--control-border`| `#B8C4C0` | `#5F7A73` | Input & button boundaries | ≥ 3.0:1 UI (AA) |

### Status & Priority Tokens

| Kind | Text/Border Token | Background Token | Distinguishing Indicator |
|---|---|---|---|
| `todo` | `--st-todo-fg` | `--st-todo-bg` | Solid circular dot |
| `in_progress` | `--st-progress-fg` | `--st-progress-bg` | Ring indicator |
| `done` | `--st-done-fg` | `--st-done-bg` | Checkmark icon |
| `overdue` | `--st-overdue-fg` | `--st-overdue-bg` | Clock icon + textual badge |
| `low` | `--pr-low-fg` | Transparent / soft | 1-bar icon |
| `medium` | `--pr-medium-fg` | Transparent / soft | 2-bar icon |
| `high` | `--pr-high-fg` | Transparent / soft | 3-bar icon |

### Chart Tokens

| Token | Light | Dark | Semantic Purpose |
|---|---|---|---|
| `--chart-todo` | `#B8841F` | `#B8841F` | To-do segments in stacked bars |
| `--chart-progress` | `#3B6FB6` | `#4A7FD6` | In-progress segments |
| `--chart-done` | `#13966F` | `#22A67F` | Completed segments |
| `--chart-neutral` | `#5F6E69` | `#8FA39C` | Timeline neutral buckets |
| `--chart-grid` | `#E3E6E0` | `#1E3431` | Baseline & divider grid lines |

### Radii Hierarchy

- `--radius-sm` (2px): Badges, segmented option buttons.
- `--radius-md` (6px): Form inputs, standard buttons, icon buttons.
- `--radius-lg` (12px): Cards, dialog modals, sheet panels.
- `--radius-pill` (9999px): Progress bar tracks.

---

## 3. Primitives & Components

### `Avatar`
- Generates up to two initials from bilingual names (supports Arabic names such as "أحمد محمد" → "أم" and English names like "Sara Ali" → "SA").
- Sizes: `sm` (24px) for compact lists and tables, `md` (32px) for user menu and cards.
- Background `--surface-2`, border `--border`, centered bold text with `<bdi>` wrapping.

### `Checkbox`
- Custom accessible checkbox element with hidden native input (`aria-checked`, focus ring).
- Minimum touch target 40px block-size, high-contrast checkmark SVG in `--accent`.

### `Badge`
- Semantic status and priority indicators with distinct icons for color-blind accessibility (never relies on color alone).
- Roles: `owner` (brass accent), `member` (muted).

### Application Shell (`AppShell`)
- **Desktop Sidebar:** Fixed inline-start sidebar (264px–280px) on wide viewports (≥1025px), displaying the brand logo, navigation links, and quick project switcher.
- **Mobile Drawer:** Accessible slide-in dialog (`role="dialog"`, `aria-modal="true"`) for viewports ≤1024px with focus trapping, backdrop click dismissal, and `Escape` key support.
- **TopBar:** Sticky top bar housing section title, language switcher (`LocaleSwitcher`), theme switcher (`ThemeToggle`), and `UserMenu`.
- **UserMenu:** Accessible dropdown menu with keyboard arrow navigation, avatar, user email, and logout action.

### Accessible Charts (`src/components/charts/`)
- Pure HTML/CSS relative layouts with zero canvas/SVG coordinate hardcoding, automatically adapting to LTR and RTL.
- Every chart panel includes a Segmented toggle to switch between visual bars and an accessible `<table>` with identical data.
- Hover/focus tooltip with bounds checking and keyboard `Escape` dismissal.

---

## 4. Typography & Arabic Text Guidelines

1. **Display & Numbers (`--font-display`):**
   - Fallback chain: `Newsreader`, `Amiri`, `Georgia`, `serif`.
   - Used for main section titles, dashboard statistics, and metric callouts.
   - For numbers, use the `.num` helper class: `font-variant-numeric: lining-nums tabular-nums;` to guarantee column alignment.

2. **Interface Body (`--font-body`):**
   - Fallback chain: `Hanken Grotesk`, `IBM Plex Sans Arabic`, `system-ui`, `sans-serif`.
   - Used for labels, buttons, navigation, and user-generated text.
   - Arabic line-height is tuned to `1.7`–`1.75` for comfortable Nastaliq/Naskh ascender and descender clearance.

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

## 6. UX Copy Principles

- **Action-Oriented Verbs:** Buttons must state exactly what happens: "Create project", "Save changes", "Delete task" (avoid vague labels like "Submit" or "OK").
- **Clear Error Guidance:** State what happened and how to resolve it directly without apologies (e.g., "Network connection unavailable. Please check your connection and try again.").
- **Empty States as Invitations:** Invite the user to take action with a clear primary button: "No projects yet. Create your first project to start organizing tasks."

---

## 7. Component Checklist for New Additions

When creating any new component in `src/components/ui/`:
1. [ ] Exclusively uses CSS Modules with CSS Logical Properties (`inline-size`, `padding-inline`, etc.).
2. [ ] Zero hardcoded colors — uses tokens from `src/styles/tokens.css`.
3. [ ] Interactive touch targets satisfy 44px min-block-size (`min-block-size: 44px`).
4. [ ] All text is localized via `useI18n().t` or `tp`.
5. [ ] Directional SVGs include the `.dirIcon` flip class.
6. [ ] Visible `:focus-visible` ring using `var(--focus-ring)` with 2px offset.
7. [ ] ARIA attributes (`aria-label`, `aria-busy`, `aria-invalid`, `aria-describedby`, `role`) tested and present.
8. [ ] Color contrast verified against WCAG AA standards (≥ 4.5:1 text, ≥ 3:1 controls).
9. [ ] Added to the showcase page at `/design-system`.
