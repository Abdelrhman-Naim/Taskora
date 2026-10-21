import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { logoutUser } from '@/services/auth';
import { getAuthInstance } from '@/lib/firebase';
import { useI18n } from '@/i18n/I18nProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { ShortcutsDialog } from './ShortcutsDialog';
import styles from './UserMenu.module.css';

export function UserMenu(): React.ReactElement | null {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  const displayName = user.displayName || user.email || 'User';

  return (
    <div ref={containerRef} className={styles.wrapper}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`${t('nav.userMenu')} - ${displayName}`}
      >
        <Avatar name={displayName} size="sm" />
        <span className={styles.userName}>
          <bdi>{displayName}</bdi>
        </span>
        <svg
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div ref={menuRef} className={styles.menu} role="menu">
          <div className={styles.userHeader}>
            <div className={styles.userInfoText}>
              <span className={styles.userInfoName}>
                <bdi>{displayName}</bdi>
              </span>
              <span className={styles.userInfoEmail} dir="ltr">
                {user.email}
              </span>
            </div>
            <Avatar name={displayName} size="md" className={styles.userHeaderAvatar} />
          </div>

          <div className={styles.divider} aria-hidden="true" />

          <button
            type="button"
            role="menuitem"
            className={styles.item}
            data-testid="user-menu-shortcuts-btn"
            onClick={() => {
              setIsOpen(false);
              setShowShortcuts(true);
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="6" y1="8" x2="6.01" y2="8" />
              <line x1="10" y1="8" x2="10.01" y2="8" />
              <line x1="14" y1="8" x2="14.01" y2="8" />
              <line x1="18" y1="8" x2="18.01" y2="8" />
              <line x1="8" y1="16" x2="16" y2="16" />
            </svg>
            <span>{t('shortcuts.menuItem')}</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className={styles.item}
            onClick={async () => {
              setIsOpen(false);
              try {
                const auth = getAuthInstance();
                await logoutUser(auth);
                router.replace('/login');
              } catch (err) {
                console.error('Logout error:', err);
              }
            }}
          >
            <Icon name="logout" size={16} />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      )}

      {showShortcuts && (
        <ShortcutsDialog
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
        />
      )}
    </div>
  );
}
