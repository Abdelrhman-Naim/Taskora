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

describe('Activity security rules (/projects/{pid}/activity/{aid}) (Task 52)', () => {
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

  const PID = 'proj-activity-1';
  const OWNER = 'owner-uid';
  const MEMBER_A = 'member-a-uid';
  const OUTSIDER = 'outsider-uid';

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('projects').doc(PID).set({
          name: 'Activity Test Project',
          description: 'Testing activity rules',
          ownerId: OWNER,
          memberIds: [OWNER, MEMBER_A],
          memberNames: {
            [OWNER]: 'Owner User',
            [MEMBER_A]: 'Alice Member',
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
    }
  });

  const validActivity = (actorId: string, actorName: string) => ({
    type: 'task_created',
    actorId,
    actorName,
    taskId: 'task-1',
    taskTitle: 'Build navbar',
    detail: null,
    createdAt: serverTimestamp(),
  });

  it('allows a member to create a valid activity entry', async () => {
    const member = testEnv.authenticatedContext(MEMBER_A);
    await assertSucceeds(
      member.firestore().collection('projects').doc(PID).collection('activity').doc('act-1').set(
        validActivity(MEMBER_A, 'Alice Member')
      )
    );
  });

  it('denies activity create when actorId does not match auth.uid', async () => {
    const member = testEnv.authenticatedContext(MEMBER_A);
    await assertFails(
      member.firestore().collection('projects').doc(PID).collection('activity').doc('act-spoof-id').set(
        validActivity(OWNER, 'Owner User')
      )
    );
  });

  it('denies activity create when actorName does not match project memberNames', async () => {
    const member = testEnv.authenticatedContext(MEMBER_A);
    await assertFails(
      member.firestore().collection('projects').doc(PID).collection('activity').doc('act-spoof-name').set(
        validActivity(MEMBER_A, 'Wrong Fake Name')
      )
    );
  });

  it('denies activity create with unknown/invalid type', async () => {
    const member = testEnv.authenticatedContext(MEMBER_A);
    await assertFails(
      member.firestore().collection('projects').doc(PID).collection('activity').doc('act-bad-type').set({
        ...validActivity(MEMBER_A, 'Alice Member'),
        type: 'invalid_event_type',
      })
    );
  });

  it('denies non-member from reading activity log', async () => {
    const outsider = testEnv.authenticatedContext(OUTSIDER);
    await assertFails(
      outsider.firestore().collection('projects').doc(PID).collection('activity').doc('act-1').get()
    );
    await assertFails(
      outsider.firestore().collection('projects').doc(PID).collection('activity').get()
    );
  });

  it('allows member to read activity log', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('projects').doc(PID).collection('activity').doc('act-seeded').set(
        validActivity(MEMBER_A, 'Alice Member')
      );
    });

    const member = testEnv.authenticatedContext(MEMBER_A);
    await assertSucceeds(
      member.firestore().collection('projects').doc(PID).collection('activity').doc('act-seeded').get()
    );
    await assertSucceeds(
      member.firestore().collection('projects').doc(PID).collection('activity').get()
    );
  });

  it('denies any update to activity entries (append-only ledger)', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('projects').doc(PID).collection('activity').doc('act-seeded').set(
        validActivity(MEMBER_A, 'Alice Member')
      );
    });

    const owner = testEnv.authenticatedContext(OWNER);
    const member = testEnv.authenticatedContext(MEMBER_A);

    await assertFails(
      member.firestore().collection('projects').doc(PID).collection('activity').doc('act-seeded').update({
        taskTitle: 'Hacked Title',
      })
    );
    await assertFails(
      owner.firestore().collection('projects').doc(PID).collection('activity').doc('act-seeded').update({
        taskTitle: 'Hacked Title by Owner',
      })
    );
  });

  it('denies non-owner from deleting activity entries, but allows owner', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('projects').doc(PID).collection('activity').doc('act-to-delete').set(
        validActivity(MEMBER_A, 'Alice Member')
      );
    });

    const member = testEnv.authenticatedContext(MEMBER_A);
    await assertFails(
      member.firestore().collection('projects').doc(PID).collection('activity').doc('act-to-delete').delete()
    );

    const owner = testEnv.authenticatedContext(OWNER);
    await assertSucceeds(
      owner.firestore().collection('projects').doc(PID).collection('activity').doc('act-to-delete').delete()
    );
  });
});
