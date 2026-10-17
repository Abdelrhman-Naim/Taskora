# TaskFlow MVP

TaskFlow is a collaborative project and task management system designed for small teams, built with Next.js App Router, Firebase Modular SDK (Auth & Firestore), and vanilla CSS Modules (zero Tailwind).

---

## Features
- **Authentication**: Email & password signup, login, persistent session across reloads, and automatic route protection (`/dashboard` redirects unauthenticated users to `/login`).
- **Projects**: Create projects, view projects, update settings, cascade delete with atomic cleanup.
- **Membership**: Add team members via email lookup (`usersByEmail`), atomic task unassignment upon member removal, and access revocation.
- **Tasks**: Full task management with status (`todo`, `in_progress`, `done`), priority (`low`, `medium`, `high`), due dates (`YYYY-MM-DD` in `Asia/Riyadh` timezone), and assignee handling.
- **Task Permissions**: Strict security rules enforcing a granular permissions matrix across owner, creator, assignee, other members, and outsiders.
- **Search & Filters**: Real-time filtering by status, priority, assignee, search keyword (case-insensitive on task titles), and overdue tasks.
- **Dashboard**: Aggregated project statistics, status counts, and overdue task notifications.
- **Resilience & Accessibility**: Offline network failure handling (`withWriteGuard`), accessible semantic HTML and ARIA labels, responsive layouts (375px, 768px, 1280px) with zero horizontal overflow.

---

## Tech Stack
- **Framework**: Next.js 16 (App Router, Client Components for interactive UI)
- **Language & Validation**: TypeScript, Zod runtime validation
- **Backend**: Firebase JS SDK (modular v13) — Authentication & Cloud Firestore
- **Styling**: CSS Modules + `src/app/globals.css` (Strictly no Tailwind CSS)
- **Unit Testing**: Vitest, React Testing Library, jsdom
- **Security Testing**: `@firebase/rules-unit-testing`, Firebase Local Emulator Suite
- **Acceptance Testing**: Playwright (driving Google Chrome against local Emulators)

---

## Test Evidence & Acceptance Criteria (TC-01…TC-16)

All 16 acceptance test cases are fully verified with passing automated suites:

| Test Case | Description | Primary Verification File | Status |
|:---|:---|:---|:---:|
| **TC-01** | User registration, displayName, and profile mapping | `tests/services/auth.test.ts`, `tests/e2e/taskflow.spec.ts` | **PASS** |
| **TC-02** | Validation errors on invalid email and short password | `tests/unit/AuthForm.test.tsx` | **PASS** |
| **TC-03** | User login and persistent session across page reloads | `tests/services/auth.test.ts`, `tests/e2e/taskflow.spec.ts` | **PASS** |
| **TC-04** | Unauthenticated user redirected to `/login` | `tests/e2e/taskflow.spec.ts` | **PASS** |
| **TC-05** | Project creation and persistence across browser reload | `tests/services/projects.test.ts`, `tests/e2e/taskflow.spec.ts` | **PASS** |
| **TC-06** | Project access control (owner/member read, outsider denied) | `tests/rules/projects.rules.test.ts` | **PASS** |
| **TC-07** | Owner adds member by email (case/whitespace normalized) | `tests/services/members.test.ts`, `tests/e2e/taskflow.spec.ts` | **PASS** |
| **TC-08** | Unregistered email rejected with clear error | `tests/services/members.test.ts` | **PASS** |
| **TC-09** | Task creation with default status=todo and timestamps | `tests/services/tasks.test.ts`, `tests/e2e/taskflow.spec.ts` | **PASS** |
| **TC-10** | Assignee can update status; non-assignee denied | `tests/services/tasks.test.ts`, `tests/e2e/taskflow.spec.ts` | **PASS** |
| **TC-11** | Filter tasks by priority, status, assignee, and overdue | `tests/unit/taskFilters.test.ts`, `tests/e2e/taskflow.spec.ts` | **PASS** |
| **TC-12** | Search tasks by title (case-insensitive, trimmed) | `tests/unit/taskFilters.test.ts`, `tests/e2e/taskflow.spec.ts` | **PASS** |
| **TC-13** | Access control on outsider project and not-found project | `tests/services/projects.test.ts`, `tests/e2e/taskflow.spec.ts` | **PASS** |
| **TC-14** | Member removal unassigns tasks atomically and revokes access | `tests/services/members.test.ts` | **PASS** |
| **TC-15** | Responsive layout without horizontal overflow at 375, 768, 1280px | `tests/e2e/taskflow.spec.ts` | **PASS** |
| **TC-16** | Offline resilience: graceful error display within <= 10s | `tests/unit/ui-states.test.tsx`, `tests/e2e/taskflow.spec.ts` | **PASS** |

