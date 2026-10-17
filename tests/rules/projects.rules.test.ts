import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
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

describe('Projects security rules', () => {
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

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
    }
  });

  const validProjectData = (ownerId: string) => ({
    name: 'Website Redesign',
    description: 'A redesign project',
    ownerId,
    memberIds: [ownerId],
    memberNames: { [ownerId]: 'Owner Name' },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  it('allows owner to create a valid project', async () => {
    const owner = testEnv.authenticatedContext('owner1');
    await assertSucceeds(
      owner.firestore().collection('projects').doc('proj1').set(validProjectData('owner1'))
    );
  });

  it('denies creation when ownerId does not match authenticated uid', async () => {
    const owner = testEnv.authenticatedContext('owner1');
    await assertFails(
      owner.firestore().collection('projects').doc('proj1').set(validProjectData('otherUser'))
    );
  });

  it('denies creation when memberIds does not initially contain only [ownerId]', async () => {
    const owner = testEnv.authenticatedContext('owner1');
    const data = {
      ...validProjectData('owner1'),
      memberIds: ['owner1', 'member2'],
      memberNames: { owner1: 'Owner', member2: 'Member 2' },
    };
    await assertFails(owner.firestore().collection('projects').doc('proj1').set(data));
  });

  it('denies creation with name length < 3 or > 80, or desc > 1000', async () => {
    const owner = testEnv.authenticatedContext('owner1');

    await assertFails(
      owner.firestore().collection('projects').doc('p1').set({
        ...validProjectData('owner1'),
        name: 'ab',
      })
    );

    await assertFails(
      owner.firestore().collection('projects').doc('p2').set({
        ...validProjectData('owner1'),
        name: 'a'.repeat(81),
      })
    );

    await assertFails(
      owner.firestore().collection('projects').doc('p3').set({
        ...validProjectData('owner1'),
        description: 'd'.repeat(1001),
      })
    );
  });

  it('denies creation with unexpected extra fields', async () => {
    const owner = testEnv.authenticatedContext('owner1');
    await assertFails(
      owner.firestore().collection('projects').doc('proj1').set({
        ...validProjectData('owner1'),
        extraField: 'not allowed',
      })
    );
  });

  describe('Read permissions (D4b, TC-13)', () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('projects').doc('proj1').set({
          name: 'Website Redesign',
          description: 'Desc',
          ownerId: 'owner1',
          memberIds: ['owner1', 'memberA'],
          memberNames: { owner1: 'Owner', memberA: 'Member A' },
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
    });

    it('allows owner and member to read project', async () => {
      const owner = testEnv.authenticatedContext('owner1');
      const member = testEnv.authenticatedContext('memberA');

      await assertSucceeds(owner.firestore().collection('projects').doc('proj1').get());
      await assertSucceeds(member.firestore().collection('projects').doc('proj1').get());
    });

    it('denies outsider and anonymous user from reading project (TC-13)', async () => {
      const outsider = testEnv.authenticatedContext('outsider');
      const anon = testEnv.unauthenticatedContext();

      await assertFails(outsider.firestore().collection('projects').doc('proj1').get());
      await assertFails(anon.firestore().collection('projects').doc('proj1').get());
    });

    it('allows reading non-existent project (resource == null) to distinguish Not Found from Denied (D4b)', async () => {
      const user = testEnv.authenticatedContext('anyUser');
      const docSnap = await assertSucceeds(
        user.firestore().collection('projects').doc('nonexistent').get()
      );
      expect(docSnap.exists).toBe(false);
    });
  });

  describe('Update and Delete permissions (TC-06)', () => {
    const originalCreated = new Date(1700000000000);

    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('projects').doc('proj1').set({
          name: 'Original Name',
          description: 'Original Desc',
          ownerId: 'owner1',
          memberIds: ['owner1', 'memberA'],
          memberNames: { owner1: 'Owner', memberA: 'Member A' },
          createdAt: originalCreated,
          updatedAt: originalCreated,
        });
      });
    });

    it('allows owner to update project name and description with server timestamp', async () => {
      const owner = testEnv.authenticatedContext('owner1');

      await assertSucceeds(
        owner.firestore().collection('projects').doc('proj1').update({
          name: 'Updated Name',
          description: 'Updated Desc',
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('denies member from updating or deleting the project (TC-06)', async () => {
      const member = testEnv.authenticatedContext('memberA');

      await assertFails(
        member.firestore().collection('projects').doc('proj1').update({
          name: 'Member Trying Update',
          updatedAt: serverTimestamp(),
        })
      );

      await assertFails(member.firestore().collection('projects').doc('proj1').delete());
    });

    it('denies owner from changing ownerId or createdAt', async () => {
      const owner = testEnv.authenticatedContext('owner1');

      await assertFails(
        owner.firestore().collection('projects').doc('proj1').update({
          ownerId: 'newOwner',
          updatedAt: serverTimestamp(),
        })
      );

      await assertFails(
        owner.firestore().collection('projects').doc('proj1').update({
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('denies owner from removing themselves from memberIds', async () => {
      const owner = testEnv.authenticatedContext('owner1');

      await assertFails(
        owner.firestore().collection('projects').doc('proj1').update({
          memberIds: ['memberA'],
          memberNames: { memberA: 'Member A' },
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('denies memberNames whose keys do not match memberIds', async () => {
      const owner = testEnv.authenticatedContext('owner1');

      await assertFails(
        owner.firestore().collection('projects').doc('proj1').update({
          memberIds: ['owner1'],
          memberNames: { owner1: 'Owner', extraKey: 'Mismatch' },
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('allows owner to delete project', async () => {
      const owner = testEnv.authenticatedContext('owner1');
      await assertSucceeds(owner.firestore().collection('projects').doc('proj1').delete());
    });
  });
});
