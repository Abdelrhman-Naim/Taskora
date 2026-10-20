import {
  Firestore,
  DocumentReference,
  collection,
  doc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { ActivityEntry, ActivityType, Actor } from '@/types';
import { toDate } from '@/lib/dates';
import { toAppError } from '@/lib/errors';

export function newActivityRef(db: Firestore, projectId: string): DocumentReference {
  return doc(collection(db, 'projects', projectId, 'activity'));
}

export function activityData(
  actor: Actor,
  e: {
    type: ActivityType;
    taskId?: string | null;
    taskTitle?: string | null;
    detail?: string | null;
  }
): Record<string, unknown> {
  return {
    type: e.type,
    actorId: actor.uid,
    actorName: actor.displayName,
    taskId: e.taskId ?? null,
    taskTitle: e.taskTitle ?? null,
    detail: e.detail ?? null,
    createdAt: serverTimestamp(),
  };
}

export async function listActivity(
  db: Firestore,
  projectId: string,
  max = 50
): Promise<ActivityEntry[]> {
  try {
    const actColl = collection(db, 'projects', projectId, 'activity');
    const q = query(actColl, orderBy('createdAt', 'desc'), limit(max));
    const snap = await getDocs(q);

    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        projectId,
        type: data.type as ActivityType,
        actorId: typeof data.actorId === 'string' ? data.actorId : '',
        actorName: typeof data.actorName === 'string' ? data.actorName : '',
        taskId: data.taskId ?? null,
        taskTitle: data.taskTitle ?? null,
        detail: data.detail ?? null,
        createdAt: toDate(data.createdAt),
      };
    });
  } catch (err) {
    throw toAppError(err);
  }
}
