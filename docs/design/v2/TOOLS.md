# Stitch MCP Tools Schema & Protocol Reference

This document records the exact parameters, conventions, and schemas of the 15 tools provided by the `StitchMCP` server for Taskora v2 (`Taskora v2 — Obsidian Ledger`).

---

## 1. Tool Index & Resource ID Conventions

> **CRITICAL RULE ON IDS:**
> - Resource-based tools (`get_project`, `get_screen`) expect a full resource name `name`: `"projects/{projectId}"` or `"projects/{projectId}/screens/{screenId}"`.
> - Generation and manipulation tools (`upload_design_md`, `create_design_system`, `create_design_system_from_design_md`, `apply_design_system`, `generate_screen_from_text`, `generate_variants`, `edit_screens`, `list_screens`, `list_design_systems`) take `projectId` **WITHOUT** the `projects/` prefix (e.g. `"9219100436315328520"`).
> - Screen ID lists (`selectedScreenIds`) take IDs **WITHOUT** the `screens/` prefix.
> - Asset IDs (`assetId`) take IDs **WITHOUT** the `assets/` prefix.

---

## 2. Detailed Schemas of the 15 Tools

### 1. `create_project`
- **Description:** Creates a new Stitch project container for UI designs and code.
- **Parameters:**
  - `title` *(string, optional)*: The title of the project (e.g. `"Taskora v2 — Obsidian Ledger"`).

### 2. `get_project`
- **Description:** Retrieves details, theme settings, screens, and design systems for a specific Stitch project.
- **Parameters:**
  - `name` *(string, required)*: Format: `projects/{projectId}`.

### 3. `list_projects`
- **Description:** Lists all accessible Stitch projects with metadata, theme, and thumbnails.
- **Parameters:** None required.

### 4. `delete_project`
- **Description:** Deletes a Stitch project.
- **Parameters:**
  - `name` *(string, required)*: Format: `projects/{projectId}`.

### 5. `upload_design_md`
- **Description:** Uploads a `DESIGN.md` file to a Stitch project to prepare for design system extraction.
- **Parameters:**
  - `projectId` *(string, required)*: Project ID without `projects/` prefix.
  - `designMdBase64` *(string, required)*: Base64-encoded UTF-8 content of `DESIGN.md`.

### 6. `create_design_system_from_design_md`
- **Description:** Creates and applies a design system derived from the uploaded `DESIGN.md`.
- **Workflow:** Must be called immediately after `upload_design_md`.
- **Parameters:**
  - `projectId` *(string, required)*: Project ID without `projects/` prefix.
  - `selectedScreenInstance` *(object, required)*:
    - `id` *(string, required)*: Screen instance ID (from `upload_design_md` result or `get_project`).
    - `sourceScreen` *(string, required)*: Format: `projects/{projectId}/screens/{screenId}`.
  - `deviceType` *(string, optional)*: `MOBILE`, `DESKTOP`, `TABLET`, `AGNOSTIC`.

### 7. `create_design_system`
- **Description:** Directly creates a foundational design system with explicit theme tokens.
- **Parameters:**
  - `projectId` *(string, optional)*: Target project ID without `projects/` prefix.
  - `designSystem` *(object, required)*:
    - `displayName` *(string, required)*
    - `theme` *(object, required)*:
      - `customColor` *(string, required, hex)*: Seed/primary brand color (e.g. `#D4B26E`).
      - `colorMode` *(string, required)*: `LIGHT` or `DARK`.
      - `headlineFont` *(string, required)*: Enum (`EB_GARAMOND`, `PLAYFAIR_DISPLAY`, `BODONI_MODA`, `LITERATA`, `INTER`, etc.).
      - `bodyFont` *(string, required)*: Enum (`IBM_PLEX_SANS`, `HANKEN_GROTESK`, `DM_SANS`, `PLUS_JAKARTA_SANS`, `MANROPE`, etc.).
      - `labelFont` *(string, optional)*: Enum.
      - `roundness` *(string, required)*: `ROUND_FOUR`, `ROUND_EIGHT`, `ROUND_TWELVE`, `ROUND_FULL`.
      - `colorVariant` *(string, optional)*: `FIDELITY`, `NEUTRAL`, `TONAL_SPOT`, etc.
      - `overridePrimaryColor`, `overrideSecondaryColor`, `overrideTertiaryColor`, `overrideNeutralColor` *(hex strings, optional)*.
      - `designMd` *(string, optional)*: Raw markdown content containing YAML frontmatter and design guidelines.
      - `spacing`, `typography` *(objects, optional)*.

