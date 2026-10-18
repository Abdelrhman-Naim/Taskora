# TaskFlow — Collaborative Project & Task Management

TaskFlow is a collaborative project and task management system designed for small teams, built with Next.js App Router, Firebase Modular SDK (Auth & Firestore), CSS Modules with CSS Logical Properties (strictly zero Tailwind CSS), bilingual Arabic/English internationalization, accessible HTML/CSS charts, and a petrol/jade dark/light theme system.

---

## Deployment & Repository
- **Live Production URL**: [https://taskora-eta-flame.vercel.app](https://taskora-eta-flame.vercel.app)
- **GitHub Repository**: [https://github.com/Abdelrhman-Naim/Taskora](https://github.com/Abdelrhman-Naim/Taskora)
- **Firebase Project ID**: `taskora-bf729` (Cloud Firestore & Auth enabled)
- **Deployment Platform**: Vercel

---

## Features

### Application Shell & Navigation (Phase 3)
- **Desktop Sidebar**: Fixed inline-start sidebar (264px–280px) on viewports > 1024px with quick project switching, dashboard link, and new project action.
- **Mobile Drawer**: Focus-trapped sliding modal drawer (`role="dialog"`) on mobile screens (≤ 1024px) triggered by hamburger button and dismissible via `Escape` or backdrop click.
- **Top Bar**: Sticky header featuring the current section title, Language Switcher (`LocaleSwitcher`), Theme Toggle (`ThemeToggle`), and a keyboard-accessible User Profile Menu (`UserMenu`).
- **User Profile Menu**: Dropdown displaying user initials avatar, display name, LTR email address, and sign out trigger.

### Professional Dashboard & Metrics
The dashboard consolidates all team projects and assignments using a pure, single source of truth (`dashboardMetrics.ts`):
- **KPI Strip**: 5 continuous metric cells:
  - **Open tasks**: Active tasks (`status !== 'done'`).
  - **In progress**: Tasks currently being worked on (`status === 'in_progress'`).
  - **Completed**: Finished tasks (`status === 'done'`) with percentage done rate (`Math.round(done / total * 100)`).
  - **Overdue**: Overdue tasks (`dueDate < today` and `status !== 'done'`) with warning icon and alert styling.
  - **Due this week**: Tasks due within the current rolling window `[today, today + 6 days]`.
- **Accessible HTML/CSS Charts**:
  - **Stacked Bars**: Status distribution per project with relative segment widths, keyboard focus tooltip, and toggleable accessible `<table>` alternative.
  - **14-Day Due Timeline**: Column chart showing upcoming due tasks per day, highlighting today and calling out overdue tasks.
- **Action & Attention Widgets**:
  - **Needs Attention**: Overdue tasks prioritized by oldest due date first, followed by tasks due today and tomorrow.
  - **My Tasks**: Open tasks assigned directly to the authenticated user, prioritized by deadline.
  - **Projects Table**: Sortable and searchable table with progress bars, member avatar clusters, and responsive collapse to stacked cards at ≤ 768px.
  - **Recently Updated**: Chronological feed of tasks ordered by latest update timestamp.
  - **Onboarding Empty State**: 3-step numbered onboarding guide for new teams with no existing projects.

### Internationalization & RTL Hygiene
- **Bilingual Parity**: Arabic (`ar`, RTL) and English (`en`, LTR) with 100% dictionary key parity.
- **Locale Negotiation**: Determined from cookie (`tf-locale`) or `Accept-Language` header, defaulting to `en` if unspecified.
- **Latin Numerals Consistency**: Both languages render Latin digits (`NUMBERING = 'latn'`) for reliable numeric scanning in charts and KPIs.
- **Bidirectional Isolation (`<bdi>`)**: All user-supplied text (project names, task titles, descriptions) is wrapped in `<bdi dir="auto">` to eliminate bidirectional text spillover. Technical identifiers and emails are strictly isolated in `dir="ltr"`.
- **Timezone-Safe Dates**: All date arithmetic and formatting uses the fixed timezone `Asia/Riyadh` via native `Intl.DateTimeFormat`.

### Theming & Design System
- **Petrol & Jade Palette**:
  - Light mode: Warm porcelain canvas (`--bg: #F4F5F2`), white surfaces (`--surface: #FFFFFF`), jade accent (`--accent: #0E6B5C`), and brass hairline accent (`--brass: #B08D45`).
  - Dark mode: Deep petrol canvas (`--bg: #0A1514`), dark teal surfaces (`--surface: #101F1D`), mint accent (`--accent: #5CCBAE`), and bright brass accent (`--brass: #C9A55A`).
- **Zero Hardcoded Colors**: Enforced by automated AST tests; every color derives strictly from CSS variables defined in `src/styles/tokens.css`.
- **WCAG AA Contrast**: Enforced by automated contrast calculation tests (minimum 4.5:1 for text, 3:1 for controls).
- **Zero-Flash Theme Switching**: Handled via `tf-theme` cookie with client-side reconciliation.

### UI Primitives Library (`src/components/ui/`)
21 hand-crafted, accessible primitives built strictly with CSS Modules and CSS Logical Properties:
1. **Avatar**: Bilingual initial generation (up to 2 initials, supporting Arabic script like "أحمد محمد" → "أم"), `--surface-2` background.
2. **Badge**: Status and priority indicators with distinct icons for color-blind accessibility.
3. **Button**: Primary, secondary, outline, danger, and ghost variants; accessible loading and disabled states.
4. **Card**: Surface container with soft border and subtle hover feedback.
5. **Checkbox**: Accessible custom checkbox with hidden native input and high-contrast SVG checkmark.
6. **ConfirmDialog**: Confirmation modal for critical actions.
7. **Dialog**: Accessible modal dialog with focus trapping, `Escape` key dismissal, and backdrop click handler.
8. **EmptyState**: Empty collection indicator with title, message, and call-to-action button.
9. **ErrorState**: Failure recovery state with retry trigger.
10. **Field**: Accessible form field wrapper connecting label, hint, and error message to input.
11. **Icon**: 14 hand-crafted inline SVG icons with automatic RTL mirroring (`.dirIcon`).
12. **IconButton**: Accessible square icon button with tooltip and ARIA label.
13. **Input**: Text, email, and password inputs with start alignment and focus ring.
14. **LocaleSwitcher**: Segmented language selector with cookie persistence.
15. **ProgressBar**: Accessible percentage progress track (`role="progressbar"`).
16. **Segmented**: Segmented control for toggling views or chart modes.
17. **Select**: Dropdown select with start alignment and custom styled chevron.
18. **Skeleton**: Layout-identical loading skeleton with pulsing shimmer animation.
19. **Spinner**: Accessible loading spinner with screen-reader text.
20. **Textarea**: Auto-resizing multiline text input.
21. **Toast**: Ephemeral feedback notification provider and hook.

---

## Automated Safety & Integrity Guards

TaskFlow enforces strict code hygiene through automated static analysis and unit tests:
1. **`css-integrity.test.ts`**:
   - Asserts every `var(--*)` used across all CSS and TSX files is explicitly declared in `tokens.css`.
   - Asserts zero hardcoded hex, rgb, rgba, or hsl colors exist anywhere outside `tokens.css`.
   - Asserts light and dark theme blocks in `tokens.css` declare identical variable sets.
2. **`i18n-hygiene.test.ts`**:
   - Asserts zero untranslated English strings exist in Arabic UI attributes or JSX literals.
   - Asserts dynamic user text in task cards and tables is properly isolated with `<bdi>`.
   - Asserts forbidden decorative prefixes (such as `+ ` or `•`) are absent.
3. **`tokens-contrast.test.ts`**:
   - Calculates real WCAG 2.1 relative luminance for all token pairs in both light and dark themes to guarantee AA compliance (≥ 4.5:1 text contrast).
4. **`i18n-parity.test.ts`**:
   - Verifies 100% key parity between English and Arabic message dictionaries.

---

## Test Evidence & Automated Test Matrix

The test suite contains **283+ automated tests** with 100% PASS rate:

| Test Suite | Files | Tests Passing | Environment |
|:---|:---:|:---:|:---|
| **Unit Tests & Integrity Guards** | 29 | **197** | Vitest + React Testing Library + jsdom |
| **Firestore Security Rules** | 5 | **46** | Vitest + `@firebase/rules-unit-testing` + Local Emulators |
| **Service Integration Tests** | 4 | **22** | Vitest + Local Auth & Firestore Emulators |
| **Acceptance & E2E Tests** | 3 | **18+** | Playwright (Phase 1 Acceptance + Phase 2 i18n/Theme + Phase 3 Dashboard) |
| **Total** | **41 files** | **283+ tests** | **100% PASS** |

---

## Local Development & Testing

### Prerequisites:
- **Node.js**: v20.x, v22.x or v24.x
- **Java**: Java 21+ (required for Firebase Local Emulator Suite)

```bash
# 1. Install dependencies
npm install

# 2. Typecheck & Lint
npm run typecheck
npm run lint

# 3. Unit, Integrity & Safety Tests (197 tests)
npm run test:unit

# 4. Security Rules Tests (46 tests)
npm run test:rules

# 5. Service Integration Tests (22 tests)
npm run test:services

# 6. Full E2E & Visual Matrix (Playwright)
npm run test:e2e

# 7. Production Build (Next.js Turbopack)
npm run build
```
