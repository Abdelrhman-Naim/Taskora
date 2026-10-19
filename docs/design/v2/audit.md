# Taskora — Visual Audit of Legacy Stitch Project (`9219100436315328520`)

> **Document Purpose:** Systematic visual audit of the legacy Stitch project (`Taskora`, ID `9219100436315328520`) to verify Section 1 of Phase 5 plan (`2026-10-19-taskflow-phase5-total-redesign.md`), establish a concrete "What NOT to Repeat" ledger for every single legacy screen, and guide the v2 "Obsidian Ledger" redesign.

---

## 1. Verification of Section 1 Findings

All findings in Section 1 of the Phase 5 plan have been **100% verified and confirmed** via live Stitch MCP queries (`list_projects`, `get_project`, `list_screens`, `get_screen`) and inspection of downloaded screen assets:

| Section 1 Claim | Live Verification Status | Evidence / Details |
|---|---|---|
| **Project Theme Settings** | **Confirmed** | `colorMode: LIGHT`, `font: INTER`, `headlineFont: INTER`, `bodyFont: INTER`, `labelFont: INTER`, `roundness: ROUND_FOUR`, `customColor: #0d5c5a` (Teal). Project visibility is `PUBLIC`. |
| **Design Systems** | **Confirmed** | 3 design systems (`Executive Precision`, `Taskora Executive Precision`). All lock into Inter, `#0d5c5a`, `#F8FAFC` background, `#FFFFFF` cards, `#E2E8F0` borders, and 4px/6px/8px radii. |
| **Dashboard Variations** | **Confirmed** | 6 dashboard screens (`Executive Dashboard`, `Dark Slate & Teal Dashboard`, `High Density Executive Slate`, `Nordic Titanium Precision`, `Editorial Alabaster & Indigo`, `Mobile Dashboard`). All suffer from identical card-grid structures and inherited typography. |
| **Remaining Screens** | **Confirmed** | Sign In (Desktop x2, Mobile x1), Create Account, Create New Project, Project Settings, Enterprise Cloud Migration Workspace, Primitives & Modal Dialog Showcase. |
| **Missing Screens** | **Confirmed** | **No mobile screen** for Project detail page, **no mobile screen** for Project Settings, and zero screens for Loading Skeleton, Empty states, Error states, or Unauthorized states. |
| **Phantom Features Leakage** | **Confirmed** | DESIGN.md contains `Command Bar & Global Omnisearch (Cmd + K)`, `Tree View -> List View -> Detail Inspector`, and uppercase `Active / Primary Tag`. |

---

## 2. Legacy Screen-by-Screen Audit ("What NOT to Repeat")

All 15 screens/assets downloaded to `docs/design/v2/legacy-screens/` were visually audited:

### 1. `b553077ced31457cb452f170d508dcc4` — Taskora - Executive Dashboard (DESKTOP, 2560x2048)
- **Visuals:** Standard light SaaS dashboard with top nav, 4-column KPI cards (`#FFFFFF` with `#E2E8F0` border), bar charts in teal, and dense task lists.
- **What NOT to Repeat (ما لا نريده):**
  - **No Card Soup:** Do not wrap every metric in identical rectangular cards with 1px gray borders.
  - **No Small Uniform KPIs:** Avoid tiny numbers without typographic drama. v2 requires a massive **Hero Metric** (`Fraunces` tabular serif) anchored by a hairline.
  - **No Overused Teal:** Stop using `#0d5c5a` across cards, badges, and charts.

### 2. `a2edb3bba9ac41f5822988124868f68c` — Taskora - Dark Slate & Teal Dashboard (DESKTOP, 2560x2048)
- **Visuals:** Dark mode attempt using slate `#0B132B` / `#1C2541` with neon teal accents `#0D5C5A` / `#20B2AA`.
- **What NOT to Repeat (ما لا نريده):**
  - **No Cold Cyan/Slate Tones:** Avoid cold bluish-gray slate backdrops and cyan glowing buttons. v2 requires warm, deep obsidian `#0C0B0A` with matte champagne `#D4B26E`.
  - **No Neon Contrast:** High-saturation teal buttons against dark backgrounds look like cyber/crypto dashboards rather than an editorial luxury ledger.

