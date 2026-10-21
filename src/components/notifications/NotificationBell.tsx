'use client';

import React, { useState, useRef } from 'react';
import { useNotifications } from './NotificationsProvider';
import { NotificationList } from './NotificationList';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './NotificationBell.module.css';

export function NotificationBell(): React.ReactElement {
  const { t } = useI18n();
  const { unread } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const badgeText = unread > 9 ? '9+' : String(unread);
  const ariaLabel =
    unread > 0 ? `${t('notif.bell')} (${unread})` : t('notif.bell');

  return (
    <div className={styles.container}>
      <button
        ref={triggerRef}
        type="button"
        data-testid="notif-bell"
        aria-label={ariaLabel}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={styles.bellBtn}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unread > 0 && (
          <span
            data-testid="notif-unread-badge"
            className={styles.badge}
            dir="ltr"
          >
            {badgeText}
          </span>
        )}
      </button>

      {/* Screen reader announcement on count change */}
      <span className={styles.srOnly} aria-live="polite">
        {ariaLabel}
      </span>

      {isOpen && (
        <NotificationList
          onClose={() => setIsOpen(false)}
          triggerRef={triggerRef}
        />
      )}
    </div>
  );
}
