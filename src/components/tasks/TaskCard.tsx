'use client';

import React from 'react';
import { Task, Project, TaskStatus } from '@/types';
import { isOverdue, todayString } from '@/lib/dates';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { useI18n } from '@/i18n/I18nProvider';

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
    <div
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'border-color var(--dur-fast) ease, background-color var(--dur-fast) ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <h3
          dir="auto"
          style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--fg)',
            margin: 0,
            wordBreak: 'break-word',
          }}
        >
          {task.title}
        </h3>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
          <Badge kind={task.status} />
          <Badge kind={task.priority} />
          {overdue && <Badge kind="overdue" />}
        </div>
      </div>

      {task.description && (
        <p
          dir="auto"
          style={{
            fontSize: '0.875rem',
            color: 'var(--fg-muted)',
            margin: 0,
            lineHeight: 1.6,
            wordBreak: 'break-word',
          }}
        >
          {task.description}
        </p>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          borderBlockStart: '1px solid var(--border-subtle)',
          paddingBlockStart: '10px',
          fontSize: '0.8125rem',
          color: 'var(--fg-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span>
            {t('task.field.assignee')}:{' '}
            <strong dir="auto" style={{ color: 'var(--fg)', fontWeight: 500 }}>
              {assigneeName}
            </strong>
          </span>

          {task.dueDate && (
            <span>
              {t('task.field.dueDate')}:{' '}
              <strong style={{ color: overdue ? 'var(--st-overdue-fg)' : 'var(--fg)', fontWeight: 500 }}>
                {formatDueDate(task.dueDate)}
              </strong>
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {statusChangeable && (
            <select
              id={`status-select-${task.id}`}
              aria-label={t('task.field.status')}
              value={task.status}
              onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
              style={{
                fontSize: '0.8125rem',
                paddingInline: '8px',
                paddingBlock: '4px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--control-border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--fg)',
                cursor: 'pointer',
              }}
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
      </div>
    </div>
  );
}
