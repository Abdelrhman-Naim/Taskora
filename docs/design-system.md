# Taskora Design System

The Taskora Design System provides a calm, prestigious, and high-density interface aesthetic derived from Google Stitch design explorations. It combines modern typography (Inter for Latin & Cairo for Arabic), bilingual parity (English & Arabic with full RTL support), and WCAG AA accessible contrast in both Light and Dark themes.

---

## 1. Design Direction & Core Identity

- **The Anchor:** A calm, purposeful dashboard structure with a clean left/right sidebar, comprehensive KPI strip, intuitive charts, and high-density data tables.
- **Restraint:** No gratuitous shadows or decorative clutter. Clean surfaces (`--surface`, `--border`) with subtle borders and crisp typography.
- **Bilingual & Bidi-Safe:** Zero physical CSS layout properties (uses logical properties exclusively), with `<bdi>` isolation for all user strings and proper Arabic typography.

---

## 2. Tokens Reference

### Palette & Roles

| Token | Light | Dark | Semantic Role | WCAG Contrast |
|---|---|---|---|---|
| `--bg` | `#F8FAFC` (Slate-50) | `#0B1118` (Deep Slate) | Application background | Base canvas |
| `--surface` | `#FFFFFF` (White) | `#131F2D` (Slate-900) | Cards, panels, inputs | Base surface |
| `--surface-2` | `#F1F5F9` | `#162536` | Elevated cards, avatars | Secondary surface |
| `--surface-hover` | `#E2E8F0` | `#1E3146` | Hover states | Interactive feedback |
| `--border` | `#E2E8F0` | `#233549` | Card borders, dividers | Structural containment |
| `--control-border`| `#64748B` | `#64748B` | Input & button boundaries | ≥ 3.0:1 UI (AA) |
| `--text` | `#0F172A` (Slate-900) | `#F8FAFC` (Slate-50) | Primary body & heading text | ≥ 13.8:1 (AAA) |
| `--text-muted` | `#475569` | `#94A3B8` | Subtitles, hints, labels | ≥ 4.5:1 (AA) |
| `--accent` | `#0D5C5A` (Deep Teal) | `#14B8A6` (Luminous Teal) | Primary calls-to-action | ≥ 4.6:1 (AA) |
| `--on-accent` | `#FFFFFF` | `#042321` | Text on primary buttons | ≥ 4.5:1 (AA) |
| `--sidebar-bg` | `#FFFFFF` | `#0E1724` | Sidebar background | Neutral canvas |
| `--sidebar-text` | `#334155` | `#CBD5E1` | Sidebar navigation text | ≥ 5.0:1 (AA) |
| `--sidebar-active-bg` | `#E6F4F2` | `#112F2E` | Sidebar active item background | Soft teal tint |
| `--sidebar-active-text` | `#0D5C5A` | `#2DD4BF` | Sidebar active item text | ≥ 5.0:1 (AA) |

### Status & Priority Tokens

| Kind | Text/Border Token | Background Token | Distinguishing Indicator |
|---|---|---|---|
| `todo` | `--st-todo-fg` (`#475569` / `#94A3B8`) | `--st-todo-bg` (`#E2E8F0` / `#1E293B`) | Solid circular dot |
| `in_progress` | `--st-progress-fg` (`#0369A1` / `#7DD3FC`) | `--st-progress-bg` (`#E0F2FE` / `#082F49`) | Ring indicator |
| `done` | `--st-done-fg` (`#0D5C5A` / `#6EE7B7`) | `--st-done-bg` (`#E6F4F2` / `#064E3B`) | Checkmark icon |
| `overdue` | `--st-overdue-fg` (`#991B1B` / `#FCA5A5`) | `--st-overdue-bg` (`#FEE2E2` / `#450A0A`) | Clock icon + textual badge |
| `low` | `--pr-low-fg` | Soft surface background | 1-bar icon |
| `medium` | `--pr-medium-fg` | Soft surface background | 2-bar icon |
| `high` | `--pr-high-fg` | Soft surface background | 3-bar icon |

### Chart Tokens

| Token | Light | Dark | Semantic Purpose |
|---|---|---|---|
| `--chart-todo` | `#64748B` | `#94A3B8` | To-do segments in stacked bars |
| `--chart-progress` | `#0284C7` | `#38BDF8` | In-progress segments |
| `--chart-done` | `#0D5C5A` | `#2DD4BF` | Completed segments |
| `--chart-neutral` | `#475569` | `#64748B` | Neutral / baseline items |
| `--chart-grid` | `#E2E8F0` | `#1E293B` | Grid lines and separators |

### Radii Hierarchy

- `--radius-sm` (4px): Form inputs, checkboxes, textareas, selects, badges, segmented buttons.
- `--radius-md` (6px): Primary/secondary/ghost/danger buttons, toast notifications.
- `--radius-lg` (8px): Cards, dialog modals, sheet panels.
- `--radius-xl` (12px): Large hero surfaces and featured panels.
- `--radius-pill` (9999px): Progress bar tracks, avatars.

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
