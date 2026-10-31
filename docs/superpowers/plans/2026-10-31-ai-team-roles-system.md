# AI & Team Roles System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Taskora into an intelligent operations hub with Team Member Job Titles in the Owner Dashboard, Voice-powered AI Project Decomposition with role-based task distribution, a Magic Quick-Add command bar, and an AI Risk Radar / Executive Digest.

**Architecture:** A robust full-stack architecture built on Next.js 16 App Router, React 19, and Firebase Firestore. Web Speech API handles browser-native voice dictation in Arabic and English with zero latency. Secure Next.js Server Routes (`/api/ai/...`) call Google Gemini (`gemini-2.5-flash`) with strict JSON Schemas to structure projects, tasks, and risk insights without exposing API keys on the client. All components follow the senior-level 6-Zone layout and clean code standards.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Firebase Firestore, Web Speech API, Google Gemini API, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-31-ai-team-roles-system-design.md`

## Global Constraints
- React 19 & Next.js 16 compatible: all client hooks must reside in `'use client'` files; server routes must use standard Next.js `Request` / `NextResponse`.
- Bidi & Localization parity: full support for Arabic (`ar`, RTL) and English (`en`, LTR) with `<bdi>` protection.
- No client-side API key leakage: Gemini API calls must execute in server routes using `process.env.GEMINI_API_KEY`.
- Clean Code standards: 6-Zone file layout, derived state over `useEffect`, guard clauses over nested ternaries.
- Testing & QA: all unit tests run via `npm run test:unit`, typecheck via `npm run typecheck`.

## Review Focus
1. Speech recognition unsupported on non-compatible browsers (e.g., Firefox): graceful fallback to text input with helpful tooltip.
2. AI generation returns empty or partial team assignments: fallback assigns to project owner or unassigned rather than throwing errors.
3. Network timeout or invalid Gemini API key: user-friendly error toast with retry action, no broken UI states.
4. Arabic date parsing in natural language: reliable resolution of relative terms like "الخميس الجاي" (next Thursday).
5. Firestore permission checks: non-owners cannot mutate project member profiles or trigger bulk AI project rewrites.

---

### Task 1: Team Members & Job Titles Data Model and Firestore Services

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/services/projects.ts`
- Test: `tests/unit/team-members-service.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface ProjectMemberProfile {
    uid: string;
    email: string;
    displayName: string;
    jobTitle: string;
    role: 'owner' | 'member';
    addedAt: string;
  }
  ```
  Functions: `addProjectMemberProfile(projectId: string, profile: ProjectMemberProfile): Promise<void>` and `updateProjectMemberRole(projectId: string, uid: string, jobTitle: string): Promise<void>`.

- [ ] **Step 1: Write failing test for member profiles service**
  Test `tests/unit/team-members-service.test.ts` verifying that `addProjectMemberProfile` correctly validates and appends a `ProjectMemberProfile` to the project's `memberProfiles` array.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/unit/team-members-service.test.ts`
  Expected: FAIL (missing exports/types).

- [ ] **Step 3: Implement `ProjectMemberProfile` in `src/types/index.ts` and service methods in `src/services/projects.ts`**
  Extend `Project` interface with `memberProfiles?: ProjectMemberProfile[]`. Implement `addProjectMemberProfile` and `updateProjectMemberRole`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run tests/unit/team-members-service.test.ts`
  Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add src/types/index.ts src/services/projects.ts tests/unit/team-members-service.test.ts
  git commit -m "feat(team): add ProjectMemberProfile type and Firestore service methods"
  ```

---

### Task 2: Owner Dashboard Team Members Card & Add Member Modal

**Files:**
- Create: `src/components/dashboard/TeamMembersCard.tsx`
- Create: `src/components/dashboard/AddMemberModal.tsx`
- Modify: `src/app/[locale]/dashboard/page.tsx` (or dashboard client view)
- Test: `tests/unit/TeamMembersCard.test.tsx`

**Interfaces:**
- Consumes: `ProjectMemberProfile`, `addProjectMemberProfile` from Task 1.
- Produces: `TeamMembersCard` rendering members with their job titles and "+ Add Member" trigger.

