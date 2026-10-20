import { ActivityEntry } from '@/types';

export type TFunction = (key: string, params?: Record<string, string | number>) => string;

export function activityMessage(e: ActivityEntry, t: TFunction): string {
  const actor = e.actorName;
  const task = e.taskTitle || t('activity.unnamedTask');

  switch (e.type) {
    case 'task_created':
      return t('activity.task_created', { actor, task });

    case 'task_status_changed': {
      const [fromStatus, toStatus] = (e.detail || '').split('>');
      const from = fromStatus ? t(`task.status.${fromStatus}`) : fromStatus;
      const to = toStatus ? t(`task.status.${toStatus}`) : toStatus;
      return t('activity.task_status_changed', { actor, task, from, to });
    }

    case 'task_assigned':
      if (e.detail) {
        return t('activity.task_assigned', { actor, task, assignee: e.detail });
      }
      return t('activity.task_unassigned', { actor, task });

    case 'task_deleted':
      return t('activity.task_deleted', { actor, task });

    case 'comment_added':
      return t('activity.comment_added', { actor, task });

    case 'member_added':
      return t('activity.member_added', { actor, member: e.detail || '' });

    case 'member_removed':
      return t('activity.member_removed', { actor, member: e.detail || '' });

    default:
      return `${actor}: ${e.type}`;
  }
}
