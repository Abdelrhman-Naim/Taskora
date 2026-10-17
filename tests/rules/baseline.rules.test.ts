import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let testEnv: RulesTestEnvironment;

describe('Baseline security rules (deny all)', () => {
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

  it('denies unauthenticated read/write to users', async () => {
    const unauthed = testEnv.unauthenticatedContext().firestore();
    await assertFails(unauthed.collection('users').doc('x').get());
    await assertFails(unauthed.collection('users').doc('x').set({ displayName: 'Hacker' }));
  });

  it('denies unauthenticated read/write to projects', async () => {
    const unauthed = testEnv.unauthenticatedContext().firestore();
    await assertFails(unauthed.collection('projects').doc('x').get());
    await assertFails(unauthed.collection('projects').doc('x').set({ name: 'Secret' }));
  });

  it('denies unauthenticated read/write to tasks', async () => {
    const unauthed = testEnv.unauthenticatedContext().firestore();
    await assertFails(unauthed.collection('projects').doc('x').collection('tasks').doc('y').get());
    await assertFails(unauthed.collection('projects').doc('x').collection('tasks').doc('y').set({ title: 'Task' }));
  });
});
