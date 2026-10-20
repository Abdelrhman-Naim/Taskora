# Taskora — Notifications Popover Design Notes

> **Status:** APPROVED & FROZEN
> **Surface:** Notification Bell & Dropdown Inbox
> **Device Targets:** Desktop (Floating popover menu) & Mobile (Full width slide-down drawer)
> **Aesthetic Identity:** Obsidian Ledger — Luxury notifications, unread gold indicators, clear states

---

## 1. Required Regions & Mandatory `data-testid` Mapping

| Component / Section | `data-testid` | Description & Semantics |
|---|---|---|
| **Notification Bell Trigger** | `notif-bell` | Top bar bell button with `aria-haspopup="true"`. |
| **Unread Badge** | `notif-unread-badge` | Numeric pill showing unread count (`1..9`, `9+`). Hidden when count is 0. |
| **Notification Popover** | `notif-popover` | Floating menu with glass backdrop blur and champagne border. |
| **Mark All as Read** | `notif-mark-all-btn` | Header button to mark all loaded notifications as read. |
| **Notification Item** | `notif-item-{id}` | Clickable item leading to project page and marking as read. |
| **Notification Text** | `notif-item-text-{id}` | Localized notification message with actor name `<bdi>` and task title `<bdi>`. |
| **Empty State** | `notif-empty-state` | Localized empty placeholder when user has 0 notifications. |

---

## 2. Palette & Tokens
- Popover surface: `var(--surface-overlay)`
- Unread item indicator: 6px circular dot in `var(--accent)`
- Hover state: `var(--surface-hover)`
- Focus-visible ring: `var(--focus-ring)`
