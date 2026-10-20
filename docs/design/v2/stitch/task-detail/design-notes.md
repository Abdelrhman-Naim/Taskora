# Taskora — Task Detail Dialog Design Notes

> **Status:** APPROVED & FROZEN
> **Surface:** Task Detail Dialog (Checklist + Labels + Comments)
> **Device Targets:** Desktop (680px Modal Dialog) & Mobile (Full-width Sheet)
> **Aesthetic Identity:** Obsidian Ledger — Precision Lines, Champagne Hairlines, Deep Charcoal Glass

---

## 1. Required Regions & Mandatory `data-testid` Mapping

| Component / Section | `data-testid` | Description & Semantics |
|---|---|---|
| **Modal Container** | `task-detail-dialog` | Modal dialog rendered with Radix Dialog portal. Esc key closes dialog. |
| **Close Button** | `task-detail-close-btn` | Close icon button at inline-end. |
| **Task Title** | `task-detail-title` | Editable or static header displaying task title inside `<bdi>`. |
| **Status Badge / Trigger** | `task-detail-status` | Interactive status trigger (`StatusMenu`) allowing assignee/owner to switch status. |
| **Priority Badge** | `task-detail-priority` | Priority badge (`low`, `medium`, `high`). |
| **Due Date Badge** | `task-detail-due-date` | Due date badge with calendar icon and `YYYY/MM/DD` numeric format. |
| **Assignee Section** | `task-detail-assignee` | Member avatar + display name inside `<bdi>`. |
| **Labels Section** | `task-detail-labels` | Flowing row of champagne outline chips + `LabelsInput` chip field. |
| **Checklist Section** | `task-checklist` | Checklist container with progress counter (`done/total`). |
| **Checklist Item** | `checklist-item-{id}` | Checkbox + item text + delete button (on hover/focus). |
| **Checklist Add Input** | `checklist-add-input` | Inline input to add a new checklist item (max 20 items). |
| **Comments Section** | `task-comments-thread` | Chronological comment stream (oldest first). |
| **Comment Item** | `comment-item-{id}` | Author avatar, author name `<bdi>`, timestamp, and text. |
| **Comment Input** | `comment-input` | Textarea for new comment (max 1000 characters). |
| **Comment Submit** | `comment-submit-btn` | Submit button, disabled when text is empty/whitespace. |

---

## 2. Palette & Tokens
- Canvas/Overlay: `var(--surface-overlay)`
- Hairlines: `var(--line)` (`#2C2824` / `#DDDAD3`), Strong: `var(--line-strong)` (`#3A352F`)
- Accent: `var(--accent)` (`#D4B26E` / `#7A5818`)
- Typography: Cairo (`var(--font-body)`), tabular figures for numbers.
