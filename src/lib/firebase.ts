import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
] as const;

let appInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;
let emulatorsConnected = false;

export function getFirebaseConfig() {
  const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';

  if (!useEmulators) {
    for (const key of requiredEnvVars) {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }
  }

  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-taskflow.firebaseapp.com',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-taskflow',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-taskflow.appspot.com',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1234567890:web:abcdef',
  };
}

export function getFirebaseApp(): FirebaseApp {
  if (appInstance) return appInstance;
  const existing = getApps();
  if (existing.length > 0) {
    appInstance = getApp();
    return appInstance;
  }
  appInstance = initializeApp(getFirebaseConfig());
  return appInstance;
}

export function getAuthInstance(): Auth {
  if (authInstance) return authInstance;
  const app = getFirebaseApp();
  authInstance = getAuth(app);
  initEmulatorsIfNeeded(authInstance, getDb());
  return authInstance;
}

export function getDb(): Firestore {
  if (dbInstance) return dbInstance;
  const app = getFirebaseApp();
  dbInstance = getFirestore(app);
  initEmulatorsIfNeeded(getAuth(app), dbInstance);
  return dbInstance;
}

function initEmulatorsIfNeeded(auth: Auth, db: Firestore) {
  if (emulatorsConnected) return;
  const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';
  if (useEmulators) {
    try {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    } catch {
      // already connected in some environments
    }
    try {
      connectFirestoreEmulator(db, '127.0.0.1', 8085);
    } catch {
      // already connected
    }
    emulatorsConnected = true;
  }
}
