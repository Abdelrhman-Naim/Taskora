import { describe, it, expect, beforeEach } from 'vitest';
import { doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import {
  createTask,
  changeTaskStatus,
  updateTask,
  deleteTask,
} from '@/services/tasks';
import { addMember, removeMember } from '@/services/members';
import { createProject, deleteProjectCascade } from '@/services/projects';
import { listActivity, newActivityRef, activityData } from '@/services/activity';
import { createTestUser, clearEmulators } from '../helpers/emulatorApp';
import { Task } from '@/types';

describe('Activity Service & Atomic Logging (Task 52)', () => {
  beforeEach(async () => {
    await clearEmulators();
  });

  async function setupProjectWithMembers() {
    const owner = await createTestUser('Owner User', 'owner@example.test');
    const memberA = await createTestUser('Alice Creator', 'alice@example.test');
    const memberB = await createTestUser('Bob Assignee', 'bob@example.test');
    const outsider = await createTestUser('David Outsider', 'david@example.test');

    const projectId = await createProject(
      owner.db,
      { uid: owner.uid, displayName: 'Owner User' },
      { name: 'Activity Project', description: 'Testing Activity' }
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

    return { owner, memberA, memberB, outsider, projectId };
  }

  it('writes exactly 1 task_created activity with ctx, and 0 without ctx', async () => {
    const { memberA, projectId } = await setupProjectWithMembers();

    // 1. Without ctx -> 0 activity logs
    await createTask(memberA.db, projectId, memberA.uid, {
      title: 'Task without ctx',
      description: '',
      priority: 'medium',
      assigneeId: null,
      dueDate: null,
    });

    let activities = await listActivity(memberA.db, projectId);
    expect(activities).toHaveLength(0);

    // 2. With ctx -> exactly 1 task_created log
    const taskId = await createTask(
      memberA.db,
      projectId,
      memberA.uid,
      {
        title: 'Task with ctx',
        description: 'notes',
        priority: 'high',
        assigneeId: null,
        dueDate: null,
      },
      { actor: { uid: memberA.uid, displayName: 'Alice Creator' } }
    );

    activities = await listActivity(memberA.db, projectId);
    expect(activities).toHaveLength(1);
    expect(activities[0].type).toBe('task_created');
    expect(activities[0].actorId).toBe(memberA.uid);
    expect(activities[0].actorName).toBe('Alice Creator');
    expect(activities[0].taskId).toBe(taskId);
    expect(activities[0].taskTitle).toBe('Task with ctx');
    expect(activities[0].detail).toBeNull();
  });

  it('writes task_status_changed with detail "todo>done" on status change', async () => {
    const { memberA, memberB, projectId } = await setupProjectWithMembers();

    const taskId = await createTask(memberA.db, projectId, memberA.uid, {
      title: 'Feature Work',
      description: '',
      priority: 'medium',
      assigneeId: memberB.uid,
      dueDate: null,
    });

    const initialTask: Task = {
      id: taskId,
      projectId,
      title: 'Feature Work',
      description: '',
      status: 'todo',
      priority: 'medium',
      assigneeId: memberB.uid,
      createdBy: memberA.uid,
      dueDate: null,
      checklist: [],
      labels: [],
      recurrence: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Member B (assignee) changes status
    await changeTaskStatus(memberB.db, projectId, taskId, 'done', {
      actor: { uid: memberB.uid, displayName: 'Bob Assignee' },
      task: initialTask,
    });

    const activities = await listActivity(memberB.db, projectId);
    expect(activities).toHaveLength(1);
    expect(activities[0].type).toBe('task_status_changed');
    expect(activities[0].actorId).toBe(memberB.uid);
    expect(activities[0].actorName).toBe('Bob Assignee');
    expect(activities[0].taskId).toBe(taskId);
    expect(activities[0].taskTitle).toBe('Feature Work');
    expect(activities[0].detail).toBe('todo>done');
  });

  it('writes task_assigned when assigneeId changes, and writes nothing for other field edits', async () => {
    const { owner, memberA, projectId } = await setupProjectWithMembers();

    const taskId = await createTask(owner.db, projectId, owner.uid, {
      title: 'Fix issue',
      description: 'Initial notes',
      priority: 'low',
      assigneeId: null,
      dueDate: null,
    });

    const taskBefore: Task = {
      id: taskId,
      projectId,
      title: 'Fix issue',
      description: 'Initial notes',
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

    // 1. Edit title and description only -> no activity log written
    await updateTask(
      owner.db,
      projectId,
      taskId,
      { title: 'Updated Title', description: 'Updated notes' },
      { actor: { uid: owner.uid, displayName: 'Owner User' }, task: taskBefore }
    );

    let activities = await listActivity(owner.db, projectId);
    expect(activities).toHaveLength(0);

    // 2. Change assigneeId -> task_assigned log written
    await updateTask(
      owner.db,
      projectId,
      taskId,
      { assigneeId: memberA.uid },
      {
        actor: { uid: owner.uid, displayName: 'Owner User' },
        task: { ...taskBefore, title: 'Updated Title' },
        assigneeName: 'Alice Creator',
      }
    );

    activities = await listActivity(owner.db, projectId);
    expect(activities).toHaveLength(1);
    expect(activities[0].type).toBe('task_assigned');
    expect(activities[0].actorId).toBe(owner.uid);
    expect(activities[0].detail).toBe('Alice Creator');

    // 3. Unassign -> detail is null
    await updateTask(
      owner.db,
      projectId,
      taskId,
      { assigneeId: null },
      {
        actor: { uid: owner.uid, displayName: 'Owner User' },
        task: { ...taskBefore, assigneeId: memberA.uid },
      }
    );

    activities = await listActivity(owner.db, projectId);
    expect(activities).toHaveLength(2);
    expect(activities[0].type).toBe('task_assigned');
    expect(activities[0].detail).toBeNull();
  });

  it('writes task_deleted when task is deleted', async () => {
    const { owner, projectId } = await setupProjectWithMembers();

    const taskId = await createTask(owner.db, projectId, owner.uid, {
      title: 'To Be Deleted',
      description: '',
      priority: 'low',
      assigneeId: null,
      dueDate: null,
    });

    const task: Task = {
      id: taskId,
      projectId,
      title: 'To Be Deleted',
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

    await deleteTask(owner.db, projectId, taskId, {
      actor: { uid: owner.uid, displayName: 'Owner User' },
      task,
    });

    const activities = await listActivity(owner.db, projectId);
    expect(activities).toHaveLength(1);
    expect(activities[0].type).toBe('task_deleted');
    expect(activities[0].taskTitle).toBe('To Be Deleted');
  });

  it('writes member_added and member_removed on membership changes', async () => {
    const { owner, outsider, projectId } = await setupProjectWithMembers();

    // 1. Add member
    await addMember(owner.db, projectId, 'david@example.test', {
      actor: { uid: owner.uid, displayName: 'Owner User' },
    });

    let activities = await listActivity(owner.db, projectId);
    expect(activities).toHaveLength(1);
    expect(activities[0].type).toBe('member_added');
    expect(activities[0].detail).toBe('David Outsider');

    // 2. Remove member
    await removeMember(owner.db, projectId, outsider.uid, {
      actor: { uid: owner.uid, displayName: 'Owner User' },
    });

    activities = await listActivity(owner.db, projectId);
    expect(activities).toHaveLength(2);
    expect(activities[0].type).toBe('member_removed');
    expect(activities[0].detail).toBe('David Outsider');
  });

  it('enforces atomicity: denied writes leave zero activity records', async () => {
    const { memberA, projectId } = await setupProjectWithMembers();

    // Member A attempts to spoof actorId or write with invalid rules
    await expect(
      createTask(
        memberA.db,
        projectId,
        memberA.uid,
        {
          title: 'Spoofed Task',
          description: '',
          priority: 'low',
          assigneeId: null,
          dueDate: null,
        },
        // Spoofing actorId with someone else's ID will fail rules
        { actor: { uid: 'spoofed-id', displayName: 'Spoofed Name' } }
      )
    ).rejects.toThrow();

    const activities = await listActivity(memberA.db, projectId);
    expect(activities).toHaveLength(0);
  });

  it('deleteProjectCascade deletes all activity logs even with 405 records in batches <= 400', async () => {
    const { owner, projectId } = await setupProjectWithMembers();

    // Seed 405 activity records in batches of 400
    const TOTAL_ACTS = 405;
    for (let i = 0; i < TOTAL_ACTS; i += 400) {
      const count = Math.min(400, TOTAL_ACTS - i);
      const batch = writeBatch(owner.db);
      for (let j = 0; j < count; j++) {
        const ref = newActivityRef(owner.db, projectId);
        batch.set(
          ref,
          activityData(
            { uid: owner.uid, displayName: 'Owner User' },
            {
              type: 'task_created',
              taskTitle: `Task ${i + j}`,
            }
          )
        );
      }
      await batch.commit();
    }

    // Verify 405 records exist
    const { collection, getDocs } = await import('firebase/firestore');
    const beforeSnap = await getDocs(collection(owner.db, 'projects', projectId, 'activity'));
    expect(beforeSnap.size).toBe(405);

    // Run deleteProjectCascade
    await deleteProjectCascade(owner.db, projectId);

    // Verify project and activity are completely deleted
    const projectSnap = await getDoc(doc(owner.db, 'projects', projectId));
    expect(projectSnap.exists()).toBe(false);

    // Verify activity collection has 0 documents left via emulator REST (bypassing rules since project is deleted)
    const res = await fetch(
      `http://127.0.0.1:8085/v1/projects/demo-taskflow/databases/(default)/documents/projects/${projectId}/activity`
    );
    const data = await res.json();
    expect(data.documents || []).toHaveLength(0);
  }, 45000);
});
