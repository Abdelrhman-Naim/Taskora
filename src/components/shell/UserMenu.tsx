import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { logoutUser } from '@/services/auth';
import { getAuthInstance } from '@/lib/firebase';
import { useI18n } from '@/i18n/I18nProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import styles from './UserMenu.module.css';

export function UserMenu(): React.ReactElement | null {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
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
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`${t('nav.userMenu')} - ${displayName}`}
      >
        <Avatar name={displayName} size="sm" />
        <span className={styles.userName}>
          <bdi>{displayName}</bdi>
        </span>
        <Icon name="arrow" size={14} />
      </button>

      {isOpen && (
        <div ref={menuRef} className={styles.menu} role="menu">
          <div className={styles.userInfo}>
            <span className={styles.userInfoName}>
              <bdi>{displayName}</bdi>
            </span>
            <span className={styles.userInfoEmail} dir="ltr">
              {user.email}
            </span>
          </div>

          <div className={styles.divider} aria-hidden="true" />

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
    </div>
  );
}
