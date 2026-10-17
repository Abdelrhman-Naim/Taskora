import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';

let appInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;
let emulatorsConnected = false;

export function isUsingEmulators(): boolean {
  // If running in browser and NOT on localhost/127.0.0.1, never use emulators
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return false;
  }

  if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') return true;
  if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'false') return false;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
  return projectId.startsWith('demo-');
}

export function getFirebaseConfig() {
  const useEmulators = isUsingEmulators();

  if (useEmulators) {
    return {
      apiKey: 'demo-api-key',
      authDomain: 'demo-taskflow.firebaseapp.com',
      projectId: 'demo-taskflow',
      storageBucket: 'demo-taskflow.appspot.com',
      messagingSenderId: '1234567890',
      appId: '1:1234567890:web:abcdef',
    };
  }

  // Production configuration for project taskora-bf729
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAOMjes8PtCUNfnFssDZWRy0ei7aH_juts',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'taskora-bf729.firebaseapp.com',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'taskora-bf729',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'taskora-bf729.firebasestorage.app',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '997225509918',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:997225509918:web:2a26d16f9a1b566444ea0f',
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
  if (!isUsingEmulators()) return;

  // Extra guard: NEVER attempt to connect to emulators over HTTPS or on remote hostnames
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'https:') return;
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return;
    }
  }

  const host = '127.0.0.1';
  try {
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  } catch {
    // already connected in some environments
  }
  try {
    connectFirestoreEmulator(db, host, 8085);
  } catch {
    // already connected
  }
  emulatorsConnected = true;
}
