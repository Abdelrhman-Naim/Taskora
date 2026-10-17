import {
  Firestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  writeBatch,
  arrayUnion,
  arrayRemove,
  deleteField,
  serverTimestamp,
} from 'firebase/firestore';
import { emailSchema } from '@/lib/validation';
import { AppError, toAppError } from '@/lib/errors';
import { withWriteGuard } from '@/lib/async';

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export async function findUserByEmail(
  db: Firestore,
  email: string
): Promise<{ uid: string; displayName: string } | null> {
  try {
    const normalized = normalizeEmail(email);
    const snap = await getDoc(doc(db, 'usersByEmail', normalized));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      uid: data.uid,
      displayName: typeof data.displayName === 'string' ? data.displayName : 'Member',
    };
  } catch (err) {
    throw toAppError(err);
  }
}

export async function addMember(
  db: Firestore,
  projectId: string,
  email: string
): Promise<{ uid: string; displayName: string }> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    throw new AppError('validation', 'Invalid email address');
  }

  const normalized = normalizeEmail(email);

  try {
    const projRef = doc(db, 'projects', projectId);
    const projSnap = await getDoc(projRef);
    if (!projSnap.exists()) {
      throw new AppError('not-found', 'Project not found');
    }
    const proj = projSnap.data();

    const userRecord = await findUserByEmail(db, normalized);
    if (!userRecord) {
      throw new AppError('unknown-user', 'No user found with this email address');
    }

    if (proj.memberIds && proj.memberIds.includes(userRecord.uid)) {
      throw new AppError('duplicate-member', 'User is already a member of this project');
    }

    await withWriteGuard(() =>
      updateDoc(projRef, {
        memberIds: arrayUnion(userRecord.uid),
        [`memberNames.${userRecord.uid}`]: userRecord.displayName,
        updatedAt: serverTimestamp(),
      })
    );

    return userRecord;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw toAppError(err);
  }
}

export async function countAssignedTasks(
  db: Firestore,
  projectId: string,
  uid: string
): Promise<number> {
  try {
    const tasksColl = collection(db, 'projects', projectId, 'tasks');
    const tasksSnap = await getDocs(tasksColl);
    return tasksSnap.docs.filter((d) => d.data()?.assigneeId === uid).length;
  } catch (err) {
    throw toAppError(err);
  }
}

export async function removeMember(
  db: Firestore,
  projectId: string,
  uid: string
): Promise<{ unassigned: number }> {
  try {
    const projRef = doc(db, 'projects', projectId);
    const projSnap = await getDoc(projRef);
    if (!projSnap.exists()) {
      throw new AppError('not-found', 'Project not found');
    }
    const proj = projSnap.data();

    if (proj.ownerId === uid) {
      throw new AppError('validation', 'Project owner cannot be removed');
    }

    if (!proj.memberIds || !proj.memberIds.includes(uid)) {
      throw new AppError('not-found', 'Member not found in project');
    }

    const tasksColl = collection(db, 'projects', projectId, 'tasks');
    const tasksSnap = await getDocs(tasksColl);
    const assignedTasks = tasksSnap.docs.filter((d) => d.data()?.assigneeId === uid);

    const batch = writeBatch(db);

    // Unassign tasks atomically
    for (const taskDoc of assignedTasks) {
      batch.update(taskDoc.ref, {
        assigneeId: null,
        updatedAt: serverTimestamp(),
      });
    }

    // Remove from project memberIds and memberNames
    batch.update(projRef, {
      memberIds: arrayRemove(uid),
      [`memberNames.${uid}`]: deleteField(),
      updatedAt: serverTimestamp(),
    });

    await withWriteGuard(() => batch.commit());

    return { unassigned: assignedTasks.length };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw toAppError(err);
  }
}
