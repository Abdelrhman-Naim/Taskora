import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../helpers/render';
import {
  TaskCard,
  canEditTask,
  canChangeStatus,
  canReassign,
  canDeleteTask,
} from '@/components/tasks/TaskCard';
import { Task, Project } from '@/types';

describe('TaskCard Permissions Helper (Table-driven)', () => {
  const baseTask: Task = {
    id: 'task-1',
    projectId: 'proj-1',
    title: 'Design Logo',
    description: 'Create vector logo',
    status: 'todo',
    priority: 'high',
    assigneeId: 'user-assignee',
    createdBy: 'user-creator',
    dueDate: '2026-10-30',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const matrix = [
    { role: 'Owner', uid: 'user-owner', isOwner: true, edit: true, status: true, reassign: true, del: true },
    { role: 'Creator (not assignee)', uid: 'user-creator', isOwner: false, edit: true, status: false, reassign: true, del: true },
    { role: 'Assignee (not creator)', uid: 'user-assignee', isOwner: false, edit: true, status: true, reassign: false, del: false },
    { role: 'Other Member', uid: 'user-other', isOwner: false, edit: false, status: false, reassign: false, del: false },
  ];

  for (const { role, uid, isOwner, edit, status, reassign, del } of matrix) {
    it(`enforces matrix permissions for ${role}`, () => {
      expect(canEditTask(baseTask, uid, isOwner)).toBe(edit);
      expect(canChangeStatus(baseTask, uid, isOwner)).toBe(status);
      expect(canReassign(baseTask, uid, isOwner)).toBe(reassign);
      expect(canDeleteTask(baseTask, uid, isOwner)).toBe(del);
    });
  }
});

describe('TaskCard Component', () => {
  const project: Project = {
    id: 'proj-1',
    name: 'Test Project',
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

  const overdueTask: Task = {
    id: 'task-overdue',
    projectId: 'proj-1',
    title: 'Critical Bugfix',
    description: 'Needs immediate fix',
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'user-assignee',
    createdBy: 'user-creator',
    dueDate: '2020-01-01',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('renders status text, priority badge text, and textual Overdue badge', () => {
    renderWithProviders(
      <TaskCard
        task={overdueTask}
        project={project}
        currentUserId="user-owner"
        isOwner={true}
        onEdit={() => {}}
        onDelete={() => {}}
        onStatusChange={() => {}}
      />
    );

    expect(screen.getByText('Critical Bugfix')).toBeInTheDocument();
    // High priority text
    expect(screen.getByText(/High/i)).toBeInTheDocument();
    // Textual Overdue badge
    expect(screen.getByText(/Overdue/i)).toBeInTheDocument();
    // Assignee name
    expect(screen.getByText(/Charlie Assignee/i)).toBeInTheDocument();
  });

  it('allows owner to trigger edit, delete, and status change', () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    const handleStatusChange = vi.fn();

    renderWithProviders(
      <TaskCard
        task={overdueTask}
        project={project}
        currentUserId="user-owner"
        isOwner={true}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />
    );

    const editBtn = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledWith(overdueTask);

    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith(overdueTask);

    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'done' } });
    expect(handleStatusChange).toHaveBeenCalledWith(overdueTask, 'done');
  });

  // Review Focus #1
  it('applies dir="auto" to English title in Arabic locale and Arabic title in English locale', () => {
    const enTask: Task = {
      ...overdueTask,
      id: 'task-en',
      title: 'Fix login bug',
    };

    const { unmount } = renderWithProviders(
      <TaskCard
        task={enTask}
        project={project}
        currentUserId="user-owner"
        isOwner={true}
        onEdit={() => {}}
        onDelete={() => {}}
        onStatusChange={() => {}}
      />,
      { locale: 'ar' }
    );

    const enTitleEl = screen.getByText('Fix login bug');
    expect(enTitleEl.getAttribute('dir')).toBe('auto');

    unmount();

    const arTask: Task = {
      ...overdueTask,
      id: 'task-ar',
      title: 'مراجعة الصفحة الرئيسية',
    };

    renderWithProviders(
      <TaskCard
        task={arTask}
        project={project}
        currentUserId="user-owner"
        isOwner={true}
        onEdit={() => {}}
        onDelete={() => {}}
        onStatusChange={() => {}}
      />,
      { locale: 'en' }
    );

    const arTitleEl = screen.getByText('مراجعة الصفحة الرئيسية');
    expect(arTitleEl.getAttribute('dir')).toBe('auto');
  });
});
