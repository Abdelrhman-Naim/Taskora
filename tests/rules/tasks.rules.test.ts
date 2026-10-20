import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { serverTimestamp } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let testEnv: RulesTestEnvironment;

describe('Tasks security rules & permission matrix', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-taskflow',
      firestore: {
        host: '127.0.0.1',
        port: 8085,
        rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
      },
    });
  }, 30000);

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  const PID = 'proj-1';
  const OWNER = 'owner-uid';
  const MEMBER_A = 'member-a-uid'; // Creator
  const MEMBER_B = 'member-b-uid'; // Assignee
  const MEMBER_C = 'member-c-uid'; // Other member
  const OUTSIDER_D = 'outsider-d-uid';
  const REMOVED_E = 'removed-e-uid';

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();

      // Seed project with Owner, Member A, Member B, Member C (Outsider D and Removed E are not in memberIds)
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('projects').doc(PID).set({
          name: 'Main Collaboration Project',
          description: 'A shared project for testing tasks',
          ownerId: OWNER,
          memberIds: [OWNER, MEMBER_A, MEMBER_B, MEMBER_C],
          memberNames: {
            [OWNER]: 'Owner User',
            [MEMBER_A]: 'Member A (Creator)',
            [MEMBER_B]: 'Member B (Assignee)',
            [MEMBER_C]: 'Member C (Observer)',
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
    }
  });

  const validTask = (createdBy: string, assigneeId: string | null = null) => ({
    title: 'Valid Task Title',
    description: 'A valid description of the task',
    status: 'todo',
    priority: 'medium',
    assigneeId,
    createdBy,
    dueDate: '2026-10-25',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  describe('Shape and Validation rules on create (TC-09)', () => {
    it('allows a project member to create a valid task with status=todo', async () => {
      const userA = testEnv.authenticatedContext(MEMBER_A);
      await assertSucceeds(
        userA.firestore().collection('projects').doc(PID).collection('tasks').doc('t-1').set(
          validTask(MEMBER_A, MEMBER_B)
        )
      );
    });

    it('denies creation when title length < 3 or > 120', async () => {
      const userA = testEnv.authenticatedContext(MEMBER_A);
      // Length 2 ❌
      await assertFails(
        userA.firestore().collection('projects').doc(PID).collection('tasks').doc('t-short').set({
          ...validTask(MEMBER_A),
          title: 'ab',
        })
      );
      // Length 3 ✔
      await assertSucceeds(
        userA.firestore().collection('projects').doc(PID).collection('tasks').doc('t-len3').set({
          ...validTask(MEMBER_A),
          title: 'abc',
        })
      );
      // Length 120 ✔
      await assertSucceeds(
        userA.firestore().collection('projects').doc(PID).collection('tasks').doc('t-len120').set({
          ...validTask(MEMBER_A),
          title: 'a'.repeat(120),
        })
      );
      // Length 121 ❌
      await assertFails(
        userA.firestore().collection('projects').doc(PID).collection('tasks').doc('t-len121').set({
          ...validTask(MEMBER_A),
          title: 'a'.repeat(121),
        })
      );
    });

    it('denies creation when description > 1000 characters', async () => {
      const userA = testEnv.authenticatedContext(MEMBER_A);
      await assertFails(
        userA.firestore().collection('projects').doc(PID).collection('tasks').doc('t-desc').set({
          ...validTask(MEMBER_A),
          description: 'd'.repeat(1001),
        })
      );
    });

    it('denies creation with invalid status (e.g. blocked, in_progress, done)', async () => {
      const userA = testEnv.authenticatedContext(MEMBER_A);
      // status 'blocked' ❌
      await assertFails(
        userA.firestore().collection('projects').doc(PID).collection('tasks').doc('t-status-b').set({
          ...validTask(MEMBER_A),
          status: 'blocked',
        })
      );
      // status 'done' on create ❌ (must be 'todo')
      await assertFails(
        userA.firestore().collection('projects').doc(PID).collection('tasks').doc('t-status-d').set({
          ...validTask(MEMBER_A),
          status: 'done',
        })
      );
      // status 'in_progress' on create ❌
      await assertFails(
        userA.firestore().collection('projects').doc(PID).collection('tasks').doc('t-status-p').set({
          ...validTask(MEMBER_A),
          status: 'in_progress',
        })
      );
    });

    it('denies creation with invalid priority', async () => {
      const userA = testEnv.authenticatedContext(MEMBER_A);
      await assertFails(
        userA.firestore().collection('projects').doc(PID).collection('tasks').doc('t-prio').set({
          ...validTask(MEMBER_A),
          priority: 'urgent',
        })
      );
    });

    it('validates dueDate format (YYYY-MM-DD or null)', async () => {
      const userA = testEnv.authenticatedContext(MEMBER_A);
      // '17/10/2026' ❌
      await assertFails(
        userA.firestore().collection('projects').doc(PID).collection('tasks').doc('t-date-slash').set({
          ...validTask(MEMBER_A),
          dueDate: '17/10/2026',
        })
      );
      // null ✔
      await assertSucceeds(
        userA.firestore().collection('projects').doc(PID).collection('tasks').doc('t-date-null').set({
          ...validTask(MEMBER_A),
          dueDate: null,
        })
      );
    });

    it('enforces createdBy == request.auth.uid', async () => {
      const userA = testEnv.authenticatedContext(MEMBER_A);
      await assertFails(
        userA.firestore().collection('projects').doc(PID).collection('tasks').doc('t-spoof').set(
          validTask(MEMBER_B) // createdBy claims to be B
        )
      );
    });

    it('enforces assigneeId is null or a valid project member', async () => {
      const userA = testEnv.authenticatedContext(MEMBER_A);
      // assignee is outsider ❌
      await assertFails(
        userA.firestore().collection('projects').doc(PID).collection('tasks').doc('t-ass-out').set(
          validTask(MEMBER_A, OUTSIDER_D)
        )
      );
      // assignee is member B ✔
      await assertSucceeds(
        userA.firestore().collection('projects').doc(PID).collection('tasks').doc('t-ass-mem').set(
          validTask(MEMBER_A, MEMBER_B)
        )
      );
      // assignee is null ✔
      await assertSucceeds(
        userA.firestore().collection('projects').doc(PID).collection('tasks').doc('t-ass-null').set(
          validTask(MEMBER_A, null)
        )
      );
    });

    it('denies creation with unexpected extra fields', async () => {
      const userA = testEnv.authenticatedContext(MEMBER_A);
      await assertFails(
        userA.firestore().collection('projects').doc(PID).collection('tasks').doc('t-extra').set({
          ...validTask(MEMBER_A),
          customField: 'malicious',
        })
      );
    });
  });

  describe('Read permissions (TC-13 / Review Focus #2)', () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('projects').doc(PID).collection('tasks').doc('seeded-task').set({
          title: 'Seeded Task',
          description: 'A task already created',
          status: 'todo',
          priority: 'medium',
          assigneeId: MEMBER_B,
          createdBy: MEMBER_A,
          dueDate: '2026-10-30',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
    });

    it('allows Owner, Member A, Member B, and Member C to read tasks', async () => {
      for (const uid of [OWNER, MEMBER_A, MEMBER_B, MEMBER_C]) {
        const ctx = testEnv.authenticatedContext(uid);
        await assertSucceeds(
          ctx.firestore().collection('projects').doc(PID).collection('tasks').doc('seeded-task').get()
        );
      }
    });

    it('denies Outsider D from reading tasks', async () => {
      const outsider = testEnv.authenticatedContext(OUTSIDER_D);
      await assertFails(
        outsider.firestore().collection('projects').doc(PID).collection('tasks').doc('seeded-task').get()
      );
    });

    it('denies Removed Member E (not in memberIds) from reading tasks (Review Focus #2)', async () => {
      const removed = testEnv.authenticatedContext(REMOVED_E);
      await assertFails(
        removed.firestore().collection('projects').doc(PID).collection('tasks').doc('seeded-task').get()
      );
    });
  });

  describe('Permission Matrix for Updates (TC-10)', () => {
    const TASK_ID = 'matrix-task';

    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('projects').doc(PID).collection('tasks').doc(TASK_ID).set({
          title: 'Original Title',
          description: 'Original Description',
          status: 'todo',
          priority: 'low',
          assigneeId: MEMBER_B,
          createdBy: MEMBER_A,
          dueDate: '2026-10-25',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
    });

    const getBaseUpdate = () => ({
      title: 'Original Title',
      description: 'Original Description',
      status: 'todo',
      priority: 'low',
      assigneeId: MEMBER_B,
      createdBy: MEMBER_A,
      dueDate: '2026-10-25',
      updatedAt: serverTimestamp(),
    });

    it('allows Member A (creator, not assignee) to update title, desc, prio, dueDate, and assigneeId, but DENIES status change (TC-10)', async () => {
      const creator = testEnv.authenticatedContext(MEMBER_A);
      const taskRef = creator.firestore().collection('projects').doc(PID).collection('tasks').doc(TASK_ID);

      // Creator updates title/desc/prio/dueDate ✔
      await assertSucceeds(
        taskRef.update({
          ...getBaseUpdate(),
          title: 'Updated by Creator',
          description: 'New Desc',
          priority: 'high',
          dueDate: '2026-11-01',
        })
      );

      // Creator changes assigneeId to Member C ✔
      await assertSucceeds(
        taskRef.update({
          ...getBaseUpdate(),
          assigneeId: MEMBER_C,
        })
      );

      // Creator tries to change status from todo to in_progress ❌ (only assignee may change status!)
      await assertFails(
        taskRef.update({
          ...getBaseUpdate(),
          status: 'in_progress',
        })
      );
    });

    it('allows Member B (assignee, not creator) to update status, but DENIES changing assigneeId', async () => {
      const assignee = testEnv.authenticatedContext(MEMBER_B);
      const taskRef = assignee.firestore().collection('projects').doc(PID).collection('tasks').doc(TASK_ID);

      // Assignee changes status to in_progress ✔ (TC-10)
      await assertSucceeds(
        taskRef.update({
          ...getBaseUpdate(),
          status: 'in_progress',
        })
      );

      // Assignee updates title/desc/priority/dueDate ✔
      await assertSucceeds(
        taskRef.update({
          ...getBaseUpdate(),
          title: 'Updated by Assignee',
          priority: 'high',
        })
      );

      // Assignee tries to change assigneeId to Member C ❌ (only creator or owner may change assignee!)
      await assertFails(
        taskRef.update({
          ...getBaseUpdate(),
          assigneeId: MEMBER_C,
        })
      );
    });

    it('denies Member C (other member, neither creator nor assignee) from updating any field', async () => {
      const other = testEnv.authenticatedContext(MEMBER_C);
      const taskRef = other.firestore().collection('projects').doc(PID).collection('tasks').doc(TASK_ID);

      // Other member tries to update title ❌
      await assertFails(
        taskRef.update({
          ...getBaseUpdate(),
          title: 'Hacked Title',
        })
      );

      // Other member tries to update status ❌
      await assertFails(
        taskRef.update({
          ...getBaseUpdate(),
          status: 'in_progress',
        })
      );

      // Other member tries to update assignee ❌
      await assertFails(
        taskRef.update({
          ...getBaseUpdate(),
          assigneeId: MEMBER_C,
        })
      );
    });

    it('allows Owner to update all task fields', async () => {
      const owner = testEnv.authenticatedContext(OWNER);
      const taskRef = owner.firestore().collection('projects').doc(PID).collection('tasks').doc(TASK_ID);

      // Owner changes title, description, priority, dueDate, assigneeId, and status all at once ✔
      await assertSucceeds(
        taskRef.update({
          ...getBaseUpdate(),
          title: 'Owner Managed Title',
          description: 'Owner notes',
          priority: 'high',
          assigneeId: MEMBER_C,
          status: 'done',
          dueDate: '2026-12-31',
        })
      );
    });

    it('denies everyone including Owner from changing createdBy or createdAt', async () => {
      const owner = testEnv.authenticatedContext(OWNER);
      const taskRef = owner.firestore().collection('projects').doc(PID).collection('tasks').doc(TASK_ID);

      // Owner tries to change createdBy ❌
      await assertFails(
        taskRef.update({
          ...getBaseUpdate(),
          createdBy: OWNER,
        })
      );

      // Owner tries to change createdAt ❌
      await assertFails(
        taskRef.update({
          ...getBaseUpdate(),
          createdAt: serverTimestamp(),
        })
      );
    });
  });

  describe('Delete permissions', () => {
    const TASK_ID = 'delete-task';

    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('projects').doc(PID).collection('tasks').doc(TASK_ID).set({
          title: 'Task To Delete',
          description: '',
          status: 'todo',
          priority: 'medium',
          assigneeId: MEMBER_B,
          createdBy: MEMBER_A,
          dueDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
    });

    it('allows Owner and Member A (creator) to delete the task', async () => {
      // Creator can delete
      const creator = testEnv.authenticatedContext(MEMBER_A);
      await assertSucceeds(
        creator.firestore().collection('projects').doc(PID).collection('tasks').doc(TASK_ID).delete()
      );

      // Re-seed for Owner test
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('projects').doc(PID).collection('tasks').doc(TASK_ID).set({
          title: 'Task To Delete',
          description: '',
          status: 'todo',
          priority: 'medium',
          assigneeId: MEMBER_B,
          createdBy: MEMBER_A,
          dueDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      // Owner can delete
      const owner = testEnv.authenticatedContext(OWNER);
      await assertSucceeds(
        owner.firestore().collection('projects').doc(PID).collection('tasks').doc(TASK_ID).delete()
      );
    });

    it('denies Member B (assignee, not creator) from deleting the task', async () => {
      const assignee = testEnv.authenticatedContext(MEMBER_B);
      await assertFails(
        assignee.firestore().collection('projects').doc(PID).collection('tasks').doc(TASK_ID).delete()
      );
    });

    it('denies Member C (other member) from deleting the task', async () => {
      const other = testEnv.authenticatedContext(MEMBER_C);
      await assertFails(
        other.firestore().collection('projects').doc(PID).collection('tasks').doc(TASK_ID).delete()
      );
    });

    it('denies Outsider D and Removed Member E from deleting the task', async () => {
      const outsider = testEnv.authenticatedContext(OUTSIDER_D);
      await assertFails(
        outsider.firestore().collection('projects').doc(PID).collection('tasks').doc(TASK_ID).delete()
      );

      const removed = testEnv.authenticatedContext(REMOVED_E);
      await assertFails(
        removed.firestore().collection('projects').doc(PID).collection('tasks').doc(TASK_ID).delete()
      );
    });
  });

  describe('Direct SDK write protections (TC-14)', () => {
    it('denies direct SDK task write from outsider D', async () => {
      const outsider = testEnv.authenticatedContext(OUTSIDER_D);
      await assertFails(
        outsider.firestore().collection('projects').doc(PID).collection('tasks').doc('hack-1').set(
          validTask(OUTSIDER_D)
        )
      );
    });

    it('denies direct SDK task write from removed member E', async () => {
      const removed = testEnv.authenticatedContext(REMOVED_E);
      await assertFails(
        removed.firestore().collection('projects').doc(PID).collection('tasks').doc('hack-2').set(
          validTask(REMOVED_E)
        )
      );
    });
  });

  describe('Extended task schema (checklist, labels, recurrence) (Task 51)', () => {
    it('denies creating a task with 21 checklist items', async () => {
      const creator = testEnv.authenticatedContext(MEMBER_A);
      const items21 = Array.from({ length: 21 }, (_, i) => ({
        id: `c-${i}`,
        text: `Item ${i}`,
        done: false,
      }));
      await assertFails(
        creator.firestore().collection('projects').doc(PID).collection('tasks').doc('t-21-check').set({
          ...validTask(MEMBER_A),
          checklist: items21,
        })
      );
    });

    it('denies creating a task with 6 labels', async () => {
      const creator = testEnv.authenticatedContext(MEMBER_A);
      await assertFails(
        creator.firestore().collection('projects').doc(PID).collection('tasks').doc('t-6-labels').set({
          ...validTask(MEMBER_A),
          labels: ['a', 'b', 'c', 'd', 'e', 'f'],
        })
      );
    });

    it('denies creating a task with invalid recurrence', async () => {
      const creator = testEnv.authenticatedContext(MEMBER_A);
      await assertFails(
        creator.firestore().collection('projects').doc(PID).collection('tasks').doc('t-invalid-rec').set({
          ...validTask(MEMBER_A),
          recurrence: 'yearly',
        })
      );
    });

    it('denies creating a task with unknown field (hasOnly)', async () => {
      const creator = testEnv.authenticatedContext(MEMBER_A);
      await assertFails(
        creator.firestore().collection('projects').doc(PID).collection('tasks').doc('t-unknown').set({
          ...validTask(MEMBER_A),
          unknownProp: 'invalid',
        })
      );
    });

    it('allows owner to update title of an old task lacking the 3 fields', async () => {
      // Seed old task document directly without checklist, labels, recurrence
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('projects').doc(PID).collection('tasks').doc('old-task-1').set({
          title: 'Old Legacy Task',
          description: 'Created before Phase 6',
          status: 'todo',
          priority: 'medium',
          assigneeId: MEMBER_B,
          createdBy: MEMBER_A,
          dueDate: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      const owner = testEnv.authenticatedContext(OWNER);
      await assertSucceeds(
        owner.firestore().collection('projects').doc(PID).collection('tasks').doc('old-task-1').update({
          title: 'Updated Old Legacy Task',
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('allows assignee to update checklist on a task', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('projects').doc(PID).collection('tasks').doc('t-phase6-assigned').set(validTask(MEMBER_A, MEMBER_B));
      });
      const assignee = testEnv.authenticatedContext(MEMBER_B);
      await assertSucceeds(
        assignee.firestore().collection('projects').doc(PID).collection('tasks').doc('t-phase6-assigned').update({
          checklist: [{ id: '1', text: 'Step 1', done: true }],
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('denies non-creator non-assignee member from updating checklist', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('projects').doc(PID).collection('tasks').doc('t-phase6-assigned').set(validTask(MEMBER_A, MEMBER_B));
      });
      const other = testEnv.authenticatedContext(MEMBER_C);
      await assertFails(
        other.firestore().collection('projects').doc(PID).collection('tasks').doc('t-phase6-assigned').update({
          checklist: [{ id: '1', text: 'Step 1', done: true }],
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('allows creating a task with valid checklist, labels, and recurrence', async () => {
      const creator = testEnv.authenticatedContext(MEMBER_A);
      await assertSucceeds(
        creator.firestore().collection('projects').doc(PID).collection('tasks').doc('t-valid-phase6').set({
          ...validTask(MEMBER_A),
          checklist: [{ id: '1', text: 'Clean up code', done: false }],
          labels: ['refactor', 'v2'],
          recurrence: 'weekly',
        })
      );
    });
  });
});
