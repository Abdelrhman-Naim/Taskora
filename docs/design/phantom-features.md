# Phantom Features Audit & Rejection Registry

Google Stitch and large multimodal UI generators frequently hallucinate decorative or enterprise-standard components that do not exist in the Taskora data model or backend architecture.

**Rule:** Every screen generated or implemented must be audited against this registry. Any feature listed as forbidden below **must never be implemented in `src/`**.

---

## Phase 6 Promoted Features (Now Real Features)

The following features were formerly phantom and are **officially implemented in Phase 6**:
1. **In-App Notification Bell & Dropdown:** Real-time user notifications subcollection at `users/{uid}/notifications`.
2. **Project Activity Log:** Audit feed subcollection at `projects/{pid}/activity`.
3. **Task Discussion & Comments:** Task comment thread subcollection at `projects/{pid}/tasks/{tid}/comments`.
4. **Task Board (Kanban) & Calendar Views:** Interactive 3-column board and monthly calendar grid for tasks.
5. **Checklists, Labels, & Recurrence:** Extended task metadata.

---

## Strictly Forbidden Phantom Features

### 1. Mentions, Emoji Reactions & Real-Time Presence
- **Hallucination:** User @mentions (`@sarah`), emoji reaction pickers on comments, typing indicators, presence avatars ("3 people viewing").
- **Reality:** Global user directory querying is strictly blocked by Firestore security rules. No presence or socket infrastructure exists on the Spark plan.
- **Handling:** Strictly pruned and forbidden.

### 2. Global Omnisearch & Command Palettes
- **Hallucination:** Global search dialog with `Cmd + K` full-text search indexing the entire database.
- **Reality:** Search is strictly local to project task lists and dashboard project tables.
- **Handling:** Pruned from the top bar. Keep only table/list-level filter bars.

### 3. File Attachments & Media Uploads
- **Hallucination:** File dropzones, drag-and-drop document upload, audio notes, camera capture.
- **Reality:** Firebase Storage requires Blaze plan billing. Zero storage or external asset hosting on Spark plan.
- **Handling:** Strictly forbidden.

### 4. Billing, Plans, and Upgrade Banners
- **Hallucination:** "Pro Plan", "Upgrade to Enterprise", "14 days remaining in trial", "Billing settings".
- **Reality:** Taskora is a focused collaborative task manager with no monetization or payment gateways.
- **Handling:** Strictly forbidden.

### 5. Growth Trends, Deltas, & Historical Curves
- **Hallucination:** "+14% vs last week", "Velocity trend", "30-day burndown chart", "Tasks completed over time line chart".
- **Reality:** Live aggregate counts only (stacked horizontal bars, upcoming due date columns). No historical analytics engine.
- **Handling:** Forbidden.

### 6. Arbitrary User Profile Settings
- **Hallucination:** Profile picture upload, phone number, department, bio, 2FA settings, billing addresses.
- **Reality:** Auth profiles contain `uid`, `email`, and `displayName`.
- **Handling:** Forbidden.
