# New Project Creation Screen Visual Review

- **Evaluator:** Antigravity Agent
- **Target Component:** `NewProjectPage` (`projects/new`), `ProjectForm`
- **Reference Assets:** `docs/design/stitch/project-new/desktop.png`
- **Design System Asset:** `1a5a2e35161d4ae380dd76682a769e88`

---

## Evaluation Against RUBRIC.md (11 Points)

| # | Criterion | Score | Evaluation Details |
|---|---|:---:|---|
| 1 | **[حرج] Visual Hierarchy** | 1 | Uncluttered, centered workspace layout: breadcrumbs ("← Dashboard / New project"), title "Create a new project", concise subtitle, and centered elevated card container (`max-w-[576px]`) with input fields and action footer. |
| 2 | **[حرج] Singular Primary Action** | 1 | "Create project" CTA is the single primary button (`--accent`: #0d5c5a); secondary Cancel action is styled as a subtle ghost button. |
| 3 | **Consistent Spacing Grid** | 1 | 8px base rhythm applied strictly (24px card padding, 16px field vertical gap, 40px input block-size). |
| 4 | **Typographic Discipline** | 1 | Restrained Inter typography; Section heading in `--font-display`, input labels in `--font-body`, character guidance and helper text in 0.8125rem. |
| 5 | **Restrained Color Palette** | 1 | Executive Precision tokens: `--surface`, `--card-bg`, `--accent` (#0d5c5a), `--border`. Zero unnecessary saturated hues. |
| 6 | **[حرج] Contrast & Semantic State Representation** | 1 | Input borders and labels achieve ≥ 5:1 contrast against surface; focus ring utilizes high-contrast 2px accent aura; invalid field errors display high-contrast red alert styling. |
| 7 | **[حرج] Application Shell & Sidebar** | 1 | Hosted seamlessly inside `AppShell` with the active "+ New project" nav item selected in the sidebar stream. |
| 8 | **Appropriate Density & Scaled Roundness** | 1 | 4px inputs (`--radius-sm`), 6px buttons (`--radius-md`), 8px card container (`--radius-lg`). |
| 9 | **Engineered Empty, Loading, and Error States** | 1 | Form inputs autofocus appropriately; submit button displays loading spinner on creation; network failure preserves values and shows retry alert. |
| 10 | **Zero Phantom Features** | 1 | Strict phantom feature avoidance: no template picker (Kanban/Scrum/Bug Tracker), no initial member invite row, no avatar uploader, no visibility toggles. |
| 11 | **RTL Mirroring & Logical Layouts** | 1 | 100% CSS Logical Properties (`inline-size`, `margin-block`, `padding-inline`). In RTL Arabic, Cancel and Create Project swap positions logically. |

**Total Score: 11 / 11** (Threshold: ≥ 9/11 with 0 critical items failing) — **PASSED**.
