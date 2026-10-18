# Design Brief: Project Workspace (`/projects/[id]`)

## 1. Purpose
The core execution view for a specific project. It allows team members and project owners to browse, filter, create, edit, reassign, and complete tasks in a high-density, accessible tabular structure.

## 2. Data
Derived from `src/types/index.ts`:
- **Project Entity:** `id`, `name`, `description`, `ownerId`, `memberIds`, `memberNames` (`Record<uid, displayName>`), `createdAt`, `updatedAt`
- **Current User Role:** `isOwner` (`user.uid === project.ownerId`), `isMember` (`project.memberIds.includes(user.uid)`)
- **Task Entity:**
  - `id`: unique identifier
  - `title`: string
  - `description`: string
  - `status`: `'todo' | 'in_progress' | 'done'`
  - `priority`: `'low' | 'medium' | 'high'`
  - `assigneeId`: string | null
  - `dueDate`: `'YYYY-MM-DD'` | null
  - `createdBy`: uid
  - `createdAt`, `updatedAt`: Date | null
- **Progress Summary:** Total tasks, completed tasks, completion percentage.

## 3. Actions
- **Header Actions:**
  - "+ New task" (modal dialog trigger; enabled for owners and members).
  - "Project settings" gear button (visible to project owner, links to `/projects/[id]/settings`).
- **Filter Toolbar Actions:**
  - Search by task title.
  - Filter by Status (`all`, `todo`, `in_progress`, `done`).
  - Filter by Priority (`all`, `low`, `medium`, `high`).
  - Filter by Assignee (`all`, `unassigned`, or specific member).
  - Quick toggle "Overdue only".
- **Task Row Actions:**
  - Quick status dropdown / toggle (allowed for assignee, creator, or owner).
  - Edit task (opens task modal; allowed for creator or owner).
  - Delete task (opens confirmation dialog; allowed for creator or owner).
  - Reassign task (allowed for owner).

## 4. States
- **Loading:** Skeleton rows reflecting the exact tabular column structure.
- **Empty Project:** When project has zero tasks, display `EmptyState` explaining that no tasks exist yet, with a clear primary "+ New task" button.
- **Empty Filter Results:** When active filters match zero tasks, display "No matching tasks found" with a "Reset filters" button.
- **Error / Unauthorized:** Error card displaying localized error message (e.g. project not found or permission denied) with navigation back to dashboard.

## 5. Layout requirements
- **Shell:** Rendered within the persistent Application Shell (Sidebar + Top Bar).
- **Project Header:**
  - Project title wrapped in `<bdi>`
  - Project description
  - Progress bar with percentage indicator
  - Member avatars stack showing initials of all members
  - Action buttons: "+ New task" (primary saturated button) and "Settings" button (secondary neutral button).
- **Filter Bar:** Single unified toolbar containing Search, Status filter, Priority filter, Assignee filter, and "Overdue only" checkbox.
- **Task List / Table:** Structured rows with columns:
  - Title & Description
  - Status Badge with semantic icon
  - Priority Badge with semantic indicator
  - Assignee avatar & name
  - Due date (highlighted red/warning if overdue)
  - Action buttons docked at `inline-end`

## 6. Responsive
- **Desktop (≥ 1024px):** Full-width structured tabular rows, all columns visible simultaneously.
- **Tablet (768px - 1023px):** Compact columns, secondary actions tucked into an overflow menu.
- **Mobile (320px - 767px):** Rows morph into structured cards. Filter bar collapses into an expandable filter drawer or stacked controls. Touch targets ≥ 44px.

## 7. i18n & Theme
- **Bilingual:** Full Arabic (RTL) and English (LTR) mirroring. Column headers and actions adjust order naturally using CSS logical properties (`margin-inline-start`, `text-align: start`).
- **Dual Themes:** Light and Dark mode styling. High-contrast status badges (AA verified).

## 8. Out of scope
Forbidden phantom features:
- No Kanban drag-and-drop boards (Taskora uses accessible structured lists).
- No file attachments, audio messages, or drag-and-drop image uploads.
- No task comment feeds, discussion threads, or activity logs.
- No time tracking timers, billable hours, or cost counters.
- No subtasks or dependency linking trees.
