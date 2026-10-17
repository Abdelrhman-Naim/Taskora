import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import React from 'react';
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

  it('renders summary cards with total tasks and count by status', () => {
    render(
      <DashboardStats
        stats={sampleStats}
        projects={mockProjects}
        hasProjects={true}
      />
    );

    // Total tasks
    const totalCard = screen.getByText('Total Tasks').closest('div')!;
    expect(within(totalCard).getByText('4')).toBeInTheDocument();

    // By status counts
    const todoCard = screen.getByText(/To Do/i).closest('div')!;
    expect(within(todoCard).getByText('2')).toBeInTheDocument();

    const inProgressCard = screen.getByText(/In Progress/i).closest('div')!;
    expect(within(inProgressCard).getByText('1')).toBeInTheDocument();

    const doneCard = screen.getByText(/Done/i).closest('div')!;
    expect(within(doneCard).getByText('1')).toBeInTheDocument();
  });

  it('renders overdue tasks list with project link', () => {
    render(
      <DashboardStats
        stats={sampleStats}
        projects={mockProjects}
        hasProjects={true}
      />
    );

    expect(screen.getByText(/Overdue Tasks/i)).toBeInTheDocument();
    expect(screen.getByText('Fix overdue bug')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /view project/i });
    expect(link).toHaveAttribute('href', '/projects/proj-1');
  });

  it('displays empty overdue message when there are no overdue tasks', () => {
    const noOverdueStats: DashboardStatsData = {
      ...sampleStats,
      overdue: [],
    };

    render(
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

    render(
      <DashboardStats
        stats={emptyStats}
        projects={[]}
        hasProjects={false}
      />
    );

    expect(screen.getByText(/No projects yet/i)).toBeInTheDocument();
    const createBtn = screen.getByRole('link', { name: /create project/i });
    expect(createBtn).toHaveAttribute('href', '/projects/new');
  });
});
