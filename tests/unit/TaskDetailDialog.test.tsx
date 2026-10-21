import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../helpers/render';
import { TaskDetailDialog } from '@/components/tasks/TaskDetailDialog';
import { Task, Project } from '@/types';

describe('TaskDetailDialog Component (Task 56)', () => {
  const project: Project = {
    id: 'proj-1',
    name: 'Sample Project',
    description: '',
    ownerId: 'user-owner',
    memberIds: ['user-owner', 'user-creator', 'user-assignee'],
    memberNames: {
      'user-owner': 'Alice Owner',
      'user-creator': 'Bob Creator',
      'user-assignee': 'Charlie Assignee',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleTask: Task = {
    id: 'task-100',
    projectId: 'proj-1',
    title: 'Detailed Task Title',
    description: 'Detailed description of the task',
    status: 'todo',
    priority: 'high',
    assigneeId: 'user-assignee',
    createdBy: 'user-creator',
    dueDate: '2026-10-30',
    checklist: [
      { id: 'c1', text: 'Item 1', done: false },
      { id: 'c2', text: 'Item 2', done: true },
    ],
    labels: ['design', 'v2'],
    recurrence: 'weekly',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('renders title, status, priority, due date, assignee, labels, and checklist', () => {
    renderWithProviders(
      <TaskDetailDialog
        task={sampleTask}
        project={project}
        currentUserId="user-owner"
        isOwner={true}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onTaskChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('task-detail-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('task-detail-title')).toHaveTextContent('Detailed Task Title');
    expect(screen.getByTestId('task-detail-priority')).toBeInTheDocument();
    expect(screen.getByTestId('task-detail-due-date')).toBeInTheDocument();
    expect(screen.getByTestId('task-detail-assignee')).toHaveTextContent('Charlie Assignee');
    expect(screen.getByText('design')).toBeInTheDocument();
    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getByTestId('task-checklist')).toBeInTheDocument();
  });

  it('closes on Escape key press or close button click', () => {
    const handleClose = vi.fn();
    renderWithProviders(
      <TaskDetailDialog
        task={sampleTask}
        project={project}
        currentUserId="user-owner"
        isOwner={true}
        onClose={handleClose}
        onEdit={vi.fn()}
        onTaskChange={vi.fn()}
      />
    );

    const closeBtn = screen.getByTestId('task-detail-close-btn');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('toggling a checklist item calls onTaskChange with updated checklist', () => {
    const handleTaskChange = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <TaskDetailDialog
        task={sampleTask}
        project={project}
        currentUserId="user-owner"
        isOwner={true}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onTaskChange={handleTaskChange}
      />
    );

    const item1 = screen.getByTestId('checklist-item-c1');
    const checkbox = item1.querySelector('input[type="checkbox"]')!;
    fireEvent.click(checkbox);

    expect(handleTaskChange).toHaveBeenCalledTimes(1);
    expect(handleTaskChange).toHaveBeenCalledWith({
      checklist: [
        { id: 'c1', text: 'Item 1', done: true },
        { id: 'c2', text: 'Item 2', done: true },
      ],
    });
  });

  it('shows Edit button only if user has permission (canEditTask)', () => {
    const handleEdit = vi.fn();
    const { rerender } = renderWithProviders(
      <TaskDetailDialog
        task={sampleTask}
        project={project}
        currentUserId="user-owner"
        isOwner={true}
        onClose={vi.fn()}
        onEdit={handleEdit}
        onTaskChange={vi.fn()}
      />
    );

    // Owner can edit
    const editBtn = screen.getByTestId('task-detail-edit-btn');
    expect(editBtn).toBeInTheDocument();

    // Outsider/other member without edit rights
    rerender(
      <TaskDetailDialog
        task={sampleTask}
        project={project}
        currentUserId="user-random-outsider"
        isOwner={false}
        onClose={vi.fn()}
        onEdit={handleEdit}
        onTaskChange={vi.fn()}
      />
    );

    expect(screen.queryByTestId('task-detail-edit-btn')).not.toBeInTheDocument();
  });
});
