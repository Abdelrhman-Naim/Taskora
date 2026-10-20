# Taskora — Task Calendar View Design Notes

> **Status:** APPROVED & FROZEN
> **Surface:** Monthly Calendar Grid by Due Date
> **Device Targets:** Desktop (Full 7-column month grid) & Mobile (Compact responsive day cells)
> **Aesthetic Identity:** Obsidian Ledger — Precision grid lines, numeric dates, champagne markers

---

## 1. Required Regions & Mandatory `data-testid` Mapping

| Component / Section | `data-testid` | Description & Semantics |
|---|---|---|
| **Calendar View Container** | `task-calendar-view` | Main calendar container rendered when view preference is `calendar`. |
| **Calendar Header** | `calendar-header` | Month/Year display (`YYYY / MM`) + Previous, Next, and Today controls. |
| **Previous Month Button** | `calendar-prev-btn` | Shifts grid back by 1 month. |
| **Next Month Button** | `calendar-next-btn` | Shifts grid forward by 1 month. |
| **Today Button** | `calendar-today-btn` | Quickly centers calendar on current month. |
| **Weekday Headers** | `calendar-weekdays` | 7-day row (Saturday first in Arabic, Sunday first in English). |
| **Calendar Day Cell** | `calendar-day-{date}` | Day box (`YYYY-MM-DD`) with day number and task pills. |
| **Task Pill** | `calendar-task-pill-{id}` | Compact clickable task chip opening Task Detail Dialog. |
| **Overflow Pill** | `calendar-more-pill-{date}` | "+N more" badge when day has > 3 tasks. |
| **Undated Tasks Strip** | `calendar-undated-tasks` | Collapsible bottom strip showing tasks without due date. |

---

## 2. Palette & Tokens
- Grid borders: `var(--line)`
- Current Day: `border-color: var(--accent)`, gold bold numeral
- Task pills: `var(--surface-hover)` with status color dot
- Overdue tasks: `var(--st-overdue-bg)` with `var(--st-overdue-fg)` text and alert icon
