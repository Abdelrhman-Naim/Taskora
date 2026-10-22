'use client';

// ============================================================================
// ZONE 1: IMPORTS
// ============================================================================
import React, { useState } from 'react';
import { Task, Project, TaskStatus } from '@/types';
import { canChangeStatus, StatusMenu } from './TaskCard';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useI18n } from '@/i18n/I18nProvider';
import { MessageKey } from '@/i18n/en';
import { isOverdue, todayString, isScheduledTask } from '@/lib/dates';
import styles from './TaskBoard.module.css';

// ============================================================================
// ZONE 2: CONFIG & CONSTANTS
// ============================================================================
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

// ============================================================================
// ZONE 3: TYPES & INTERFACES
// ============================================================================
export interface TaskBoardProps {
  tasks: Task[];
  project: Project;
  currentUserId: string;
  isOwner: boolean;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
  onOpen: (task: Task) => void;
}

interface BoardCardProps {
  task: Task;
  project: Project;
  canChange: boolean;
  isScheduled?: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, task: Task) => void;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
  onOpen: (task: Task) => void;
  scheduledBannerText?: string;
}

interface BoardColumnProps {
  config: ColumnConfig;
  tasks: Task[];
  scheduledTasks: Task[];
  project: Project;
  currentUserId: string;
  isOwner: boolean;
  isDragOver: boolean;
  showScheduled: boolean;
  onToggleScheduled: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, task: Task) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => void;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
  onOpen: (task: Task) => void;
}

// ============================================================================
// ZONE 4: HELPERS & HOOKS
// ============================================================================
function partitionTasksByColumn(
  tasks: Task[],
  status: TaskStatus
): { activeTasks: Task[]; scheduledTasks: Task[] } {
  const columnTasks = tasks.filter((t) => t.status === status);
  if (status !== 'todo') {
    return { activeTasks: columnTasks, scheduledTasks: [] };
  }
  return {
    activeTasks: columnTasks.filter((t) => !isScheduledTask(t)),
    scheduledTasks: columnTasks.filter((t) => isScheduledTask(t)),
  };
}

