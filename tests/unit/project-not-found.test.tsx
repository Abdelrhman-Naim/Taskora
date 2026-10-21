import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../helpers/render';
import ProjectPage from '@/app/(dashboard)/projects/[id]/page';
import * as projectService from '@/services/projects';
import * as taskService from '@/services/tasks';
import { AppError } from '@/lib/errors';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'deleted-project-123' }),
  usePathname: () => '/projects/deleted-project-123',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('@/lib/firebase', () => ({
  getDb: vi.fn(() => ({})),
}));

vi.mock('@/services/projects', () => ({
  getProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProjectCascade: vi.fn(),
}));

vi.mock('@/services/tasks', () => ({
  listTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  changeTaskStatus: vi.fn(),
  deleteTask: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      uid: 'user-123',
      displayName: 'Test User',
      email: 'user@example.com',
    },
    loading: false,
  }),
}));

describe('Project Page - Review Focus 5 (Deleted / Not Found Project)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigating to a deleted project via notification link shows "not found" ErrorState without crashing', async () => {
    vi.mocked(projectService.getProject).mockRejectedValue(
      new AppError('not-found', 'Project not found')
    );
    vi.mocked(taskService.listTasks).mockResolvedValue([]);

    renderWithProviders(<ProjectPage />);

    // Expect loading spinner initially or wait for not-found error state
    await waitFor(() => {
      expect(screen.getByTestId('project-not-found')).toBeInTheDocument();
    });

    // Verify it displays localized "not found" message
    expect(screen.getByText('Project not found')).toBeInTheDocument();
  });
});
