import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../helpers/render';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DashboardStatsData } from '@/lib/stats';
import { Project, Task } from '@/types';

describe('DashboardStats Component', () => {
  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      name: 'Website Redesign',
      description: 'Main redesign',
      ownerId: 'user-1',
      memberIds: ['user-1'],
      memberNames: { 'user-1': 'User One' },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const overdueTask: Task = {
    id: 'task-overdue',
    projectId: 'proj-1',
    title: 'Fix overdue bug',
    description: 'Critical bug',
    status: 'todo',
    priority: 'high',
    assigneeId: null,
    createdBy: 'user-1',
    dueDate: '2026-10-16',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleStats: DashboardStatsData = {
    totalTasks: 4,
    byStatus: {
      todo: 2,
      in_progress: 1,
      done: 1,
    },
    overdue: [overdueTask],
  };

  it('renders summary ledger with total tasks and count by status', () => {
    renderWithProviders(
      <DashboardStats
        stats={sampleStats}
        projects={mockProjects}
        hasProjects={true}
      />
    );

    // Total tasks in ledger
    const ledger = screen.getByTestId('dashboard-ledger');
    const totalItem = within(ledger).getByText('Total').closest('div')!;
    expect(within(totalItem).getByText('4')).toBeInTheDocument();

    // By status counts
    const todoItem = within(ledger).getByText('To do').closest('div')!;
    expect(within(todoItem).getByText('2')).toBeInTheDocument();

    const inProgressItem = within(ledger).getByText('In progress').closest('div')!;
    expect(within(inProgressItem).getByText('1')).toBeInTheDocument();

    const doneItem = within(ledger).getByText('Done').closest('div')!;
    expect(within(doneItem).getByText('1')).toBeInTheDocument();

    const overdueItem = within(ledger).getByText('Overdue').closest('div')!;
    expect(within(overdueItem).getByText('1')).toBeInTheDocument();
  });

  it('renders overdue tasks list with project link', () => {
    renderWithProviders(
      <DashboardStats
        stats={sampleStats}
        projects={mockProjects}
        hasProjects={true}
      />
    );

    expect(screen.getByText(/Overdue tasks/i)).toBeInTheDocument();
    expect(screen.getByText('Fix overdue bug')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /details/i });
    expect(link).toHaveAttribute('href', '/projects/proj-1');
  });

  it('displays empty overdue message when there are no overdue tasks', () => {
    const noOverdueStats: DashboardStatsData = {
      ...sampleStats,
      overdue: [],
    };

    renderWithProviders(
      <DashboardStats
        stats={noOverdueStats}
        projects={mockProjects}
        hasProjects={true}
      />
    );

    expect(screen.getByText(/No overdue tasks/i)).toBeInTheDocument();
  });

  it('displays empty state for user without any projects', () => {
    const emptyStats: DashboardStatsData = {
      totalTasks: 0,
      byStatus: { todo: 0, in_progress: 0, done: 0 },
      overdue: [],
    };

    renderWithProviders(
      <DashboardStats
        stats={emptyStats}
        projects={[]}
        hasProjects={false}
      />
    );

    expect(screen.getByText(/No projects yet/i)).toBeInTheDocument();
  });
});
