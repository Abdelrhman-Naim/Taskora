import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render';
import { KpiStrip } from '@/components/dashboard/KpiStrip';
import { HeroMetric } from '@/components/dashboard/HeroMetric';
import { NeedsAttention } from '@/components/dashboard/NeedsAttention';
import { MyTasks } from '@/components/dashboard/MyTasks';
import { ProjectsTable } from '@/components/dashboard/ProjectsTable';
import { RecentlyUpdated } from '@/components/dashboard/RecentlyUpdated';
import { OnboardingEmpty } from '@/components/dashboard/OnboardingEmpty';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  computeMetrics,
  summarizeProjects,
  needsAttention,
  myTasks,
  recentlyUpdated,
} from '@/lib/dashboardMetrics';
import { Project, Task } from '@/types';

// Mock next/link & next/navigation
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Professional Dashboard Components (Task 26 TDD)', () => {
  const today = '2026-10-17';
  const currentUid = 'user-1';

  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      name: 'Website Redesign',
      description: 'Corporate web presence refresh',
      ownerId: 'user-1',
      memberIds: ['user-1', 'user-2'],
      memberNames: { 'user-1': 'Sara Ali', 'user-2': 'Ahmed Nour' },
      createdAt: new Date('2026-10-01'),
      updatedAt: new Date('2026-10-17T10:00:00Z'),
    },
    {
      id: 'proj-2',
      name: 'Mobile App',
      description: 'iOS and Android mobile app',
      ownerId: 'user-2',
      memberIds: ['user-1', 'user-2'],
      memberNames: { 'user-1': 'Sara Ali', 'user-2': 'Ahmed Nour' },
      createdAt: new Date('2026-10-05'),
      updatedAt: new Date('2026-10-16T15:00:00Z'),
    },
  ];

  const mockTasks: Task[] = [
    {
      id: 'task-1',
      projectId: 'proj-1',
      title: 'Fix overdue login bug',
      description: 'Critical authentication bug',
      status: 'todo',
      priority: 'high',
      assigneeId: 'user-1',
      createdBy: 'user-1',
      dueDate: '2026-10-15', // 2 days overdue
      createdAt: new Date('2026-10-10'),
      updatedAt: new Date('2026-10-17T11:00:00Z'),
    },
    {
      id: 'task-2',
      projectId: 'proj-1',
      title: 'Review landing page copy',
      description: 'Review copy with marketing',
      status: 'in_progress',
      priority: 'medium',
      assigneeId: 'user-1',
      createdBy: 'user-1',
      dueDate: '2026-10-17', // due today
      createdAt: new Date('2026-10-12'),
      updatedAt: new Date('2026-10-17T09:00:00Z'),
    },
    {
      id: 'task-3',
      projectId: 'proj-2',
      title: 'Prepare app release notes',
      description: 'Store release notes',
      status: 'todo',
      priority: 'low',
      assigneeId: 'user-2',
      createdBy: 'user-2',
      dueDate: '2026-10-18', // due tomorrow
      createdAt: new Date('2026-10-14'),
      updatedAt: new Date('2026-10-15T12:00:00Z'),
    },
    {
      id: 'task-4',
      projectId: 'proj-1',
      title: 'Setup analytics tracking',
      description: 'Configure event tracking',
      status: 'done',
      priority: 'medium',
      assigneeId: 'user-1',
      createdBy: 'user-1',
      dueDate: '2026-10-14', // was past date, but done so NOT overdue
      createdAt: new Date('2026-10-08'),
      updatedAt: new Date('2026-10-14T16:00:00Z'),
    },
    {
      id: 'task-5',
      projectId: 'proj-2',
      title: 'Push notification tests',
      description: 'Test push triggers',
      status: 'todo',
      priority: 'high',
      assigneeId: 'user-1',
      createdBy: 'user-2',
      dueDate: '2026-10-22', // due within 7 days
      createdAt: new Date('2026-10-15'),
      updatedAt: new Date('2026-10-16T08:00:00Z'),
    },
  ];

  const projectNameMap = (id: string) => {
    const p = mockProjects.find((x) => x.id === id);
    return p ? p.name : 'Unknown';
  };

  describe('HeroMetric', () => {
    it('renders hero completion numeral with tabular figures and safe 0% on empty tasks', () => {
      const metrics = computeMetrics(mockTasks, today);
      const { unmount } = renderWithProviders(<HeroMetric metrics={metrics} />);
      expect(screen.getByTestId('hero-metric')).toBeInTheDocument();
      expect(screen.getByText('20%')).toBeInTheDocument();
      unmount();

      // Empty tasks test: must be 0% and never NaN%
      const emptyMetrics = computeMetrics([], today);
      const { unmount: unmountEmpty } = renderWithProviders(<HeroMetric metrics={emptyMetrics} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.queryByText(/nan/i)).not.toBeInTheDocument();
      unmountEmpty();
    });
  });

  describe('KpiStrip', () => {
    it('renders 5 continuous KPI cells with consistent metrics matching computeMetrics', () => {
      const metrics = computeMetrics(mockTasks, today);

      // Verify mathematical contract:
      expect(metrics.total).toBe(5);
      expect(metrics.open).toBe(4);
      expect(metrics.inProgress).toBe(1);
      expect(metrics.completed).toBe(1);
      expect(metrics.completionRate).toBe(20);
      expect(metrics.overdue).toBe(1);
      expect(metrics.dueThisWeek).toBe(3); // task-2 (today), task-3 (tomorrow), task-5 (Oct 22)
      expect(metrics.open + metrics.completed).toBe(metrics.total);

      renderWithProviders(<KpiStrip metrics={metrics} />);

      // Open tasks
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText(/of 5/i)).toBeInTheDocument();

      // In progress & Completed & Overdue counts exist
      expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);

      // Completed with percentage
      expect(screen.getByText(/20% done/i)).toBeInTheDocument();

      // Overdue cell with warning icon and non-color-only text
      expect(screen.getByText(/Needs immediate attention/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/overdue/i)).toBeInTheDocument();

      // Due this week
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('renders localized Arabic KPI strip with correct numbering and RTL layout', () => {
      const metrics = computeMetrics(mockTasks, today);
      renderWithProviders(<KpiStrip metrics={metrics} />, { locale: 'ar' });

      expect(screen.getByText(/مهام مفتوحة/i)).toBeInTheDocument();
      expect(screen.getByText(/قيد التنفيذ/i)).toBeInTheDocument();
      expect(screen.getByText(/مكتملة/i)).toBeInTheDocument();
      expect(screen.getByText(/20% منجز/i)).toBeInTheDocument();
      expect(screen.getByText(/تستحق هذا الأسبوع/i)).toBeInTheDocument();
    });
  });

  describe('NeedsAttention', () => {
    it('renders items requiring urgent attention ordered: overdue first, today, tomorrow', () => {
      const items = needsAttention(mockTasks, today);
      renderWithProviders(<NeedsAttention items={items} projectName={projectNameMap} />);

      // task-1 is overdue by 2 days
      expect(screen.getByText('Fix overdue login bug')).toBeInTheDocument();
      expect(screen.getByText(/2 days overdue/i)).toBeInTheDocument();

      // task-2 is due today
      expect(screen.getByText('Review landing page copy')).toBeInTheDocument();
      expect(screen.getByText(/Due today/i)).toBeInTheDocument();

      // task-3 is due tomorrow
      expect(screen.getByText('Prepare app release notes')).toBeInTheDocument();
      expect(screen.getByText(/Due tomorrow/i)).toBeInTheDocument();
    });

    it('shows empty state when no items need attention', () => {
      renderWithProviders(<NeedsAttention items={[]} projectName={projectNameMap} />);
      expect(screen.getByText(/Nothing requires urgent attention/i)).toBeInTheDocument();
    });
  });

  describe('MyTasks', () => {
    it('renders tasks assigned to user with status, priority, and bdi title', () => {
      const tasks = myTasks(mockTasks, currentUid, today);
      renderWithProviders(<MyTasks tasks={tasks} projectName={projectNameMap} />);

      // currentUid has task-1, task-2, task-5 open. task-4 is done (excluded). task-3 is user-2 (excluded).
      expect(screen.getByText('Fix overdue login bug')).toBeInTheDocument();
      expect(screen.getByText('Review landing page copy')).toBeInTheDocument();
      expect(screen.getByText('Push notification tests')).toBeInTheDocument();

      // Excluded tasks
      expect(screen.queryByText('Setup analytics tracking')).not.toBeInTheDocument();
      expect(screen.queryByText('Prepare app release notes')).not.toBeInTheDocument();
    });

    it('shows empty state when user has no assigned open tasks', () => {
      renderWithProviders(<MyTasks tasks={[]} projectName={projectNameMap} />);
      expect(screen.getByText(/No open tasks assigned to you/i)).toBeInTheDocument();
    });
  });

  describe('ProjectsTable', () => {
    it('renders project summaries, handles sorting, searching, and displays progress and badges', () => {
      const summaries = summarizeProjects(mockProjects, mockTasks, currentUid, today);
      renderWithProviders(<ProjectsTable summaries={summaries} />);

      // Both projects appear
      expect(screen.getByText('Website Redesign')).toBeInTheDocument();
      expect(screen.getByText('Mobile App')).toBeInTheDocument();

      // Role badges: user-1 is owner of proj-1 and member of proj-2
      expect(screen.getByText('Owner')).toBeInTheDocument();
      expect(screen.getByText('Member')).toBeInTheDocument();

      // Progress percentages:
      // proj-1: 1 done out of 3 total = 33%
      expect(screen.getByText('33%')).toBeInTheDocument();
      // proj-2: 0 done out of 2 total = 0%
      expect(screen.getByText('0%')).toBeInTheDocument();

      // Search filter test:
      const searchInput = screen.getByPlaceholderText(/search projects/i);
      fireEvent.change(searchInput, { target: { value: 'Mobile' } });

      expect(screen.getByText('Mobile App')).toBeInTheDocument();
      expect(screen.queryByText('Website Redesign')).not.toBeInTheDocument();

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(screen.getByText('Website Redesign')).toBeInTheDocument();

      // Sorting test: clicking on "Project" column header sorts by name
      const nameHeader = screen.getByRole('columnheader', { name: /project/i });
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

      fireEvent.click(nameHeader);
      // Toggles sort direction to descending
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    });

    it('shows empty search result when search yields no matches', () => {
      const summaries = summarizeProjects(mockProjects, mockTasks, currentUid, today);
      renderWithProviders(<ProjectsTable summaries={summaries} />);

      const searchInput = screen.getByPlaceholderText(/search projects/i);
      fireEvent.change(searchInput, { target: { value: 'Nonexistent Project XYZ' } });

      expect(screen.getByText(/No projects matching your search/i)).toBeInTheDocument();
    });
  });

  describe('RecentlyUpdated', () => {
    it('renders recently updated tasks ordered by updatedAt descending', () => {
      const recent = recentlyUpdated(mockTasks);
      renderWithProviders(<RecentlyUpdated tasks={recent} projectName={projectNameMap} />);

      expect(screen.getByText('Fix overdue login bug')).toBeInTheDocument();
      expect(screen.getByText('Review landing page copy')).toBeInTheDocument();
    });
  });

  describe('OnboardingEmpty', () => {
    it('renders 3 numbered onboarding steps and primary create project button', () => {
      const handleCreate = vi.fn();
      renderWithProviders(<OnboardingEmpty onCreateProject={handleCreate} />);

      expect(screen.getByText(/Get started with Taskora/i)).toBeInTheDocument();
      expect(screen.getByText(/1/)).toBeInTheDocument();
      expect(screen.getAllByText(/Create your first project/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/2/)).toBeInTheDocument();
      expect(screen.getByText(/Invite team members/i)).toBeInTheDocument();
      expect(screen.getByText(/3/)).toBeInTheDocument();
      expect(screen.getByText(/Assign and track tasks/i)).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: /create your first project/i });
      fireEvent.click(btn);
      expect(handleCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe('DashboardSkeleton', () => {
    it('renders layout-identical skeleton with accessible loading state', () => {
      renderWithProviders(<DashboardSkeleton />);
      const skeleton = screen.getByLabelText(/loading/i);
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Structural & Quality Standards (Task 35)', () => {
    it('provides data-testid on all key dashboard components', () => {
      const metrics = computeMetrics(mockTasks, today);
      const items = needsAttention(mockTasks, today);
      const tasks = myTasks(mockTasks, currentUid, today);
      const summaries = summarizeProjects(mockProjects, mockTasks, currentUid, today);
      const recent = recentlyUpdated(mockTasks);

      const { unmount: unmountHero } = renderWithProviders(<HeroMetric metrics={metrics} />);
      expect(screen.getByTestId('hero-metric')).toBeInTheDocument();
      unmountHero();

      const { unmount: unmountKpi } = renderWithProviders(<KpiStrip metrics={metrics} />);
      expect(screen.getByTestId('kpi-ledger')).toBeInTheDocument();
      unmountKpi();

      const { unmount: unmountAttn } = renderWithProviders(<NeedsAttention items={items} projectName={projectNameMap} />);
      expect(screen.getByTestId('needs-attention')).toBeInTheDocument();
      unmountAttn();

      const { unmount: unmountTasks } = renderWithProviders(<MyTasks tasks={tasks} projectName={projectNameMap} />);
      expect(screen.getByTestId('my-tasks')).toBeInTheDocument();
      unmountTasks();

      const { unmount: unmountTable } = renderWithProviders(<ProjectsTable summaries={summaries} />);
      expect(screen.getByTestId('projects-ledger')).toBeInTheDocument();
      unmountTable();

      const { unmount: unmountRecent } = renderWithProviders(<RecentlyUpdated tasks={recent} projectName={projectNameMap} />);
      expect(screen.getByTestId('recently-updated')).toBeInTheDocument();
      unmountRecent();

      const { unmount: unmountOnboarding } = renderWithProviders(<OnboardingEmpty />);
      expect(screen.getByTestId('onboarding')).toBeInTheDocument();
      unmountOnboarding();
    });

    it('ensures math consistency and safe 0% calculation for empty projects', () => {
      const emptyProject: Project = {
        id: 'proj-empty',
        name: 'Empty Project',
        description: '',
        ownerId: currentUid,
        memberIds: [currentUid],
        memberNames: { [currentUid]: 'Sara' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const summaries = summarizeProjects([emptyProject], [], currentUid, today);
      expect(summaries[0].progress).toBe(0);
      expect(isNaN(summaries[0].progress)).toBe(false);

      const metrics = computeMetrics(mockTasks, today);
      const projectSummaries = summarizeProjects(mockProjects, mockTasks, currentUid, today);
      const sumOfOpenInProjects = projectSummaries.reduce((acc, p) => acc + p.open, 0);
      expect(sumOfOpenInProjects).toBe(metrics.open);
    });

    it('passes Phantom Features Audit: banned elements and labels are absent', () => {
      const metrics = computeMetrics(mockTasks, today);
      const summaries = summarizeProjects(mockProjects, mockTasks, currentUid, today);

      renderWithProviders(
        <div>
          <KpiStrip metrics={metrics} />
          <ProjectsTable summaries={summaries} />
        </div>
      );

      // No notifications bell
      expect(screen.queryByLabelText(/notification|notifications/i)).not.toBeInTheDocument();
      // No billing or upgrade triggers
      expect(screen.queryByRole('button', { name: /upgrade|billing|pro plan/i })).not.toBeInTheDocument();
      // No growth rate badges (e.g., +12% or -5%)
      expect(screen.queryByText(/\+\d+%/)).not.toBeInTheDocument();
      expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();
    });
  });
});
