# Taskora — Project Activity Panel Design Notes

> **Status:** APPROVED & FROZEN
> **Surface:** Project Activity Stream (Dialog / Drawer)
> **Device Targets:** Desktop (Large Dialog modal) & Mobile (Responsive Drawer)
> **Aesthetic Identity:** Obsidian Ledger — Chronological audit timeline, event iconography, tabular lines

---

## 1. Required Regions & Mandatory `data-testid` Mapping

| Component / Section | `data-testid` | Description & Semantics |
|---|---|---|
| **Activity Panel Trigger** | `project-activity-btn` | Header button in project view to open activity log. |
| **Activity Panel Container** | `project-activity-panel` | Dialog/Drawer container with title and close button. |
| **Activity List** | `activity-list` | Vertical chronological feed (last 50 events). |
| **Activity Item** | `activity-item-{id}` | Timeline row with event icon, actor name `<bdi>`, translated message, and relative time. |
| **Activity Empty State** | `activity-empty-state` | Localized empty placeholder when project has 0 activity logs. |
| **Activity Retry Button** | `activity-retry-btn` | Retry button rendered on network load failure. |

---

## 2. Palette & Tokens
- Event Icons:
  - Task created / deleted: `var(--accent)`
  - Status changed: `var(--st-progress-fg)`
  - Member added / removed: `var(--text-2)`
  - Comment added: `var(--text-3)`
- Separators: `1px solid var(--line)`
