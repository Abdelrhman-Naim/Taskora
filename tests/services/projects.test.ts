import { describe, it, expect, beforeEach } from 'vitest';
import { doc, getDoc } from 'firebase/firestore';
import {
  createProject,
  listUserProjects,
  getProject,
  updateProject,
  deleteProjectCascade,
} from '@/services/projects';
import { createTestUser, clearEmulators } from '../helpers/emulatorApp';

describe('Projects Service', () => {
  beforeEach(async () => {
    await clearEmulators();
  });

  it('creates a project, validates fields, and lists it for the owner (TC-05)', async () => {
    const owner = await createTestUser('Alice Owner', 'alice.owner@example.test');
    const outsider = await createTestUser('Bob Outsider', 'bob.outsider@example.test');

    const projectId = await createProject(
      owner.db,
      { uid: owner.uid, displayName: 'Alice Owner' },
      { name: 'Website Redesign', description: 'Main website redesign' }
    );

    expect(projectId).toBeDefined();

    // Verify document structure in Firestore
    const snap = await getDoc(doc(owner.db, 'projects', projectId));
    expect(snap.exists()).toBe(true);
    const data = snap.data();
    expect(data?.name).toBe('Website Redesign');
    expect(data?.description).toBe('Main website redesign');
    expect(data?.ownerId).toBe(owner.uid);
    expect(data?.memberIds).toEqual([owner.uid]);
    expect(data?.memberNames).toEqual({ [owner.uid]: 'Alice Owner' });
    expect(data?.createdAt).toBeDefined();
    expect(data?.updatedAt).toBeDefined();

    // Owner sees it in listUserProjects
    const ownerProjects = await listUserProjects(owner.db, owner.uid);
    expect(ownerProjects.length).toBe(1);
    expect(ownerProjects[0].id).toBe(projectId);
    expect(ownerProjects[0].name).toBe('Website Redesign');
    expect(ownerProjects[0].createdAt).toBeInstanceOf(Date);
    expect(ownerProjects[0].updatedAt).toBeInstanceOf(Date);

    // Outsider does NOT see it in listUserProjects
    const outsiderProjects = await listUserProjects(outsider.db, outsider.uid);
    expect(outsiderProjects.length).toBe(0);
  });

  it('enforces access control on getProject (TC-13)', async () => {
    const owner = await createTestUser('Project Owner', 'proj.owner@example.test');
    const outsider = await createTestUser('Outsider User', 'outsider.user@example.test');

    const projectId = await createProject(
      owner.db,
      { uid: owner.uid, displayName: 'Project Owner' },
      { name: 'Confidential Strategy', description: 'Secret plans' }
    );

    // Owner can fetch
    const fetched = await getProject(owner.db, projectId);
    expect(fetched.name).toBe('Confidential Strategy');

    // Outsider gets permission-denied AppError and no fields
    await expect(getProject(outsider.db, projectId)).rejects.toMatchObject({
      code: 'permission-denied',
    });

    // Random non-existent ID throws not-found AppError
    await expect(getProject(owner.db, 'non-existent-proj-id')).rejects.toMatchObject({
      code: 'not-found',
    });
  });

  it('updates project preserving createdAt and updating updatedAt', async () => {
    const owner = await createTestUser('Update Owner', 'update.owner@example.test');

    const projectId = await createProject(
      owner.db,
      { uid: owner.uid, displayName: 'Update Owner' },
      { name: 'Initial Name', description: 'Initial Desc' }
    );

    const initialSnap = await getDoc(doc(owner.db, 'projects', projectId));
    const initialCreatedAt = initialSnap.data()?.createdAt;

    await updateProject(owner.db, projectId, {
      name: 'Renamed Project',
      description: 'Updated Desc',
    });

    const updatedProject = await getProject(owner.db, projectId);
    expect(updatedProject.name).toBe('Renamed Project');
    expect(updatedProject.description).toBe('Updated Desc');
    expect(updatedProject.createdAt).toEqual(initialCreatedAt?.toDate());
  });

  it('rejects short project name client-side before network request', async () => {
    const owner = await createTestUser('Validation Owner', 'val.owner@example.test');

    await expect(
      createProject(
        owner.db,
        { uid: owner.uid, displayName: 'Validation Owner' },
        { name: 'ab', description: '' }
      )
    ).rejects.toMatchObject({
      code: 'validation',
    });
  });

  it('cascades deletion of project and its tasks', async () => {
    const owner = await createTestUser('Delete Owner', 'delete.owner@example.test');

    const projectId = await createProject(
      owner.db,
      { uid: owner.uid, displayName: 'Delete Owner' },
      { name: 'To Be Deleted', description: 'Will be deleted' }
    );

    await deleteProjectCascade(owner.db, projectId);

    const snap = await getDoc(doc(owner.db, 'projects', projectId));
    expect(snap.exists()).toBe(false);
  });
});

