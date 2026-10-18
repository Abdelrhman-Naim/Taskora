# Design Brief: Project Settings (`/projects/[id]/settings`)

## 1. Purpose
Administrative console for project owners to modify project metadata, manage team collaborators (add/remove members), and access the destructive project deletion zone.

## 2. Data
- **Project Metadata:**
  - `name`: string (1-100 characters)
  - `description`: string (optional, up to 500 characters)
  - `ownerId`: string
- **Team Members:**
  - `memberIds`: array of user IDs
  - `memberNames`: dictionary of `{ [uid: string]: displayName }`
- **Member Task Assignments Count:** Number of active tasks assigned to each member (queried dynamically to warn during removal).

## 3. Actions
- **Edit Project Information:** Update name and description; save changes via primary button.
- **Add Team Member:** Enter user's email address in an inline form and click "Add member".
- **Remove Team Member:** Click "Remove" button next to a collaborator (opens confirmation modal stating number of tasks that will be unassigned).
- **Delete Project:** Click destructive "Delete project" in Danger Zone (opens confirmation modal requiring explicit confirmation).
- **Back Navigation:** Link back to `/projects/[id]`.

## 4. States
- **Loading:** Skeleton form and member list placeholders.
- **Saving / Submitting:** Buttons display pending states; inputs disabled during network mutation.
- **Success Toast:** Accessible toast notification on successful metadata update or member modification.
- **Error States:** Inline form errors (e.g. user with email not found, cannot remove project owner, network error).
- **Unauthorized:** For non-owners navigating directly to settings, display permission-denied notice with redirect to project page.

## 5. Layout requirements
- **Shell:** Inside standard Application Shell (Sidebar + Top Bar).
- **Header:** Back button, Page title "Project Settings", project subtitle.
- **Section 1 (General Information):** Card containing Project Name input, Description textarea, and "Save changes" button.
- **Section 2 (Team Management):** Card containing:
  - Add Member form (Email input + "Add member" button).
  - Member list table/rows showing initials avatar, display name, role badge ("Owner" vs "Member"), and "Remove" button (disabled or hidden for owner).
- **Section 3 (Danger Zone):** Distinct red/destructive accented card with clear warning copy and a destructive "Delete this project" button.

## 6. Responsive
- **Desktop (≥ 1024px):** Structured max-width container (~56rem / 896px) with clean card separations.
- **Tablet (768px - 1023px):** Fluid container with 2rem margins.
- **Mobile (320px - 767px):** Full-bleed mobile cards, stacked form controls, touch targets ≥ 44px.

## 7. i18n & Theme
- **Bilingual:** All section headings, input labels, confirmation warnings, and danger alerts localized in Arabic (RTL) and English (LTR).
- **Dual Themes:** Danger zone uses subtle crimson wash (`error_container`) in light mode and deep muted crimson border in dark mode with AA text contrast.

## 8. Out of scope
Forbidden phantom features:
- No granular permission role matrices (Taskora has two clear roles: Owner and Member).
- No invite link generation or temporary guest access tokens.
- No project export (CSV/JSON/PDF) or archiving workflows.
- No Slack/Webhook integration settings.
- No custom branding or color picker settings for projects.