// ============================================================================
// ZONE 5: SUB-COMPONENTS
// ============================================================================
function BoardCard({
  task,
  project,
  canChange,
  isScheduled = false,
  onDragStart,
  onStatusChange,
  onOpen,
  scheduledBannerText,
}: BoardCardProps): React.ReactElement {
  const isTaskOverdue = isOverdue(task, todayString());
  const checklistTotal = task.checklist ? task.checklist.length : 0;
  const checklistDone = task.checklist
    ? task.checklist.filter((c) => c.done).length
    : 0;

  const assigneeName = task.assigneeId ? project.memberNames[task.assigneeId] : null;

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={canChange}
      aria-disabled={!canChange ? 'true' : undefined}
      data-testid={`board-task-card-${task.id}`}
      className={`${styles.card} ${isScheduled ? styles.scheduledCard : ''}`}
      onDragStart={(e) => {
        if (canChange) onDragStart(e, task);
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

      {isScheduled && scheduledBannerText && (
        <div className={styles.scheduledBanner}>
          <span>⏰</span>
          <span>{scheduledBannerText}</span>
        </div>
      )}

      {!isScheduled && task.labels && task.labels.length > 0 && (
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
          {isScheduled && <Badge kind="scheduled" />}
          <Badge kind={task.priority} />

          {!isScheduled && checklistTotal > 0 && (
            <span className={styles.checklistBadge} dir="ltr">
              {checklistDone}/{checklistTotal}
            </span>
          )}

          {!isScheduled && task.dueDate && (
            <span
              className={`${styles.dueDate} ${isTaskOverdue ? styles.overdue : ''}`}
              dir="ltr"
            >
              {task.dueDate}
            </span>
          )}
        </div>

        {!isScheduled && assigneeName && (
          <Avatar name={assigneeName} size="sm" />
        )}
      </div>
    </div>
  );
}

function BoardColumn({
  config,
  tasks,
  scheduledTasks,
  project,
  currentUserId,
  isOwner,
  isDragOver,
  showScheduled,
  onToggleScheduled,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onStatusChange,
  onOpen,
}: BoardColumnProps): React.ReactElement {
  const { t } = useI18n();
  const isTodoCol = config.status === 'todo';

  return (
    <div
      className={styles.column}
      data-testid={`board-column-${config.status}`}
    >
      {/* Column Header */}
      <div
        className={styles.columnHeader}
        data-testid={`board-column-header-${config.status}`}
      >
        <h3 className={styles.columnHeaderTitle}>
          <span
            className={`${styles.statusIndicator} ${config.indicatorClass}`}
            aria-hidden="true"
          />
          <span>{t(config.labelKey)}</span>
        </h3>
        <span className={styles.countBadge} dir="ltr">
          {tasks.length}
        </span>
      </div>

      {/* Dropzone */}
      <div
        className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ''}`}
        data-testid={`board-column-dropzone-${config.status}`}
        onDragOver={(e) => onDragOver(e, config.status)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, config.status)}
      >
        {tasks.length === 0 ? (
          <div
            className={styles.emptyState}
            data-testid={`board-column-empty-${config.status}`}
          >
            {t(config.emptyKey)}
          </div>
        ) : (
          tasks.map((task) => (
            <BoardCard
              key={task.id}
              task={task}
              project={project}
              canChange={canChangeStatus(task, currentUserId, isOwner)}
              onDragStart={onDragStart}
              onStatusChange={onStatusChange}
              onOpen={onOpen}
            />
          ))
        )}

        {/* Scheduled Tasks Accordion (Todo column only) */}
        {isTodoCol && scheduledTasks.length > 0 && (
          <div className={styles.scheduledSection} data-testid="scheduled-tasks-section">
            <button
              type="button"
              className={styles.scheduledToggle}
              onClick={onToggleScheduled}
              aria-expanded={showScheduled}
            >
              <span>
                📅 {t('task.recurrence.scheduledTitle')} ({scheduledTasks.length})
              </span>
              <span style={{ fontSize: '0.75rem' }}>{showScheduled ? '▲' : '▼'}</span>
            </button>

            {showScheduled && (
              <div className={styles.scheduledList}>
                {scheduledTasks.map((task) => (
                  <BoardCard
                    key={task.id}
                    task={task}
                    project={project}
                    isScheduled
                    canChange={canChangeStatus(task, currentUserId, isOwner)}
                    onDragStart={onDragStart}
                    onStatusChange={onStatusChange}
                    onOpen={onOpen}
                    scheduledBannerText={t('task.recurrence.scheduledBanner', {
                      date: task.dueDate || '',
                    })}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ZONE 6: MAIN COMPONENT
// ============================================================================
export function TaskBoard({
  tasks,
  project,
  currentUserId,
  isOwner,
  onStatusChange,
  onOpen,
}: TaskBoardProps): React.ReactElement {
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
    if (
      droppedTask &&
      droppedTask.status !== colStatus &&
      canChangeStatus(droppedTask, currentUserId, isOwner)
    ) {
      onStatusChange(droppedTask, colStatus);
    }
  };

  return (
    <div className={styles.container} data-testid="task-board-view">
      {COLUMNS.map((col) => {
        const { activeTasks, scheduledTasks } = partitionTasksByColumn(tasks, col.status);

        return (
          <BoardColumn
            key={col.status}
            config={col}
            tasks={activeTasks}
            scheduledTasks={scheduledTasks}
            project={project}
            currentUserId={currentUserId}
            isOwner={isOwner}
            isDragOver={dragOverCol === col.status}
            showScheduled={showScheduled}
            onToggleScheduled={() => setShowScheduled((prev) => !prev)}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onStatusChange={onStatusChange}
            onOpen={onOpen}
          />
        );
      })}
    </div>
  );
}
