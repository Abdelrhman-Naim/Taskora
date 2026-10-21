import {
  Firestore,
  collection,
  doc,
  getDocs,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { TaskComment, Actor, Task } from '@/types';
import { commentInputSchema, fieldErrors } from '@/lib/validation';
import { toDate } from '@/lib/dates';
import { AppError, toAppError } from '@/lib/errors';
import { withWriteGuard } from '@/lib/async';
import { newActivityRef, activityData } from './activity';
import { newNotificationRef, notificationData, recipientsFor } from './notifications';

export async function listComments(
  db: Firestore,
  projectId: string,
  taskId: string,
  max = 100
): Promise<TaskComment[]> {
  try {
    const commentsColl = collection(db, 'projects', projectId, 'tasks', taskId, 'comments');
    const q = query(commentsColl, orderBy('createdAt', 'asc'), limit(max));
    const snap = await getDocs(q);

    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        projectId,
        taskId,
        authorId: typeof data.authorId === 'string' ? data.authorId : '',
        authorName: typeof data.authorName === 'string' ? data.authorName : '',
        text: typeof data.text === 'string' ? data.text : '',
        createdAt: toDate(data.createdAt),
      };
    });
  } catch (err) {
    throw toAppError(err);
  }
}

export async function addComment(
  db: Firestore,
  projectId: string,
  taskId: string,
  ctx: { actor: Actor; task: Task; projectName: string },
  text: string
): Promise<string> {
  const parsed = commentInputSchema.safeParse({ text });
  if (!parsed.success) {
    throw new AppError('validation', 'Validation failed', fieldErrors(parsed.error));
  }

  try {
    const commentRef = doc(collection(db, 'projects', projectId, 'tasks', taskId, 'comments'));
    const batch = writeBatch(db);

    // 1. Add comment document
    batch.set(commentRef, {
      authorId: ctx.actor.uid,
      authorName: ctx.actor.displayName,
      text: parsed.data.text,
      createdAt: serverTimestamp(),
    });

    // 2. Add activity log
    const actRef = newActivityRef(db, projectId);
    batch.set(
      actRef,
      activityData(ctx.actor, {
        type: 'comment_added',
        taskId,
        taskTitle: ctx.task.title,
      })
    );

    // 3. Add notifications to recipients (creator and assignee, minus author)
    const recs = recipientsFor({
      type: 'comment_added',
      actorUid: ctx.actor.uid,
      task: ctx.task,
    });

    for (const recipientUid of recs) {
      const notifRef = newNotificationRef(db, recipientUid);
      batch.set(
        notifRef,
        notificationData(ctx.actor, {
          type: 'comment_added',
          projectId,
          projectName: ctx.projectName,
          taskId,
          taskTitle: ctx.task.title,
        })
      );
    }

    await withWriteGuard(() => batch.commit());

    return commentRef.id;
  } catch (err) {
    throw toAppError(err);
  }
}

export async function deleteComment(
  db: Firestore,
  projectId: string,
  taskId: string,
  commentId: string
): Promise<void> {
  try {
    await withWriteGuard(() =>
      deleteDoc(doc(db, 'projects', projectId, 'tasks', taskId, 'comments', commentId))
    );
  } catch (err) {
    throw toAppError(err);
  }
}
