import { describe, it, expect, beforeEach } from 'vitest';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signOut } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc } from 'firebase/firestore';
import { registerUser, loginUser, logoutUser, ensureUserProfile } from '@/services/auth';
import { clearEmulators } from '../helpers/emulatorApp';

describe('Auth Service', () => {
  let app: FirebaseApp;
  let auth: ReturnType<typeof getAuth>;
  let db: ReturnType<typeof getFirestore>;

  beforeEach(async () => {
    await clearEmulators();
    const appName = `auth-test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    app = initializeApp(
      {
        apiKey: 'fake-api-key',
        authDomain: 'demo-taskflow.firebaseapp.com',
        projectId: 'demo-taskflow',
      },
      appName
    );
    auth = getAuth(app);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    db = getFirestore(app);
    connectFirestoreEmulator(db, '127.0.0.1', 8085);
  });

  it('registers user, updates displayName, and creates user profile and email mapping (TC-01)', async () => {
    const user = await registerUser(auth, db, {
      name: 'Owner User',
      email: 'owner@example.test',
      password: 'Password123!',
    });

    expect(user.displayName).toBe('Owner User');
    expect(user.email).toBe('owner@example.test');
    expect(user.uid).toBeDefined();

    // Verify users/{uid} document
    const userSnap = await getDoc(doc(db, 'users', user.uid));
    expect(userSnap.exists()).toBe(true);
    expect(userSnap.data()?.displayName).toBe('Owner User');
    expect(userSnap.data()?.email).toBe('owner@example.test');
    expect(userSnap.data()?.createdAt).toBeDefined();

    // Verify usersByEmail/{emailLower} document
    const emailSnap = await getDoc(doc(db, 'usersByEmail', 'owner@example.test'));
    expect(emailSnap.exists()).toBe(true);
    expect(emailSnap.data()?.uid).toBe(user.uid);
    expect(emailSnap.data()?.displayName).toBe('Owner User');
  });

  it('rejects duplicate email with email-in-use AppError', async () => {
    await registerUser(auth, db, {
      name: 'User One',
      email: 'duplicate@example.test',
      password: 'Password123!',
    });

    await expect(
      registerUser(auth, db, {
        name: 'User Two',
        email: 'duplicate@example.test',
        password: 'Password123!',
      })
    ).rejects.toMatchObject({
      code: 'email-in-use',
    });
  });

  it('creates profile via ensureUserProfile if Auth user lacks Firestore documents (Review Focus #1)', async () => {
    // First register
    const registered = await registerUser(auth, db, {
      name: 'Existing Auth',
      email: 'existing@example.test',
      password: 'Password123!',
    });

    await signOut(auth);

    // Login calls ensureUserProfile and returns SessionUser
    const loggedIn = await loginUser(auth, db, 'existing@example.test', 'Password123!');
    expect(loggedIn.uid).toBe(registered.uid);
    expect(loggedIn.displayName).toBe('Existing Auth');

    // Calling ensureUserProfile again does not overwrite existing createdAt
    const firstSnap = await getDoc(doc(db, 'users', registered.uid));
    const firstCreatedAt = firstSnap.data()?.createdAt;

    await ensureUserProfile(db, {
      uid: registered.uid,
      email: 'existing@example.test',
      displayName: 'Existing Auth',
    });

    const secondSnap = await getDoc(doc(db, 'users', registered.uid));
    expect(secondSnap.data()?.createdAt).toEqual(firstCreatedAt);
  });

  it('rejects invalid password with invalid-credentials AppError', async () => {
    await registerUser(auth, db, {
      name: 'Login Test',
      email: 'logintest@example.test',
      password: 'Password123!',
    });

    await signOut(auth);

    await expect(
      loginUser(auth, db, 'logintest@example.test', 'WrongPassword!')
    ).rejects.toMatchObject({
      code: 'invalid-credentials',
    });
  });

  it('logs out user cleanly', async () => {
    await registerUser(auth, db, {
      name: 'Logout Test',
      email: 'logout@example.test',
      password: 'Password123!',
    });

    expect(auth.currentUser).not.toBeNull();
    await logoutUser(auth);
    expect(auth.currentUser).toBeNull();
  });
});
