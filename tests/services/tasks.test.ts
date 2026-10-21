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

  it('creates task with checklist, labels, and recurrence, and retrieves them as-is (Task 51)', async () => {
    const { memberA, memberB, projectId } = await setupProjectWithMembers();

    const taskId = await createTask(memberA.db, projectId, memberA.uid, {
      title: 'Extended Feature Task',
      description: 'Testing checklist and labels',
      priority: 'high',
      assigneeId: memberB.uid,
      dueDate: '2026-11-15',
      checklist: [
        { id: 'c1', text: 'Subtask 1', done: false },
        { id: 'c2', text: 'Subtask 2', done: true },
      ],
      labels: ['frontend', 'pwa'],
      recurrence: 'weekly',
    });

    const tasks = await listTasks(memberA.db, projectId);
    const task = tasks.find((t) => t.id === taskId);
    expect(task).toBeDefined();
    expect(task?.checklist).toEqual([
      { id: 'c1', text: 'Subtask 1', done: false },
      { id: 'c2', text: 'Subtask 2', done: true },
    ]);
    expect(task?.labels).toEqual(['frontend', 'pwa']);
    expect(task?.recurrence).toBe('weekly');
  });

  it('normalizes legacy tasks lacking checklist, labels, and recurrence to default empty values (Task 51)', async () => {
    const { memberA, projectId } = await setupProjectWithMembers();

    // Insert legacy task document directly without the 3 new fields
    const { serverTimestamp, setDoc } = await import('firebase/firestore');
    const legacyDocRef = doc(memberA.db, 'projects', projectId, 'tasks', 'legacy-task-xyz');
    await setDoc(legacyDocRef, {
      title: 'Legacy Task Without Phase 6 Fields',
      description: 'Legacy task',
      status: 'todo',
      priority: 'low',
      assigneeId: null,
      createdBy: memberA.uid,
      dueDate: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const tasks = await listTasks(memberA.db, projectId);
    const legacy = tasks.find((t) => t.id === 'legacy-task-xyz');
    expect(legacy).toBeDefined();
    expect(legacy?.checklist).toEqual([]);
    expect(legacy?.labels).toEqual([]);
    expect(legacy?.recurrence).toBe('none');
  });

  describe('Recurring Tasks (Task 55)', () => {
    it('spawns a new task on transition to done when recurrence != none and has dueDate', async () => {
      const { memberA, memberB, projectId } = await setupProjectWithMembers();

      const taskId = await createTask(memberA.db, projectId, memberA.uid, {
        title: 'Weekly Standup Notes',
        description: 'Prepare notes',
        priority: 'high',
        assigneeId: memberB.uid,
        dueDate: '2026-10-18',
        checklist: [
          { id: 'c1', text: 'Item 1', done: true },
          { id: 'c2', text: 'Item 2', done: false },
        ],
        labels: ['weekly', 'notes'],
        recurrence: 'weekly',
      });

      const initialTasks = await listTasks(memberB.db, projectId);
      const originalTask = initialTasks.find((t) => t.id === taskId)!;

      const actor = { uid: memberB.uid, displayName: 'Bob Assignee' };

      // Complete the task
      await changeTaskStatus(memberB.db, projectId, taskId, 'done', {
        actor,
        task: originalTask,
      });

      const allTasks = await listTasks(memberB.db, projectId);
      expect(allTasks.length).toBe(2);

      // The original task is now done
      const updatedOriginal = allTasks.find((t) => t.id === taskId)!;
      expect(updatedOriginal.status).toBe('done');

      // The newly spawned task
      const spawned = allTasks.find((t) => t.id !== taskId)!;
      expect(spawned.title).toBe('Weekly Standup Notes');
      expect(spawned.description).toBe('Prepare notes');
      expect(spawned.priority).toBe('high');
      expect(spawned.assigneeId).toBe(memberB.uid);
      expect(spawned.labels).toEqual(['weekly', 'notes']);
      expect(spawned.recurrence).toBe('weekly');
      expect(spawned.status).toBe('todo');
      expect(spawned.createdBy).toBe(memberB.uid);
      // dueDate should advance by 7 days from 2026-10-18
      expect(spawned.dueDate).toBe('2026-10-25');
      // Checklist items reset to done: false and have new IDs
      expect(spawned.checklist.length).toBe(2);
      expect(spawned.checklist[0].text).toBe('Item 1');
      expect(spawned.checklist[0].done).toBe(false);
      expect(spawned.checklist[0].id).not.toBe('c1');
      expect(spawned.checklist[1].text).toBe('Item 2');
      expect(spawned.checklist[1].done).toBe(false);
      expect(spawned.checklist[1].id).not.toBe('c2');
    });

    it('does NOT spawn a new task if recurrence is none or dueDate is null or transition is not to done', async () => {
      const { memberA, projectId } = await setupProjectWithMembers();

      const taskId = await createTask(memberA.db, projectId, memberA.uid, {
        title: 'Non-recurring task',
        description: 'Single task',
        priority: 'low',
        assigneeId: memberA.uid,
        dueDate: '2026-10-18',
        recurrence: 'none',
      });

      const originalTask = (await listTasks(memberA.db, projectId)).find((t) => t.id === taskId)!;
      const actor = { uid: memberA.uid, displayName: 'Alice Creator' };

      // Transition todo -> in_progress
      await changeTaskStatus(memberA.db, projectId, taskId, 'in_progress', {
        actor,
        task: originalTask,
      });
      let tasks = await listTasks(memberA.db, projectId);
      expect(tasks.length).toBe(1);

      // Transition in_progress -> done on recurrence: 'none'
      const inProgTask = tasks.find((t) => t.id === taskId)!;
      await changeTaskStatus(memberA.db, projectId, taskId, 'done', {
        actor,
        task: inProgTask,
      });
      tasks = await listTasks(memberA.db, projectId);
      expect(tasks.length).toBe(1);

      // Transition done -> done
      const doneTask = tasks.find((t) => t.id === taskId)!;
      await changeTaskStatus(memberA.db, projectId, taskId, 'done', {
        actor,
        task: doneTask,
      });
      tasks = await listTasks(memberA.db, projectId);
      expect(tasks.length).toBe(1);
    });
  });
});