- [ ] **Step 1: Write failing test for TeamMembersCard rendering**
  Test verifying that members are rendered with their name, email, and job title badge, and clicking "+ Add Member" shows the modal.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/unit/TeamMembersCard.test.tsx`
  Expected: FAIL.

- [ ] **Step 3: Implement `AddMemberModal.tsx` and `TeamMembersCard.tsx`**
  Follow 6-Zone layout. Add common job title presets (*UI/UX Designer, Frontend Developer, Backend Developer, QA Engineer, Project Manager, DevOps*). Provide Arabic & English translations.

- [ ] **Step 4: Mount `TeamMembersCard` into the Owner Dashboard**
  Integrate the card into the project owner dashboard view.

- [ ] **Step 5: Run tests and typecheck**
  Run: `npx vitest run tests/unit/TeamMembersCard.test.tsx && npm run typecheck`
  Expected: PASS.

- [ ] **Step 6: Commit**
  ```bash
  git add src/components/dashboard/TeamMembersCard.tsx src/components/dashboard/AddMemberModal.tsx src/app/[locale]/dashboard/ tests/unit/TeamMembersCard.test.tsx
  git commit -m "feat(dashboard): add TeamMembersCard with job titles and AddMemberModal"
  ```

---

### Task 3: Web Speech API Hook for Arabic & English Voice Dictation

**Files:**
- Create: `src/hooks/useSpeechRecognition.ts`
- Test: `tests/unit/useSpeechRecognition.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface UseSpeechRecognitionReturn {
    isListening: boolean;
    transcript: string;
    isSupported: boolean;
    startListening: (lang?: string) => void;
    stopListening: () => void;
    resetTranscript: () => void;
    error: string | null;
  }
  ```

- [ ] **Step 1: Write unit test with window.SpeechRecognition mock**
  Verify starting speech recognition sets `isListening: true`, receiving `onresult` appends transcript, and unsupported environments set `isSupported: false`.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/unit/useSpeechRecognition.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Implement `useSpeechRecognition.ts`**
  Support `webkitSpeechRecognition` and standard `SpeechRecognition`. Default language to active locale (`ar-SA` / `en-US`). Handle error events cleanly without crashing.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run tests/unit/useSpeechRecognition.test.ts`
  Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add src/hooks/useSpeechRecognition.ts tests/unit/useSpeechRecognition.test.ts
  git commit -m "feat(speech): add useSpeechRecognition hook with bilingual support"
  ```

---

### Task 4: AI Project Generator Server Route (`/api/ai/generate-project`)

**Files:**
- Create: `src/lib/ai/gemini.ts`
- Create: `src/app/api/ai/generate-project/route.ts`
- Test: `tests/unit/gemini-project-generator.test.ts`

**Interfaces:**
- Produces: `POST /api/ai/generate-project` returning `{ projectName: string, projectDescription: string, tasks: GeneratedTask[] }`.
- Prompt instructs Gemini to assign tasks based on `members[i].jobTitle` (e.g. design -> UI/UX Designer, API/database -> Backend Developer).

- [ ] **Step 1: Write unit test for prompt builder and response parser**
  Test verifying that response parsing correctly maps role keywords and outputs valid task structures matching the Zod schema.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/unit/gemini-project-generator.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Implement `gemini.ts` helper and `/api/ai/generate-project/route.ts`**
  Secure server route reading `process.env.GEMINI_API_KEY`. Strict JSON response parsing with Zod validation. Graceful fallback if AI service key is missing.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run tests/unit/gemini-project-generator.test.ts`
  Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add src/lib/ai/gemini.ts src/app/api/ai/generate-project/route.ts tests/unit/gemini-project-generator.test.ts
  git commit -m "feat(ai): implement /api/ai/generate-project route with role-based assignment"
  ```

---

### Task 5: Voice & AI Project Decomposition Modal (Project Architect UI)

**Files:**
- Create: `src/components/ai/AIProjectArchitectModal.tsx`
- Modify: `src/app/[locale]/dashboard/page.tsx`
- Test: `tests/unit/AIProjectArchitectModal.test.tsx`

**Interfaces:**
- Consumes: `useSpeechRecognition` (Task 3), `/api/ai/generate-project` (Task 4), `createProject` and `createTask` services.
- Produces: An interactive modal allowing voice/text prompt input, live breakdown preview, task adjustments, and 1-click bulk creation into Firestore.

- [ ] **Step 1: Write test for interactive preview modal**
  Test verifying that submitting a prompt displays generated tasks, allows toggling tasks on/off, and clicking "Create Project" triggers batch insertion.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/unit/AIProjectArchitectModal.test.tsx`
  Expected: FAIL.

- [ ] **Step 3: Implement `AIProjectArchitectModal.tsx`**
  Include: Voice dictation mic button, streaming/loading state with pulsing skeleton, review list with priority tags and assigned member badges, and confirm button.

