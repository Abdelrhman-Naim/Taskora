# Phase 6 Architectural & Product Decisions

## 1. Test Baseline (Task 50 Step 1)

Recorded on 2026-10-20 on branch `feat/phase6-features`:

- **Unit Tests (`npm run test:unit`):** 221 tests across 33 test files (100% PASS)
- **Security Rules Tests (`npm run test:rules`):** 32 tests across 4 test files (100% PASS)
- **Services Integration Tests (`npm run test:services`):** 22 tests across 4 test files (100% PASS)
- **Total Test Suite (`npm run test`):** 275 tests across 41 test files (100% PASS)
- **E2E Playwright Tests (`npm run test:e2e`):** 53 tests (100% PASS)
- **ESLint (`npm run lint`):** 0 errors, 0 warnings
- **TypeScript (`npm run typecheck`):** 0 errors
- **Production Build (`npm run build`):** Succeeded with 0 errors

### Final Verified Metrics (Task 64):
- **Unit Tests (`npm run test:unit`):** 311 tests across 47 test files (100% PASS)
- **Security Rules Tests (`npm run test:rules`):** 82 tests across 8 test files (100% PASS)
- **Services Integration Tests (`npm run test:services`):** 46 tests across 7 test files (100% PASS)
- **Total Automated Vitest Suite:** 439 tests across 62 test files (100% PASS)
- **ESLint (`npm run lint`):** 0 errors, 0 warnings
- **TypeScript (`npm run typecheck`):** 0 errors
- **Production Build (`npm run build`):** Succeeded with 0 errors
- **External Dependencies:** Zero paid services or external APIs. 100% Spark-compatible client architecture.

---

## 2. Fixed Architecture & Product Decisions

### A. Strict Out-of-Scope Registry
1. **Attachments & File Uploads:** Firebase Storage requires Blaze plan billing. Zero storage or external asset hosting on Spark plan.
2. **Email & Push Notifications:** Requires Cloud Functions and external email gateways (SendGrid/Mailgun). Out of scope for client-only Spark plan.
3. **User @Mentions:** General user directory enumeration is strictly forbidden by Firestore security rules (users can only see members of shared projects).
4. **Multiple Assignees:** Task authorization matrix assumes a single `assigneeId`. Multiple assignees would compromise atomic role checks and quota limits.
5. **Real-Time Task Synchronization:** Taskora follows Decision D6 (`getDocs` + explicit revalidation on mutation). Real-time snapshots are restricted exclusively to user notifications.
6. **Offline Queued Writes:** Out of scope. Simple offline error resilience with clear alert messaging is preserved.
7. **Comment Editing:** YAGNI. Comments are immutable historical ledger items; authors, task creators, and project owners may delete comments, but not edit.

### B. Core Functional Invariants
- **Calendar Week Starting Day:**
  - Arabic (`ar`): Saturday (`السبت` / index 6)
  - English (`en`): Sunday (`Sunday` / index 0)
- **View Preference Storage:**
  - Key: `tf-view` in `localStorage`
  - Values: `'list' | 'board' | 'calendar'`
  - Fallback: `'list'` on parse failure or SSR
  - Exception handling: wrapped in `try / catch` for private browsing / blocked storage
- **Atomic Operations & Batch Limit:**
  - Max batch size: ≤ 400 writes (well within Firestore 500 hard limit)
  - Atomic co-writes: Every task/member change producing an activity or notification entry is written in a single `writeBatch`.
- **Activity Log Security & Integrity:**
  - Written by the client within the atomic batch.
  - Validated by Firestore security rules: verifies `actorId == request.auth.uid` and `actorName == project.memberNames[actorId]`.
  - Non-tamper-proof notice: Because Firestore rules cannot verify past state diffs on nested documents without custom functions, a malicious authorized member could theoretically forge activity metadata. This is a documented limitation of client-only Spark architectures.
- **Quota & Validation Constraints:**
  - Checklist: ≤ 20 items per task; item text: 1..120 chars; `done`: boolean.
  - Labels: ≤ 5 labels per task; label text: 1..24 chars trimmed; case-insensitive uniqueness.
  - Comments: 1..1000 chars trimmed; displayed oldest first.
  - Activity Feed: displayed last 50 items (`orderBy('createdAt', 'desc')`, `limit(50)`).
  - Notifications Feed: displayed last 30 items (`orderBy('createdAt', 'desc')`, `limit(30)`), real-time `onSnapshot`.
