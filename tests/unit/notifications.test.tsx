import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../helpers/render';
import {
  NotificationsProvider,
} from '@/components/notifications/NotificationsProvider';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import * as notifService from '@/services/notifications';
import { AppNotification } from '@/types';

vi.mock('@/services/notifications', () => ({
  subscribeNotifications: vi.fn(),
  markRead: vi.fn(),
  markAllRead: vi.fn(),
  countUnread: vi.fn((list: AppNotification[]) => list.filter((n) => !n.readAt).length),
}));

vi.mock('@/lib/firebase', () => ({
  getDb: vi.fn(() => ({})),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      uid: 'user-recipient',
      displayName: 'Recipient User',
      email: 'recipient@example.com',
    },
    loading: false,
  }),
}));

describe('Notifications UI (Task 58)', () => {
  const unsubscribeMock = vi.fn();
  let onChangeCallback: ((list: AppNotification[]) => void) | null = null;

  const mockNotifs: AppNotification[] = [
    {
      id: 'n-1',
      type: 'task_assigned',
      projectId: 'proj-1',
      projectName: 'Alpha Project',
      taskId: 't-1',
      taskTitle: 'Important Task',
      actorId: 'u-actor',
      actorName: 'Alice Actor',
      createdAt: new Date(),
      readAt: null, // unread
    },
    {
      id: 'n-2',
      type: 'comment_added',
      projectId: 'proj-1',
      projectName: 'Alpha Project',
      taskId: 't-1',
      taskTitle: 'Important Task',
      actorId: 'u-actor',
      actorName: 'Bob Actor',
      createdAt: new Date(),
      readAt: null, // unread
    },
    {
      id: 'n-3',
      type: 'member_added',
      projectId: 'proj-2',
      projectName: 'Beta Project',
      taskId: null,
      taskTitle: null,
      actorId: 'u-owner',
      actorName: 'Owner User',
      createdAt: new Date(),
      readAt: new Date(), // read
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    onChangeCallback = null;
    vi.mocked(notifService.subscribeNotifications).mockImplementation(
      (_db, _uid, onChange) => {
        onChangeCallback = onChange;
        onChange(mockNotifs);
        return unsubscribeMock;
      }
    );
  });

  function TestHarness() {
    return (
      <NotificationsProvider>
        <NotificationBell />
      </NotificationsProvider>
    );
  }

  it('subscribes to notifications on mount and unsubscribes on unmount', () => {
    const { unmount } = renderWithProviders(<TestHarness />);

    expect(notifService.subscribeNotifications).toHaveBeenCalledTimes(1);
    unmount();
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });

  it('displays badge with unread count and hides badge when unread is 0', async () => {
    renderWithProviders(<TestHarness />);

    const badge = screen.getByTestId('notif-unread-badge');
    expect(badge).toHaveTextContent('2');

    // Simulate all read
    if (onChangeCallback) {
      onChangeCallback(
        mockNotifs.map((n) => ({ ...n, readAt: new Date() }))
      );
    }

    await waitFor(() => {
      expect(screen.queryByTestId('notif-unread-badge')).not.toBeInTheDocument();
    });
  });

  it('displays 9+ when unread count exceeds 9', () => {
    const tenUnread: AppNotification[] = Array.from({ length: 12 }, (_, i) => ({
      id: `notif-${i}`,
      type: 'task_assigned',
      projectId: 'proj-1',
      projectName: 'Proj',
      taskId: 't-1',
      taskTitle: 'Task',
      actorId: 'u-1',
      actorName: 'User',
      createdAt: new Date(),
      readAt: null,
    }));

    vi.mocked(notifService.subscribeNotifications).mockImplementation(
      (_db, _uid, onChange) => {
        onChange(tenUnread);
        return unsubscribeMock;
      }
    );

    renderWithProviders(<TestHarness />);
    expect(screen.getByTestId('notif-unread-badge')).toHaveTextContent('9+');
  });

  it('opens popover on click and closes on Escape with focus restored', async () => {
    renderWithProviders(<TestHarness />);

    const bell = screen.getByTestId('notif-bell');
    fireEvent.click(bell);

    expect(screen.getByTestId('notif-popover')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByTestId('notif-popover')).not.toBeInTheDocument();
  });

  it('Mark all as read calls markAllRead and clears unread counter', async () => {
    vi.mocked(notifService.markAllRead).mockResolvedValue(undefined);

    renderWithProviders(<TestHarness />);

    const bell = screen.getByTestId('notif-bell');
    fireEvent.click(bell);

    const markAllBtn = screen.getByTestId('notif-mark-all-btn');
    fireEvent.click(markAllBtn);

    expect(notifService.markAllRead).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      ['n-1', 'n-2']
    );
  });

  it('clicking notification item calls markRead and navigates', async () => {
    vi.mocked(notifService.markRead).mockResolvedValue(undefined);

    renderWithProviders(<TestHarness />);

    const bell = screen.getByTestId('notif-bell');
    fireEvent.click(bell);

    const item1 = screen.getByTestId('notif-item-n-1');
    fireEvent.click(item1);

    expect(notifService.markRead).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'n-1'
    );
  });

  it('renders localized empty state when there are 0 notifications', () => {
    vi.mocked(notifService.subscribeNotifications).mockImplementation(
      (_db, _uid, onChange) => {
        onChange([]);
        return unsubscribeMock;
      }
    );

    renderWithProviders(<TestHarness />);
    const bell = screen.getByTestId('notif-bell');
    fireEvent.click(bell);

    expect(screen.getByTestId('notif-empty-state')).toBeInTheDocument();
  });
});
