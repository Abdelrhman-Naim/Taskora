# Design Specification: AI & Team Roles System for Taskora

- **Date:** 2026-10-31
- **Status:** Proposed
- **Author:** Antigravity & User
- **Topic:** Team Roles Management, Voice & AI Project Breakdown, Natural Language Task Quick-Add, and AI Risk Radar

---

## 1. Executive Summary & Goals

Taskora is an executive-grade project management platform built on Next.js 16, React 19, Tailwind CSS v4, and Firebase Firestore. To transition from a manual task manager to an intelligent, proactive operational hub, this specification defines the end-to-end architecture for:

1. **Team Roles & Job Titles Foundation:** Empowering project owners to register team members with designated job titles (e.g., UI/UX Designer, Frontend Developer, Backend Engineer, QA Specialist) in the Owner Dashboard.
2. **Voice & AI Project Decomposition (Project Architect):** Allowing project owners to describe a project via voice (Web Speech API) or text, using Google Gemini to automatically generate a complete Work Breakdown Structure (WBS) with tasks, checklists, priorities, deadlines, and smart role-based assignment to the team.
3. **Magic Natural-Language Task Creator (Quick-Add):** A persistent quick-action command bar with speech/text parsing that converts casual spoken/written requests into structured tasks assigned to the appropriate role.
4. **AI Risk Radar & Executive Digest:** An automated analysis engine that audits project velocity, overdue tasks, and bottlenecked team members, producing an executive-ready weekly summary.

---

## 2. System Architecture & Components

```
+------------------------------------------------------------------------------------+
|                                CLIENT LAYER (React 19)                             |
|                                                                                    |
|  +---------------------+  +-------------------------+  +------------------------+  |
|  |  Owner Dashboard    |  |  AI Project Modal       |  |  Magic Quick-Add Bar   |  |
|  |  (Team Directory)   |  |  (Voice / Text Input)   |  |  (Speech-to-Text Input)|  |
|  +----------+----------+  +------------+------------+  +-----------+------------+  |
|             |                          |                           |               |
|             |                          v                           v               |
|             |             +-------------------------+ +-------------------------+  |
|             |             | Web Speech API Service  | | Interactive Preview     |  |
|             |             | (Arabic / English STT)  | | Review & Bulk Insert    |  |
|             |             +------------+------------+ +------------+------------+  |
+-------------|--------------------------|---------------------------|---------------+
              |                          |                           |
              v                          v                           v
+------------------------------------------------------------------------------------+
|                             NEXT.JS 16 SERVER / API LAYER                          |
|                                                                                    |
|  +-------------------------------------+  +-------------------------------------+  |
|  | POST /api/ai/generate-project       |  | POST /api/ai/quick-task             |  |
|  | - Auth verification (Firebase UID)  |  | - Auth verification                 |  |
|  | - Team roster context injection     |  | - Entity & date extraction          |  |
|  | - Gemini 2.5 Flash Structured JSON  |  | - Role mapping to member            |  |
|  +------------------+------------------+  +------------------+------------------+  |
|                     |                                        |                     |
|                     v                                        v                     |
|  +------------------------------------------------------------------------------+  |
|  | POST /api/ai/risk-radar                                                      |  |
|  | - Task timeline & workload bottleneck analysis                               |  |
|  | - Bi-lingual Executive Summary generation                                    |  |
|  +------------------------------------------------------------------------------+  |
+------------------------------------------------------------------------------------+
                                         |
                                         v
+------------------------------------------------------------------------------------+
|                         DATABASE & PERSISTENCE (Firestore)                         |
|  - Collection: projects (includes memberProfiles: Array<ProjectMemberProfile>)      |
|  - Collection: tasks (includes assigneeId, checklist, labels, priority)             |
|  - Collection: activity (audit logging)                                            |
+------------------------------------------------------------------------------------+
```

---

## 3. Phase 1: Team Members & Job Titles Directory

### 3.1 Data Schema Changes

In `src/types/index.ts`:

```typescript
export interface ProjectMemberProfile {
  uid: string;
  email: string;
  displayName: string;
  jobTitle: string; // e.g. "Frontend Developer", "UI/UX Designer", "QA Engineer"
  role: 'owner' | 'member';
  addedAt: string; // ISO date string
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  memberNames: Record<string, string>;
  memberProfiles?: ProjectMemberProfile[]; // Rich profile directory
  createdAt: Date | null;
  updatedAt: Date | null;
}
```

### 3.2 UI & UX in Owner Dashboard
- **Location:** Dedicated card in `src/app/dashboard/` or embedded in project settings.
- **Components:**
  - `TeamMembersCard.tsx`: Displays list of members with avatars, display names, emails, job title badges, and count of active tasks assigned to each.
  - `AddMemberModal.tsx`: Modal form with validation:
    - Member Email (`type="email"`)
    - Display Name (`type="text"`)
    - Job Title (`select` or custom `input` with presets: *UI/UX Designer*, *Frontend Developer*, *Backend Engineer*, *Full Stack Developer*, *QA Tester*, *DevOps Specialist*, *Project Manager*, *Marketing/Content*).
