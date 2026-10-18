import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../helpers/render';
import { TaskList } from '@/components/tasks/TaskList';
import { Task, Project } from '@/types';

describe('TaskList Component', () => {
  const project: Project = {
    id: 'proj-1',
    name: 'Sample Project',
    description: '',
    ownerId: 'user-owner',
    memberIds: ['user-owner', 'user-1'],
    memberNames: {
      'user-owner': 'Alice Owner',
      'user-1': 'Bob Member',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleTasks: Task[] = [
    {
      id: 'task-1',
      projectId: 'proj-1',
      title: 'First Task',
      description: 'First Desc',
      status: 'todo',
      priority: 'high',
      assigneeId: 'user-1',
      createdBy: 'user-owner',
      dueDate: '2026-10-30',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'task-2',
      projectId: 'proj-1',
      title: 'Second Task',
      description: 'Second Desc',
      status: 'done',
      priority: 'low',
      assigneeId: null,
      createdBy: 'user-owner',
      dueDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('renders EmptyState when tasks array is empty and fires onNewTask', () => {
    const handleNewTask = vi.fn();
    renderWithProviders(
      <TaskList
        tasks={[]}
        project={project}
        currentUserId="user-owner"
        isOwner={true}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
        onNewTask={handleNewTask}
      />
    );

    const newBtn = screen.getByRole('button', { name: /new task/i });
    expect(newBtn).toBeInTheDocument();
    fireEvent.click(newBtn);
    expect(handleNewTask).toHaveBeenCalledTimes(1);
  });

  it('renders tasks in a list structure with column alignment', () => {
    const { container } = renderWithProviders(
      <TaskList
        tasks={sampleTasks}
        project={project}
        currentUserId="user-owner"
        isOwner={true}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
      />
    );

    expect(screen.getByText('First Task')).toBeInTheDocument();
    expect(screen.getByText('Second Task')).toBeInTheDocument();
    const list = container.querySelector('[role="list"]');
    expect(list).toBeInTheDocument();
  });
});
