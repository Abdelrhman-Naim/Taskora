import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../helpers/render';
import { TaskCalendar } from '@/components/tasks/TaskCalendar';
import { Task } from '@/types';
import { todayString } from '@/lib/dates';

describe('TaskCalendar Component (Task 60)', () => {
  const today = todayString();
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      projectId: 'proj-1',
      title: 'Task for Today',
      description: '',
      status: 'todo',
      priority: 'high',
      assigneeId: null,
      createdBy: 'u-1',
      dueDate: today,
      checklist: [],
      labels: [],
      recurrence: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'task-overdue',
      projectId: 'proj-1',
      title: 'Overdue Task',
      description: '',
      status: 'todo',
      priority: 'high',
      assigneeId: null,
      createdBy: 'u-1',
      dueDate: '2026-01-01', // definitely overdue
      checklist: [],
      labels: [],
      recurrence: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'task-nodate',
      projectId: 'proj-1',
      title: 'Undated Task',
      description: '',
      status: 'in_progress',
      priority: 'medium',
      assigneeId: null,
      createdBy: 'u-1',
      dueDate: null,
      checklist: [],
      labels: [],
      recurrence: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('renders calendar container, navigation controls, and today cell with aria-current="date"', () => {
    renderWithProviders(
      <TaskCalendar
        tasks={mockTasks}
        locale="en"
        onOpen={vi.fn()}
      />
    );

    expect(screen.getByTestId('task-calendar-view')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-header')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-prev-btn')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-next-btn')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-today-btn')).toBeInTheDocument();

    const todayCell = screen.getByTestId(`calendar-day-${today}`);
    expect(todayCell).toBeInTheDocument();
    expect(todayCell).toHaveAttribute('aria-current', 'date');
  });

  it('renders weekday headers starting with Sunday in en and Saturday in ar', () => {
    const { unmount } = renderWithProviders(
      <TaskCalendar
        tasks={mockTasks}
        locale="en"
        onOpen={vi.fn()}
      />
    );

    const weekdaysEn = screen.getByTestId('calendar-weekdays');
    // First weekday in en should be Sunday / Sun
    expect(weekdaysEn.children[0]).toHaveTextContent(/sun/i);
    unmount();

    renderWithProviders(
      <TaskCalendar
        tasks={mockTasks}
        locale="ar"
        onOpen={vi.fn()}
      />
    );

    const weekdaysAr = screen.getByTestId('calendar-weekdays');
    // First weekday in ar should be Saturday / السبت
    expect(weekdaysAr.children[0]).toHaveTextContent(/سبت/i);
  });

  it('renders up to 3 task pills per day and displays +N more when day has > 3 tasks', () => {
    const manyTasks: Task[] = Array.from({ length: 5 }, (_, i) => ({
      id: `task-multi-${i}`,
      projectId: 'proj-1',
      title: `Multi Task ${i + 1}`,
      description: '',
      status: 'todo',
      priority: 'medium',
      assigneeId: null,
      createdBy: 'u-1',
      dueDate: today,
      checklist: [],
      labels: [],
      recurrence: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    renderWithProviders(
      <TaskCalendar
        tasks={manyTasks}
        locale="en"
        onOpen={vi.fn()}
      />
    );

    // Exactly 3 pills rendered
    expect(screen.getByTestId('calendar-task-pill-task-multi-0')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-task-pill-task-multi-1')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-task-pill-task-multi-2')).toBeInTheDocument();
    expect(screen.queryByTestId('calendar-task-pill-task-multi-3')).not.toBeInTheDocument();

    // +2 more pill displayed
    const morePill = screen.getByTestId(`calendar-more-pill-${today}`);
    expect(morePill).toBeInTheDocument();
    expect(morePill).toHaveTextContent(/2/);
  });

  it('clicking a task pill calls onOpen with the task', () => {
    const handleOpen = vi.fn();
    renderWithProviders(
      <TaskCalendar
        tasks={mockTasks}
        locale="en"
        onOpen={handleOpen}
      />
    );

    const pill = screen.getByTestId('calendar-task-pill-task-1');
    fireEvent.click(pill);
    expect(handleOpen).toHaveBeenCalledTimes(1);
    expect(handleOpen).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('renders undated tasks count strip when there are tasks without due date', () => {
    renderWithProviders(
      <TaskCalendar
        tasks={mockTasks}
        locale="en"
        onOpen={vi.fn()}
      />
    );

    const undatedStrip = screen.getByTestId('calendar-undated-tasks');
    expect(undatedStrip).toBeInTheDocument();
    expect(undatedStrip).toHaveTextContent(/1/);
  });

  it('navigates months using prev, next, and today buttons', () => {
    renderWithProviders(
      <TaskCalendar
        tasks={mockTasks}
        locale="en"
        onOpen={vi.fn()}
      />
    );

    const header = screen.getByTestId('calendar-header');
    const initialText = header.textContent;

    fireEvent.click(screen.getByTestId('calendar-next-btn'));
    expect(header.textContent).not.toBe(initialText);

    fireEvent.click(screen.getByTestId('calendar-today-btn'));
    expect(header.textContent).toBe(initialText);
  });
});
