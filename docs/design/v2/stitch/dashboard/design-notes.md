# Taskora Dashboard v2 ("Obsidian Ledger") — Approved Design Notes

> **Document Status:** FROZEN AND APPROVED.
> **Stitch Project:** `Taskora v2 — Obsidian Ledger` (`projects/1925018263022126574`)
> **Source Screens:**
> - Desktop Dark: `a9f2eac7efcc45c4ac7ca2636d45d99b` (`desktop-dark.png`)
> - Desktop Light: `91538f4a52b34723b92a0a0d42dddc04` (`desktop-light.png`)
> - Mobile: `730ce2563bc6427f98ffc54810c11cbf` (`mobile.png`)

---

## 1. Required Regions & Mandatory `data-testid` Mapping

All components implementing the v2 Dashboard MUST render the following `data-testid` attributes in the exact visual order below:

| Region / Component | `data-testid` | Visual Role & Structure |
|---|---|---|
| **Navigation Sidebar** | `app-sidebar` | Persistent 264px near-black navigation rail (`#11100E`). Contains Taskora monogram, Dashboard link with 1px start-edge champagne hairline rule (`inset-inline-start`), Projects list with live counts, primary `+ New project` button, and user profile card. |
| **Top App Bar** | `app-topbar` | Minimalist header displaying section title ("Dashboard"), Language switcher (`EN / العربية`), Theme switcher, and user avatar. Mobile view includes ☰ drawer trigger. |
| **Hero Metric Numeral** | `hero-metric` | Single dominant completion percentage (`87%`) set in `Fraunces` display serif with lining/tabular numerals. Subtly divided by a 1px champagne rule (`#D4B26E`). Displays `0%` when total tasks === 0 (never `NaN%`). Sub-breakdown: `Open 41 · In progress 12 · Overdue 3`. |
| **KPI Ledger** | `kpi-ledger` | High-density tabular strip divided by hairlines (`#2C2824` / `#DDDAD3`), NOT rounded card soup. |
| **Tasks by Project Chart** | `chart-tasks-by-project` | Horizontal proportional distribution bars for top 6 projects (warm gray `#3A352F` with single champagne highlight `#D4B26E`). Supports accessible data table view. |
| **Due Timeline Chart** | `chart-due-timeline` | 14-day upcoming commitment bar chart with dedicated Overdue column. Supports accessible data table view. |
| **Needs Attention Ledger** | `needs-attention` | Urgent exceptions ledger separated by hairlines. Overdue tasks highlighted with warm coral `#EE8A78` badge. |
| **My Tasks Ledger** | `my-tasks` | Focused ledger of open tasks assigned to the active user (`assigneeId === uid`), ordered by due date. |
| **Projects Ledger** | `projects-ledger` | Continuous tabular ledger with sortable columns: Project Name, Role (Owner/Member), Member Initials stack, Progress %, Open count, Overdue count, and Last updated. |
| **Recently Updated Log** | `recently-updated` | Subtle chronological activity stream showing modified tasks with timestamps and member initials. |
| **Onboarding Empty State** | `onboarding` | 3-step setup guide rendered strictly when the user belongs to zero projects. |

---

## 2. Palette & Surface Tokens

### Dark Mode (Primary Baseline)
- **Canvas Base:** `--bg: #0C0B0A`
- **Standard Surfaces:** `--surface: #141211`
- **Raised Surfaces (Max 2):** `--surface-raised: #1C1A17`
- **Overlay Surfaces (Modals):** `--surface-overlay: #26231F`
- **Hairline Rules:** `--line: #2C2824`, `--line-strong: #3A352F`
- **Primary Text:** `--text: #EFE9DD` (Warm Ivory)
- **Secondary Text:** `--text-2: #B5AC9C` (Muted Sand)
- **Tertiary Metadata:** `--text-3: #9A9183` (Warm Slate)
- **Brand Accent:** `--accent: #D4B26E` (Champagne Gold), `--on-accent: #1A1408`
- **Status Semantic Identifiers:**
  - Todo: `--st-todo-fg: #B3AC9E`
  - In Progress: `--st-progress-fg: #8DB4E8`
  - Done: `--st-done-fg: #9CC5A1`
  - Overdue: `--st-overdue-fg: #EE8A78`
- **Sidebar:** `--sidebar-bg: #11100E`, `--sidebar-text: #EFE9DD`

### Light Mode ("Pearl & Bronze")
- **Canvas Base:** `--bg: #F4F4F2`
- **Surfaces:** `--surface: #FFFFFF`, sunken wells `--surface-sunken: #EDECE8`
- **Hairline Rules:** `--line: #DDDAD3`
- **Primary Text:** `--text: #1B1915`, Secondary `--text-2: #5A5348`, Tertiary `--text-3: #736B5E`
- **Brand Accent (Bronze):** `--accent: #7A5818` (text/buttons, contrast 6.49:1), `--accent-line: #B88A3A`
- **Status Identifiers:** Todo `#6B655A`, In Progress `#2D5FA8`, Done `#2F6B3F`, Overdue `#B3402E`
- **Sidebar:** **Remains dark `--sidebar-bg: #11100E`** with `--sidebar-text: #EFE9DD`.

---

## 3. Typographic Scale

- **Display & Page Headlines:** `Fraunces` variable serif (`font-optical-sizing: auto; font-variant-numeric: lining-nums tabular-nums`).
- **Body & Controls:** `Instrument Sans` (`400`, `500`, `600`).
- **Arabic Script:**
  - Headlines & Hero Numeral: `Amiri`
  - Body & Controls: `IBM Plex Sans Arabic`
  - Numerals in Arabic context: Latin tabular digits (`latn`).

---

## 4. Responsive & Bidirectional Architecture

- **Desktop (≥ 1280px):** 264px fixed sidebar, 12-column workplane, 2-column charts, continuous tabular data grid.
- **Tablet (768px - 1023px):** Off-canvas drawer navigation, stacked or fluid chart panels, compact table rows.
- **Mobile (< 768px):** Single vertical stream. Sidebar converts to focus-trapped drawer (`role="dialog"`). Projects ledger converts to stacked cards with hairlines. Minimum touch target 44px. Zero horizontal overflow (`overflow-x: hidden`).
- **Bidirectional Parity:** Complete mirroring via logical properties (`margin-inline-start`, `padding-inline-end`, `inset-inline-start`). In Arabic (`dir="rtl"`), the sidebar is docked on the right and the champagne active indicator sits on the right edge.
