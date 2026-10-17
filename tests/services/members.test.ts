import { describe, it, expect, beforeEach } from 'vitest';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  normalizeEmail,
  addMember,
  countAssignedTasks,
  removeMember,
} from '@/services/members';
import { createProject, listUserProjects, getProject } from '@/services/projects';
import { createTask, listTasks } from '@/services/tasks';
import { createTestUser, clearEmulators } from '../helpers/emulatorApp';

describe('Members Service', () => {
  beforeEach(async () => {
    await clearEmulators();
  });

  it('normalizes email correctly (trim and lowercase)', () => {
    expect(normalizeEmail('  User@Example.COM  ')).toBe('user@example.com');
  });

  it('allows owner to add member by email, member sees project in listUserProjects, and accepts mixed case/spaces (TC-07 / Review Focus #3)', async () => {
    const owner = await createTestUser('Owner User', 'owner@example.test');
    const member = await createTestUser('Bob Member', 'bob.member@example.test');

    const projectId = await createProject(
      owner.db,
      { uid: owner.uid, displayName: 'Owner User' },
      { name: 'Team Project', description: 'Testing member addition' }
    );

    // Add with mixed case and leading/trailing whitespace (Review Focus #3)
    const added = await addMember(owner.db, projectId, '  Bob.Member@EXAMPLE.TEST  ');
    expect(added.uid).toBe(member.uid);
    expect(added.displayName).toBe('Bob Member');

    // Bob can now see the project in listUserProjects (TC-07)
    const bobProjects = await listUserProjects(member.db, member.uid);
    expect(bobProjects.some((p) => p.id === projectId)).toBe(true);
  });

  it('rejects unregistered email with unknown-user error and does not modify memberIds (TC-08)', async () => {
    const owner = await createTestUser('Owner User', 'owner@example.test');
    const projectId = await createProject(
      owner.db,
      { uid: owner.uid, displayName: 'Owner User' },
      { name: 'Project TC08', description: '' }
    );

    await expect(
      addMember(owner.db, projectId, 'unregistered@example.test')
    ).rejects.toMatchObject({
      code: 'unknown-user',
    });

    const snap = await getDoc(doc(owner.db, 'projects', projectId));
    expect(snap.data()?.memberIds).toEqual([owner.uid]);
  });

  it('rejects adding duplicate member or adding owner with duplicate-member error', async () => {
    const owner = await createTestUser('Owner User', 'owner@example.test');
    await createTestUser('Alice Member', 'alice@example.test');

    const projectId = await createProject(
      owner.db,
      { uid: owner.uid, displayName: 'Owner User' },
      { name: 'Duplicate Check', description: '' }
    );

    // Adding owner -> duplicate-member
    await expect(addMember(owner.db, projectId, 'owner@example.test')).rejects.toMatchObject({
      code: 'duplicate-member',
    });

    // Add member once
    await addMember(owner.db, projectId, 'alice@example.test');

    // Add member again -> duplicate-member
    await expect(addMember(owner.db, projectId, 'alice@example.test')).rejects.toMatchObject({
      code: 'duplicate-member',
    });
  });

  it('denies non-owner from adding a member with permission-denied', async () => {
    const owner = await createTestUser('Owner User', 'owner@example.test');
    const memberA = await createTestUser('Member A', 'membera@example.test');
    await createTestUser('Member B', 'memberb@example.test');

    const projectId = await createProject(
      owner.db,
      { uid: owner.uid, displayName: 'Owner User' },
      { name: 'Restricted Project', description: '' }
    );

    await addMember(owner.db, projectId, 'membera@example.test');

    // Member A tries to add Member B -> permission-denied
    await expect(
      addMember(memberA.db, projectId, 'memberb@example.test')
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });

  it('atomically unassigns tasks when member is removed and revokes member access (TC-14 / Review Focus)', async () => {
    const owner = await createTestUser('Owner User', 'owner@example.test');
    const memberUser = await createTestUser('Member Bob', 'bob@example.test');

    const projectId = await createProject(
      owner.db,
      { uid: owner.uid, displayName: 'Owner User' },
      { name: 'Atomic Unassign Project', description: '' }
    );

    await addMember(owner.db, projectId, 'bob@example.test');

    // Create 2 tasks assigned to Bob and 1 task assigned to owner
    const task1 = await createTask(owner.db, projectId, owner.uid, {
      title: 'Task 1 for Bob',
      description: '',
      priority: 'high',
      assigneeId: memberUser.uid,
      dueDate: null,
    });

    const task2 = await createTask(owner.db, projectId, owner.uid, {
      title: 'Task 2 for Bob',
      description: '',
      priority: 'low',
      assigneeId: memberUser.uid,
      dueDate: null,
    });

    await createTask(owner.db, projectId, owner.uid, {
      title: 'Task for Owner',
      description: '',
      priority: 'medium',
      assigneeId: owner.uid,
      dueDate: null,
    });

    // Count assigned tasks
    const count = await countAssignedTasks(owner.db, projectId, memberUser.uid);
    expect(count).toBe(2);

    // Remove member Bob
    const result = await removeMember(owner.db, projectId, memberUser.uid);
    expect(result.unassigned).toBe(2);

    // Verify tasks are now unassigned
    const tasks = await listTasks(owner.db, projectId);
    const unassignedBobTask1 = tasks.find((t) => t.id === task1);
    const unassignedBobTask2 = tasks.find((t) => t.id === task2);
    expect(unassignedBobTask1?.assigneeId).toBeNull();
    expect(unassignedBobTask2?.assigneeId).toBeNull();

    // Verify Bob is removed from memberIds and memberNames
    const projectSnap = await getDoc(doc(owner.db, 'projects', projectId));
    const projectData = projectSnap.data();
    expect(projectData?.memberIds).not.toContain(memberUser.uid);
    expect(projectData?.memberNames[memberUser.uid]).toBeUndefined();

    // Revoked access: Bob now gets permission-denied on getProject and listTasks
    await expect(getProject(memberUser.db, projectId)).rejects.toMatchObject({
      code: 'permission-denied',
    });
    await expect(listTasks(memberUser.db, projectId)).rejects.toMatchObject({
      code: 'permission-denied',
    });

    // Direct SDK write from removed member fails (TC-14)
    await expect(
      updateDoc(doc(memberUser.db, 'projects', projectId, 'tasks', task1), {
        title: 'Hacked Title',
      })
    ).rejects.toThrow();

    // Removing owner is rejected client-side with validation error
    await expect(removeMember(owner.db, projectId, owner.uid)).rejects.toMatchObject({
      code: 'validation',
    });
  });
});
