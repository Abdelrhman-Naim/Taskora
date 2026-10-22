import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  Firestore,
  doc,
  getDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { SessionUser } from '@/types';
import { AppError, toAppError } from '@/lib/errors';
import { withWriteGuard } from '@/lib/async';
import { registerSchema } from '@/lib/validation';

export async function ensureUserProfile(
  db: Firestore,
  user: { uid: string; email: string; displayName: string }
): Promise<void> {
  const emailLower = user.email.trim().toLowerCase();
  const displayName = user.displayName.trim();
  const userRef = doc(db, 'users', user.uid);
  const emailRef = doc(db, 'usersByEmail', emailLower);

  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const batch = writeBatch(db);
    batch.set(userRef, {
      displayName,
      email: emailLower,
      createdAt: serverTimestamp(),
    });
    batch.set(emailRef, {
      uid: user.uid,
      displayName,
    });
    await withWriteGuard(() => batch.commit());
  } else {
    // If users document exists but usersByEmail is somehow missing, ensure it
    const emailSnap = await getDoc(emailRef);
    if (!emailSnap.exists()) {
      const batch = writeBatch(db);
      batch.set(emailRef, {
        uid: user.uid,
        displayName,
      });
      await withWriteGuard(() => batch.commit());
    }
  }
}

export async function registerUser(
  auth: Auth,
  db: Firestore,
  input: { name: string; email: string; password: string }
): Promise<SessionUser> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('validation', 'Validation failed', {
      name: parsed.error.issues.find((i) => i.path[0] === 'name')?.message || '',
      email: parsed.error.issues.find((i) => i.path[0] === 'email')?.message || '',
      password: parsed.error.issues.find((i) => i.path[0] === 'password')?.message || '',
    });
  }

  const { name, email, password } = parsed.data;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await ensureUserProfile(db, {
      uid: cred.user.uid,
      email,
      displayName: name,
    });

    const session: SessionUser = {
      uid: cred.user.uid,
      displayName: name,
      email,
    };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('taskflow:user-updated', { detail: session }));
    }

    return session;
  } catch (err) {
    throw toAppError(err);
  }
}

export async function loginUser(
  auth: Auth,
  db: Firestore,
  email: string,
  password: string
): Promise<SessionUser> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail || !password) {
    throw new AppError('invalid-credentials', 'Email and password are required');
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
    const user = cred.user;
    const displayName = user.displayName || trimmedEmail.split('@')[0];

    await ensureUserProfile(db, {
      uid: user.uid,
      email: user.email || trimmedEmail,
      displayName,
    });

    const session: SessionUser = {
      uid: user.uid,
      displayName,
      email: user.email || trimmedEmail,
    };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('taskflow:user-updated', { detail: session }));
    }

    return session;
  } catch (err) {
    throw toAppError(err);
  }
}

export async function logoutUser(auth: Auth): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    throw toAppError(err);
  }
}

export async function resetPassword(auth: Auth, email: string): Promise<void> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    throw new AppError('validation', 'Email is required', { email: 'Email is required' });
  }

  try {
    await sendPasswordResetEmail(auth, trimmedEmail);
  } catch (err) {
    throw toAppError(err);
  }
}
