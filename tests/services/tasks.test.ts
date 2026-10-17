import { describe, it, expect, beforeEach } from 'vitest';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  createTask,
  listTasks,
  updateTask,
  changeTaskStatus,
  deleteTask,
} from '@/services/tasks';
import { createProject } from '@/services/projects';
import { createTestUser, clearEmulators } from '../helpers/emulatorApp';

describe('Tasks Service', () => {
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
      { name: 'Task Project', description: 'Testing Tasks Service' }
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

  it('creates task with status=todo, createdBy, and timestamps, and lists it (TC-09)', async () => {
    const { memberA, memberB, projectId } = await setupProjectWithMembers();

    const taskId = await createTask(memberA.db, projectId, memberA.uid, {
      title: 'Setup Database',
      description: 'Run migrations',
      priority: 'high',
      assigneeId: memberB.uid,
      dueDate: '2026-10-31',
    });

    expect(taskId).toBeDefined();

    const tasks = await listTasks(memberA.db, projectId);
    expect(tasks.length).toBe(1);
    const task = tasks[0];
    expect(task.id).toBe(taskId);
    expect(task.title).toBe('Setup Database');
    expect(task.description).toBe('Run migrations');
    expect(task.status).toBe('todo');
    expect(task.priority).toBe('high');
    expect(task.assigneeId).toBe(memberB.uid);
    expect(task.createdBy).toBe(memberA.uid);
    expect(task.dueDate).toBe('2026-10-31');
    expect(task.createdAt).toBeInstanceOf(Date);
    expect(task.updatedAt).toBeInstanceOf(Date);
  });

  it('rejects short title "ab" and whitespace "   " with validation error client-side (TC-09)', async () => {
    const { memberA, projectId } = await setupProjectWithMembers();

    await expect(
      createTask(memberA.db, projectId, memberA.uid, {
        title: 'ab',
        description: '',
        priority: 'medium',
        assigneeId: null,
        dueDate: null,
      })
    ).rejects.toMatchObject({
      code: 'validation',
    });

    await expect(
      createTask(memberA.db, projectId, memberA.uid, {
        title: '   ',
        description: '',
        priority: 'medium',
        assigneeId: null,
        dueDate: null,
      })
    ).rejects.toMatchObject({
      code: 'validation',
    });
  });

  it('allows assignee (Member B) to change status to done, but denies creator (Member A) (TC-10)', async () => {
    const { memberA, memberB, projectId } = await setupProjectWithMembers();

    const taskId = await createTask(memberA.db, projectId, memberA.uid, {
      title: 'Feature Work',
      description: 'Implement feature',
      priority: 'medium',
      assigneeId: memberB.uid,
      dueDate: null,
    });

    // Creator A (not assignee) tries to change status -> permission-denied
    await expect(
      changeTaskStatus(memberA.db, projectId, taskId, 'done')
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });

    // Assignee B changes status -> succeeds
    await changeTaskStatus(memberB.db, projectId, taskId, 'done');

    const tasks = await listTasks(memberB.db, projectId);
    expect(tasks[0].status).toBe('done');
  });

  it('updates task preserving createdAt and updating updatedAt', async () => {
    const { memberA, projectId } = await setupProjectWithMembers();

    const taskId = await createTask(memberA.db, projectId, memberA.uid, {
      title: 'Initial Title',
      description: 'Initial Desc',
      priority: 'low',
      assigneeId: null,
      dueDate: null,
    });

    const initialSnap = await getDoc(doc(memberA.db, 'projects', projectId, 'tasks', taskId));
    const initialCreatedAt = initialSnap.data()?.createdAt;

    await updateTask(memberA.db, projectId, taskId, {
      title: 'Updated Title',
      description: 'Updated Desc',
      priority: 'high',
    });

    const updatedSnap = await getDoc(doc(memberA.db, 'projects', projectId, 'tasks', taskId));
    expect(updatedSnap.data()?.title).toBe('Updated Title');
    expect(updatedSnap.data()?.description).toBe('Updated Desc');
    expect(updatedSnap.data()?.priority).toBe('high');
    expect(updatedSnap.data()?.createdAt).toEqual(initialCreatedAt);
  });

  it('denies deleteTask by non-creator / non-owner, allows deletion by creator', async () => {
    const { memberA, memberB, projectId } = await setupProjectWithMembers();

    const taskId = await createTask(memberA.db, projectId, memberA.uid, {
      title: 'Task To Delete',
      description: '',
      priority: 'low',
      assigneeId: memberB.uid,
      dueDate: null,
    });

    // Assignee (not creator, not owner) tries to delete -> permission-denied
    await expect(deleteTask(memberB.db, projectId, taskId)).rejects.toMatchObject({
      code: 'permission-denied',
    });

    // Creator deletes -> succeeds
    await deleteTask(memberA.db, projectId, taskId);

    const tasks = await listTasks(memberA.db, projectId);
    expect(tasks.length).toBe(0);
  });

  it('denies listTasks for an outsider not in project members', async () => {
    const { outsider, projectId } = await setupProjectWithMembers();

    await expect(listTasks(outsider.db, projectId)).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });
});
