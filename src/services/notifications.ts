import {
  Firestore,
  DocumentReference,
  collection,
  doc,
  writeBatch,
  query,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { AppNotification, NotificationType, Actor, Task } from '@/types';
import { toDate } from '@/lib/dates';
import { AppError, toAppError } from '@/lib/errors';
import { withWriteGuard } from '@/lib/async';

export function newNotificationRef(db: Firestore, recipientUid: string): DocumentReference {
  return doc(collection(db, 'users', recipientUid, 'notifications'));
}

export function notificationData(
  actor: Actor,
  e: {
    type: NotificationType;
    projectId: string;
    projectName: string;
    taskId?: string | null;
    taskTitle?: string | null;
  }
): Record<string, unknown> {
  return {
    type: e.type,
    projectId: e.projectId,
    projectName: e.projectName,
    taskId: e.taskId ?? null,
    taskTitle: e.taskTitle ?? null,
    actorId: actor.uid,
    actorName: actor.displayName,
    createdAt: serverTimestamp(),
    readAt: null,
  };
}

export function recipientsFor(e: {
  type: NotificationType;
  actorUid: string;
  task?: Pick<Task, 'createdBy' | 'assigneeId'>;
  newAssigneeId?: string | null;
  addedUid?: string;
}): string[] {
  const result: string[] = [];

  switch (e.type) {
    case 'task_assigned':
      if (e.newAssigneeId && e.newAssigneeId !== e.actorUid) {
        result.push(e.newAssigneeId);
      }
      break;

    case 'comment_added':
      if (e.task) {
        if (e.task.createdBy && e.task.createdBy !== e.actorUid) {
          result.push(e.task.createdBy);
        }
        if (
          e.task.assigneeId &&
          e.task.assigneeId !== e.actorUid &&
          !result.includes(e.task.assigneeId)
        ) {
          result.push(e.task.assigneeId);
        }
      }
      break;

    case 'member_added':
      if (e.addedUid && e.addedUid !== e.actorUid) {
        result.push(e.addedUid);
      }
      break;
  }

  return result;
}

export function subscribeNotifications(
  db: Firestore,
  uid: string,
  onChange: (list: AppNotification[]) => void,
  onError: (e: AppError) => void
): Unsubscribe {
  try {
    const notifColl = collection(db, 'users', uid, 'notifications');
    const q = query(notifColl, orderBy('createdAt', 'desc'), limit(30));

    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            type: data.type as NotificationType,
            projectId: data.projectId,
            projectName: data.projectName,
            taskId: data.taskId ?? null,
            taskTitle: data.taskTitle ?? null,
            actorId: data.actorId,
            actorName: data.actorName,
            createdAt: toDate(data.createdAt),
            readAt: toDate(data.readAt),
          };
        });
        onChange(list);
      },
      (err) => {
        onError(toAppError(err));
      }
    );
  } catch (err) {
    onError(toAppError(err));
    return () => {};
  }
}

export async function markRead(
  db: Firestore,
  uid: string,
  id: string
): Promise<void> {
  try {
    const ref = doc(db, 'users', uid, 'notifications', id);
    await withWriteGuard(() =>
      updateDoc(ref, {
        readAt: serverTimestamp(),
      })
    );
  } catch (err) {
    throw toAppError(err);
  }
}

export async function markAllRead(
  db: Firestore,
  uid: string,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  try {
    const batch = writeBatch(db);
    for (const id of ids) {
      batch.update(doc(db, 'users', uid, 'notifications', id), {
        readAt: serverTimestamp(),
      });
    }
    await withWriteGuard(() => batch.commit());
  } catch (err) {
    throw toAppError(err);
  }
}

export function countUnread(list: AppNotification[]): number {
  return list.filter((n) => n.readAt === null).length;
}
