'use client';

import React from 'react';
import { Task, Project, TaskStatus } from '@/types';
import { isOverdue, todayString } from '@/lib/dates';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { useI18n } from '@/i18n/I18nProvider';
import { StatusMenu } from './StatusMenu';
import styles from './TaskCard.module.css';

export { StatusMenu };

export function canEditTask(t: Task, uid: string, isOwner: boolean): boolean {
  if (isOwner) return true;
  return t.createdBy === uid || t.assigneeId === uid;
}

export function canChangeStatus(t: Task, uid: string, isOwner: boolean): boolean {
  if (isOwner) return true;
  return t.assigneeId === uid || (!t.assigneeId && t.createdBy === uid);
}

export function canReassign(t: Task, uid: string, isOwner: boolean): boolean {
  if (isOwner) return true;
  return t.createdBy === uid;
}

export function canDeleteTask(t: Task, uid: string, isOwner: boolean): boolean {
  if (isOwner) return true;
  return t.createdBy === uid;
}

export interface TaskCardProps {
  task: Task;
  project: Project;
  currentUserId: string;
  isOwner: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
  onOpen?: (task: Task) => void;
}

export function TaskCard({
  task,
  project,
  currentUserId,
  isOwner,
  onEdit,
  onDelete,
  onStatusChange,
  onOpen,
}: TaskCardProps): React.ReactElement {
  const { t } = useI18n();
  const overdue = isOverdue(task, todayString());
  const assigneeName = task.assigneeId
    ? project.memberNames[task.assigneeId] || 'Unknown Member'
    : t('task.assignee.unassigned');

  const editable = canEditTask(task, currentUserId, isOwner);
  const statusChangeable = canChangeStatus(task, currentUserId, isOwner);
  const deletable = canDeleteTask(task, currentUserId, isOwner);

  const doneCount = (task.checklist || []).filter((item) => item.done).length;
  const hasChecklist = task.checklist && task.checklist.length > 0;
  const hasLabels = task.labels && task.labels.length > 0;

  return (
    <div className={styles.card} role="listitem" data-testid="task-item">
      {/* Main info column: Title & Badges */}
      <div className={styles.mainCol}>
        <div className={styles.titleRow}>
          <h3
            dir="auto"
            className={`${styles.title} ${onOpen ? styles.titleClickable : ''}`}
            data-testid="task-title"
            onClick={() => onOpen?.(task)}
          >
            <bdi dir="auto">{task.title}</bdi>
          </h3>
          <div className={styles.badges}>
            <span data-testid="task-status-badge">
              <Badge kind={task.status} />
            </span>
            <span data-testid="task-priority-badge">
              <Badge kind={task.priority} />
            </span>
            {overdue && <Badge kind="overdue" />}
            {hasChecklist && (
              <span
                className={styles.checklistProgress}
                dir="ltr"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {doneCount}/{task.checklist.length}
              </span>
            )}
          </div>
        </div>

        {task.description && (
          <p dir="auto" className={styles.desc}>
            {task.description}
          </p>
        )}

        {hasLabels && (
          <div className={styles.labelsRow}>
            {task.labels.map((lbl, idx) => (
              <span key={idx} className={styles.labelChip}>
                <bdi>{lbl}</bdi>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Assignee column */}
      <div className={styles.assigneeCol} data-testid="task-assignee">
        <Avatar name={assigneeName} size="sm" />
        <span className={styles.assigneeName}>
          <bdi>{assigneeName}</bdi>
        </span>
      </div>

      {/* Due date column */}
      <div className={styles.dueCol} data-testid="task-due-date">
        {task.dueDate ? (
          <span className={overdue ? styles.dueOverdue : styles.dueDate}>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ opacity: 0.75, flexShrink: 0 }}
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span dir="ltr" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {task.dueDate.replace(/-/g, '/')}
            </span>
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        )}
      </div>

      {/* Action controls column in fixed order: status change -> edit -> delete */}
      {(statusChangeable || editable || deletable) && (
        <div className={styles.actions} data-testid="task-actions">
          {statusChangeable && (
            <StatusMenu
              task={task}
              canChange={statusChangeable}
              onStatusChange={onStatusChange}
            />
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
