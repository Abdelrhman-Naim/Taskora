'use client';

import React from 'react';
import { Task, Project, TaskStatus } from '@/types';
import { isOverdue, todayString } from '@/lib/dates';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './TaskCard.module.css';

export function canEditTask(t: Task, uid: string, isOwner: boolean): boolean {
  if (isOwner) return true;
  return t.createdBy === uid || t.assigneeId === uid;
}

export function canChangeStatus(t: Task, uid: string, isOwner: boolean): boolean {
  if (isOwner) return true;
  return t.assigneeId === uid;
}

export function canReassign(t: Task, uid: string, isOwner: boolean): boolean {
  if (isOwner) return true;
  return t.createdBy === uid;
}

export function canDeleteTask(t: Task, uid: string, isOwner: boolean): boolean {
  if (isOwner) return true;
  return t.createdBy === uid;
}

interface TaskCardProps {
  task: Task;
  project: Project;
  currentUserId: string;
  isOwner: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
}

export function TaskCard({
  task,
  project,
  currentUserId,
  isOwner,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskCardProps): React.ReactElement {
  const { t, formatDueDate } = useI18n();
  const overdue = isOverdue(task, todayString());
  const assigneeName = task.assigneeId
    ? project.memberNames[task.assigneeId] || 'Unknown Member'
    : t('task.assignee.unassigned');

  const editable = canEditTask(task, currentUserId, isOwner);
  const statusChangeable = canChangeStatus(task, currentUserId, isOwner);
  const deletable = canDeleteTask(task, currentUserId, isOwner);

  return (
    <div className={styles.card} role="listitem">
      {/* Main info column: Title & Badges */}
      <div className={styles.mainCol}>
        <div className={styles.titleRow}>
          <h3 dir="auto" className={styles.title}>
            <bdi dir="auto">{task.title}</bdi>
          </h3>
          <div className={styles.badges}>
            <Badge kind={task.status} />
            <Badge kind={task.priority} />
            {overdue && <Badge kind="overdue" />}
          </div>
        </div>

        {task.description && (
          <p dir="auto" className={styles.desc}>
            {task.description}
          </p>
        )}
      </div>

      {/* Assignee column */}
      <div className={styles.assigneeCol}>
        <Avatar name={assigneeName} size="sm" />
        <span className={styles.assigneeName}>
          <bdi>{assigneeName}</bdi>
        </span>
      </div>

      {/* Due date column */}
      <div className={styles.dueCol}>
        {task.dueDate ? (
          <>
            <span className={overdue ? styles.dueOverdue : styles.dueDate}>
              {formatDueDate(task.dueDate)}
            </span>
          </>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        )}
      </div>

      {/* Action controls column in fixed order: status change -> edit -> delete */}
      {(statusChangeable || editable || deletable) && (
        <div className={styles.actions} data-testid="task-actions">
          {statusChangeable && (
            <select
              id={`status-select-${task.id}`}
              aria-label={t('task.field.status')}
              value={task.status}
              onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
              className={styles.statusSelect}
            >
              <option value="todo">{t('task.status.todo')}</option>
              <option value="in_progress">{t('task.status.in_progress')}</option>
              <option value="done">{t('task.status.done')}</option>
            </select>
          )}

          {editable && (
            <IconButton
              icon="edit"
              label={t('common.edit')}
              size="sm"
              variant="ghost"
              onClick={() => onEdit(task)}
            />
          )}

          {deletable && (
            <IconButton
              icon="trash"
              label={t('common.delete')}
              size="sm"
              variant="danger"
              onClick={() => onDelete(task)}
            />
          )}
        </div>
      )}
    </div>
  );
}
