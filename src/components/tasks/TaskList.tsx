import React from 'react';
import { Task, Project, TaskStatus } from '@/types';
import { TaskCard } from '@/components/tasks/TaskCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './TaskList.module.css';

interface TaskListProps {
  tasks: Task[];
  project: Project;
  currentUserId: string;
  isOwner: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
  onNewTask?: () => void;
}

export function TaskList({
  tasks,
  project,
  currentUserId,
  isOwner,
  onEdit,
  onDelete,
  onStatusChange,
  onNewTask,
}: TaskListProps): React.ReactElement {
  const { t } = useI18n();

  if (tasks.length === 0) {
    return (
      <EmptyState
        title={t('task.list.emptyTitle')}
        message={t('task.list.emptyDescription')}
        action={
          onNewTask
            ? {
                label: t('task.new.button'),
                onClick: onNewTask,
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className={styles.list} role="list">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          project={project}
          currentUserId={currentUserId}
          isOwner={isOwner}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