### Test Suite Summary
- **Unit Tests**: 14 test files, **96 tests passing**
- **Security Rules Tests**: 5 test files, **46 tests passing**
- **Service Integration Tests**: 4 test files, **22 tests passing**
- **E2E Acceptance Tests**: 1 test file, **8 test scenarios passing**
- **Total Passing Automated Tests**: **172 passing tests**

---

## Permissions Matrix

Enforced strictly in `firestore.rules` and reflected in UI conditional rendering:

| Action | Owner | Task Creator | Task Assignee | Project Member | Outsider |
|:---|:---:|:---:|:---:|:---:|:---:|
| Read Project & Tasks | Yes | Yes | Yes | Yes | Denied |
| Update Project / Delete Project | Yes | Denied | Denied | Denied | Denied |
| Add / Remove Members | Yes | Denied | Denied | Denied | Denied |
| Create Task | Yes | Yes | Yes | Yes | Denied |
| Edit Task Title / Description / Due Date | Yes | Yes | Denied | Denied | Denied |
| Update Task Status (`todo` / `in_progress` / `done`) | Yes | If Assigned | Yes | Denied | Denied |
| Delete Task | Yes | Yes | Denied | Denied | Denied |

---

## Architectural Decisions (D1–D8)
- **D1**: Member email lookup uses `/usersByEmail/{emailLower}` (`get` allowed for authenticated users, `list` denied) without Cloud Functions.
- **D2**: `/users/{uid}` is readable only by the owner. Project member names are stored denormalized in `projects.memberNames: Record<uid, string>` to avoid N+1 queries.
- **D3**: Member removal uses atomic `writeBatch` to unassign tasks and update `memberIds`/`memberNames`.
- **D4**: Cascade project deletion uses atomic `writeBatch` for up to 400 tasks and the project document.
- **D4b**: `projects/{id}` allows read when `resource == null` so the client cleanly differentiates Not Found from Access Denied.
- **D5**: `dueDate` is stored as `YYYY-MM-DD` string in fixed timezone `Asia/Riyadh` (`APP_TIME_ZONE`) to prevent date shifting.
- **D6**: All Firestore writes are guarded by `withWriteGuard` (checking `navigator.onLine` and 8s timeout).
- **D7**: Client uses `getDocs` read + explicit reload on mutation for predictable lifecycle.
- **D8**: Comprehensive task permissions matrix enforced in `firestore.rules`.

---

## MVP Limits & Boundaries
1. **Cascade Delete Scale**: Batch deletion supports projects with up to 400 tasks in a single atomic batch.
2. **Display Name**: Display name is set on registration and synced to user profile; editing display name after creation is out of MVP scope.
3. **Ownership**: Project ownership transfer is out of MVP scope.
4. **Scope Control**: No Kanban boards, dark mode toggle, activity feeds, or external UI component libraries (pure CSS Modules).

---

## Demo Accounts & Seed Script

Run the seed script to populate sample accounts, a demo project, and the Appendix A sample tasks:
```bash
npm run seed -- --emulator
```

### Seeded Credentials:
- **Owner**: `owner@example.test` / `Password123!` (Name: "Owner User")
- **Member**: `member@example.test` / `Password123!` (Name: "Member User")
- **Project**: «Website Redesign»
- **Tasks**:
  1. `Build navbar` (To Do, High, Assigned to Member, Due: 2026-10-25)
  2. `Fix overdue bug` (To Do, High, Assigned to Member, Due: 2026-10-16 [Overdue])
  3. `Setup Database` (In Progress, Medium, Assigned to Member, Due: 2026-10-30)
  4. `Write Documentation` (Done, Low, Unassigned, Due: 2026-10-10)

---

## Environment Variables

| Variable | Description | Example (Local Emulator) |
|:---|:---|:---|
| `NEXT_PUBLIC_USE_EMULATORS` | Connect to local Firebase Emulators | `true` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key | `fake-api-key` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `demo-taskflow.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID | `demo-taskflow` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`| Firebase Storage Bucket | `demo-taskflow.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging Sender ID | `123456789` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Web App ID | `1:123456789:web:abcdef` |

---

## Local Development & Testing

```bash
# 1. Install dependencies
npm install

# 2. Typecheck & Lint
npm run typecheck
npm run lint

# 3. Unit, Security Rules & Service Tests
npm run test

# 4. E2E Acceptance Tests
npm run test:e2e

# 5. Production Build
npm run build
```

---

## Live Exercise Note
Task filtering is implemented in `src/lib/taskFilters.ts`. The `overdueOnly` filter is integrated into the UI filter bar and evaluates overdue status strictly using `isOverdue(task, todayString())`.