### 3. `61bf652cdc9d4ac69b39872434b1ac25` — Taskora - High Density Executive Slate (DESKTOP, 2560x2048)
- **Visuals:** Cramped 3-column data grid with microscopic text, dense table rows, and repeated card headers.
- **What NOT to Repeat (ما لا نريده):**
  - **No Cluttered Card Clusters:** Do not cram 6 different cards into a single viewport without white space.
  - **No Generic Inter Font:** The entire interface is flattened into corporate Inter sans-serif with zero typographic hierarchy.

### 4. `019e87f469fd452e9a04d1cc56601e32` — Taskora - Nordic Titanium Precision (DESKTOP, 2560x2048)
- **Visuals:** Monochromatic gray/titanium look with light teal highlights and minimal elevation.
- **What NOT to Repeat (ما لا نريده):**
  - **No Dead Gray Surfaces:** Bleak mid-gray containers lack tactile warmth and quiet luxury.
  - **No Card Outlines:** Heavy 1px outline boxes around every small list item ruin visual scanning.

### 5. `26391eec8a7049daacdbd499632edfd7` — Taskora - Editorial Alabaster & Indigo (DESKTOP, 2560x2048)
- **Visuals:** Off-white alabaster background with indigo/teal accents and mixed card elevations.
- **What NOT to Repeat (ما لا نريده):**
  - **No Off-Brand Palette Drift:** Switching between indigo, teal, and slate across screens destroys visual identity.
  - **No Fluffy Drop Shadows:** In v2, depth is expressed through clean surface levels (`--bg` -> `--surface` -> `--surface-raised`), not fuzzy drop shadows.

### 6. `6a3b3188c14b4a90aaab01b3a99f5700` — Taskora - Mobile Dashboard (MOBILE, 780x5152)
- **Visuals:** Stacked vertical list of all desktop cards, very long scrolling height, tiny touch targets.
- **What NOT to Repeat (ما لا نريده):**
  - **No Infinite Card Scroll:** Stacking 12 individual bordered cards vertically creates overwhelming mobile fatigue.
  - **No Cramped Nav Rail:** Mobile navigation must use a dedicated drawer and fluid ledger rows with comfortable touch targets (minimum 44px).

### 7. `9da23100c85943c280118e5880148605` — Taskora - Sign In (DESKTOP, 2560x2048)
- **Visuals:** Floating white modal box centered on an empty gray canvas, single teal CTA button.
- **What NOT to Repeat (ما لا نريده):**
  - **No Generic Floating Box:** A tiny card in the middle of a blank page feels like a template scaffold.
  - **No Missing Brand Presence:** v2 requires an authoritative split layout: deep obsidian brand panel with champagne rule on one side, clean luxury form on the other.

### 8. `05215b979e034f0e9efc1928fa76f4fd` — Taskora - Sign In (Executive Precision) (DESKTOP, 2560x2048)
- **Visuals:** Slight variation of Sign In with small branding text and teal border on active inputs.
- **What NOT to Repeat (ما لا نريده):**
  - **No Redundant Screen Variants:** Duplicate screens clutter the project without providing actual design differentiation.

### 9. `503b39aa905949349929d34332860115` — Taskora - Sign In (Mobile) (MOBILE, 780x1768)
- **Visuals:** Fullscreen mobile sign-in form with teal button and Inter inputs.
- **What NOT to Repeat (ما لا نريده):**
  - **No Raw Input Boxes:** Inputs with plain gray borders feel unfinished. v2 requires refined 6px corners, warm placeholder text, and subtle champagne focus treatment.