### 8. `update_design_system`
- **Description:** Updates an existing design system in a project.
- **Parameters:**
  - `assetId` *(string, required)*: ID of the design system without `assets/`.
  - `projectId` *(string, required)*: Project ID without `projects/`.
  - `designSystem` *(object, required)*: Updated `DesignSystem` object.

### 9. `list_design_systems`
- **Description:** Lists all design systems available in a project or globally.
- **Parameters:**
  - `projectId` *(string, optional)*: Project ID without `projects/`.

### 10. `apply_design_system`
- **Description:** Re-skins chosen screens using the specified design system tokens.
- **Parameters:**
  - `projectId` *(string, required)*: Project ID without `projects/`.
  - `assetId` *(string, required)*: Design system asset ID without `assets/`.
  - `selectedScreenInstances` *(array of objects, required)*: `[{ id, sourceScreen }]`.

### 11. `generate_screen_from_text`
- **Description:** Generates a new screen from a natural language prompt.
- **Parameters:**
  - `projectId` *(string, required)*: Project ID without `projects/`.
  - `prompt` *(string, required)*: Text prompt describing purpose, layout, data, and mood.
  - `deviceType` *(string, optional)*: `DESKTOP` or `MOBILE`.
  - `designSystem` *(string, optional)*: Resource name e.g. `assets/{id}` to enforce consistent design tokens.
  - `modelId` *(string, optional)*: `GEMINI_3_8_FLASH` or `GEMINI_3_5_FLASH_LITE`.

### 12. `generate_variants`
- **Description:** Explores or refines layout/styling variations of existing screens.
- **Parameters:**
  - `projectId` *(string, required)*: Project ID without `projects/`.
  - `selectedScreenIds` *(array of strings, required)*: Screen IDs without `screens/`.
  - `prompt` *(string, required)*: Instructions for variation.
  - `variantOptions` *(object, required)*:
    - `variantCount` *(int, optional, 1-5, default 3)*.
    - `creativeRange` *(string, required)*: `REFINE`, `EXPLORE`, `REIMAGINE`.
    - `aspects` *(array of strings, optional)*: `LAYOUT`, `COLOR_SCHEME`, `IMAGES`, `TEXT_FONT`, `TEXT_CONTENT`.

### 13. `edit_screens`
- **Description:** Applies iterative edits and corrections to existing screens.
- **Parameters:**
  - `projectId` *(string, required)*: Project ID without `projects/`.
  - `selectedScreenIds` *(array of strings, required)*: Screen IDs without `screens/`.
  - `prompt` *(string, required)*: Targeted feedback/modification prompt.
  - `deviceType` *(string, optional)*: `DESKTOP` or `MOBILE`.

### 14. `list_screens`
- **Description:** Returns all screens, thumbnails, HTML downloads, and dimensions in a project.
- **Parameters:**
  - `projectId` *(string, required)*: Format `projects/{projectId}`.

### 15. `get_screen`
- **Description:** Fetches full metadata, screenshot URL, and HTML code bundle for a single screen.
- **Parameters:**
  - `name` *(string, required)*: Format `projects/{projectId}/screens/{screenId}`.

---

## 3. DESIGN.md Standard Format

Stitch expects a markdown document with YAML frontmatter followed by structured markdown sections:

```markdown
---
name: Obsidian Ledger
colors:
  surface: '#141211'
  surface-dim: '#0C0B0A'
  surface-bright: '#1C1A17'
  surface-container-lowest: '#0C0B0A'
  surface-container-low: '#11100E'
  surface-container: '#141211'
  surface-container-high: '#1C1A17'
  surface-container-highest: '#26231F'
  on-surface: '#EFE9DD'
  on-surface-variant: '#B5AC9C'
  outline: '#2C2824'
  outline-variant: '#3A352F'
  primary: '#D4B26E'
  on-primary: '#1A1408'
  primary-container: '#2C2415'
  on-primary-container: '#E2C282'
  secondary: '#B5AC9C'
  on-secondary: '#141211'
  error: '#EE8A78'
  on-error: '#1A0C0A'
  background: '#0C0B0A'
  on-background: '#EFE9DD'
typography:
  display-lg:
    fontFamily: Fraunces
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
  headline-lg:
    fontFamily: Fraunces
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  body-md:
    fontFamily: Instrument Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 4px
  md: 6px
  lg: 10px
  xl: 14px
  full: 9999px
spacing:
  space-xs: 4px
  space-sm: 8px
  space-md: 12px
  space-base: 16px
  space-lg: 24px
  space-xl: 32px
---

## Brand & Style
...
```
