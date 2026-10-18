# Project Settings Screen Visual Review

- **Evaluator:** Antigravity Agent
- **Target Component:** `ProjectSettingsPage` (`projects/[id]/settings`), `MemberManager`, `ProjectForm`, `Dialog`
- **Reference Assets:** `docs/design/stitch/project-settings/desktop.png`, `docs/design/stitch/components/desktop.png`
- **Design System Asset:** `1a5a2e35161d4ae380dd76682a769e88`

---

## Evaluation Against RUBRIC.md (11 Points)

| # | Criterion | Score | Evaluation Details |
|---|---|:---:|---|
| 1 | **[حرج] Visual Hierarchy** | 1 | Clear three-tiered hierarchy: 1) General Settings card with project metadata form, 2) Team Members management card with active count pill and add form, 3) Danger Zone card isolated at bottom with high-contrast alert styling. |
| 2 | **[حرج] Singular Primary Action** | 1 | "Save changes" is the primary action in the metadata form; member addition is a separate scoped button; "Delete project" is deliberately styled as an isolated red destructive button. |
| 3 | **Consistent Spacing Grid** | 1 | Base 8px rhythm throughout (24px card padding, 16px field gaps, 8px member row spacing). |
| 4 | **Typographic Discipline** | 1 | Restrained Inter typography; Section headers in `--font-display`, labels and helper text in `--font-body`, member counts and badges in `--font-mono`. |
| 5 | **Restrained Color Palette** | 1 | Executive Precision tokens: `--surface`, `--card-bg`, `--accent` (#0d5c5a), `--border`. Danger zone utilizes `--st-overdue-bg` and `--st-overdue-fg`. |
| 6 | **[حرج] Contrast & Semantic State Representation** | 1 | Text contrast ≥ 5:1 across all surfaces; Owner badge highlighted with distinct amber/gold background and dark amber text; danger actions use red outline and high-contrast red fill. |
| 7 | **[حرج] Application Shell & Sidebar** | 1 | Fully hosted within the responsive `AppShell` with breadcrumb navigation back to project workspace. Only project owner can access settings. |
| 8 | **Appropriate Density & Scaled Roundness** | 1 | 4px inputs (`--radius-sm`), 6px buttons (`--radius-md`), 8px cards (`--radius-lg`), circular avatar containers. |
| 9 | **Engineered Empty, Loading, and Error States** | 1 | `MemberManager` displays inline error if unknown user email entered; delete confirmation dialog traps focus and explains consequences (irreversible action and cascade deletion); loading spinners on mutations. |
| 10 | **Zero Phantom Features** | 1 | Zero phantom features: no RBAC permission matrix editors (admin/lead/observer fake roles), no project transfer ownership wizard, no billing tier warnings. |
| 11 | **RTL Mirroring & Logical Layouts** | 1 | Strict CSS Logical Properties (`inline-size`, `margin-block`, `padding-inline`). User member names in `<bdi>`. Member removal buttons pinned to `inline-end`. |

**Total Score: 11 / 11** (Threshold: ≥ 9/11 with 0 critical items failing) — **PASSED**.