### 10. `1e228f8081b84f78874f88373ae4f2f8` — Taskora - Create Account (DESKTOP, 2560x2048)
- **Visuals:** White centered card with email/password/name fields and teal button.
- **What NOT to Repeat (ما لا نريده):**
  - **No Disconnected Flow:** Matches the generic floating box anti-pattern. Must use the cohesive split-panel layout.

### 11. `26bcd12ceb8048a6a9717a1b516a97d5` — Taskora - Create New Project (DESKTOP, 2560x2048)
- **Visuals:** Multi-step wizard dialog with teal progress steps and extensive text inputs.
- **What NOT to Repeat (ما لا نريده):**
  - **No Overly Complex Wizard Modals:** A focused luxury modal with crisp hairline separators and clear champagne primary action is much cleaner.

### 12. `beb42ba49cd04835950ec6817ada0c98` — Taskora - Project Settings (DESKTOP, 2560x2048)
- **Visuals:** Tabbed settings card with member invitations, role dropdowns, and delete project danger zone.
- **What NOT to Repeat (ما لا نريده):**
  - **No Missing Mobile Representation:** This screen had zero mobile counterpart in Stitch.
  - **No Harsh Red Alerts:** Destructive actions should feel deliberate and serious, with warm muted coral (`#EE8A78` / `#B3402E`) rather than fluorescent warning badges.

### 13. `e4c3f9cf1d3a4ae1afb691e6173dc7b8` — Taskora - Enterprise Cloud Migration Workspace (DESKTOP, 2560x2048)
- **Visuals:** Project task board with 3-pane layout, status tags, table view, and detailed inspector sidebar.
- **What NOT to Repeat (ما لا نريده):**
  - **No Phantom Inspector Pane:** The "Detail Inspector" pane on the right does not exist in Taskora's SRS and data model.
  - **No Missing Mobile Design:** No mobile screen was generated for the project workspace.
  - **No Table-in-Card Nesting:** Nesting tables inside bordered cards creates visual box-in-box vibration. v2 uses continuous ledger rows separated by hairline dividers.

### 14. `d98710826556404d9ea67568156db48b` — Taskora - Primitives & Modal Dialog Showcase (DESKTOP, 2560x2924)
- **Visuals:** Component catalog displaying buttons, inputs, badges, and modals.
- **What NOT to Repeat (ما لا نريده):**
  - **No Uppercase Spaced Tags:** UPPERCASE badges with `letter-spacing: 0.04em` look aggressive and corporate.
  - **No Round-4 Pill Confusion:** Inconsistent radii across components. v2 enforces a strict role-based scale: 6px controls, 10px panels, 14px dialogs, 0px sidebar.

### 15. `ba389f9bb53f41cf87b94be45c97ac6a` — Taskora Logo (SVG, 512x512)
- **Visuals:** Stylized teal monogram "T" in a rounded square.
- **What NOT to Repeat (ما لا نريده):**
  - **No Teal Brand Mark:** The brand identity must be migrated from teal `#0d5c5a` to champagne gold `#D4B26E` / ivory `#EFE9DD`.

---

## 3. Core Architectural Takeaways for Taskora v2

1. **Why Patching Failed:**
   The old Stitch project was locked at the project level to `customColor: #0d5c5a`, `font: INTER`, and `roundness: ROUND_FOUR`. Every new screen prompt automatically inherited these attributes regardless of prompt phrasing.
2. **Why a New Stitch Project is Mandatory:**
   Creating `Taskora v2 — Obsidian Ledger` with fresh project-level metadata ensures that all subsequent generations inherit the editorial luxury palette, fonts, and radii from the root.
3. **The Ledger Paradigm:**
   Replace the "Card Soup" (nested white rectangles with gray borders) with continuous editorial rows separated by subtle hairlines (`#2C2824` / `#DDDAD3`), tabular display typography (`Fraunces`), and at most two raised surfaces per screen.
