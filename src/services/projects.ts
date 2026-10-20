import {
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  writeBatch,
  query,
  where,
  serverTimestamp,
  DocumentSnapshot,
} from 'firebase/firestore';
import { Project, ProjectInput } from '@/types';
import { projectInputSchema } from '@/lib/validation';
import { AppError, toAppError } from '@/lib/errors';
import { withWriteGuard } from '@/lib/async';
import { toDate } from '@/lib/dates';

export function mapProject(snap: DocumentSnapshot): Project {
  const data = snap.data();
  if (!data) {
    throw new AppError('not-found', 'Project not found');
  }

  return {
    id: snap.id,
    name: typeof data.name === 'string' ? data.name : '',
    description: typeof data.description === 'string' ? data.description : '',
    ownerId: typeof data.ownerId === 'string' ? data.ownerId : '',
    memberIds: Array.isArray(data.memberIds) ? data.memberIds : [],
    memberNames:
      typeof data.memberNames === 'object' && data.memberNames !== null
        ? (data.memberNames as Record<string, string>)
        : {},
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function createProject(
  db: Firestore,
  owner: { uid: string; displayName: string },
  input: ProjectInput
): Promise<string> {
  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('validation', 'Invalid project details', {
      name: parsed.error.issues.find((i) => i.path[0] === 'name')?.message || '',
      description: parsed.error.issues.find((i) => i.path[0] === 'description')?.message || '',
    });
  }

  const { name, description } = parsed.data;
  const projectRef = doc(collection(db, 'projects'));

  try {
    await withWriteGuard(() =>
      setDoc(projectRef, {
        name,
        description,
        ownerId: owner.uid,
        memberIds: [owner.uid],
        memberNames: { [owner.uid]: owner.displayName },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
    return projectRef.id;
  } catch (err) {
    throw toAppError(err);
  }
}

export async function listUserProjects(
  db: Firestore,
  uid: string
): Promise<Project[]> {
  try {
    const q = query(
      collection(db, 'projects'),
      where('memberIds', 'array-contains', uid)
    );
    const snap = await getDocs(q);
    const projects: Project[] = [];

    snap.forEach((docSnap) => {
      try {
        projects.push(mapProject(docSnap));
      } catch {
        // Skip malformed docs
      }
    });

    // Local sort descending by updatedAt (or createdAt)
    projects.sort((a, b) => {
      const timeA = a.updatedAt?.getTime() ?? a.createdAt?.getTime() ?? 0;
      const timeB = b.updatedAt?.getTime() ?? b.createdAt?.getTime() ?? 0;
      return timeB - timeA;
    });

    return projects;
  } catch (err) {
    throw toAppError(err);
  }
}

export async function getProject(
  db: Firestore,
  id: string
): Promise<Project> {
  try {
    const snap = await getDoc(doc(db, 'projects', id));
    if (!snap.exists()) {
      throw new AppError('not-found', 'Project not found');
    }
    return mapProject(snap);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw toAppError(err);
  }
}

export async function updateProject(
  db: Firestore,
  id: string,
  input: ProjectInput
): Promise<void> {
  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('validation', 'Invalid project details', {
      name: parsed.error.issues.find((i) => i.path[0] === 'name')?.message || '',
      description: parsed.error.issues.find((i) => i.path[0] === 'description')?.message || '',
    });
  }

  const { name, description } = parsed.data;

  try {
    await withWriteGuard(() =>
      updateDoc(doc(db, 'projects', id), {
        name,
        description,
        updatedAt: serverTimestamp(),
      })
    );
  } catch (err) {
    throw toAppError(err);
  }
}

export async function deleteProjectCascade(
  db: Firestore,
  id: string
): Promise<void> {
  try {
    const tasksQuery = query(collection(db, 'projects', id, 'tasks'));
    const tasksSnap = await getDocs(tasksQuery);

    if (tasksSnap.size > 0) {
      throw new AppError(
        'too-many-tasks',
        "Delete the project's tasks first"
      );
    }

    // Delete all activity logs in chunks <= 400
    const activitySnap = await getDocs(collection(db, 'projects', id, 'activity'));
    const actDocs = activitySnap.docs;
    const CHUNK_SIZE = 400;

    for (let i = 0; i < actDocs.length; i += CHUNK_SIZE) {
      const chunk = actDocs.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const d of chunk) {
        batch.delete(d.ref);
      }
      await withWriteGuard(() => batch.commit());
    }

    const batch = writeBatch(db);
    batch.delete(doc(db, 'projects', id));

    await withWriteGuard(() => batch.commit());
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw toAppError(err);
  }
}