- **Security & Validation:**
  - Zod schema `AddMemberSchema` verifying email format and non-empty job title.
  - Restricted to Project Owner only via Firebase security rules and UI permission checks.

---

## 4. Phase 2: Voice & AI Project Decomposition (Project Architect)

### 4.1 Speech-to-Text (Voice Dictation)
- **Engine:** Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`) with zero third-party latency.
- **Language Detection:** Defaults to active user locale (`ar-SA` when locale is Arabic, `en-US` when English).
- **Visual Feedback:** Pulsing audio indicator when mic is active, real-time transcription into prompt input field.

### 4.2 AI Engine & API Route
- **Endpoint:** `POST /api/ai/generate-project`
- **Request Payload:**
  ```json
  {
    "projectId": "string",
    "prompt": "string",
    "locale": "ar | en",
    "members": [
      { "uid": "u1", "displayName": "Ahmed", "jobTitle": "UI/UX Designer" },
      { "uid": "u2", "displayName": "Sarah", "jobTitle": "Backend Developer" },
      { "uid": "u3", "displayName": "Khaled", "jobTitle": "QA Engineer" }
    ]
  }
  ```
- **Gemini Model:** `gemini-2.5-flash` with strict JSON schema:
  ```json
  {
    "projectName": "string",
    "projectDescription": "string",
    "tasks": [
      {
        "title": "string",
        "description": "string",
        "priority": "low | medium | high",
        "assignedMemberUid": "string | null",
        "suggestedDueDaysFromNow": 7,
        "checklist": ["item 1", "item 2", "item 3"]
      }
    ]
  }
  ```
- **Smart Role-Assignment Heuristic:** The prompt instructs the LLM to inspect each member's `jobTitle` and pair tasks appropriately (design tasks to UI/UX, database & APIs to Backend, test cases to QA).

### 4.3 Interactive Review Modal
- Instead of blind insertions, a preview modal renders the proposed project breakdown.
- The owner can:
  - Toggle individual tasks on/off.
  - Change assigned member or priority inline.
  - Click "Apply & Create Project" -> executes batch write to Firestore.

---

## 5. Phase 3: Magic Quick-Add & AI Risk Radar

### 5.1 Magic Quick-Add Bar
- Persistent command bar located at the top of the Project board.
- Text input + Microphone icon.
- Example inputs:
  - Arabic: *"تصميم الشعار وصفحة البداية يوم الأربعاء أولوية عالية للمصمم"*
  - English: *"Setup PostgreSQL database and auth schema by next Friday high priority for backend"*
- Maps the extracted task directly into the current project without opening multi-field modals.

### 5.2 AI Risk Radar & Executive Digest
- **Endpoint:** `POST /api/ai/risk-radar`
- **Input:** Project summary, tasks list with statuses and due dates, members roster.
- **Output:**
  1. **Risk Flags:**
     - Overdue high-priority items.
     - Workload imbalance (e.g., 80% of tasks assigned to one developer).
     - Stale items in `in_progress` without recent activity.
  2. **Executive Summary:** Formatted markdown bulleted progress report suitable for client updates or weekly stakeholder reviews.

---

## 6. Code Standards & Architecture Guidelines

In accordance with `/nextjs-react-clean-code`:
- **6-Zone Layout:** All new components must structure code into:
  1. Imports
  2. Configuration & Constants
  3. Types & Interfaces
  4. Helper Functions & Hooks
  5. Sub-Components
  6. Main Component
- **No Synced State Antipattern:** Use derived state and clean memoization instead of chained `useEffect` handlers.
- **Guard Clauses:** Avoid nested ternaries; render states using early returns.
- **Security:** LLM calls happen exclusively in server routes (`src/app/api/ai/...`); `GEMINI_API_KEY` is kept server-side only.

---

## 7. Testing & Quality Assurance Plan

In accordance with `/testing-qa`:
- **Unit Testing (Vitest):**
  - Test Web Speech API hook fallback behavior when browser unsupported.
  - Test JSON Schema validator for Gemini API outputs (handling edge cases and malformed JSON).
  - Test role matching algorithm (e.g. matching "Designer" to "UI/UX Designer").
- **Integration Testing:**
  - Mock API responses for `/api/ai/generate-project` and `/api/ai/quick-task`.
  - Validate batch task insertion in Firestore mock emulator.
- **Quality Gates:**
  - `npm run typecheck` passes with zero errors.
  - `npm run lint` passes cleanly.
  - `npm run test:unit` passes 100%.
