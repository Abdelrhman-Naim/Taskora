import {
  Firestore,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { Task, TaskInput, TaskPatch, TaskStatus, RECURRENCES, Recurrence, Actor, TaskWriteContext } from '@/types';
import { taskInputSchema, fieldErrors } from '@/lib/validation';
import { toDate, nextDueDate } from '@/lib/dates';
import { AppError, toAppError } from '@/lib/errors';
import { withWriteGuard } from '@/lib/async';
import { newActivityRef, activityData } from './activity';
import { newNotificationRef, notificationData } from './notifications';

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
    checklist: Array.isArray(data.checklist) ? data.checklist : [],
    labels: Array.isArray(data.labels) ? data.labels : [],
    recurrence:
      typeof data.recurrence === 'string' && (RECURRENCES as readonly string[]).includes(data.recurrence)
        ? (data.recurrence as Recurrence)
        : 'none',
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
  input: TaskInput,
  ctx?: { actor: Actor; projectName?: string }
): Promise<string> {
  const parsed = taskInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('validation', 'Validation failed', fieldErrors(parsed.error));
  }

  const { title, description, priority, assigneeId, dueDate, checklist, labels, recurrence } = parsed.data;

  try {
    const taskRef = doc(collection(db, 'projects', projectId, 'tasks'));
    const taskData = {
      title,
      description,
      status: 'todo',
      priority,
      assigneeId,
      createdBy: uid,
      dueDate,
      checklist: checklist || [],
      labels: labels || [],
      recurrence: recurrence || 'none',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (ctx) {
      const batch = writeBatch(db);
      batch.set(taskRef, taskData);
      const actRef = newActivityRef(db, projectId);
      batch.set(
        actRef,
        activityData(ctx.actor, {
          type: 'task_created',
          taskId: taskRef.id,
          taskTitle: title,
        })
      );

      // In-app notification if the task is assigned to a member
      if (assigneeId && assigneeId !== uid) {
        const notifRef = newNotificationRef(db, assigneeId);
        batch.set(
          notifRef,
          notificationData(ctx.actor, {
            type: 'task_assigned',
            projectId,
            projectName: ctx.projectName || 'Project',
            taskId: taskRef.id,
            taskTitle: title,
          })
        );
      }

      // Notify checklist members for shared tasks
      if (checklist && checklist.length > 0) {
        for (const item of checklist) {
          if (item.id && item.id.length >= 20 && item.id !== uid && item.id !== assigneeId) {
            const notifRef = newNotificationRef(db, item.id);
            batch.set(
              notifRef,
              notificationData(ctx.actor, {
                type: 'task_assigned',
                projectId,
                projectName: ctx.projectName || 'Project',
                taskId: taskRef.id,
                taskTitle: title,
              })
            );
          }
        }
      }

      await withWriteGuard(() => batch.commit());
    } else {
      await withWriteGuard(() => setDoc(taskRef, taskData));
    }

    return taskRef.id;
  } catch (err) {
    throw toAppError(err);
  }
}

