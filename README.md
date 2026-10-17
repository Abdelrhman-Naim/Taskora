# TaskFlow MVP

TaskFlow is a project and task management system designed for small teams, built with Next.js App Router, Firebase Auth, and Cloud Firestore.

## Features
- **Authentication**: Email & password signup, login, persistent session, and route protection.
- **Projects**: Create projects, view projects, update settings, cascade delete with atomic cleanup.
- **Membership**: Add/remove team members via email lookup (`usersByEmail`), atomic task unassignment upon member removal.
- **Tasks**: Full task management with status (`todo`, `in_progress`, `done`), priority (`low`, `medium`, `high`), due dates, and assignee handling.
- **Task Permissions**: Strict security rules enforcing an granular permissions matrix across owner, creator, assignee, other members, and outsiders.
- **Search & Filters**: Real-time filtering by status, priority, assignee, search keyword, and overdue tasks.
- **Dashboard**: Aggregated project statistics, status counts, and overdue task notifications.

## Tech Stack
- Next.js (App Router, Client Components for interactive UI)
- TypeScript & Zod (strict runtime validation)
- Firebase JS SDK (modular v13)
- CSS Modules + `globals.css` (Accessible, responsive 375px/768px/1280px)
- Vitest & React Testing Library (Unit & component testing)
- `@firebase/rules-unit-testing` & Firebase Emulator Suite (Firestore & Auth security rules)
- Playwright (End-to-End browser acceptance tests)

## Prerequisites
- Node.js 20+
- Java 21+ (required for Firebase Local Emulators)
- npm

## Local Development
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Enable emulators in `.env.local`:
   ```env
   NEXT_PUBLIC_USE_EMULATORS=true
   ```
3. Run unit tests:
   ```bash
   npm run test:unit
   ```
4. Run rules tests:
   ```bash
   npm run test:rules
   ```
5. Run services tests:
   ```bash
   npm run test:services
   ```
6. Start dev server:
   ```bash
   npm run dev
   ```

## Test Commands
- `npm run test:unit`: Unit tests for pure logic, Zod validation, and dates.
- `npm run test:rules`: Security rules unit tests against Firestore Emulator.
- `npm run test:services`: End-to-end service layer tests against Auth & Firestore Emulators.
- `npm run test:e2e`: Playwright acceptance tests.
- `npm run test`: Combined unit, rules, and service tests.

## Architectural Decisions
- **D1**: Member email lookup uses `/usersByEmail/{emailLower}` (`get` allowed for authenticated users, `list` denied) without Cloud Functions.
- **D2**: `/users/{uid}` is readable only by the owner. Project member names are stored in `projects.memberNames: Record<uid, string>`.
- **D3**: Member removal uses atomic `writeBatch` to unassign tasks and remove membership.
- **D4**: Cascade project deletion uses atomic `writeBatch` for tasks and project document.
- **D4b**: `projects/{id}` allows read when `resource == null` so the client cleanly differentiates Not Found from Access Denied.
- **D5**: `dueDate` is stored as `YYYY-MM-DD` string in fixed timezone `Asia/Riyadh` to prevent timezone shift errors.
- **D6**: All Firestore writes are guarded by `withWriteGuard` (checking `navigator.onLine` and 8s timeout).
- **D7**: `getDocs` read + explicit reload on mutation.
- **D8**: Comprehensive task permissions matrix enforced in `firestore.rules`.
