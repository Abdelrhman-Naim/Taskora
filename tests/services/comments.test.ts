import { describe, it, expect, beforeEach } from 'vitest';
import { doc, getDoc, updateDoc, writeBatch, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { addComment, listComments, deleteComment } from '@/services/comments';
import { createTask, deleteTask } from '@/services/tasks';
import { createProject } from '@/services/projects';
import { listActivity } from '@/services/activity';
import { subscribeNotifications } from '@/services/notifications';
import { createTestUser, clearEmulators } from '../helpers/emulatorApp';
import { AppNotification, Task } from '@/types';

describe('Comments Service & Cascading Delete (Task 54)', () => {
  beforeEach(async () => {
    await clearEmulators();
  });

  async function setupProjectWithMembers() {
    const owner = await createTestUser('Owner User', 'owner@example.test');
    const memberA = await createTestUser('Alice Creator', 'alice@example.test');
    const memberB = await createTestUser('Bob Assignee', 'bob@example.test');
    const memberC = await createTestUser('Charlie Member', 'charlie@example.test');

    const projectId = await createProject(
      owner.db,
      { uid: owner.uid, displayName: 'Owner User' },
      { name: 'Comments Project', description: 'Testing Comments' }
    );

    await updateDoc(doc(owner.db, 'projects', projectId), {
      memberIds: [owner.uid, memberA.uid, memberB.uid, memberC.uid],
      memberNames: {
        [owner.uid]: 'Owner User',
        [memberA.uid]: 'Alice Creator',
        [memberB.uid]: 'Bob Assignee',
        [memberC.uid]: 'Charlie Member',
      },
      updatedAt: serverTimestamp(),
    });

    return { owner, memberA, memberB, memberC, projectId };
  }

  it('adds comment and lists comments oldest-first, writing activity and notifications', async () => {
    const { memberA, memberB, memberC, projectId } = await setupProjectWithMembers();

    // Member A creates a task assigned to Member B
    const taskId = await createTask(memberA.db, projectId, memberA.uid, {
      title: 'Commented Task',
      description: 'Task to receive comments',
      priority: 'high',
      assigneeId: memberB.uid,
      dueDate: null,
    });

    const task: Task = {
      id: taskId,
      projectId,
      title: 'Commented Task',
      description: 'Task to receive comments',
      status: 'todo',
      priority: 'high',
      assigneeId: memberB.uid,
      createdBy: memberA.uid,
      dueDate: null,
      checklist: [],
      labels: [],
      recurrence: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Listen for notifications for Creator (Member A) and Assignee (Member B)
    let notifsA: AppNotification[] = [];
    let notifsB: AppNotification[] = [];

    const unsubA = subscribeNotifications(memberA.db, memberA.uid, (l) => { notifsA = l; }, () => {});
    const unsubB = subscribeNotifications(memberB.db, memberB.uid, (l) => { notifsB = l; }, () => {});

    try {
      // Member C (third party) adds comment 1
      const c1Id = await addComment(
        memberC.db,
        projectId,
        taskId,
        {
          actor: { uid: memberC.uid, displayName: 'Charlie Member' },
          task,
          projectName: 'Comments Project',
        },
        'First comment from Charlie'
      );

      // Wait a tick for second comment timestamp
      await new Promise((r) => setTimeout(r, 100));

      // Member C adds comment 2
      const c2Id = await addComment(
        memberC.db,
        projectId,
        taskId,
        {
          actor: { uid: memberC.uid, displayName: 'Charlie Member' },
          task,
          projectName: 'Comments Project',
        },
        'Second comment from Charlie'
      );

      // Verify listComments returns oldest first
      const comments = await listComments(memberA.db, projectId, taskId);
      expect(comments).toHaveLength(2);
      expect(comments[0].id).toBe(c1Id);
      expect(comments[0].text).toBe('First comment from Charlie');
      expect(comments[1].id).toBe(c2Id);
      expect(comments[1].text).toBe('Second comment from Charlie');

      // Verify activity log has comment_added
      const activities = await listActivity(memberA.db, projectId);
      expect(activities.length).toBeGreaterThanOrEqual(2);
      expect(activities[0].type).toBe('comment_added');
      expect(activities[0].actorId).toBe(memberC.uid);
      expect(activities[0].taskId).toBe(taskId);
      expect(activities[0].taskTitle).toBe('Commented Task');

      // Wait for notification delivery
      await new Promise((r) => setTimeout(r, 600));

      // Both creator (A) and assignee (B) received notification since author is C
      expect(notifsA.some((n) => n.type === 'comment_added' && n.taskId === taskId)).toBe(true);
      expect(notifsB.some((n) => n.type === 'comment_added' && n.taskId === taskId)).toBe(true);
    } finally {
      unsubA();
      unsubB();
    }
  });

  it('rejects empty or whitespace-only comments with validation error without writing', async () => {
    const { memberA, projectId } = await setupProjectWithMembers();

    const task: Task = {
      id: 'task-dummy',
      projectId,
      title: 'Dummy',
      description: '',
      status: 'todo',
      priority: 'low',
      assigneeId: null,
      createdBy: memberA.uid,
      dueDate: null,
      checklist: [],
      labels: [],
      recurrence: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await expect(
      addComment(
        memberA.db,
        projectId,
        'task-dummy',
        {
          actor: { uid: memberA.uid, displayName: 'Alice Creator' },
          task,
          projectName: 'Comments Project',
        },
        '   '
      )
    ).rejects.toMatchObject({ code: 'validation' });

    await expect(
      addComment(
        memberA.db,
        projectId,
        'task-dummy',
        {
          actor: { uid: memberA.uid, displayName: 'Alice Creator' },
          task,
          projectName: 'Comments Project',
        },
        ''
      )
    ).rejects.toMatchObject({ code: 'validation' });
  });

  it('deleteTask cascades deletion of its comments, handling 405 comments in batches <= 400', async () => {
    const { owner, projectId } = await setupProjectWithMembers();

    const taskId = await createTask(owner.db, projectId, owner.uid, {
      title: 'Task with many comments',
      description: '',
      priority: 'low',
      assigneeId: null,
      dueDate: null,
    });

    const task: Task = {
      id: taskId,
      projectId,
      title: 'Task with many comments',
      description: '',
      status: 'todo',
      priority: 'low',
      assigneeId: null,
      createdBy: owner.uid,
      dueDate: null,
      checklist: [],
      labels: [],
      recurrence: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Seed 405 comments
    const TOTAL_COMMENTS = 405;
    for (let i = 0; i < TOTAL_COMMENTS; i += 400) {
      const count = Math.min(400, TOTAL_COMMENTS - i);
      const batch = writeBatch(owner.db);
      for (let j = 0; j < count; j++) {
        const commRef = doc(collection(owner.db, 'projects', projectId, 'tasks', taskId, 'comments'));
        batch.set(commRef, {
          authorId: owner.uid,
          authorName: 'Owner User',
          text: `Comment ${i + j}`,
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }

    // Verify 405 comments exist
    const snapBefore = await getDocs(
      collection(owner.db, 'projects', projectId, 'tasks', taskId, 'comments')
    );
    expect(snapBefore.size).toBe(405);

    // Delete task with cascade
    await deleteTask(owner.db, projectId, taskId, {
      actor: { uid: owner.uid, displayName: 'Owner User' },
      task,
    });

    // Verify task is deleted
    const taskSnap = await getDoc(doc(owner.db, 'projects', projectId, 'tasks', taskId));
    expect(taskSnap.exists()).toBe(false);

    // Verify comments are completely deleted via REST
    const res = await fetch(
      `http://127.0.0.1:8085/v1/projects/demo-taskflow/databases/(default)/documents/projects/${projectId}/tasks/${taskId}/comments`
    );
    const data = await res.json();
    expect(data.documents || []).toHaveLength(0);
  }, 45000);

  it('deleteComment allows author, project owner, and task creator, but denies other member', async () => {
    const { owner, memberA, memberB, memberC, projectId } = await setupProjectWithMembers();

    // Member A creates task
    const taskId = await createTask(memberA.db, projectId, memberA.uid, {
      title: 'Perm Task',
      description: '',
      priority: 'medium',
      assigneeId: null,
      dueDate: null,
    });

    const task: Task = {
      id: taskId,
      projectId,
      title: 'Perm Task',
      description: '',
      status: 'todo',
      priority: 'medium',
      assigneeId: null,
      createdBy: memberA.uid,
      dueDate: null,
      checklist: [],
      labels: [],
      recurrence: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Member B adds a comment
    const commentId = await addComment(
      memberB.db,
      projectId,
      taskId,
      {
        actor: { uid: memberB.uid, displayName: 'Bob Assignee' },
        task,
        projectName: 'Comments Project',
      },
      'A comment by Bob'
    );

    // 1. Member C (other member, not author, not task creator, not owner) cannot delete
    await expect(
      deleteComment(memberC.db, projectId, taskId, commentId)
    ).rejects.toThrow();

    // 2. Member B (author) can delete
    await expect(
      deleteComment(memberB.db, projectId, taskId, commentId)
    ).resolves.not.toThrow();

    // Seed another comment by B
    const commentId2 = await addComment(
      memberB.db,
      projectId,
      taskId,
      {
        actor: { uid: memberB.uid, displayName: 'Bob Assignee' },
        task,
        projectName: 'Comments Project',
      },
      'Another comment by Bob'
    );

    // 3. Member A (Task creator) can delete
    await expect(
      deleteComment(memberA.db, projectId, taskId, commentId2)
    ).resolves.not.toThrow();

    // Seed another comment by B
    const commentId3 = await addComment(
      memberB.db,
      projectId,
      taskId,
      {
        actor: { uid: memberB.uid, displayName: 'Bob Assignee' },
        task,
        projectName: 'Comments Project',
      },
      'Third comment by Bob'
    );

    // 4. Owner can delete
    await expect(
      deleteComment(owner.db, projectId, taskId, commentId3)
    ).resolves.not.toThrow();
  });
});
