'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Task, Project, TaskStatus } from '@/types';
import { isOverdue, todayString } from '@/lib/dates';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './TaskCard.module.css';

const STATUS_OPTIONS: { value: TaskStatus; labelKey: 'task.status.todo' | 'task.status.in_progress' | 'task.status.done' }[] = [
  { value: 'todo', labelKey: 'task.status.todo' },
  { value: 'in_progress', labelKey: 'task.status.in_progress' },
  { value: 'done', labelKey: 'task.status.done' },
];

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
  const { t } = useI18n();
  const overdue = isOverdue(task, todayString());
  const assigneeName = task.assigneeId
    ? project.memberNames[task.assigneeId] || 'Unknown Member'
    : t('task.assignee.unassigned');

  const editable = canEditTask(task, currentUserId, isOwner);
  const statusChangeable = canChangeStatus(task, currentUserId, isOwner);
  const deletable = canDeleteTask(task, currentUserId, isOwner);

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number; minWidth: number }>({
    top: 0,
    left: 0,
    minWidth: 140,
  });
  const statusSelectRef = useRef<HTMLSelectElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const openStatusMenu = () => {
    if (!statusSelectRef.current) return;
    const rect = statusSelectRef.current.getBoundingClientRect();
    const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
    const menuWidth = Math.max(rect.width, 140);
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = 135;

    const top =
      spaceBelow < menuHeight && rect.top > menuHeight
        ? rect.top - menuHeight - 4
        : rect.bottom + 4;

    const left = isRtl
      ? Math.max(8, rect.right - menuWidth)
      : Math.min(window.innerWidth - menuWidth - 8, rect.left);

    setMenuCoords({
      top,
      left,
      minWidth: menuWidth,
    });
    setIsStatusOpen(true);
  };

  const handleSelectMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      e.preventDefault();
      if (isStatusOpen) {
        setIsStatusOpen(false);
      } else {
        openStatusMenu();
      }
    }
  };

  const handleSelectKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (isStatusOpen) {
        setIsStatusOpen(false);
      } else {
        openStatusMenu();
      }
    } else if (e.key === 'Escape') {
      setIsStatusOpen(false);
    }
  };

  useEffect(() => {
    if (!isStatusOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        statusSelectRef.current &&
        !statusSelectRef.current.contains(e.target as Node) &&
        statusMenuRef.current &&
        !statusMenuRef.current.contains(e.target as Node)
      ) {
        setIsStatusOpen(false);
      }
    };
    const handleScroll = () => setIsStatusOpen(false);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsStatusOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isStatusOpen]);

  return (
    <div className={styles.card} role="listitem" data-testid="task-item">
      {/* Main info column: Title & Badges */}
      <div className={styles.mainCol}>
        <div className={styles.titleRow}>
          <h3 dir="auto" className={styles.title} data-testid="task-title">
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
          </div>
        </div>

        {task.description && (
          <p dir="auto" className={styles.desc}>
            {task.description}
          </p>
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
            <>
              <select
                ref={statusSelectRef}
                id={`status-select-${task.id}`}
                aria-label={t('task.field.status')}
                value={task.status}
                onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
                onMouseDown={handleSelectMouseDown}
                onKeyDown={handleSelectKeyDown}
                className={styles.statusSelect}
              >
                <option value="todo">{t('task.status.todo')}</option>
                <option value="in_progress">{t('task.status.in_progress')}</option>
                <option value="done">{t('task.status.done')}</option>
              </select>

              {isStatusOpen &&
                typeof document !== 'undefined' &&
                createPortal(
                  <div
                    ref={statusMenuRef}
                    className={styles.statusMenu}
                    role="menu"
                    style={{
                      top: `${menuCoords.top}px`,
                      left: `${menuCoords.left}px`,
                      minWidth: `${menuCoords.minWidth}px`,
                    }}
                  >
                    {STATUS_OPTIONS.map((opt) => {
                      const isActive = task.status === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="menuitem"
                          className={`${styles.statusMenuItem} ${isActive ? styles.statusMenuItemActive : ''}`}
                          onClick={() => {
                            onStatusChange(task, opt.value);
                            setIsStatusOpen(false);
                            if (statusSelectRef.current) {
                              statusSelectRef.current.value = opt.value;
                              statusSelectRef.current.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                          }}
                        >
                          <span>{t(opt.labelKey)}</span>
                          {isActive && (
                            <span className={styles.statusMenuCheck}>
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>,
                  document.body
                )}
            </>
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
