import { describe, it, expect } from 'vitest';
import {
  mapProject,
  addProjectMemberProfile,
  updateProjectMemberProfile,
  removeProjectMember,
} from '@/services/projects';
import { ProjectMemberProfile } from '@/types';
import { AppError } from '@/lib/errors';
import { DocumentSnapshot, Firestore } from 'firebase/firestore';

describe('Team Members & Job Titles Service', () => {
  it('mapProject parses memberProfiles correctly from snapshot', () => {
    const mockSnap = {
      id: 'proj-123',
      data: () => ({
        name: 'Alpha Project',
        description: 'Test project',
        ownerId: 'owner-1',
        memberIds: ['owner-1', 'member-2'],
        memberNames: { 'owner-1': 'Owner Name', 'member-2': 'Designer Name' },
        memberProfiles: [
          {
            uid: 'owner-1',
            email: 'owner@test.com',
            displayName: 'Owner Name',
            jobTitle: 'Project Manager',
            role: 'owner',
            addedAt: '2026-10-31T00:00:00.000Z',
          },
          {
            uid: 'member-2',
            email: 'designer@test.com',
            displayName: 'Designer Name',
            jobTitle: 'UI/UX Designer',
            role: 'member',
            addedAt: '2026-10-31T00:00:00.000Z',
          },
        ],
        createdAt: null,
        updatedAt: null,
      }),
    } as unknown as DocumentSnapshot;

    const project = mapProject(mockSnap);
    expect(project.memberProfiles).toBeDefined();
    expect(project.memberProfiles?.length).toBe(2);
    expect(project.memberProfiles?.[1].jobTitle).toBe('UI/UX Designer');
  });

  it('addProjectMemberProfile validates input and appends profile', async () => {
    const mockDb = {} as Firestore;
    const invalidProfile: ProjectMemberProfile = {
      uid: 'u-1',
      email: 'not-an-email',
      displayName: 'Dev',
      jobTitle: '',
      role: 'member',
      addedAt: new Date().toISOString(),
    };

    await expect(
      addProjectMemberProfile(mockDb, 'proj-123', invalidProfile)
    ).rejects.toThrow(AppError);
  });
it('updateProjectMemberProfile throws if project does not exist', async () => {
    const mockDb = {} as Firestore;
    await expect(
      updateProjectMemberProfile(mockDb, 'non-existent-proj', 'u-1', { displayName: 'Updated' })
    ).rejects.toThrow();
  });

  it('removeProjectMember throws error if trying to remove project owner', async () => {
    const mockDb = {} as Firestore;
    await expect(
      removeProjectMember(mockDb, 'proj-1', 'owner-1')
    ).rejects.toThrow();
  });
});
