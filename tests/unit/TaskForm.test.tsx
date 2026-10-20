import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../helpers/render';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Project, Task } from '@/types';
import { AppError } from '@/lib/errors';

describe('TaskForm Component', () => {
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

  it('renders fields and displays validation error for invalid title', async () => {
    const handleSave = vi.fn();
    renderWithProviders(
      <TaskForm
        project={project}
        currentUserId="user-owner"
        isOwner={true}
        onSave={handleSave}
        onCancel={() => {}}
      />
    );

    expect(screen.getByTestId('task-form-modal')).toBeInTheDocument();
    expect(screen.getByTestId('task-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('task-description-input')).toBeInTheDocument();
    expect(screen.getByTestId('task-priority-select')).toBeInTheDocument();
    expect(screen.getByTestId('task-due-date-input')).toBeInTheDocument();
    expect(screen.getByTestId('task-assignee-select')).toBeInTheDocument();
    expect(screen.getByTestId('save-task-btn')).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'ab' } }); // Short title (< 3)

    const submitBtn = screen.getByRole('button', { name: /new task|create task|save/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Task title must be between 3 and 120 characters/i)).toBeInTheDocument();
    });

    expect(handleSave).not.toHaveBeenCalled();
  });

  it('disables submit button while saving', async () => {
    let resolveSave: () => void = () => {};
    const handleSave = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        })
    );

    renderWithProviders(
      <TaskForm
        project={project}
        currentUserId="user-owner"
        isOwner={true}
        onSave={handleSave}
        onCancel={() => {}}
      />
    );

    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Valid Task' } });

    const submitBtn = screen.getByRole('button', { name: /new task|create task|save/i });
    fireEvent.click(submitBtn);

    expect(submitBtn).toBeDisabled();

    resolveSave();
  });

  it('stays open with user values and shows error message on network failure (Review Focus #2)', async () => {
    const handleSave = vi.fn().mockRejectedValue(new AppError('network', 'Network timeout while saving'));
    const handleCancel = vi.fn();

    renderWithProviders(
      <TaskForm
        project={project}
        currentUserId="user-owner"
        isOwner={true}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );

    const titleInput = screen.getByLabelText(/Title/i);
    const descInput = screen.getByLabelText(/Description/i);

    fireEvent.change(titleInput, { target: { value: 'My Important Task' } });
    fireEvent.change(descInput, { target: { value: 'Important notes' } });

    const submitBtn = screen.getByRole('button', { name: /new task|create task|save/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Form remains open with its values
    expect(titleInput).toHaveValue('My Important Task');
    expect(descInput).toHaveValue('Important notes');
    expect(handleCancel).not.toHaveBeenCalled();
  });

  it('disables assignee selector when user cannot reassign, and status selector when user cannot change status', () => {
    const existingTask: Task = {
      id: 'task-1',
      projectId: 'proj-1',
      title: 'Fix Engine',
      description: '',
      status: 'todo',
      priority: 'medium',
      assigneeId: 'user-assignee',
      createdBy: 'user-creator',
      dueDate: null,
      checklist: [],
      labels: [],
      recurrence: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // User is assignee (can change status, but CANNOT reassign)
    const { rerender } = renderWithProviders(
      <TaskForm
        project={project}
        initialTask={existingTask}
        currentUserId="user-assignee"
        isOwner={false}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const assigneeSelect = screen.getByLabelText(/Assignee/i);
    const statusSelect = screen.getByLabelText(/Status/i);

    expect(assigneeSelect).toBeDisabled();
    expect(statusSelect).not.toBeDisabled();

    // User is creator (can reassign, but CANNOT change status)
    rerender(
      <TaskForm
        project={project}
        initialTask={existingTask}
        currentUserId="user-creator"
        isOwner={false}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/Assignee/i)).not.toBeDisabled();
    expect(screen.getByLabelText(/Status/i)).toBeDisabled();
  });
});
