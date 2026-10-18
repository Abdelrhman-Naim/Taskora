# Dashboard Design Notes & Structural Specification

This document details the visual hierarchy, component boundaries, spacing intervals, color tokens, and explicit `data-testid` registry for implementing the Taskora Dashboard.

---

## 1. Required `data-testid` Registry

The following `data-testid` attributes are mandatory across the Dashboard and Shell implementation:

1. `data-testid="app-sidebar"`: Permanent desktop rail (width 260px) / mobile drawer containing logo, navigation, projects list with task counts, "+ New project" trigger, and user profile card.
2. `data-testid="app-topbar"`: Top utility bar containing Section Title ("Dashboard"), Locale switcher (EN / العربية), Theme switcher (Light / Dark / System), and User Menu trigger. On <1024px screens, contains the ☰ hamburger button.
3. `data-testid="kpi-strip"`: Key Performance Indicators container with 5 metric cells (Open Tasks, In Progress, Completed + Rate, Overdue, Due This Week).
4. `data-testid="chart-tasks-by-project"`: Horizontal stacked distribution chart panel showing Todo / In Progress / Done breakdowns for top projects, with accessible Table view switcher.
5. `data-testid="chart-due-timeline"`: 14-day upcoming horizon column chart with dedicated Overdue column bucket and Table view switcher.
6. `data-testid="needs-attention"`: Actionable urgent tasks card categorizing Overdue, Due Today, and Due Tomorrow tasks.
7. `data-testid="my-tasks"`: Tasks assigned directly to the current logged-in user.
8. `data-testid="projects-table"`: Full projects summary table featuring search filter, sortable headers, member initials avatar stacks, progress meters, and open/overdue task counters.
9. `data-testid="recently-updated"`: Activity stream of recent task modifications.
10. `data-testid="onboarding"`: Empty state onboarding card shown when the user belongs to 0 projects (guided 3-step startup).

---

## 2. Spacing & Rhythm Scale

- **Grid Intervals:** Absolute 4px / 8px multiples.
  - Component intra-spacing: `8px` (`0.5rem`) to `12px` (`0.75rem`)
  - Card internal padding: `16px` (`1rem`) to `24px` (`1.5rem`)
  - Major section gaps: `24px` (`1.5rem`) to `32px` (`2rem`)
- **Container Clamp:**
  - Content container max-width: `1400px` centered, keeping scanning horizons ergonomic on ultra-wide monitors.

---

## 3. Surface & Color Specifications

### Light Theme
- **Backdrop Canvas (`--bg-canvas`):** `#f8fafc` (Slate 50)
- **Primary Card Surface (`--bg-surface`):** `#ffffff` (Pure White)
- **Subtle Containers / Wells (`--bg-subtle`):** `#f1f5f9` (Slate 100)
- **Primary Accent (`--color-primary`):** `#0d5c5a` (Deep Architectural Teal)
- **Primary Accent Hover (`--color-primary-hover`):** `#063837`
- **Primary Accent Soft Wash (`--color-primary-wash`):** `#e6f4f2`
- **Hairline Borders (`--border-subtle`):** `#e2e8f0` (Slate 200)
- **Interactive Borders (`--border-interactive`):** `#cbd5e1` (Slate 300)
- **Primary Text (`--text-primary`):** `#0f172a` (Slate 900)
- **Secondary Text (`--text-secondary`):** `#334155` (Slate 700)
- **Muted Text (`--text-muted`):** `#64748b` (Slate 500)

### Dark Theme
- **Backdrop Canvas (`--bg-canvas`):** `#0b1118`
- **Primary Card Surface (`--bg-surface`):** `#131f2d`
- **Subtle Containers / Wells (`--bg-subtle`):** `#162536`
- **Primary Accent (`--color-primary`):** `#14b8a6` (Luminous Teal)
- **Primary Accent Hover (`--color-primary-hover`):** `#2dd4bf`
- **Primary Accent Soft Wash (`--color-primary-wash`):** `rgba(20, 184, 166, 0.15)`
- **Hairline Borders (`--border-subtle`):** `#233549`
- **Interactive Borders (`--border-interactive`):** `#334b66`
- **Primary Text (`--text-primary`):** `#f8fafc`
- **Secondary Text (`--text-secondary`):** `#cbd5e1`
- **Muted Text (`--text-muted`):** `#94a3b8`

### Semantic Status Tokens (Light / Dark)
- **Todo:** Slate (`#475569` / `#94a3b8`) + Circle SVG
- **In Progress:** Indigo/Sky (`#0284c7` / `#38bdf8`) + Spinner/Progress SVG
- **Done:** Emerald (`#16a34a` / `#4ade80`) + Checkmark SVG
- **Overdue:** Crimson/Rose (`#dc2626` / `#f87171`) + Alert Triangle SVG

---

## 4. Responsive Adaptations

| Viewport Width | Sidebar Behavior | Chart Panels | Projects Layout |
|----------------|------------------|--------------|-----------------|
| **≥ 1024px** (Desktop) | Persistent 260px rail | Side-by-side 2-column grid | Full tabular grid with all columns |
| **768px - 1023px** (Tablet) | Drawer (☰ toggle in top bar) | Stacked 1-column or compact 2-column | Compact table with scroll safety |
| **< 768px** (Mobile) | Off-canvas focus-trapped drawer | Stacked 1-column cards | Responsive stacked card stream |
