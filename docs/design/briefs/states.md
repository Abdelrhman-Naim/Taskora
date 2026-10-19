# Taskora UI States Specification Brief (`states.md`)

## Purpose
Defines the visual architecture, token mapping, and interaction mechanics for core non-ideal operational states across Taskora: Skeleton Loading, Zero-Data / Empty, Network & System Errors, Permission Denied, and Not Found (404). Ensures uninterrupted editorial dignity and orientation across all application views.

## Data
- **Loading Skeleton State:**
  - Layout placeholder dimensions mirroring actual content (sidebar rails, hero metric box, chart skeleton bars, table row lines).
- **Empty States:**
  - `OnboardingEmpty`: 3 setup steps (Create Project, Invite Collaborator, Assign Task) shown when user owns zero projects.
  - `ProjectEmptyState`: Guidance message with action to create the first task in an empty project.
  - `FilterEmptyState`: Notice that no tasks match current filter criteria, with clear-filters action.
- **Error & Resilience States:**
  - `error`: User-facing message from `AppError` (`code`, `message`, `details`).
  - `retryAction`: Callback trigger to re-attempt failed async operations.
- **Access States:**
  - `Forbidden`: Message explaining lack of project membership or administrative privileges.
  - `NotFound`: Message identifying non-existent or deleted project/task resource.

## Actions
- **Retry Action:** Accessible secondary button (`btn-secondary`) to re-trigger failed data queries without full page reload.
- **Navigation Recovery:** Link back to `/dashboard` or project root.
- **Filter Reset:** Button to reset active filter parameters to default (`status=all`, `priority=all`, `assignee=all`).
- **Create First Item:** Primary action button (`btn-primary`, Champagne Gold) to instantiate a new project or task.

## States
- **Skeleton Shimmer:** Low-contrast pulse animation using subtle alpha shifts (`rgba(239, 233, 221, 0.04)` to `0.08` in dark; `rgba(27, 25, 21, 0.04)` to `0.08` in light).
- **Empty Ledger State:** Muted hairline container with calm typography, subtle SVG icon, and singular CTA.
- **Inline Error Alert:** Muted coral hairline border (`#EE8A78`), localized inside the relevant panel without unmounting the shell.
- **Full Page Error:** Editorial headline, human explanation, and prominent retry button.

## Layout requirements
- **Structural Mirroring:** Loading skeletons must match the exact dimensions, grid columns, and line heights of target components to prevent cumulative layout shift (CLS). Full-page generic spinners are strictly banned.
- **Hairline Framing:** Empty and error states reside on flat surfaces bounded by 1px hairlines (`--line`), with generous vertical padding (`space-xl` / 32px to `space-2xl` / 48px).
- **Iconography:** Distinct, minimalist hairline icons with 1.5px stroke width.

## Responsive
- **Desktop (≥ 1280px):** Skeletons and states fill the main content container without horizontal scrolling. Multi-column skeleton blocks reflect dashboard layout.
- **Tablet / Mobile (< 1024px):** Single-column stacked state presentation with touch-friendly retry buttons (minimum 44px height).

## i18n & Theme
- **Bilingual Copy:** All messages and button labels loaded exclusively from translation catalogs (`en.ts` and `ar.ts`).
- **RTL Alignment:** Icons and texts align to `start` edge. Skeletons shimmer in the reading direction (left-to-right in LTR, right-to-left in RTL).
- **Theme Consistency:** Skeletons and state containers adapt seamlessly between deep obsidian dark mode and pearl light mode.

## Out of scope
- Full-page blocking modal spinners or generic spinning wheels.
- Third-party error tracking badges or error code jargon shown to users.
- Gamified celebratory empty-state illustrations, cartoon characters, or balloons.
- Global offline banners blocking navigation.
