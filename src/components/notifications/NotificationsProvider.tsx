'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { AppNotification } from '@/types';
import { subscribeNotifications, markRead, markAllRead, countUnread } from '@/services/notifications';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { AppError } from '@/lib/errors';

interface NotificationsContextValue {
  items: AppNotification[];
  unread: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  error: AppError | null;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [error, setError] = useState<AppError | null>(null);
  const userUid = user?.uid;

  useEffect(() => {
    if (!userUid) return;

    const db = getDb();
    const unsubscribe = subscribeNotifications(
      db,
      userUid,
      (list) => {
        setItems(list);
      },
      (err) => {
        setError(err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userUid]);

  const activeItems = useMemo(() => (userUid ? items : []), [userUid, items]);
  const unread = useMemo(() => countUnread(activeItems), [activeItems]);

  const handleMarkRead = useCallback(
    async (id: string) => {
      if (!user) return;
      try {
        const db = getDb();
        await markRead(db, user.uid, id);
        setItems((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
        );
      } catch (err) {
        setError(err instanceof AppError ? err : new AppError('unknown', 'Failed to mark read'));
      }
    },
    [user]
  );

  const handleMarkAllRead = useCallback(async () => {
    if (!user) return;
    const unreadIds = activeItems.filter((n) => !n.readAt).map((n) => n.id);
    if (unreadIds.length === 0) return;

    try {
      const db = getDb();
      await markAllRead(db, user.uid, unreadIds);
      setItems((prev) =>
        prev.map((n) => (!n.readAt ? { ...n, readAt: new Date() } : n))
      );
    } catch (err) {
      setError(err instanceof AppError ? err : new AppError('unknown', 'Failed to mark all read'));
    }
  }, [user, activeItems]);

  const value = useMemo(
    () => ({
      items: activeItems,
      unread,
      markRead: handleMarkRead,
      markAllRead: handleMarkAllRead,
      error,
    }),
    [activeItems, unread, handleMarkRead, handleMarkAllRead, error]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return ctx;
}
