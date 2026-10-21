'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { AppNotification } from '@/types';
import { useNotifications } from './NotificationsProvider';
import { useI18n } from '@/i18n/I18nProvider';
import { MessageKey } from '@/i18n/en';
import styles from './NotificationList.module.css';

export interface NotificationListProps {
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function renderNotificationMessage(n: AppNotification, template: string) {
  const parts = template.split(/(\{actor\}|\{task\}|\{project\})/g);
  return parts.map((part, i) => {
    if (part === '{actor}') {
      return <bdi key={i}>{n.actorName}</bdi>;
    }
    if (part === '{task}') {
      return <bdi key={i}>{n.taskTitle || ''}</bdi>;
    }
    if (part === '{project}') {
      return <bdi key={i}>{n.projectName}</bdi>;
    }
    return part;
  });
}

export function NotificationList({ onClose, triggerRef }: NotificationListProps): React.ReactElement {
  const { t } = useI18n();
  const { items, markRead, markAllRead } = useNotifications();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        triggerRef?.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef?.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, triggerRef]);

  const hasUnread = items.some((n) => !n.readAt);

  return (
    <div
      ref={popoverRef}
      className={styles.popover}
      data-testid="notif-popover"
      role="region"
      aria-label={t('notif.bell')}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>{t('notif.bell')}</h3>
        <button
          type="button"
          data-testid="notif-mark-all-btn"
          className={styles.markAllBtn}
          disabled={!hasUnread}
          onClick={() => markAllRead()}
        >
          {t('notif.markAllRead')}
        </button>
      </div>

      {items.length === 0 ? (
        <p className={styles.emptyState} data-testid="notif-empty-state">
          {t('notif.empty')}
        </p>
      ) : (
        <ul className={styles.list}>
          {items.map((n) => {
            const isUnread = !n.readAt;
            const templateKey = `notif.${n.type}` as MessageKey;
            const template = t(templateKey);

            return (
              <li key={n.id}>
                <Link
                  href={`/projects/${n.projectId}`}
                  className={styles.item}
                  data-testid={`notif-item-${n.id}`}
                  onClick={() => {
                    if (isUnread) {
                      markRead(n.id);
                    }
                    onClose();
                  }}
                >
                  {isUnread ? (
                    <span className={styles.unreadDot} aria-hidden="true" />
                  ) : (
                    <span className={styles.readSpacer} aria-hidden="true" />
                  )}
                  <div className={styles.itemBody}>
                    <p
                      className={styles.message}
                      data-testid={`notif-item-text-${n.id}`}
                      dir="auto"
                    >
                      {renderNotificationMessage(n, template)}
                    </p>
                    {n.createdAt && (
                      <span className={styles.time} dir="ltr">
                        {n.createdAt.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
