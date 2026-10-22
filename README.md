# Taskora — Collaborative Project & Task Management

Taskora is an executive-grade, bilingual collaborative project and task management system built with Next.js 16 (Turbopack, App Router), React 19, Firebase Modular SDK (Authentication & Cloud Firestore), Tailwind CSS v4 for page-level orchestration, and accessible CSS Modules with CSS Logical Properties for atomic components.

The visual aesthetic and layout architecture are designed under the **"Obsidian Ledger"** design system, created and verified through the **Google Stitch MCP Design Workflow** and evaluated against a **17-point design rubric**, guaranteeing WCAG 2.1 AA accessibility, seamless English/Arabic bidirectional parity, zero horizontal overflow across all viewports (320px–1280px+), and complete dark/light mode consistency.

---

## Live Deployment & Repository
- **Production URL**: [https://taskora-eta-flame.vercel.app](https://taskora-eta-flame.vercel.app)
- **GitHub Repository**: [https://github.com/Abdelrhman-Naim/Taskora](https://github.com/Abdelrhman-Naim/Taskora)
- **Firebase Project ID**: `taskora-bf729` (Cloud Firestore & Auth enabled)
- **Deployment Platform**: Vercel

---

## Visual Previews

| Light Mode (LTR / Desktop 1280px) | Dark Mode (RTL / Arabic 1280px) |
|---|---|
| ![Dashboard Light](docs/screenshots/02-dashboard.png) | ![Dashboard Arabic](docs/screenshots/phase3/dashboard-desktop-ar-light.png) |

| Task Board & Filtering | Mobile Responsive (375px) |
|---|---|
| ![Task Board](docs/screenshots/03-project-tasks.png) | ![Mobile 375px](docs/screenshots/06-mobile-375px.png) |

Detailed before/after comparison and design evolution are documented in [docs/design/v2/before-after.md](docs/design/v2/before-after.md).

---

## Design System: Obsidian Ledger

Taskora replaces generic SaaS templates with an editorial **financial ledger** paradigm:

### 1. Architectural Principles
- **Ledger Rows, Not Card Soup:** Projects and tasks are rendered as continuous ledger sheets separated by architectural hairlines (`#2C2824` in dark, `#DDDAD3` in light), restricting elevated panels to a maximum of two per screen.
- **Hero Numeral:** A single grand completion percentage metric in high-contrast Fraunces serif underlined with a quiet champagne rule anchors the dashboard.
- **Strict Accent Rationing:** Champagne (`#D4B26E` dark / `#7A5818` light) is strictly rationed to essential touchpoints: the primary action button, the 1px active navigation indicator rule, and single-series chart emphasis.
- **Persistent Obsidian Sidebar:** The docked sidebar remains near-black (`#11100E`) across both Dark and Light modes for consistent executive anchoring.
- **Zero Phantom Features:** No simulated notifications, fake command palettes, or ungrounded upsell widgets; every control binds directly to Firestore data contracts.

### 2. Typographic Palette
- **Headings & KPI Figures:** **Fraunces** variable display serif with `font-variant-numeric: lining-nums tabular-nums`.
- **Interface & Body:** **Instrument Sans** clean modern sans-serif.
- **Arabic Display:** **Amiri** classical serif.
- **Arabic Body:** **IBM Plex Sans Arabic** with Latin numerals (`latn`) for tabular alignment.

### 3. Palette Tokens
| Token | Dark (Obsidian) | Light (Pearl & Bronze) | Purpose |
|---|---|---|---|
| `--bg` | `#0C0B0A` | `#F4F4F2` | Base canvas background |
| `--surface` | `#141211` | `#FFFFFF` | Primary surface container |
| `--surface-raised` | `#1C1A17` | `#FFFFFF` | Elevated dialogs and menus |
| `--line` | `#2C2824` | `#DDDAD3` | Hairline ledger row dividers |
| `--text` | `#EFE9DD` | `#1B1915` | High-contrast primary reading text |
| `--accent` | `#D4B26E` | `#7A5818` | Champagne / Bronze focal accent |
| `--on-accent` | `#1A1408` | `#FFFFFF` | Text on accent buttons (AAA contrast) |
| `--sidebar-bg` | `#11100E` | `#11100E` | Persistent dark sidebar plane |

---

## Key Features & Capabilities

### 1. Application Shell & Navigation
- **Docked Sidebar (Desktop ≥ 1024px):** Fixed navigation with Taskora monogram, live project counters, and user profile card.
- **Responsive Drawer (Mobile < 1024px):** Accessible slide-out dialog (`role="dialog"`, `aria-modal="true"`) with backdrop dismissal, focus trap, and `Escape` key handling.
- **Sticky TopBar:** Context title, Language Switcher, Theme Switcher, and User Profile Menu with avatar and sign-out trigger.

### 2. Executive Dashboard & Metrics
- **Single Hero Numeral:** Live percentage completion rate with hairline rule and ledger metric strip.
- **Accessible HTML/CSS Charts:**
  - **Stacked Bars:** Status breakdown per project with keyboard focus tooltips and an accessible `<table>` alternative toggle.
  - **14-Day Timeline (Column Chart):** Workload timeline highlighting today's deadline and alerting on overdue tasks.
- **Attention Widgets:** "Needs Attention" queue prioritizing overdue and impending tasks, "My Tasks" personalized list, and sortable Projects Ledger table.

### 3. Project & Task Management
- **Multi-View Project Layouts:**
  - **List View:** Dense, structured financial ledger row format with inline status menus.
  - **Board View:** Three-column Kanban (`todo`, `in_progress`, `done`) with HTML5 native drag-and-drop, optimistic status moves, and full touch accessibility via keyboard-accessible `StatusMenu`.
  - **Calendar View:** Fully responsive month grid (Saturday start for Arabic, Sunday start for English) highlighting due dates, overdue items, overflow dialogs, and undated tasks strips.
- **Extended Task Capabilities:**
  - **Checklists:** Up to 20 sub-items with interactive completion checkboxes and progress ratio display (`x/y`).
  - **Labels:** Up to 5 custom labels per task with dedicated label filtering in `FilterBar`.
  - **Recurring Tasks:** Automated rule-based recurrence (`daily`, `weekly`, `monthly`) creating the next iteration upon task completion.
- **Collaborative Task Detail Modal & Comments:**
  - Comprehensive detail dialog with editable checklist, status transitions, clean accessible close button, and metadata inspection.
  - Interactive discussion feed supporting up to 1,000 characters per comment with atomic cascade deletion upon task removal (≤ 400 operations per batch).
- **In-App Notifications & Activity Stream:**
  - Real-time notification bell with unread counters (`onSnapshot`), direct project navigation, and atomic write integration.
  - Chronological project activity feed displaying the latest 50 events with formatted numeric dates (`yyyy/mm/dd`) and user bidi isolation.

### 4. Excel (.xlsx) & CSV Data Export
- **Role-Based Excel Export:** Interactive `.xlsx` export powered by `exceljs` reserved exclusively for the project owner. Team members are prevented from accessing the export button for data sovereignty.
- **Localized Formatting:** Both Arabic and English column headers, dates, priorities, assignees, and checklist progress indicators.
- **CSV Fallback & Security:** Standard CSV export with formula injection guards (neutralizing `=`, `+`, `-`, `@`, `\t`, `\r`), UTF-8 BOM encoding, and CRLF line endings.

### 5. Authentication & Account Recovery
- **Bilingual Identity Rails:** Split-screen authentication layout with localized marketing copy, security badges, and encryption metadata responding to locale direction (`dir="rtl"` / `dir="ltr"`).
- **Forgot Password Flow:** Built-in self-service password reset modal (`ForgotPasswordModal`) communicating directly with Firebase Auth `sendPasswordResetEmail`, featuring input validation, instant email prefilling, and accessible feedback alerts.
- **Secure Registration & Login:** Form validation via Zod schemas, user profile initialization in Firestore, and automatic session persistence.

### 6. Internationalization & Bidirectional Safety
- **Bilingual Parity:** English (`en`, LTR) and Arabic (`ar`, RTL) with 100% key parity across translation dictionaries.
- **Bidirectional Isolation (`<bdi>`):** User-generated text (names, titles, notes) is strictly wrapped in `<bdi dir="auto">` to eliminate bidirectional text spillover.
- **Latin Numerals:** Consistent Latin numbering (`latn`) across Arabic and English for clear data scanning in tables and KPIs.
- **Timezone Safety:** Native `Intl.DateTimeFormat` configured with `Asia/Riyadh` timezone to prevent server/client hydration drift.

### 7. Technical Constraints & Free-Tier (Spark) Architecture
- **Firebase Spark Plan Strict Conformance:** Zero Cloud Functions and zero Firebase Storage used. All interactions are client-side operations orchestrated via Firebase Modular SDK v13.
- **Atomic Operations & Batch Quotas:** All multi-document mutations run atomically in a single `writeBatch` strictly bounded at ≤ 400 operations.
- **Activity Log Security:** Activity entries are validated by Firestore rules for actor identity (`actorId == request.auth.uid` and `actorName == project.memberNames[actorId]`).

---

## Automated Test Matrix & Safety Guards

The project enforces continuous code quality via automated static analysis, unit tests, security rules emulators, and Playwright visual baselines:

| Test Suite | Files | Tests Passing | Test Framework / Environment |
|:---|:---:|:---:|:---|
| **Unit Tests & Static Integrity** | 49 | **336** | Vitest + React Testing Library + jsdom |
| **Firestore Security Rules** | 8 | **82** | Vitest + `@firebase/rules-unit-testing` + Local Firestore Emulator |
| **Service Integration Tests** | 7 | **48** | Vitest + Local Auth & Firestore Emulators |
| **Total Automated Vitest Suite** | **64 files** | **466 tests** | **100% PASS** |
| **Playwright E2E & Matrix** | 10 | **55** | Playwright (20 combos: LTR/RTL × Light/Dark × 3 Viewports + Acceptance) |

### Automated Guards:
- **`no-legacy-palette.test.ts`**: Fails if any legacy color or obsolete font exists.
- **`css-integrity.test.ts`**: Verifies every token exists in `tokens.css` and ensures zero hardcoded color literals outside tokens.
- **`tokens-contrast.test.ts`**: Mathematically computes WCAG 2.1 relative luminance ratios for all tokens in both themes.
- **`i18n-parity.test.ts`**: Enforces 100% dictionary key synchronization and guards against untranslated Latin text in Arabic locale.
- **`i18n-hygiene.test.ts`**: Enforces zero untranslated English strings in Arabic attributes, verified `<bdi>` wrapping, and zero decorative symbol prefixes.
- **`visual.spec.ts`**: Validates zero horizontal overflow on all pages from 375px to 1280px, checks RTL sidebar right-alignment, and runs Axe-core accessibility audits with zero violations.

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

# 3. Unit, Integrity & Safety Tests (336 tests)
npm run test:unit

# 4. Security Rules Tests (82 tests)
npm run test:rules

# 5. Service Integration Tests (48 tests)
npm run test:services

# 6. Playwright Visual Baselines & E2E Suites
npm run test:e2e

# 7. Production Build (Next.js Turbopack)
npm run build
```
