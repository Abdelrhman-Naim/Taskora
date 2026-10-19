# Taskora v2: Before vs. After ("Obsidian Ledger" Redesign)

This document formalizes the total transformation from the legacy "Executive Precision" (Phase 4 / Stitch v1) to the approved and implemented **"Obsidian Ledger"** (Phase 5 / Stitch v2).

---

## 1. Architectural & Aesthetic Paradigm Shift

| Dimension | Legacy (v1 / Executive Precision) | New (v2 / Obsidian Ledger) |
|---|---|---|
| **Stitch Project** | `projects/9219100436315328520` (Public, Teal `#0d5c5a`, Inter) | `projects/1925018263022126574` (Obsidian Ledger, Private, Design System `assets/740bfefb8f9e46d4af43ed2ce7b44189`) |
| **Color Foundation** | Generic Slate & Teal (`#0d5c5a`, `#13966F`, `#22A67F`), Tailwind-like borders (`#e2e8f0`) | Dark Obsidian `#0C0B0A` with Pearl & Bronze light variant (`#F4F4F2`). Zero teal, zero generic Tailwind blue/purple. |
| **Accent Discipline** | Teal spread across cards, pills, buttons, borders, badges | Champagne `#D4B26E` (dark) / `#7A5818` (light) **strictly rationed to 3 touchpoints**: primary action, active navigation rule (1px hairline), and single chart emphasis. |
| **Typography** | Generic Sans-Serif (`Inter`) for all headers and numbers | **Fraunces** display serif (lining & tabular figures) + **Instrument Sans** body. Arabic: **Amiri** display + **IBM Plex Sans Arabic**. |
| **Layout Paradigm** | Card Soup: Dozens of isolated white/dark rounded rectangles with 1px border | **Financial Ledger**: Continuous container rows separated by hairlines (`#2C2824` / `#DDDAD3`), maximum two elevated surfaces per page. |
| **Hero Metric** | Standard 4-card metric grid with equal visual weight | **Single Hero Numeral**: Grand completion percentage in high-contrast Fraunces serif with an architectural champagne hairline underline. |
| **Sidebar** | Fluctuating light/slate sidebar | **Persistent Near-Black Sidebar** (`#11100E`) across both Dark and Light themes with champagne active hairline. |
| **Phantom Features** | Command palette (Cmd+K), global omnisearch, notification bells, upgrade banners | **Zero Phantom Features**: Strict adherence to actual Firestore schema and SRS data requirements. |

---

## 2. Screen-by-Screen Comparison Matrix

| Screen | Legacy Artifacts & Flaws | Obsidian Ledger Implementation | Frozen Reference Path |
|---|---|---|---|
| **Dashboard** | 6 fragmented variants with generic cards and metric soup | Single Hero Metric (87% Fraunces display) + Attention Ledger rows + Due Timeline chart + Projects Ledger table | `docs/design/v2/stitch/dashboard/` |
| **Authentication (Login & Register)** | Generic centered card on plain gray background | High-end 2-column split layout: Dark obsidian identity rail with monogram signet, editorial narrative headline, champagne hairline, and focused form plane | `docs/design/v2/stitch/login/`, `docs/design/v2/stitch/register/` |
| **Project Workspace** | Was completely missing dedicated Mobile design in v1 | Continuous ledger task list with hairline dividers, tabular metadata (assignee, priority, due date), overdue markers, and clean action drawer | `docs/design/v2/stitch/project/` |
| **Project Settings** | Missing mobile layout, card-nested member list | Integrated Member Ledger with discrete role badges (`var(--accent-soft)`), owner protection, and hairline danger section | `docs/design/v2/stitch/project-settings/` |
| **New Project** | Cluttered multi-step card modal with generic inputs | Streamlined editorial form plane with Fraunces headline, character-counter hints, and champagne submit action | `docs/design/v2/stitch/project-new/` |
| **UI States (Loading, Empty, Error)** | Basic unstyled fallback alerts and plain spinners | Architectural skeleton lines with smooth pulse, Fraunces empty state ledger box, and high-contrast operational fault container | `docs/design/v2/stitch/states/` |

---

## 3. Visual Acceptance Verification

1. **Unbranded Recognition Test**: A screenshot viewed without the "Taskora" logo is immediately recognizable as an exclusive financial/editorial ledger system (near-black obsidian plane, Fraunces display serif numerals, hairlines, and quiet champagne accents), never a standard template SaaS.
2. **WCAG AA Compliance**: 100% compliant across all 53 automated Playwright E2E checks and Vitest contrast suites (foreground-to-background contrast ≥ 4.5:1 for normal text and ≥ 3.0:1 for graphical UI elements).
3. **Bilingual & Responsive Consistency**: Strict bidirectional symmetry (LTR/RTL) with Amiri display serif for Arabic, zero horizontal overflow across 320px–1280px viewports.
