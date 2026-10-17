import React from 'react';
import { Task, Project, TaskStatus } from '@/types';
import { isOverdue, todayString, formatDueDate } from '@/lib/dates';

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

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  low: { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' },
  medium: { bg: 'rgba(234, 179, 8, 0.15)', color: '#eab308' },
  high: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
};

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
}: TaskCardProps) {
  const overdue = isOverdue(task, todayString());
  const assigneeName = task.assigneeId
    ? project.memberNames[task.assigneeId] || 'Unknown Member'
    : 'Unassigned';

  const editable = canEditTask(task, currentUserId, isOwner);
  const statusChangeable = canChangeStatus(task, currentUserId, isOwner);
  const deletable = canDeleteTask(task, currentUserId, isOwner);

  const prioStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'border-color 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            wordBreak: 'break-word',
          }}
        >
          {task.title}
        </h3>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: prioStyle.bg,
              color: prioStyle.color,
            }}
          >
            {task.priority.toUpperCase()}
          </span>

          {overdue && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: 'var(--danger)',
              }}
            >
              Overdue
            </span>
          )}
        </div>
      </div>

      {task.description && (
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {task.description}
        </p>
      )}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          fontSize: '12px',
          color: 'var(--text-muted)',
          marginTop: 'auto',
          paddingTop: '6px',
        }}
      >
        <div>
          <span style={{ fontWeight: 600 }}>Assignee:</span>{' '}
          <span style={{ color: 'var(--text-secondary)' }}>{assigneeName}</span>
        </div>

        {task.dueDate && (
          <div>
            <span style={{ fontWeight: 600 }}>Due:</span>{' '}
            <span style={{ color: overdue ? 'var(--danger)' : 'var(--text-secondary)' }}>
              {formatDueDate(task.dueDate)}
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--border)',
          paddingTop: '12px',
          marginTop: '4px',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor={`status-select-${task.id}`} style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Status:
          </label>
          {statusChangeable ? (
            <select
              id={`status-select-${task.id}`}
              value={task.status}
              onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                backgroundColor: 'var(--bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          ) : (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                padding: '4px 8px',
                backgroundColor: 'var(--bg)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}
            >
              {STATUS_LABELS[task.status]}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {editable && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              Edit
            </button>
          )}

          {deletable && (
            <button
              type="button"
              onClick={() => onDelete(task)}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: 'transparent',
                color: 'var(--danger)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
