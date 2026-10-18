# Design Brief: New Project Creation (`/projects/new`)

## 1. Purpose
A focused workspace initiation form enabling operators to establish a new collaborative project container with minimal cognitive friction.

## 2. Data
- **Input Fields:**
  - `name`: string (required, 1-100 characters)
  - `description`: string (optional, up to 500 characters)
- **Context:** Current authenticated user becomes the default `owner` (`ownerId === uid`) and first member.

## 3. Actions
- Fill project name and description.
- Submit form via primary "Create project" button.
- Cancel / Back to Dashboard.

## 4. States
- **Default (Idle):** Empty inputs, autofocus on project name field.
- **Submitting (Loading):** Form inputs disabled, submit button shows progress spinner/loading indicator.
- **Validation Error:** Inline validation message if name is empty or exceeds character limits.
- **Submission Error:** Error banner displaying failure reason (e.g. network disconnection) with retry button.

## 5. Layout requirements
- **Shell:** Inside standard Application Shell (Sidebar + Top Bar).
- **Header:** Breadcrumb navigation ("Dashboard / New Project"), clear title "Create a new project", brief subtitle.
- **Form Card:** Cleanly elevated card container (max width ~36rem / 576px):
  - Project Name label, input, and hint.
  - Project Description label, textarea, and character guidance.
  - Action footer with secondary "Cancel" link and primary "Create project" CTA.

## 6. Responsive
- **Desktop (≥ 1024px):** Centered form card in workspace view with generous vertical spacing.
- **Tablet (768px - 1023px):** Fluid layout with 2rem side padding.
- **Mobile (320px - 767px):** Full-bleed form layout, inputs full width, sticky action footer, touch targets ≥ 44px.

## 7. i18n & Theme
- **Bilingual:** Localized labels, placeholders, breadcrumbs, and error messages in Arabic (RTL) and English (LTR).
- **Dual Themes:** Cohesive theme styling matching the global design system.

## 8. Out of scope
Forbidden phantom features:
- No template selection picker (Kanban, Agile, Bug Tracker, Waterfall).
- No initial team member invite step inside the project creation wizard.
- No project icon/avatar picker or project cover photo upload.
- No visibility toggles (Public / Private / Secret).
