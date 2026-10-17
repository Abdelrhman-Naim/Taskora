import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let testEnv: RulesTestEnvironment;

describe('Project cascade delete security rules (D4 Fallback)', () => {
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

  it('allows owner to delete an empty project, but denies member', async () => {
    const ownerId = 'owner1';
    const memberId = 'member2';
    const pid = 'proj-empty-1';

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('projects').doc(pid).set({
        name: 'Empty Project',
        description: 'No tasks',
        ownerId,
        memberIds: [ownerId, memberId],
        memberNames: { [ownerId]: 'Owner', [memberId]: 'Member' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    const memberDb = testEnv.authenticatedContext(memberId).firestore();
    await assertFails(memberDb.collection('projects').doc(pid).delete());

    const ownerDb = testEnv.authenticatedContext(ownerId).firestore();
    await assertSucceeds(ownerDb.collection('projects').doc(pid).delete());
  });
});
