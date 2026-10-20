import { describe, it, expect, beforeEach } from 'vitest';
import { doc, updateDoc } from 'firebase/firestore';
import {
  recipientsFor,
  subscribeNotifications,
  markAllRead,
  markRead,
  countUnread,
} from '@/services/notifications';
import { createTask, updateTask } from '@/services/tasks';
import { createProject } from '@/services/projects';
import { createTestUser, clearEmulators } from '../helpers/emulatorApp';
import { AppNotification, Task } from '@/types';

describe('Notifications Service & Logic (Task 53)', () => {
  beforeEach(async () => {
    await clearEmulators();
  });

  describe('recipientsFor table-driven tests', () => {
    it('returns empty array when assigning to oneself', () => {
      const recs = recipientsFor({
        type: 'task_assigned',
        actorUid: 'u-1',
        newAssigneeId: 'u-1',
      });
      expect(recs).toEqual([]);
    });

    it('returns [newAssigneeId] when assigning to another user', () => {
      const recs = recipientsFor({
        type: 'task_assigned',
        actorUid: 'u-1',
        newAssigneeId: 'u-2',
      });
      expect(recs).toEqual(['u-2']);
    });

    it('returns both creator and assignee when third party comments on task', () => {
      const recs = recipientsFor({
        type: 'comment_added',
        actorUid: 'u-3',
        task: {
          createdBy: 'u-1',
          assigneeId: 'u-2',
        },
      });
      expect(recs).toEqual(['u-1', 'u-2']);
    });

    it('deduplicates when creator and assignee are the same person', () => {
      const recs = recipientsFor({
        type: 'comment_added',
        actorUid: 'u-3',
        task: {
          createdBy: 'u-1',
          assigneeId: 'u-1',
        },
      });
      expect(recs).toEqual(['u-1']);
    });

    it('returns assignee only when creator is the commenting actor', () => {
      const recs = recipientsFor({
        type: 'comment_added',
        actorUid: 'u-1',
        task: {
          createdBy: 'u-1',
          assigneeId: 'u-2',
        },
      });
      expect(recs).toEqual(['u-2']);
    });

    it('returns added user when member_added is triggered for someone else', () => {
      const recs = recipientsFor({
        type: 'member_added',
        actorUid: 'u-1',
        addedUid: 'u-2',
      });
      expect(recs).toEqual(['u-2']);
    });

    it('returns empty array if addedUid equals actorUid', () => {
      const recs = recipientsFor({
        type: 'member_added',
        actorUid: 'u-1',
        addedUid: 'u-1',
      });
      expect(recs).toEqual([]);
    });
  });

  describe('Integration with real Firestore emulator and onSnapshot', () => {
    async function setupProjectWithMembers() {
      const owner = await createTestUser('Owner User', 'owner@example.test');
      const memberA = await createTestUser('Alice Creator', 'alice@example.test');
      const memberB = await createTestUser('Bob Assignee', 'bob@example.test');

      const projectId = await createProject(
        owner.db,
        { uid: owner.uid, displayName: 'Owner User' },
        { name: 'Awesome Project', description: 'Testing Notifications' }
      );

      const { serverTimestamp } = await import('firebase/firestore');
      await updateDoc(doc(owner.db, 'projects', projectId), {
        memberIds: [owner.uid, memberA.uid, memberB.uid],
        memberNames: {
          [owner.uid]: 'Owner User',
          [memberA.uid]: 'Alice Creator',
          [memberB.uid]: 'Bob Assignee',
        },
        updatedAt: serverTimestamp(),
      });

      return { owner, memberA, memberB, projectId };
    }

    it('delivers task_assigned notification to member B when member A assigns a task', async () => {
      const { memberA, memberB, projectId } = await setupProjectWithMembers();

      const taskId = await createTask(memberA.db, projectId, memberA.uid, {
        title: 'Build Feature X',
        description: '',
        priority: 'high',
        assigneeId: null,
        dueDate: null,
      });

      const initialTask: Task = {
        id: taskId,
        projectId,
        title: 'Build Feature X',
        description: '',
        status: 'todo',
        priority: 'high',
        assigneeId: null,
        createdBy: memberA.uid,
        dueDate: null,
        checklist: [],
        labels: [],
        recurrence: 'none',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Set up onSnapshot listener for Member B
      let resolveFirstDelivery: (n: AppNotification[]) => void;
      const deliveryPromise = new Promise<AppNotification[]>((resolve) => {
        resolveFirstDelivery = resolve;
      });

      const unsubscribe = subscribeNotifications(
        memberB.db,
        memberB.uid,
        (list) => {
          if (list.length > 0) {
            resolveFirstDelivery(list);
          }
        },
        (err) => {
          throw err;
        }
      );

      try {
        // Member A assigns task to Member B
        await updateTask(
          memberA.db,
          projectId,
          taskId,
          { assigneeId: memberB.uid },
          {
            actor: { uid: memberA.uid, displayName: 'Alice Creator' },
            task: initialTask,
            assigneeName: 'Bob Assignee',
            projectName: 'Awesome Project',
          }
        );

        // Wait for delivery via onSnapshot (within 5 seconds)
        const notifs = await Promise.race([
          deliveryPromise,
          new Promise<AppNotification[]>((_, reject) =>
            setTimeout(() => reject(new Error('Notification timed out')), 5000)
          ),
        ]);

        expect(notifs).toHaveLength(1);
        const notif = notifs[0];
        expect(notif.type).toBe('task_assigned');
        expect(notif.actorId).toBe(memberA.uid);
        expect(notif.actorName).toBe('Alice Creator');
        expect(notif.projectId).toBe(projectId);
        expect(notif.projectName).toBe('Awesome Project');
        expect(notif.taskId).toBe(taskId);
        expect(notif.taskTitle).toBe('Build Feature X');
        expect(notif.readAt).toBeNull();
        expect(countUnread(notifs)).toBe(1);

        // markRead
        await markRead(memberB.db, memberB.uid, notif.id);

        // markAllRead on ids
        await markAllRead(memberB.db, memberB.uid, [notif.id]);
      } finally {
        unsubscribe();
      }
    });

    it('Unsubscribe stops receiving further notifications', async () => {
      const { memberA, memberB, projectId } = await setupProjectWithMembers();

      let callbackCallCount = 0;
      const unsubscribe = subscribeNotifications(
        memberB.db,
        memberB.uid,
        () => {
          callbackCallCount++;
        },
        () => {}
      );

      // Unsubscribe immediately
      unsubscribe();
      const countAfterUnsub = callbackCallCount;

      // Member A creates another task and assigns it
      const taskId = await createTask(memberA.db, projectId, memberA.uid, {
        title: 'Another Task',
        description: '',
        priority: 'low',
        assigneeId: null,
        dueDate: null,
      });

      await updateTask(
        memberA.db,
        projectId,
        taskId,
        { assigneeId: memberB.uid },
        {
          actor: { uid: memberA.uid, displayName: 'Alice Creator' },
          task: {
            id: taskId,
            projectId,
            title: 'Another Task',
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
          },
          assigneeName: 'Bob Assignee',
          projectName: 'Awesome Project',
        }
      );

      // Wait a moment and ensure count did not increment
      await new Promise((r) => setTimeout(r, 600));
      expect(callbackCallCount).toBe(countAfterUnsub);
    });
  });
});
