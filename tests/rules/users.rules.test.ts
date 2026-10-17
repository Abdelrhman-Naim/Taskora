import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
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

describe('Users and usersByEmail security rules', () => {
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

  it('allows user to read and create their own profile with valid data and timestamp', async () => {
    const alice = testEnv.authenticatedContext('alice', { email: 'alice@example.com' });
    const db = alice.firestore();

    await assertSucceeds(
      db.collection('users').doc('alice').set({
        displayName: 'Alice User',
        email: 'alice@example.com',
        createdAt: serverTimestamp(),
      })
    );

    await assertSucceeds(db.collection('users').doc('alice').get());
  });

  it('denies user from reading or creating another user profile', async () => {
    const alice = testEnv.authenticatedContext('alice', { email: 'alice@example.com' });
    const db = alice.firestore();

    await assertFails(db.collection('users').doc('bob').get());
    await assertFails(
      db.collection('users').doc('bob').set({
        displayName: 'Bob User',
        email: 'bob@example.com',
        createdAt: new Date(),
      })
    );
  });

  it('denies update and delete on users profile', async () => {
    // Setup alice document bypassing rules
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('users').doc('alice').set({
        displayName: 'Alice',
        email: 'alice@example.com',
        createdAt: new Date(),
      });
    });

    const alice = testEnv.authenticatedContext('alice', { email: 'alice@example.com' });
    const db = alice.firestore();

    await assertFails(db.collection('users').doc('alice').update({ displayName: 'New Name' }));
    await assertFails(db.collection('users').doc('alice').delete());
  });

  it('allows authenticated get on usersByEmail but forbids unauthenticated and list queries', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('usersByEmail').doc('bob@example.com').set({
        uid: 'bob',
        displayName: 'Bob User',
      });
    });

    const alice = testEnv.authenticatedContext('alice', { email: 'alice@example.com' });
    const unauthed = testEnv.unauthenticatedContext();

    // Authenticated get succeeds
    await assertSucceeds(alice.firestore().collection('usersByEmail').doc('bob@example.com').get());

    // Unauthenticated get fails
    await assertFails(unauthed.firestore().collection('usersByEmail').doc('bob@example.com').get());

    // List query fails
    await assertFails(alice.firestore().collection('usersByEmail').get());
  });

  it('allows create on usersByEmail matching authenticated email but denies for others', async () => {
    const alice = testEnv.authenticatedContext('alice', { email: 'alice@example.com' });

    // Valid own email mapping
    await assertSucceeds(
      alice.firestore().collection('usersByEmail').doc('alice@example.com').set({
        uid: 'alice',
        displayName: 'Alice User',
      })
    );

    // Creating for someone else's email fails
    await assertFails(
      alice.firestore().collection('usersByEmail').doc('bob@example.com').set({
        uid: 'alice',
        displayName: 'Alice User',
      })
    );
  });
});
