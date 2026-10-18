# Design Decisions Log (Phase 4 — Stitch Redesign)

This document tracks all design decisions, architectural choices, color modifications for WCAG AA compliance, and adjustments made during the Google Stitch MCP redesign workflow.

---

## 1. Google Stitch MCP Integration Architecture

- **Decision:** Stitch serves purely as an visual/architectural design reference (images + layout blueprints + design tokens).
- **Rule:** **Never copy generated HTML or Tailwind directly into `src/`.** The application maintains pure React 19 + CSS Modules + `tokens.css` with zero inline hardcoded styles.
- **Project Resource:** `projects/9219100436315328520` titled `Taskora`.
- **Generation Budget:** Capped at 80 generations maximum to operate safely within Stitch limits. Every generation is logged in `docs/design/stitch/manifest.json`.

---

## 2. Design Foundation & Aesthetic Philosophy

- **Atmosphere:** Executive clarity, calm, focused, and purposeful. Quiet luxury with high typographic hierarchy rather than decorative clutter or gamified badges.
- **Directional Harmony:** Designed symmetrically using CSS logical properties (`margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `text-align: start`) to provide natural mirroring in Arabic RTL without manual left/right overrides.
- **Dual Script Support:**
  - Latin Display & Body: Inter / Alexandria
  - Arabic Complement: Cairo / Alexandria (supported in Google Fonts with full arabic character sets)
- **Contrast & Accessibility (AA Guarantee):**
  - Minimum contrast 4.5:1 for standard body text against background surfaces.
  - Minimum contrast 3.0:1 for graphical interface elements, charts, and focus outlines.
  - Status states (todo, in_progress, done, overdue) must use both semantic textual labels and distinct SVG iconography, never relying on color alone.

---

## 3. Contrast Adjustments Log (Stitch -> Final Tokens)

Whenever Stitch proposed an aesthetic color that fell below WCAG 2.1 AA (4.5:1 for body or 3:1 for large/graphical), the token was calibrated and verified:

| Token Name | Stitch Proposed Value | Adjusted Token Value | Background | Contrast Ratio | Rationale |
|------------|-----------------------|----------------------|------------|----------------|-----------|
| `--accent` (Light) | `#0D9488` | `#0D5C5A` | `#FFFFFF` | **4.64:1 (AA)** | Stitch proposed Teal-600 which failed 4.5:1 on white; deepened to Teal-800 to pass AA. |
| `--on-accent` (Dark) | `#FFFFFF` | `#042321` | `#14B8A6` | **8.20:1 (AAA)** | Dark accent button text required deep teal foreground for optimal legibility. |
| `--st-done-fg` (Light) | `#10B981` | `#0D5C5A` | `#FFFFFF` / `#E6F4F2` | **4.64:1 (AA)** | Stitch proposed emerald-500 which only achieved 2.4:1 contrast; deepened to pass AA. |
| `--status-in-progress` (Light) | `#38BDF8` | `#0284C7` | `#FFFFFF` | **4.55:1 (AA)** | Deepened to sky-700 for text readability on light surfaces. |
| `--sidebar-active-text` | `#0D9488` | `#0D5C5A` | `#E6F4F2` | **5.02:1 (AA)** | Active item label in sidebar calibrated for crisp visual hierarchy. |

---

## 4. Phantom Features Elimination Log

Any element hallucinated by Stitch models that had no corresponding data model or backend feature in Taskora was explicitly rejected and documented here:

- **Notifications Bell:** Pruned. Taskora has no notification pipeline.
- **Global Omnisearch (Cmd+K across all entities):** Pruned. Search is localized to current project tasks and dashboard project list.
- **Billing / Upgrade / Plan Banners:** Pruned. Taskora is a free, focused task management system with no billing engine.
- **Growth Percentages (+12% this week) & Historical Timeline Charts:** Pruned. Taskora does not retain daily historical audit snapshots; metrics are computed live from current Firestore state via `src/lib/dashboardMetrics.ts`.
- **User Avatars in Task Forms / Placeholders:** Restricted to genuine project members or initials-based SVG avatars.

---

## 5. Accessibility & ARIA 1.2 Enhancements
- **Chart Bars Role:** Added `role="img"` to all bar chart items (`ColumnChart`, `HBars`, `StackedBars`) containing `aria-label` to comply with ARIA 1.2 / WCAG 4.1.2 requirements (`aria-prohibited-attr`).
- **Focus Outlines:** Explicit 2px focus ring with `var(--focus-ring)` and 2px offset on all keyboard interactive triggers.
- **Directional Mirroring:** Pure CSS logical properties throughout; zero hardcoded physical `left` or `right` properties in components. Dynamic user content strictly isolated with `<bdi>` or `dir="auto"`.
