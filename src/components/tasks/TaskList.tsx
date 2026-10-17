import React from 'react';
import { Task, Project, TaskStatus } from '@/types';
import { TaskCard } from '@/components/tasks/TaskCard';
import { EmptyState } from '@/components/ui/EmptyState';

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
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        title="No tasks yet"
        message="Create your first task to start organizing work for this project."
        action={
          onNewTask
            ? {
                label: 'Create Task',
                onClick: onNewTask,
              }
            : undefined
        }
      />
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '16px',
      }}
    >
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
