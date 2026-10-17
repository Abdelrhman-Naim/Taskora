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
| `--surface-hover` | `#F8F9F7` | `#152724` | Hover states | Interactive feedback |
| `--fg` | `#0F1E1C` (Ink) | `#EAF0EC` (Mist) | Primary body & heading text | ≥ 13.8:1 (AAA) |
| `--fg-muted` | `#52605D` | `#8CA09B` | Subtitles, hints, labels | ≥ 4.5:1 (AA) |
| `--accent` | `#0E6B5C` (Jade) | `#5CCBAE` (Mint) | Primary calls-to-action | ≥ 4.6:1 (AA) |
| `--on-accent` | `#FFFFFF` | `#0A1514` | Text on primary buttons | ≥ 4.5:1 (AA) |
| `--brass` | `#B08D45` | `#C9A55A` | Signature hairline rule only | ≥ 3.0:1 UI (AA) |
| `--border` | `#D8DFDC` | `#1B312E` | Card borders, dividers | Structural containment |
| `--control-border`| `#B8C4C0` | `#274440` | Input & button boundaries | ≥ 3.0:1 UI (AA) |

### Status & Priority Tokens

| Kind | Token | Semantic Purpose | Distinguishing Indicator |
|---|---|---|---|
| `todo` | `--st-todo` / `--st-todo-bg` | Backlog / Not started | Solid circular dot |
| `in_progress` | `--st-in-progress` / `--st-in-progress-bg` | Currently in work | Ring indicator |
| `done` | `--st-done` / `--st-done-bg` | Completed task | Checkmark icon |
| `overdue` | `--st-overdue` / `--st-overdue-bg` | Exceeded due date | Clock icon + textual badge |
| `low` | `--st-priority-low` | Low priority | 1-bar icon |
| `medium` | `--st-priority-medium` | Medium priority | 2-bar icon |
| `high` | `--st-priority-high` | High priority | 3-bar icon |

### Radii Hierarchy

- `--radius-sm` (2px): Badges, segmented option buttons.
- `--radius-md` (6px): Form inputs, standard buttons, icon buttons.
- `--radius-lg` (12px): Cards, dialog modals, sheet panels.
- `--radius-pill` (9999px): Progress bar tracks.

---

## 3. Typography & Arabic Text Guidelines

1. **Display & Numbers (`--font-display`):**
   - Fallback chain: `Newsreader`, `Amiri`, `Georgia`, `serif`.
   - Used for main section titles, dashboard statistics, and metric callouts.
   - For numbers, use the `.num` helper class: `font-variant-numeric: lining-nums tabular-nums;` to guarantee column alignment.

2. **Interface Body (`--font-body`):**
   - Fallback chain: `Hanken Grotesk`, `IBM Plex Sans Arabic`, `system-ui`, `sans-serif`.
   - Used for labels, buttons, navigation, and user-generated text.
   - Arabic line-height is tuned to `1.7`–`1.75` for comfortable Nastaliq/Naskh ascender and descender clearance.

---

## 4. Logical CSS & RTL Guidelines

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
- **Mixed Content (`dir="auto"`):**
  - All user-supplied text (task title, project name, user descriptions) must render with `dir="auto"` so Arabic sentences start on the right and English sentences start on the left.
  - Email addresses and email inputs must always be `dir="ltr"`.

---

## 5. UX Copy Principles

- **Action-Oriented Verbs:** Buttons must state exactly what happens: "Create project", "Save changes", "Delete task" (avoid vague labels like "Submit" or "OK").
- **Clear Error Guidance:** State what happened and how to resolve it directly without apologies (e.g., "Network connection unavailable. Please check your connection and try again.").
- **Empty States as Invitations:** Invite the user to take action with a clear primary button: "No projects yet. Create your first project to start organizing tasks."

---

## 6. Component Checklist for New Additions

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
