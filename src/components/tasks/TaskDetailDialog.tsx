'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Task, Project, TaskPatch, TaskStatus } from '@/types';
import { canEditTask, canChangeStatus } from '@/components/tasks/TaskCard';
import { StatusMenu } from '@/components/tasks/StatusMenu';
import { Checklist } from '@/components/tasks/Checklist';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './TaskDetailDialog.module.css';

export interface TaskDetailDialogProps {
  task: Task;
  project: Project;
  currentUserId: string;
  isOwner: boolean;
  onClose: () => void;
  onEdit: (t: Task) => void;
  onTaskChange: (patch: TaskPatch) => Promise<void>;
}

export function TaskDetailDialog({
  task,
  project,
  currentUserId,
  isOwner,
  onClose,
  onEdit,
  onTaskChange,
}: TaskDetailDialogProps): React.ReactElement | null {
  const { t } = useI18n();
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const canEdit = canEditTask(task, currentUserId, isOwner);
  const canStatus = canChangeStatus(task, currentUserId, isOwner);

  const assigneeName = task.assigneeId
    ? project.memberNames[task.assigneeId] || 'Unknown Member'
    : t('task.assignee.unassigned');

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Initial focus on close button or modal
    const closeBtn = modalRef.current?.querySelector<HTMLElement>(
      '[data-testid="task-detail-close-btn"]'
    );
    closeBtn?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocusedRef.current && previouslyFocusedRef.current.focus) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [onClose]);

  const handleStatusChange = (_t: Task, newStatus: TaskStatus) => {
    onTaskChange({ status: newStatus });
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-heading"
    >
      <div
        ref={modalRef}
        className={styles.modal}
        data-testid="task-detail-dialog"
      >
        <div className={styles.header}>
          <div className={styles.headerTitleCol}>
            <h2
              id="task-detail-heading"
              className={styles.title}
              data-testid="task-detail-title"
              dir="auto"
            >
              <bdi>{task.title}</bdi>
            </h2>
          </div>
          <div className={styles.headerActions}>
            {canEdit && (
              <button
                type="button"
                data-testid="task-detail-edit-btn"
                className={styles.editBtn}
                onClick={() => onEdit(task)}
              >
                {t('task.detail.edit')}
              </button>
            )}
            <button
              type="button"
              data-testid="task-detail-close-btn"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label={t('task.detail.close')}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="6" />
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.metaRow}>
            <div
              className={styles.statusWrapper}
              data-testid="task-detail-status"
            >
              <StatusMenu
                task={task}
                canChange={canStatus}
                onStatusChange={handleStatusChange}
              />
            </div>

            <div data-testid="task-detail-priority">
              <Badge kind={task.priority} />
            </div>

            <div data-testid="task-detail-due-date">
              {task.dueDate ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.8125rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
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
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  —
                </span>
              )}
            </div>
          </div>

          {task.description && (
            <p className={styles.desc} dir="auto">
              {task.description}
            </p>
          )}

          <div className={styles.section} data-testid="task-detail-assignee">
            <h4 className={styles.sectionTitle}>{t('task.field.assignee')}</h4>
            <div className={styles.assigneeBox}>
              <Avatar name={assigneeName} size="sm" />
              <bdi>{assigneeName}</bdi>
            </div>
          </div>

          <div className={styles.section} data-testid="task-detail-labels">
            <h4 className={styles.sectionTitle}>{t('task.field.labels')}</h4>
            {task.labels && task.labels.length > 0 ? (
              <div className={styles.labelsList}>
                {task.labels.map((l, i) => (
                  <span key={i} className={styles.labelChip}>
                    <bdi>{l}</bdi>
                  </span>
                ))}
              </div>
            ) : (
              <p className={styles.labelChipEmpty}>{t('task.labels.empty')}</p>
            )}
          </div>

          <div className={styles.section}>
            <Checklist
              items={task.checklist || []}
              canEdit={canEdit}
              onChange={(updatedItems) => {
                onTaskChange({ checklist: updatedItems });
              }}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