- [ ] **Step 4: Integrate trigger button into Owner Dashboard**
  Add "إنشاء مشروع ذكي بالذكاء الاصطناعي ✨" (AI Project Architect) button next to New Project.

- [ ] **Step 5: Run tests and typecheck**
  Run: `npx vitest run tests/unit/AIProjectArchitectModal.test.tsx && npm run typecheck`
  Expected: PASS.

- [ ] **Step 6: Commit**
  ```bash
  git add src/components/ai/AIProjectArchitectModal.tsx src/app/[locale]/dashboard/ tests/unit/AIProjectArchitectModal.test.tsx
  git commit -m "feat(ai): add AIProjectArchitectModal with voice input and interactive review"
  ```

---

### Task 6: Magic Quick-Add Command Bar (`/api/ai/quick-task`)

**Files:**
- Create: `src/app/api/ai/quick-task/route.ts`
- Create: `src/components/ai/MagicQuickAddBar.tsx`
- Modify: `src/app/[locale]/projects/[id]/page.tsx`
- Test: `tests/unit/MagicQuickAddBar.test.tsx`

**Interfaces:**
- Produces: `MagicQuickAddBar` embedded at the top of Kanban and List views. Accepts voice or text, parses entities (title, due date, priority, checklist, assigned role), and inserts the task immediately.

- [ ] **Step 1: Write unit test for `/api/ai/quick-task` route parsing**
  Test entity extraction on Arabic and English inputs (e.g. "مهمة للمصمم يوم الأحد أولوية عالية").

- [ ] **Step 2: Implement route and `MagicQuickAddBar.tsx`**
  Add mic button for quick voice dictation, instant optimistic UI update, and toast notification on creation.

- [ ] **Step 3: Mount into Project board views**
  Add to project header above Kanban / Table tabs.

- [ ] **Step 4: Run tests and typecheck**
  Run: `npx vitest run tests/unit/MagicQuickAddBar.test.tsx && npm run typecheck`
  Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add src/app/api/ai/quick-task/route.ts src/components/ai/MagicQuickAddBar.tsx src/app/[locale]/projects/[id]/ tests/unit/MagicQuickAddBar.test.tsx
  git commit -m "feat(ai): add MagicQuickAddBar with natural language and voice parser"
  ```

---

### Task 7: AI Risk Radar & Executive Digest (`/api/ai/risk-radar`)

**Files:**
- Create: `src/app/api/ai/risk-radar/route.ts`
- Create: `src/components/ai/RiskRadarModal.tsx`
- Modify: `src/components/projects/ProjectHeader.tsx` (or Owner actions bar)
- Test: `tests/unit/RiskRadarModal.test.tsx`

**Interfaces:**
- Produces: Risk Radar modal displaying:
  1. Bottleneck alerts (overdue tasks, overloaded team members).
  2. Formatted Executive Progress Summary with copy-to-clipboard and export button.

- [ ] **Step 1: Write unit test for risk detection heuristics**
  Test verifying that overdue tasks and workload imbalances trigger risk flags.

- [ ] **Step 2: Implement `/api/ai/risk-radar/route.ts` and `RiskRadarModal.tsx`**
  Provide bilingual executive summary generation.

- [ ] **Step 3: Mount Risk Radar button for Project Owner**
  Add "رادار المخاطر والتقرير الذكي 📊" button for owners.

- [ ] **Step 4: Run tests and typecheck**
  Run: `npx vitest run tests/unit/RiskRadarModal.test.tsx && npm run typecheck`
  Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add src/app/api/ai/risk-radar/route.ts src/components/ai/RiskRadarModal.tsx tests/unit/RiskRadarModal.test.tsx
  git commit -m "feat(ai): add AI Risk Radar and Executive Progress Digest"
  ```

---

### Task 8: Full End-to-End Verification & Quality Gates

**Files:**
- Test: Comprehensive Vitest suite, typecheck, linting.

- [ ] **Step 1: Run comprehensive test suite**
  Run: `npm run test:unit`
  Expected: All tests PASS.

- [ ] **Step 2: Run TypeScript typecheck**
  Run: `npm run typecheck`
  Expected: Zero errors.

- [ ] **Step 3: Run linter**
  Run: `npm run lint`
  Expected: Clean report.

- [ ] **Step 4: Final commit and summary**
  ```bash
  git commit -m "chore: complete AI & team roles system implementation and testing verification"
  ```
