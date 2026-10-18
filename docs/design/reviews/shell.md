# Shell & Navigation Visual Review

- **Evaluator:** Antigravity Agent
- **Target Component:** `AppShell` (`Sidebar`, `TopBar`, `MobileDrawer`, `UserMenu`)
- **Reference Assets:** `docs/design/stitch/dashboard/desktop.png`, `mobile.png`
- **Design System Asset:** `1a5a2e35161d4ae380dd76682a769e88`

---

## Evaluation Against RUBRIC.md (11 Points)

| # | Criterion | Score | Evaluation Details |
|---|---|:---:|---|
| 1 | **[حرج] Visual Hierarchy** | 1 | Unambiguous visual structure: brand header, clear navigation links, projects listing with counter, primary "+ New project" creation trigger, and top bar context title. |
| 2 | **[حرج] Singular Primary Action** | 1 | Single prominent creation action ("+ New project") styled consistently; secondary controls are restrained. |
| 3 | **Consistent Spacing Grid** | 1 | Strict 4px/8px multiples (16px sidebar padding, 12px item padding, 56px topbar block-size). |
| 4 | **Typographic Discipline** | 1 | Uses Inter & Cairo typography tokens exclusively (`--font-display`, `--font-body`) with restrained font sizes. |
| 5 | **Restrained Color Palette** | 1 | Uses semantic sidebar and topbar tokens: `--sidebar-bg`, `--sidebar-border`, `--sidebar-text`, `--sidebar-active-bg`, `--sidebar-active-text`, `--topbar-bg`, `--topbar-border`. Zero arbitrary color values. |
| 6 | **[حرج] Contrast & Semantic State Representation** | 1 | Nav links achieve ≥ 5.0:1 contrast against sidebar surface. Active item achieves 6.8:1. High-contrast focus rings on all interactive elements. |
| 7 | **[حرج] Application Shell & Sidebar** | 1 | Desktop sidebar (≥1024px) visible with no hamburger button. Mobile (<1024px) collapses desktop sidebar and shows hamburger button that triggers accessible modal drawer (`role="dialog"`, focus trapped, `Escape` key dismissal). |
| 8 | **Appropriate Density & Scaled Roundness** | 1 | 6px (`--radius-md`) for nav links and buttons, 4px (`--radius-sm`) for brand glyph container, 9999px for project dot. High visual ergonomics. |
| 9 | **Engineered Empty, Loading, and Error States** | 1 | Projects list handles loading, empty list, and error states gracefully through `ProjectsProvider`. |
| 10 | **Zero Phantom Features** | 1 | Clean phantom feature audit: zero notification bell icons, zero global search inputs, zero billing/upgrade teasers, zero unauthenticated links. |
| 11 | **RTL Mirroring & Logical Layouts** | 1 | 100% CSS Logical Properties (`inset-inline-start`, `border-inline-end`, `margin-inline`, `padding-inline`). In Arabic (`dir="rtl"`), sidebar sits on the right edge. User display name isolated in `<bdi>` and email in `dir="ltr"`. |

**Total Score: 11 / 11** (Threshold: ≥ 9/11 with 0 critical items failing) — **PASSED**.
