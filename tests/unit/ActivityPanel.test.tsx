import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ActivityPanel } from '@/components/projects/ActivityPanel';
import { listActivity } from '@/services/activity';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ActivityEntry } from '@/types';
import { AppError } from '@/lib/errors';

vi.mock('@/services/activity', () => ({
  listActivity: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  getDb: vi.fn(() => ({})),
}));

const mockEntries: ActivityEntry[] = [
  {
    id: 'act-1',
    projectId: 'proj-1',
    type: 'task_created',
    actorId: 'user-1',
    actorName: 'Alice',
    taskId: 'task-1',
    taskTitle: 'First Task',
    detail: null,
    createdAt: new Date('2026-10-20T12:00:00Z'),
  },
  {
    id: 'act-2',
    projectId: 'proj-1',
    type: 'task_status_changed',
    actorId: 'user-2',
    actorName: 'Bob',
    taskId: 'task-1',
    taskTitle: 'First Task',
    detail: 'todo>done',
    createdAt: new Date('2026-10-20T13:00:00Z'),
  },
];

function renderWithI18n(ui: React.ReactElement, locale: 'en' | 'ar' = 'en') {
  return render(<I18nProvider initialLocale={locale}>{ui}</I18nProvider>);
}

describe('ActivityPanel (Task 63)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(listActivity).mockReturnValue(new Promise(() => {})); // Never resolves
    renderWithI18n(<ActivityPanel projectId="proj-1" />);

    expect(screen.getByTestId('activity-skeleton')).toBeInTheDocument();
  });

  it('renders activities ordered newest-first', async () => {
    // Return in unsorted order from mock, ActivityPanel should render sorted newest-first
    vi.mocked(listActivity).mockResolvedValue([...mockEntries]);

    renderWithI18n(<ActivityPanel projectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('activity-list')).toBeInTheDocument();
    });

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    // Newest is act-2 (13:00) then act-1 (12:00)
    expect(items[0]).toHaveAttribute('data-testid', 'activity-item-act-2');
    expect(items[1]).toHaveAttribute('data-testid', 'activity-item-act-1');
  });

  it('renders actor inside <bdi> and translated message in English', async () => {
    vi.mocked(listActivity).mockResolvedValue([mockEntries[0]]);

    renderWithI18n(<ActivityPanel projectId="proj-1" />, 'en');

    await waitFor(() => {
      expect(screen.getByTestId('activity-item-act-1')).toBeInTheDocument();
    });

    const bdi = screen.getByText('Alice');
    expect(bdi.tagName.toLowerCase()).toBe('bdi');
    expect(screen.getByText(/created task/i)).toBeInTheDocument();
  });

  it('renders translated message in Arabic', async () => {
    vi.mocked(listActivity).mockResolvedValue([mockEntries[0]]);

    renderWithI18n(<ActivityPanel projectId="proj-1" />, 'ar');

    await waitFor(() => {
      expect(screen.getByTestId('activity-item-act-1')).toBeInTheDocument();
    });

    const bdi = screen.getByText('Alice');
    expect(bdi.tagName.toLowerCase()).toBe('bdi');
    expect(screen.getByText(/أنشأ/i)).toBeInTheDocument();
  });

  it('displays empty state when no activity exists', async () => {
    vi.mocked(listActivity).mockResolvedValue([]);

    renderWithI18n(<ActivityPanel projectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('activity-empty-state')).toBeInTheDocument();
    });
  });

  it('displays error state with retry button on network error and retries on click', async () => {
    vi.mocked(listActivity).mockRejectedValueOnce(new AppError('network', 'Failed to fetch'));

    renderWithI18n(<ActivityPanel projectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('activity-retry-btn')).toBeInTheDocument();
    });

    vi.mocked(listActivity).mockResolvedValueOnce([mockEntries[0]]);
    fireEvent.click(screen.getByTestId('activity-retry-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('activity-item-act-1')).toBeInTheDocument();
    });
  });
});
