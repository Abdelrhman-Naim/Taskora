# Design Brief: Shared Interactive Primitives & Dialogs (`components/`)

## 1. Purpose
Defines the specifications for shared interactive dialogs, modal sheets, and UI primitives across Taskora:
1. **Task Modal (`TaskForm`):** Create and edit task dialog.
2. **Confirm Dialog (`ConfirmDialog`):** Destructive confirmation modal (delete project, remove member with unassigned task count, delete task).
3. **UI Primitives:** Button, Input, Select, Textarea, Checkbox, Badge, Avatar, Toast, ProgressBar, SegmentedControl.

## 2. Data
- **Task Form Fields:**
  - `title`: string (1-200 characters)
  - `description`: string (optional, markdown or text)
  - `status`: `'todo' | 'in_progress' | 'done'`
  - `priority`: `'low' | 'medium' | 'high'`
  - `assigneeId`: string | null (selected from project member list)
  - `dueDate`: `'YYYY-MM-DD'` | null
- **Confirmation Dialog Data:**
  - `title`: string
  - `message`: string (may include count of unassigned tasks, project name, or warning text)
  - `confirmLabel`: string (e.g. "Delete", "Remove")
  - `variant`: `'danger' | 'default'`

## 3. Actions
- Open modal on user trigger; lock background scroll (`aria-hidden` on app root).
- Focus trapping inside modal container; cycle focus via Tab / Shift+Tab.
- Close on Escape key press or backdrop click; return focus to trigger element.
- Primary confirm / save action with network mutation.
- Secondary cancel action.

## 4. States
- **Resting:** Clean inputs, default button states.
- **Hover & Focus:** Clear 2px focus ring with high-contrast accent; hover surface tints.
- **Active / Submitting:** Buttons show inline loading spinner, inputs disabled.
- **Invalid / Error:** Field borders turn red with accessible error text tied via `aria-describedby`.
- **Disabled:** Muted opacity (0.5), cursor not-allowed, non-focusable.

## 5. Layout requirements
- **Modal Scrim:** Neutral dark backdrop with slight blur (`backdrop-filter: blur(2px)`).
- **Dialog Card:** Centered, floating card (max width 32rem / 512px) with 1px border and elevated shadow.
- **Header:** Dialog title and accessible close button (✕).
- **Body:** Form inputs arranged in vertical stack with 1rem spacing.
- **Footer:** Action bar right-aligned (left-aligned in RTL) with Cancel button and Primary Confirm/Save button.

## 6. Responsive
- **Desktop (≥ 1024px):** Centered dialog with 2rem internal padding.
- **Tablet (768px - 1023px):** Centered modal with safe margins.
- **Mobile (320px - 767px):** Bottom sheet or full-width modal drawer. Touch targets ≥ 44px. Inputs zoom-safe (font size ≥ 16px to prevent iOS auto-zoom).

## 7. i18n & Theme
- **Bilingual:** Dual English/Arabic typography, bidirectional action alignment (Cancel and Confirm swapped in RTL), user text rendered with `<bdi>`.
- **Dual Themes:** Light and dark mode tokens for dialog surfaces, borders, buttons, and scrims.

## 8. Out of scope
Forbidden phantom features:
- No rich-text WYSIWYG editors, file upload dropzones, or audio recording widgets in task forms.
- No multi-step wizard dialogs for tasks.
- No recurring task rules (daily, weekly, custom cron).
- No animated confetti or sound effects on task completion.
