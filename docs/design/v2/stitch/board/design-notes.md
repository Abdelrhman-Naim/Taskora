# Taskora — Task Board (Kanban View) Design Notes

> **Status:** APPROVED & FROZEN
> **Surface:** 3-Column Kanban Board (To do, In Progress, Done)
> **Device Targets:** Desktop (3-column responsive grid) & Mobile (Horizontal swipeable lane scroll)
> **Aesthetic Identity:** Obsidian Ledger — Hairline-separated vertical lanes, drag-and-drop elevation

---

## 1. Required Regions & Mandatory `data-testid` Mapping

| Component / Section | `data-testid` | Description & Semantics |
|---|---|---|
| **Board View Container** | `task-board-view` | Main board container rendered when view preference is `board`. |
| **Board Column** | `board-column-{status}` | Column for `todo`, `in_progress`, and `done`. |
| **Column Header** | `board-column-header-{status}` | Status badge, localized title, and task count badge. |
| **Column Task List** | `board-column-dropzone-{status}` | Native HTML5 dropzone with visual drag-over indicator. |
| **Board Task Card** | `board-task-card-{id}` | Draggable task card (or non-draggable if not permitted). |
| **Card Status Menu** | `board-card-status-{id}` | Accessible keyboard alternative to drag-and-drop. |
| **Empty Column State** | `board-column-empty-{status}` | Subtle empty placeholder when column has 0 tasks. |

---

## 2. Palette & Tokens
- Column background: `var(--surface-sunken)` or subtle overlay with 1px border `var(--line)`
- Drag-over active indicator: `border-color: var(--accent)`, subtle gold tint
- RTL support: In Arabic (`dir="rtl"`), columns flow naturally from right to left (To do on right, Done on left)
