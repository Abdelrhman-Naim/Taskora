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

  const emailLower = email.trim().toLowerCase();
  const { doc, writeBatch, serverTimestamp } = await import('firebase/firestore');
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', cred.user.uid), {
    displayName: name,
    email: emailLower,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, 'usersByEmail', emailLower), {
    uid: cred.user.uid,
    displayName: name,
  });
  await batch.commit();

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
  } catch {
    // ignore if emulator not reachable
  }

  try {
    await fetch(
      'http://127.0.0.1:9099/emulator/v1/projects/demo-taskflow/accounts',
      { method: 'DELETE' }
    );
  } catch {
    // ignore if emulator not reachable
  }
}
