import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import DashboardPage from '@/app/(dashboard)/dashboard/page';
import ProjectPage from '@/app/(dashboard)/projects/[id]/page';
import { AuthForm } from '@/components/auth/AuthForm';
import { TaskForm } from '@/components/tasks/TaskForm';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { FilterBar } from '@/components/tasks/FilterBar';
import { MemberManager } from '@/components/projects/MemberManager';
import { AppError } from '@/lib/errors';
import * as statsLib from '@/lib/stats';
import * as projectServices from '@/services/projects';
import * as taskServices from '@/services/tasks';
import { DEFAULT_FILTERS } from '@/lib/taskFilters';
import { Project } from '@/types';

// Mock useAuth
const mockUser = {
  uid: 'user-1',
  email: 'user1@example.test',
  displayName: 'User One',
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}));

// Mock useParams for ProjectPage
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'proj-1' }),
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock firebase
vi.mock('@/lib/firebase', () => ({
  getDb: () => ({}),
  getFirebaseAuth: () => ({}),
}));

describe('UI States, Accessibility, and Error Resilience (Task 12, TC-15, TC-16)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dashboard Loading, Empty, and Error States (FR-15, FR-16)', () => {
    it('shows ErrorState with Retry button when dashboard loading fails (network error), and retries on click', async () => {
      let callCount = 0;
      vi.spyOn(statsLib, 'loadDashboardData').mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new AppError('network', 'Network connection unavailable');
        }
        return {
          projects: [],
          tasks: [],
        };
      });

      render(<DashboardPage />);

      // Error state should display
      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/Network connection unavailable/i);

      // Retry button
      const retryBtn = screen.getByRole('button', { name: /retry/i });
      expect(retryBtn).toBeInTheDocument();

      fireEvent.click(retryBtn);

      // On retry, it recovers and displays EmptyState for no projects
      await waitFor(() => {
        expect(screen.getByText(/No projects yet/i)).toBeInTheDocument();
      });
      expect(callCount).toBe(2);
    });

    it('shows EmptyState when dashboard data has 0 projects', async () => {
      vi.spyOn(statsLib, 'loadDashboardData').mockResolvedValueOnce({
        projects: [],
        tasks: [],
      });

      render(<DashboardPage />);

      expect(await screen.findByText(/No projects yet/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /create project/i })).toHaveAttribute(
        'href',
        '/projects/new'
      );
    });
  });

  describe('Project Details Page Loading, Error, and Retry States (FR-15, FR-16)', () => {
    it('shows ErrorState with Retry button when getProject fails with network error, and retries on click', async () => {
      let callCount = 0;
      const mockProject: Project = {
        id: 'proj-1',
        name: 'Alpha Project',
        description: 'Test description',
        ownerId: 'user-1',
        memberIds: ['user-1'],
        memberNames: { 'user-1': 'User One' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(projectServices, 'getProject').mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new AppError('network', 'Connection lost');
        }
        return mockProject;
      });
      vi.spyOn(taskServices, 'listTasks').mockResolvedValue([]);

      render(<ProjectPage />);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/Connection lost/i);

      const retryBtn = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.getByText('Alpha Project')).toBeInTheDocument();
      });
      expect(callCount).toBe(2);
    });
  });

  describe('Action Error Resilience (TC-16)', () => {
    const mockProject: Project = {
      id: 'proj-1',
      name: 'Alpha Project',
      description: 'Test description',
      ownerId: 'user-1',
      memberIds: ['user-1'],
      memberNames: { 'user-1': 'User One' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('TaskForm displays role="alert" with network error on submission failure, and fields are preserved', async () => {
      const handleSave = vi.fn().mockRejectedValueOnce(
        new AppError('network', 'Cannot connect to server')
      );

      render(
        <TaskForm
          project={mockProject}
          currentUserId="user-1"
          isOwner={true}
          onSave={handleSave}
          onCancel={vi.fn()}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'New offline task' } });

      const submitBtn = screen.getByRole('button', { name: /create task/i });
      fireEvent.click(submitBtn);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/Cannot connect to server/i);

      // Title input is preserved and still has value
      expect(titleInput).toHaveValue('New offline task');
    });

    it('ProjectForm displays role="alert" on network failure and preserves entered values', async () => {
      const handleSubmit = vi.fn().mockRejectedValueOnce(
        new AppError('network', 'Failed to create project offline')
      );

      render(
        <ProjectForm
          onSubmit={handleSubmit}
        />
      );

      const nameInput = screen.getByLabelText(/project name/i);
      fireEvent.change(nameInput, { target: { value: 'Offline Project Name' } });

      const submitBtn = screen.getByRole('button', { name: /save project/i });
      fireEvent.click(submitBtn);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/Failed to create project offline/i);
      expect(nameInput).toHaveValue('Offline Project Name');
    });
  });

  describe('Accessibility Form Controls Verification (NFR-03)', () => {
    const mockProject: Project = {
      id: 'proj-1',
      name: 'Alpha Project',
      description: 'Test description',
      ownerId: 'user-1',
      memberIds: ['user-1'],
      memberNames: { 'user-1': 'User One' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('AuthForm inputs have associated accessible labels', () => {
      render(<AuthForm mode="register" onSubmit={vi.fn()} />);
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('TaskForm inputs have associated accessible labels', () => {
      render(
        <TaskForm
          project={mockProject}
          currentUserId="user-1"
          isOwner={true}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/assignee/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    });

    it('ProjectForm inputs have associated accessible labels', () => {
      render(<ProjectForm onSubmit={vi.fn()} />);
      expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('FilterBar controls have associated accessible labels', () => {
      render(
        <FilterBar
          filters={DEFAULT_FILTERS}
          onChange={vi.fn()}
          members={{ 'user-1': 'User One' }}
        />
      );
      expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/assignee/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/overdue only/i)).toBeInTheDocument();
    });

    it('MemberManager input has associated accessible label', () => {
      render(
        <MemberManager
          project={mockProject}
          onAddMember={vi.fn()}
          onRemoveMember={vi.fn()}
          getAssignedTaskCount={vi.fn().mockResolvedValue(0)}
        />
      );
      expect(screen.getByLabelText(/member email/i)).toBeInTheDocument();
    });
  });
});
