import {
  Firestore,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { Task, TaskInput, TaskPatch, TaskStatus } from '@/types';
import { taskInputSchema, fieldErrors } from '@/lib/validation';
import { toDate } from '@/lib/dates';
import { AppError, toAppError } from '@/lib/errors';
import { withWriteGuard } from '@/lib/async';

export function mapTask(
  snap: DocumentSnapshot | QueryDocumentSnapshot,
  projectId: string
): Task {
  const data = snap.data();
  if (!data) {
    throw new AppError('not-found', 'Task not found');
  }

  return {
    id: snap.id,
    projectId,
    title: typeof data.title === 'string' ? data.title : '',
    description: typeof data.description === 'string' ? data.description : '',
    status: (data.status as TaskStatus) || 'todo',
    priority: data.priority || 'medium',
    assigneeId: data.assigneeId ?? null,
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
    dueDate: data.dueDate ?? null,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function listTasks(
  db: Firestore,
  projectId: string
): Promise<Task[]> {
  try {
    const tasksColl = collection(db, 'projects', projectId, 'tasks');
    const snap = await getDocs(tasksColl);
    const tasks = snap.docs.map((d) => mapTask(d, projectId));

    // Sort locally by createdAt descending (newest first)
    return tasks.sort((a, b) => {
      const timeA = a.createdAt ? a.createdAt.getTime() : 0;
      const timeB = b.createdAt ? b.createdAt.getTime() : 0;
      return timeB - timeA;
    });
  } catch (err) {
    throw toAppError(err);
  }
}

export async function createTask(
  db: Firestore,
  projectId: string,
  uid: string,
  input: TaskInput
): Promise<string> {
  const parsed = taskInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('validation', 'Validation failed', fieldErrors(parsed.error));
  }

  const { title, description, priority, assigneeId, dueDate } = parsed.data;

  try {
    const taskRef = doc(collection(db, 'projects', projectId, 'tasks'));
    await withWriteGuard(() =>
      setDoc(taskRef, {
        title,
        description,
        status: 'todo',
        priority,
        assigneeId,
        createdBy: uid,
        dueDate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );

    return taskRef.id;
  } catch (err) {
    throw toAppError(err);
  }
}

export async function updateTask(
  db: Firestore,
  projectId: string,
  taskId: string,
  patch: TaskPatch
): Promise<void> {
  // If title or description are in patch, validate them
  if (patch.title !== undefined || patch.description !== undefined || patch.priority !== undefined || patch.dueDate !== undefined) {
    const checkObj = {
      title: patch.title ?? 'Valid Title',
      description: patch.description ?? '',
      priority: patch.priority ?? 'medium',
      assigneeId: patch.assigneeId ?? null,
      dueDate: patch.dueDate ?? null,
    };
    const parsed = taskInputSchema.safeParse(checkObj);
    if (!parsed.success) {
      throw new AppError('validation', 'Validation failed', fieldErrors(parsed.error));
    }
  }

  try {
    const cleanData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (patch.title !== undefined) cleanData.title = patch.title.trim();
    if (patch.description !== undefined) cleanData.description = patch.description.trim();
    if (patch.priority !== undefined) cleanData.priority = patch.priority;
    if (patch.status !== undefined) cleanData.status = patch.status;
    if (patch.assigneeId !== undefined) cleanData.assigneeId = patch.assigneeId;
    if (patch.dueDate !== undefined) cleanData.dueDate = patch.dueDate;

    await withWriteGuard(() =>
      updateDoc(doc(db, 'projects', projectId, 'tasks', taskId), cleanData)
    );
  } catch (err) {
    throw toAppError(err);
  }
}

export async function changeTaskStatus(
  db: Firestore,
  projectId: string,
  taskId: string,
  status: TaskStatus
): Promise<void> {
  try {
    await withWriteGuard(() =>
      updateDoc(doc(db, 'projects', projectId, 'tasks', taskId), {
        status,
        updatedAt: serverTimestamp(),
      })
    );
  } catch (err) {
    throw toAppError(err);
  }
}

export async function deleteTask(
  db: Firestore,
  projectId: string,
  taskId: string
): Promise<void> {
  try {
    await withWriteGuard(() =>
      deleteDoc(doc(db, 'projects', projectId, 'tasks', taskId))
    );
  } catch (err) {
    throw toAppError(err);
  }
}
