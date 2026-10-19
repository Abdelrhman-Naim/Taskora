# Design Brief: Dashboard (`/dashboard`) — Obsidian Ledger

## 1. Purpose
The primary command center for authenticated Taskora operators and managers. It delivers a high-density, calm executive overview of tasks, upcoming deadlines, project progress, and urgent items across all workspace projects, styled as an editorial luxury private ledger ("Obsidian Ledger").

## 2. Data
Aggregated directly from Firestore via `src/types/index.ts` and `src/lib/dashboardMetrics.ts`:
- **Current User:** `uid`, `displayName`, `email`
- **Hero & KPI Metrics (`computeMetrics`):**
  - `total`: number of tasks
  - `open`: count of non-completed tasks
  - `inProgress`: count of tasks with status `in_progress`
  - `completed`: count of tasks with status `done`
  - `completionRate`: percentage `0..100` (`0%` when `total === 0`, never `NaN%`)
  - `overdue`: count of non-completed tasks where `dueDate < today`
  - `dueThisWeek`: open tasks due between `today` and `today + 6 days`
- **Charts:**
  - *Tasks by Project (`topProjectsByOpen`)*: Up to top 6 projects sorted by open count, with segmented counts for `todo`, `in_progress`, and `done`.
  - *Due Timeline (`dueTimeline`)*: Overdue count column plus 14 daily buckets (`{ date, count, isToday }`).
- **Lists & Tables:**
  - *Needs Attention (`needsAttention`)*: Top 6 urgent tasks categorized as `overdue` (with days overdue), `today`, or `tomorrow`.
  - *My Tasks (`myTasks`)*: Open tasks assigned to current user `assigneeId === uid`, ordered by due date.
  - *Projects Ledger (`summarizeProjects`)*: All accessible projects with fields `name`, `role` (`owner` | `member`), member initials avatar stack (`memberNames`), `progress` (0..100%), `open`, `overdue`, `updatedAt` (formatted date).
  - *Recently Updated (`recentlyUpdated`)*: Top 5 recently modified tasks with relative timestamp.

## 3. Actions
- Navigate between workspace sections (Dashboard, individual Projects).
- "+ New project" action (primary trigger in sidebar and header, links to `/projects/new`).
- Table search by project name and column header sorting (`aria-sort`).
- Quick row navigation to `/projects/[id]`.
- Top bar actions: Language toggle (EN / AR), Theme toggle (Light / Dark / System), User menu with Logout trigger.
- Toggle between Chart view and accessible data Table view for charts.

## 4. States
- **Loading:** Dedicated `DashboardSkeleton` preserving the exact layout structure of the hero metric, KPI ledger, charts, and table (zero full-page blanking or generic spinners).
- **Empty (Onboarding):** Rendered when the user belongs to 0 projects (`OnboardingEmpty` with 3 guided steps to create first project, invite team members, and add tasks).
- **Error:** Localized `ErrorState` with clear Arabic/English failure explanation and an accessible "Retry" button.
- **Empty Filter/Search:** When projects ledger search yields 0 matches, display inline empty feedback with clear query reset.

## 5. Layout requirements
- **Sidebar (`data-testid="app-sidebar"`):** Permanent 264px near-black navigation (`#11100E`) on screens ≥ 1024px, with a 1px champagne hairline marking the active item (`inset-inline-start`). Contains Taskora logo, Dashboard link, Projects section with live open task badges, primary "+ New project" button, and user card.
- **Top Bar (`data-testid="app-topbar"`):** Section title ("Dashboard"), Language selector, Theme selector, User Menu. On screens < 1024px, includes a ☰ hamburger trigger opening the focus-trapped drawer.
- **Header:** Welcome greeting with user's display name inside `<bdi>`, today's date formatted according to active locale, and "+ New project" trigger.
- **Hero Numeral (`data-testid="hero-metric"`):** Massive completion percentage set in `Fraunces` high-contrast display serif, anchored by a thin 1px champagne divider rule beneath. Displays `0%` when no tasks exist (never `NaN%`). Shows tabular breakdown of Open, In Progress, and Overdue tasks.
- **KPI Ledger (`data-testid="kpi-ledger"`):** High-density tabular strip with hairline dividers (`#2C2824`), not card soup.
- **Charts Row:** Two side-by-side analytical panels (`data-testid="chart-tasks-by-project"` and `data-testid="chart-due-timeline"`), with restrained warm-gray and champagne palettes and accessible table switchers.
- **Operational Row:** Two side-by-side ledger modules (`data-testid="needs-attention"` and `data-testid="my-tasks"`).
- **Projects Summary Section (`data-testid="projects-ledger"`):** Continuous ledger rows separated by hairlines with search, sorting, avatar stacks, and progress indicators.
- **Activity Section (`data-testid="recently-updated"`):** Stream of recently modified tasks.

## 6. Responsive
- **Desktop (≥ 1280px):** 12-column grid, persistent sidebar (264px), two-column chart grid, comprehensive tabular projects ledger.
- **Tablet (768px - 1023px):** Collapsed/drawer navigation, 2-column or stacked charts, scroll-safe or compact tabular layout.
- **Mobile (320px - 767px):** Single vertical stream. Sidebar converts to off-canvas modal drawer (`role="dialog"`). Projects ledger shifts to stacked card layout. Minimum touch target 44px, safe area insets respected, 0 horizontal overflow.

## 7. i18n & Theme
- **Bilingual:** Full bidirectional parity between English (`en`, LTR) and Arabic (`ar`, RTL). Textual alignment using `text-align: start`. Directional indicators mirror naturally. User generated content wrapped in `<bdi dir="auto">`. Arabic headlines in `Amiri`, body in `IBM Plex Sans Arabic`.
- **Dual Themes:** Primary dark mode ("Obsidian Ledger": `#0C0B0A` canvas, `#141211` surface, `#D4B26E` champagne) and light mode ("Pearl & Bronze": `#F4F4F2` canvas, `#FFFFFF` surface, `#7A5818` bronze). Sidebar is near-black `#11100E` in both themes.

## 8. Out of scope
Explicitly forbidden features per Phantom Features Audit:
- No notification bell icon or activity drop-down list.
- No global omnisearch across all platform entities (search is confined to projects table).
- No billing, subscriptions, pricing plans, or upgrade prompts.
- No growth rates or trend indicators (e.g. "+12% vs last month").
- No historical time-series analytics (burndown, completion velocity over months).
- No chat, team messaging, task comments, or live presence indicators.
- No calendar views, Gantt charts, or board view toggles on dashboard.
- No Detail Inspector third-column pane.
