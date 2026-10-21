'use client';

import React, { useState } from 'react';
import { Task, Project, TaskStatus } from '@/types';
import { canChangeStatus, StatusMenu } from './TaskCard';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useI18n } from '@/i18n/I18nProvider';
import { MessageKey } from '@/i18n/en';
import { isOverdue, todayString, isScheduledTask } from '@/lib/dates';
import styles from './TaskBoard.module.css';

export interface TaskBoardProps {
  tasks: Task[];
  project: Project;
  currentUserId: string;
  isOwner: boolean;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
  onOpen: (task: Task) => void;
}

interface ColumnConfig {
  status: TaskStatus;
  labelKey: MessageKey;
  emptyKey: MessageKey;
  indicatorClass: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    status: 'todo',
    labelKey: 'board.column.todo',
    emptyKey: 'board.empty.todo',
    indicatorClass: styles.statusTodo,
  },
  {
    status: 'in_progress',
    labelKey: 'board.column.in_progress',
    emptyKey: 'board.empty.in_progress',
    indicatorClass: styles.statusInProgress,
  },
  {
    status: 'done',
    labelKey: 'board.column.done',
    emptyKey: 'board.empty.done',
    indicatorClass: styles.statusDone,
  },
];

export function TaskBoard({
  tasks,
  project,
  currentUserId,
  isOwner,
  onStatusChange,
  onOpen,
}: TaskBoardProps): React.ReactElement {
  const { t } = useI18n();
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [showScheduled, setShowScheduled] = useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, colStatus: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colStatus) {
      setDragOverCol(colStatus);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, colStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const droppedTask = tasks.find((item) => item.id === taskId);
    if (droppedTask && droppedTask.status !== colStatus && canChangeStatus(droppedTask, currentUserId, isOwner)) {
      onStatusChange(droppedTask, colStatus);
    }
  };

  return (
    <div className={styles.container} data-testid="task-board-view">
      {COLUMNS.map((col) => {
        const rawColTasks = tasks.filter((tItem) => tItem.status === col.status);
        const isTodoCol = col.status === 'todo';
        const colTasks = isTodoCol ? rawColTasks.filter((t) => !isScheduledTask(t)) : rawColTasks;
        const scheduledTasks = isTodoCol ? rawColTasks.filter((t) => isScheduledTask(t)) : [];
        const isCurrentDragOver = dragOverCol === col.status;

        return (
          <div
            key={col.status}
            className={styles.column}
            data-testid={`board-column-${col.status}`}
          >
            <div
              className={styles.columnHeader}
              data-testid={`board-column-header-${col.status}`}
            >
              <h3 className={styles.columnHeaderTitle}>
                <span
                  className={`${styles.statusIndicator} ${col.indicatorClass}`}
                  aria-hidden="true"
                />
                <span>{t(col.labelKey)}</span>
              </h3>
              <span className={styles.countBadge} dir="ltr">
                {colTasks.length}
              </span>
            </div>

            <div
              className={`${styles.dropzone} ${isCurrentDragOver ? styles.dropzoneActive : ''}`}
              data-testid={`board-column-dropzone-${col.status}`}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              {colTasks.length === 0 ? (
                <div
                  className={styles.emptyState}
                  data-testid={`board-column-empty-${col.status}`}
                >
                  {t(col.emptyKey)}
                </div>
              ) : (
                colTasks.map((task) => {
                  const canChange = canChangeStatus(task, currentUserId, isOwner);
                  const isTaskOverdue = isOverdue(task, todayString());

                  const checklistTotal = task.checklist ? task.checklist.length : 0;
                  const checklistDone = task.checklist
                    ? task.checklist.filter((c) => c.done).length
                    : 0;

                  return (
                    <div
                      key={task.id}
                      role="button"
                      tabIndex={0}
                      draggable={canChange}
                      aria-disabled={!canChange ? 'true' : undefined}
                      data-testid={`board-task-card-${task.id}`}
                      className={styles.card}
                      onDragStart={(e) => {
                        if (canChange) handleDragStart(e, task);
                      }}
                      onClick={() => onOpen(task)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          onOpen(task);
                        }
                      }}
                    >
                      <div className={styles.cardHeader}>
                        <h4 className={styles.cardTitle}>
                          <bdi>{task.title}</bdi>
                        </h4>
                        <div
                          data-testid={`board-card-status-${task.id}`}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <StatusMenu
                            task={task}
                            canChange={canChange}
                            onStatusChange={onStatusChange}
                          />
                        </div>
                      </div>

                      {task.labels && task.labels.length > 0 && (
                        <div className={styles.labelsList}>
                          {task.labels.map((lbl, idx) => (
                            <span key={idx} className={styles.labelChip}>
                              <bdi>{lbl}</bdi>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className={styles.cardFooter}>
                        <div className={styles.metaGroup}>
                          <Badge kind={task.priority} />

                          {checklistTotal > 0 && (
                            <span className={styles.checklistBadge} dir="ltr">
                              {checklistDone}/{checklistTotal}
                            </span>
                          )}

                          {task.dueDate && (
                            <span
                              className={`${styles.dueDate} ${isTaskOverdue ? styles.overdue : ''}`}
                              dir="ltr"
                            >
                              {task.dueDate}
                            </span>
                          )}
                        </div>

                        {task.assigneeId && project.memberNames[task.assigneeId] && (
                          <Avatar
                            name={project.memberNames[task.assigneeId]}
                            size="sm"
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {isTodoCol && scheduledTasks.length > 0 && (
                <div className={styles.scheduledSection} data-testid="scheduled-tasks-section">
                  <button
                    type="button"
                    className={styles.scheduledToggle}
                    onClick={() => setShowScheduled((prev) => !prev)}
                    aria-expanded={showScheduled}
                  >
                    <span>
                      📅 {t('task.recurrence.scheduledTitle')} ({scheduledTasks.length})
                    </span>
                    <span style={{ fontSize: '0.75rem' }}>{showScheduled ? '▲' : '▼'}</span>
                  </button>

                  {showScheduled && (
                    <div className={styles.scheduledList}>
                      {scheduledTasks.map((task) => {
                        const canChange = canChangeStatus(task, currentUserId, isOwner);
                        return (
                          <div
                            key={task.id}
                            role="button"
                            tabIndex={0}
                            draggable={canChange}
                            aria-disabled={!canChange ? 'true' : undefined}
                            data-testid={`board-task-card-${task.id}`}
                            className={`${styles.card} ${styles.scheduledCard}`}
                            onDragStart={(e) => {
                              if (canChange) handleDragStart(e, task);
                            }}
                            onClick={() => onOpen(task)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                onOpen(task);
                              }
                            }}
                          >
                            <div className={styles.cardHeader}>
                              <h4 className={styles.cardTitle}>
                                <bdi>{task.title}</bdi>
                              </h4>
                              <div
                                data-testid={`board-card-status-${task.id}`}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                              >
                                <StatusMenu
                                  task={task}
                                  canChange={canChange}
                                  onStatusChange={onStatusChange}
                                />
                              </div>
                            </div>

                            <div className={styles.scheduledBanner}>
                              <span>⏰</span>
                              <span>{t('task.recurrence.scheduledBanner', { date: task.dueDate || '' })}</span>
                            </div>

                            <div className={styles.cardFooter}>
                              <div className={styles.metaGroup}>
                                <Badge kind="scheduled" />
                                <Badge kind={task.priority} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
