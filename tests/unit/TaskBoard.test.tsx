import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../helpers/render';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { Task, Project } from '@/types';

describe('TaskBoard Component (Task 59)', () => {
  const project: Project = {
    id: 'proj-1',
    name: 'Sample Project',
    description: '',
    ownerId: 'user-owner',
    memberIds: ['user-owner', 'user-assignee', 'user-other'],
    memberNames: {
      'user-owner': 'Alice Owner',
      'user-assignee': 'Bob Assignee',
      'user-other': 'Charlie Other',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const tasks: Task[] = [
    {
      id: 'task-1',
      projectId: 'proj-1',
      title: 'To Do Task',
      description: '',
      status: 'todo',
      priority: 'high',
      assigneeId: 'user-assignee',
      createdBy: 'user-owner',
      dueDate: '2026-10-30',
      checklist: [],
      labels: ['frontend'],
      recurrence: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'task-2',
      projectId: 'proj-1',
      title: 'In Progress Task',
      description: '',
      status: 'in_progress',
      priority: 'medium',
      assigneeId: 'user-assignee',
      createdBy: 'user-owner',
      dueDate: '2026-10-31',
      checklist: [],
      labels: [],
      recurrence: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'task-3',
      projectId: 'proj-1',
      title: 'Done Task',
      description: '',
      status: 'done',
      priority: 'low',
      assigneeId: 'user-owner',
      createdBy: 'user-owner',
      dueDate: null,
      checklist: [],
      labels: [],
      recurrence: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('renders three columns in order todo -> in_progress -> done with correct task counts', () => {
    renderWithProviders(
      <TaskBoard
        tasks={tasks}
        project={project}
        currentUserId="user-owner"
        isOwner={true}
        onStatusChange={vi.fn()}
        onOpen={vi.fn()}
      />
    );

    expect(screen.getByTestId('task-board-view')).toBeInTheDocument();
    expect(screen.getByTestId('board-column-todo')).toBeInTheDocument();
    expect(screen.getByTestId('board-column-in_progress')).toBeInTheDocument();
    expect(screen.getByTestId('board-column-done')).toBeInTheDocument();

    // Check headers and counts
    expect(screen.getByTestId('board-column-header-todo')).toHaveTextContent('1');
    expect(screen.getByTestId('board-column-header-in_progress')).toHaveTextContent('1');
    expect(screen.getByTestId('board-column-header-done')).toHaveTextContent('1');
  });

  it('dropping a card onto another column calls onStatusChange with new status', () => {
    const handleStatusChange = vi.fn();
    renderWithProviders(
      <TaskBoard
        tasks={tasks}
        project={project}
        currentUserId="user-owner"
        isOwner={true}
        onStatusChange={handleStatusChange}
        onOpen={vi.fn()}
      />
    );

    const card = screen.getByTestId('board-task-card-task-1');
    const doneDropzone = screen.getByTestId('board-column-dropzone-done');

    // Simulate drag start
    const dataTransfer = {
      data: {} as Record<string, string>,
      setData(key: string, val: string) {
        this.data[key] = val;
      },
      getData(key: string) {
        return this.data[key];
      },
    };

    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.dragOver(doneDropzone, { dataTransfer });
    fireEvent.drop(doneDropzone, { dataTransfer });

    expect(handleStatusChange).toHaveBeenCalledTimes(1);
    expect(handleStatusChange).toHaveBeenCalledWith(tasks[0], 'done');
  });

  it('dropping a card onto its current column does NOT trigger onStatusChange', () => {
    const handleStatusChange = vi.fn();
    renderWithProviders(
      <TaskBoard
        tasks={tasks}
        project={project}
        currentUserId="user-owner"
        isOwner={true}
        onStatusChange={handleStatusChange}
        onOpen={vi.fn()}
      />
    );

    const card = screen.getByTestId('board-task-card-task-1');
    const todoDropzone = screen.getByTestId('board-column-dropzone-todo');

    const dataTransfer = {
      data: {} as Record<string, string>,
      setData(key: string, val: string) {
        this.data[key] = val;
      },
      getData(key: string) {
        return this.data[key];
      },
    };

    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.dragOver(todoDropzone, { dataTransfer });
    fireEvent.drop(todoDropzone, { dataTransfer });

    expect(handleStatusChange).not.toHaveBeenCalled();
  });

  it('disables dragging and sets aria-disabled when user cannot change status', () => {
    renderWithProviders(
      <TaskBoard
        tasks={tasks}
        project={project}
        currentUserId="user-other" // Not owner, creator, or assignee of task-1
        isOwner={false}
        onStatusChange={vi.fn()}
        onOpen={vi.fn()}
      />
    );

    const card = screen.getByTestId('board-task-card-task-1');
    expect(card).toHaveAttribute('draggable', 'false');
    expect(card).toHaveAttribute('aria-disabled', 'true');
  });

  it('each card provides a StatusMenu for accessible keyboard status changes', () => {
    renderWithProviders(
      <TaskBoard
        tasks={tasks}
        project={project}
        currentUserId="user-owner"
        isOwner={true}
        onStatusChange={vi.fn()}
        onOpen={vi.fn()}
      />
    );

    expect(screen.getByTestId('board-card-status-task-1')).toBeInTheDocument();
    expect(screen.getByTestId('board-card-status-task-2')).toBeInTheDocument();
    expect(screen.getByTestId('board-card-status-task-3')).toBeInTheDocument();
  });

  it('clicking card or pressing Enter calls onOpen with the task', () => {
    const handleOpen = vi.fn();
    renderWithProviders(
      <TaskBoard
        tasks={tasks}
        project={project}
        currentUserId="user-owner"
        isOwner={true}
        onStatusChange={vi.fn()}
        onOpen={handleOpen}
      />
    );

    const card = screen.getByTestId('board-task-card-task-1');
    fireEvent.click(card);
    expect(handleOpen).toHaveBeenCalledTimes(1);
    expect(handleOpen).toHaveBeenCalledWith(tasks[0]);

    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
    expect(handleOpen).toHaveBeenCalledTimes(2);
  });

  it('renders empty column state when a column has zero tasks', () => {
    const onlyTodoTasks: Task[] = [tasks[0]];
    renderWithProviders(
      <TaskBoard
        tasks={onlyTodoTasks}
        project={project}
        currentUserId="user-owner"
        isOwner={true}
        onStatusChange={vi.fn()}
        onOpen={vi.fn()}
      />
    );

    expect(screen.getByTestId('board-column-empty-in_progress')).toBeInTheDocument();
    expect(screen.getByTestId('board-column-empty-done')).toBeInTheDocument();
  });
});
