import { initializeApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  updateProfile,
  Auth,
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';

export async function createTestUser(
  name: string,
  email: string
): Promise<{ uid: string; db: Firestore; auth: Auth }> {
  const appName = `test-app-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const app = initializeApp(
    {
      apiKey: 'fake-api-key',
      authDomain: 'demo-taskflow.firebaseapp.com',
      projectId: 'demo-taskflow',
    },
    appName
  );

  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });

  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8085);

  const cred = await createUserWithEmailAndPassword(auth, email, 'Password123!');
  await updateProfile(cred.user, { displayName: name });

  return {
    uid: cred.user.uid,
    db,
    auth,
  };
}

export async function clearEmulators(): Promise<void> {
  try {
    await fetch(
      'http://127.0.0.1:8085/emulator/v1/projects/demo-taskflow/databases/(default)/documents',
      { method: 'DELETE' }
    );
  } catch (err) {
    // ignore if emulator not reachable
  }

  try {
    await fetch(
      'http://127.0.0.1:9099/emulator/v1/projects/demo-taskflow/accounts',
      { method: 'DELETE' }
    );
  } catch (err) {
    // ignore if emulator not reachable
  }
}
