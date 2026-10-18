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

Whenever Stitch proposes an aesthetic color that falls below WCAG 2.1 AA (4.5:1 for body or 3:1 for large/graphical), the adjusted token is recorded below with rationale:

| Token Name | Stitch Proposed Value | Adjusted Token Value | Background | Contrast Ratio | Rationale |
|------------|-----------------------|----------------------|------------|----------------|-----------|
| *(Logged during Task 33)* | | | | | |

---

## 4. Phantom Features Elimination Log

Any element hallucinated by Stitch models that has no corresponding data model or backend feature in Taskora is explicitly rejected and documented here:

- **Notifications Bell:** Pruned. Taskora has no notification pipeline.
- **Global Omnisearch (Cmd+K across all entities):** Pruned. Search is localized to current project tasks and dashboard project list.
- **Billing / Upgrade / Plan Banners:** Pruned. Taskora is a free, focused task management system with no billing engine.
- **Growth Percentages (+12% this week) & Historical Timeline Charts:** Pruned. Taskora does not retain daily historical audit snapshots; metrics are computed live from current Firestore state via `src/lib/dashboardMetrics.ts`.
- **User Avatars in Task Forms / Placeholders:** Restricted to genuine project members or initials-based SVG avatars.
