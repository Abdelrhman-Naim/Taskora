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

describe('Notifications security rules (/users/{uid}/notifications/{nid}) (Task 53)', () => {
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

  const PID = 'proj-notif-1';
  const OWNER = 'owner-uid';
  const MEMBER_A = 'member-a-uid'; // Sender
  const MEMBER_B = 'member-b-uid'; // Recipient
  const OUTSIDER = 'outsider-uid';
  const REMOVED = 'removed-uid';

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('projects').doc(PID).set({
          name: 'Notif Project',
          description: 'Testing notifications rules',
          ownerId: OWNER,
          memberIds: [OWNER, MEMBER_A, MEMBER_B],
          memberNames: {
            [OWNER]: 'Owner User',
            [MEMBER_A]: 'Alice Sender',
            [MEMBER_B]: 'Bob Recipient',
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Seed users
        for (const uid of [OWNER, MEMBER_A, MEMBER_B, OUTSIDER, REMOVED]) {
          await db.collection('users').doc(uid).set({
            displayName: `User ${uid}`,
            email: `${uid}@example.test`,
            createdAt: serverTimestamp(),
          });
        }
      });
    }
  });

  const validNotification = (actorId: string, actorName: string) => ({
    type: 'task_assigned',
    projectId: PID,
    projectName: 'Notif Project',
    taskId: 'task-1',
    taskTitle: 'Build navbar',
    actorId,
    actorName,
    createdAt: serverTimestamp(),
    readAt: null,
  });

  it('allows a member to create a notification for another member in the project', async () => {
    const sender = testEnv.authenticatedContext(MEMBER_A);
    await assertSucceeds(
      sender.firestore().collection('users').doc(MEMBER_B).collection('notifications').doc('notif-1').set(
        validNotification(MEMBER_A, 'Alice Sender')
      )
    );
  });

  it('denies creating a notification for oneself (request.auth.uid == uid)', async () => {
    const sender = testEnv.authenticatedContext(MEMBER_A);
    await assertFails(
      sender.firestore().collection('users').doc(MEMBER_A).collection('notifications').doc('notif-self').set(
        validNotification(MEMBER_A, 'Alice Sender')
      )
    );
  });

  it('denies creating a notification for a user not in the project', async () => {
    const sender = testEnv.authenticatedContext(MEMBER_A);
    await assertFails(
      sender.firestore().collection('users').doc(OUTSIDER).collection('notifications').doc('notif-out').set(
        validNotification(MEMBER_A, 'Alice Sender')
      )
    );
  });

  it('denies creating a notification with a spoofed actorId', async () => {
    const sender = testEnv.authenticatedContext(MEMBER_A);
    await assertFails(
      sender.firestore().collection('users').doc(MEMBER_B).collection('notifications').doc('notif-spoof').set(
        validNotification(OWNER, 'Owner User')
      )
    );
  });

  it('denies creating a notification with non-null readAt', async () => {
    const sender = testEnv.authenticatedContext(MEMBER_A);
    await assertFails(
      sender.firestore().collection('users').doc(MEMBER_B).collection('notifications').doc('notif-read').set({
        ...validNotification(MEMBER_A, 'Alice Sender'),
        readAt: serverTimestamp(),
      })
    );
  });

  it('allows recipient to read their notifications, but denies other members and outsiders', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('users').doc(MEMBER_B).collection('notifications').doc('notif-b').set(
        validNotification(MEMBER_A, 'Alice Sender')
      );
    });

    const recipient = testEnv.authenticatedContext(MEMBER_B);
    await assertSucceeds(
      recipient.firestore().collection('users').doc(MEMBER_B).collection('notifications').doc('notif-b').get()
    );

    const sender = testEnv.authenticatedContext(MEMBER_A);
    await assertFails(
      sender.firestore().collection('users').doc(MEMBER_B).collection('notifications').doc('notif-b').get()
    );

    const outsider = testEnv.authenticatedContext(OUTSIDER);
    await assertFails(
      outsider.firestore().collection('users').doc(MEMBER_B).collection('notifications').doc('notif-b').get()
    );
  });

  it('allows recipient to update readAt only, but denies updating other fields like type', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('users').doc(MEMBER_B).collection('notifications').doc('notif-up').set(
        validNotification(MEMBER_A, 'Alice Sender')
      );
    });

    const recipient = testEnv.authenticatedContext(MEMBER_B);

    // Can update readAt
    await assertSucceeds(
      recipient.firestore().collection('users').doc(MEMBER_B).collection('notifications').doc('notif-up').update({
        readAt: serverTimestamp(),
      })
    );

    // Cannot update type
    await assertFails(
      recipient.firestore().collection('users').doc(MEMBER_B).collection('notifications').doc('notif-up').update({
        type: 'comment_added',
      })
    );
  });

  it('denies actor who was removed from the project from creating a notification', async () => {
    const removed = testEnv.authenticatedContext(REMOVED);
    await assertFails(
      removed.firestore().collection('users').doc(MEMBER_B).collection('notifications').doc('notif-rem').set(
        validNotification(REMOVED, 'Removed User')
      )
    );
  });

  it('allows adding a member and creating their notification in a single atomic batch (proves getAfter)', async () => {
    const owner = testEnv.authenticatedContext(OWNER);
    const db = owner.firestore();

    const batch = db.batch();
    const projRef = db.collection('projects').doc(PID);
    const notifRef = db.collection('users').doc(OUTSIDER).collection('notifications').doc('notif-added');

    // Add outsider to project members in the batch
    batch.update(projRef, {
      memberIds: [OWNER, MEMBER_A, MEMBER_B, OUTSIDER],
      'memberNames.outsider-uid': 'Outsider User',
      updatedAt: serverTimestamp(),
    });

    // In same batch, create member_added notification for the newly added member
    batch.set(notifRef, {
      type: 'member_added',
      projectId: PID,
      projectName: 'Notif Project',
      taskId: null,
      taskTitle: null,
      actorId: OWNER,
      actorName: 'Owner User',
      createdAt: serverTimestamp(),
      readAt: null,
    });

    await assertSucceeds(batch.commit());
  });
});
