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

describe('Comments security rules (/projects/{pid}/tasks/{tid}/comments/{cid}) (Task 54)', () => {
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

  const PID = 'proj-comments-1';
  const TID = 'task-comment-1';
  const OWNER = 'owner-uid';
  const CREATOR = 'creator-uid';
  const MEMBER = 'member-uid';
  const OTHER_MEMBER = 'other-uid';
  const OUTSIDER = 'outsider-uid';

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('projects').doc(PID).set({
          name: 'Comments Project',
          description: 'Testing comments rules',
          ownerId: OWNER,
          memberIds: [OWNER, CREATOR, MEMBER, OTHER_MEMBER],
          memberNames: {
            [OWNER]: 'Owner User',
            [CREATOR]: 'Task Creator',
            [MEMBER]: 'Comment Author',
            [OTHER_MEMBER]: 'Other Member',
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Seed task
        await db.collection('projects').doc(PID).collection('tasks').doc(TID).set({
          title: 'Target Task',
          description: 'Task for comments',
          status: 'todo',
          priority: 'medium',
          assigneeId: MEMBER,
          createdBy: CREATOR,
          dueDate: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
    }
  });

  const validComment = (authorId: string, authorName: string, text = 'This is a comment') => ({
    authorId,
    authorName,
    text,
    createdAt: serverTimestamp(),
  });

  it('allows a project member to add a valid comment to an existing task', async () => {
    const member = testEnv.authenticatedContext(MEMBER);
    await assertSucceeds(
      member
        .firestore()
        .collection('projects')
        .doc(PID)
        .collection('tasks')
        .doc(TID)
        .collection('comments')
        .doc('comm-1')
        .set(validComment(MEMBER, 'Comment Author'))
    );
  });

  it('denies comment with empty text (size < 1)', async () => {
    const member = testEnv.authenticatedContext(MEMBER);
    await assertFails(
      member
        .firestore()
        .collection('projects')
        .doc(PID)
        .collection('tasks')
        .doc(TID)
        .collection('comments')
        .doc('comm-empty')
        .set(validComment(MEMBER, 'Comment Author', ''))
    );
  });

  it('denies comment with text exceeding 1000 characters', async () => {
    const member = testEnv.authenticatedContext(MEMBER);
    await assertFails(
      member
        .firestore()
        .collection('projects')
        .doc(PID)
        .collection('tasks')
        .doc(TID)
        .collection('comments')
        .doc('comm-long')
        .set(validComment(MEMBER, 'Comment Author', 'a'.repeat(1001)))
    );
  });

  it('denies comment with spoofed authorId or mismatched authorName', async () => {
    const member = testEnv.authenticatedContext(MEMBER);
    // Spoofed authorId
    await assertFails(
      member
        .firestore()
        .collection('projects')
        .doc(PID)
        .collection('tasks')
        .doc(TID)
        .collection('comments')
        .doc('comm-spoof-id')
        .set(validComment(OWNER, 'Owner User'))
    );

    // Mismatched authorName
    await assertFails(
      member
        .firestore()
        .collection('projects')
        .doc(PID)
        .collection('tasks')
        .doc(TID)
        .collection('comments')
        .doc('comm-spoof-name')
        .set(validComment(MEMBER, 'Wrong Fake Name'))
    );
  });

  it('denies commenting on a non-existent task', async () => {
    const member = testEnv.authenticatedContext(MEMBER);
    await assertFails(
      member
        .firestore()
        .collection('projects')
        .doc(PID)
        .collection('tasks')
        .doc('non-existent-task')
        .collection('comments')
        .doc('comm-orphan')
        .set(validComment(MEMBER, 'Comment Author'))
    );
  });

  it('denies an outsider or removed member from reading or commenting', async () => {
    const outsider = testEnv.authenticatedContext(OUTSIDER);
    await assertFails(
      outsider
        .firestore()
        .collection('projects')
        .doc(PID)
        .collection('tasks')
        .doc(TID)
        .collection('comments')
        .doc('comm-out')
        .set(validComment(OUTSIDER, 'Outsider User'))
    );

    await assertFails(
      outsider
        .firestore()
        .collection('projects')
        .doc(PID)
        .collection('tasks')
        .doc(TID)
        .collection('comments')
        .get()
    );
  });

  it('denies any update to comments', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db
        .collection('projects')
        .doc(PID)
        .collection('tasks')
        .doc(TID)
        .collection('comments')
        .doc('comm-seeded')
        .set(validComment(MEMBER, 'Comment Author'));
    });

    const member = testEnv.authenticatedContext(MEMBER);
    await assertFails(
      member
        .firestore()
        .collection('projects')
        .doc(PID)
        .collection('tasks')
        .doc(TID)
        .collection('comments')
        .doc('comm-seeded')
        .update({ text: 'Updated Text' })
    );
  });

  describe('Comment deletion permissions', () => {
    const seedComment = async (cid: string) => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db
          .collection('projects')
          .doc(PID)
          .collection('tasks')
          .doc(TID)
          .collection('comments')
          .doc(cid)
          .set(validComment(MEMBER, 'Comment Author'));
      });
    };

    it('allows the comment author to delete their comment', async () => {
      await seedComment('comm-by-author');
      const author = testEnv.authenticatedContext(MEMBER);
      await assertSucceeds(
        author
          .firestore()
          .collection('projects')
          .doc(PID)
          .collection('tasks')
          .doc(TID)
          .collection('comments')
          .doc('comm-by-author')
          .delete()
      );
    });

    it('allows the project owner to delete any comment', async () => {
      await seedComment('comm-by-owner');
      const owner = testEnv.authenticatedContext(OWNER);
      await assertSucceeds(
        owner
          .firestore()
          .collection('projects')
          .doc(PID)
          .collection('tasks')
          .doc(TID)
          .collection('comments')
          .doc('comm-by-owner')
          .delete()
      );
    });

    it('allows the task creator to delete comments on their task', async () => {
      await seedComment('comm-by-creator');
      const taskCreator = testEnv.authenticatedContext(CREATOR);
      await assertSucceeds(
        taskCreator
          .firestore()
          .collection('projects')
          .doc(PID)
          .collection('tasks')
          .doc(TID)
          .collection('comments')
          .doc('comm-by-creator')
          .delete()
      );
    });

    it('denies other members from deleting someone else comment', async () => {
      await seedComment('comm-by-other');
      const other = testEnv.authenticatedContext(OTHER_MEMBER);
      await assertFails(
        other
          .firestore()
          .collection('projects')
          .doc(PID)
          .collection('tasks')
          .doc(TID)
          .collection('comments')
          .doc('comm-by-other')
          .delete()
      );
    });
  });
});