export async function updateTask(
  db: Firestore,
  projectId: string,
  taskId: string,
  patch: TaskPatch,
  ctx?: TaskWriteContext
): Promise<void> {
  // If editable fields are in patch, validate them
  if (
    patch.title !== undefined ||
    patch.description !== undefined ||
    patch.priority !== undefined ||
    patch.dueDate !== undefined ||
    patch.checklist !== undefined ||
    patch.labels !== undefined ||
    patch.recurrence !== undefined
  ) {
    const checkObj = {
      title: patch.title ?? 'Valid Title',
      description: patch.description ?? '',
      priority: patch.priority ?? 'medium',
      assigneeId: patch.assigneeId ?? null,
      dueDate: patch.dueDate !== undefined ? patch.dueDate : (patch.recurrence && patch.recurrence !== 'none' ? '2099-01-01' : null),
      checklist: patch.checklist,
      labels: patch.labels,
      recurrence: patch.recurrence,
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
    if (patch.checklist !== undefined) cleanData.checklist = patch.checklist;
    if (patch.labels !== undefined) cleanData.labels = patch.labels;
    if (patch.recurrence !== undefined) cleanData.recurrence = patch.recurrence;

    const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
    const assigneeChanged =
      ctx !== undefined &&
      patch.assigneeId !== undefined &&
      patch.assigneeId !== ctx.task.assigneeId;

    if (ctx && assigneeChanged) {
      const batch = writeBatch(db);
      batch.update(taskRef, cleanData);
      const actRef = newActivityRef(db, projectId);
      const detail = patch.assigneeId === null ? null : (ctx.assigneeName || patch.assigneeId);
      batch.set(
        actRef,
        activityData(ctx.actor, {
          type: 'task_assigned',
          taskId,
          taskTitle: patch.title ?? ctx.task.title,
          detail,
        })
      );

      // In-app notification for the newly assigned member
      if (patch.assigneeId && patch.assigneeId !== ctx.actor.uid) {
        const notifRef = newNotificationRef(db, patch.assigneeId);
        batch.set(
          notifRef,
          notificationData(ctx.actor, {
            type: 'task_assigned',
            projectId,
            projectName: ctx.projectName || 'Project',
            taskId,
            taskTitle: patch.title ?? ctx.task.title,
          })
        );
      }
      await withWriteGuard(() => batch.commit());
    } else {
      await withWriteGuard(() => updateDoc(taskRef, cleanData));
    }
  } catch (err) {
    throw toAppError(err);
  }
}

export async function changeTaskStatus(
  db: Firestore,
  projectId: string,
  taskId: string,
  status: TaskStatus,
  ctx?: TaskWriteContext
): Promise<void> {
  try {
    const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
    const statusChanged = ctx !== undefined && ctx.task.status !== status;

    if (ctx && statusChanged) {
      const batch = writeBatch(db);
      batch.update(taskRef, {
        status,
        updatedAt: serverTimestamp(),
      });
      const actRef = newActivityRef(db, projectId);
      batch.set(
        actRef,
        activityData(ctx.actor, {
          type: 'task_status_changed',
          taskId,
          taskTitle: ctx.task.title,
          detail: `${ctx.task.status}>${status}`,
        })
      );

      if (
        status === 'done' &&
        ctx.task.status !== 'done' &&
        ctx.task.recurrence &&
        ctx.task.recurrence !== 'none' &&
        ctx.task.dueDate
      ) {
        const nextDue = nextDueDate(ctx.task.dueDate, ctx.task.recurrence);
        const newTaskRef = doc(collection(db, 'projects', projectId, 'tasks'));
        const newChecklist = (ctx.task.checklist || []).map((item, idx) => ({
          id: `c-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
          text: item.text,
          done: false,
        }));

        batch.set(newTaskRef, {
          title: ctx.task.title,
          description: ctx.task.description,
          status: 'todo',
          priority: ctx.task.priority,
          assigneeId: ctx.task.assigneeId,
          createdBy: ctx.actor.uid,
          dueDate: nextDue,
          checklist: newChecklist,
          labels: ctx.task.labels || [],
          recurrence: ctx.task.recurrence,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        const newActRef = newActivityRef(db, projectId);
        batch.set(
          newActRef,
          activityData(ctx.actor, {
            type: 'task_created',
            taskId: newTaskRef.id,
            taskTitle: ctx.task.title,
          })
        );
      }

      await withWriteGuard(() => batch.commit());
    } else {
      await withWriteGuard(() =>
        updateDoc(taskRef, {
          status,
          updatedAt: serverTimestamp(),
        })
      );
    }
  } catch (err) {
    throw toAppError(err);
  }
}

export async function deleteTask(
  db: Firestore,
  projectId: string,
  taskId: string,
  ctx?: TaskWriteContext
): Promise<void> {
  try {
    // Delete any comments on this task in chunks <= 400
    const commentsColl = collection(db, 'projects', projectId, 'tasks', taskId, 'comments');
    const commentsSnap = await getDocs(commentsColl);
    const commentDocs = commentsSnap.docs;
    const CHUNK_SIZE = 400;

    for (let i = 0; i < commentDocs.length; i += CHUNK_SIZE) {
      const chunk = commentDocs.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const d of chunk) {
        batch.delete(d.ref);
      }
      await withWriteGuard(() => batch.commit());
    }

    const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);

    if (ctx) {
      const batch = writeBatch(db);
      batch.delete(taskRef);
      const actRef = newActivityRef(db, projectId);
      batch.set(
        actRef,
        activityData(ctx.actor, {
          type: 'task_deleted',
          taskId,
          taskTitle: ctx.task.title,
        })
      );
      await withWriteGuard(() => batch.commit());
    } else {
      await withWriteGuard(() => deleteDoc(taskRef));
    }
  } catch (err) {
    throw toAppError(err);
  }
}
