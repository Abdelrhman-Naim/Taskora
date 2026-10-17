'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useAuth } from '@/hooks/useAuth';
import { logoutUser } from '@/services/auth';
import { getAuthInstance } from '@/lib/firebase';
import { useI18n } from '@/i18n/I18nProvider';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { ThemeToggle } from '@/theme/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { ToastProvider } from '@/components/ui/Toast';
import styles from './layout.module.css';

export default function DashboardLayout({ children }: { children: ReactNode }): React.ReactElement {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const handleLogout = async () => {
    const auth = getAuthInstance();
    await logoutUser(auth);
    router.replace('/login');
  };

  return (
    <RequireAuth>
      <ToastProvider>
        <div className={styles.wrapper}>
          <header className={styles.header}>
            <div className={styles.startNav}>
              <Link href="/dashboard" className={styles.logo}>
                {t('app.name')}
              </Link>
              <nav className={styles.navLinks}>
                <Link href="/dashboard" className={styles.navLink}>
                  {t('nav.dashboard')}
                </Link>
              </nav>
            </div>

            <div className={styles.endNav}>
              <LocaleSwitcher />
              <ThemeToggle />
              {user && (
                <span className={styles.userName} dir="auto">
                  {user.displayName || user.email}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                style={{ color: 'var(--st-overdue-fg)' }}
              >
                {t('nav.logout')}
              </Button>
            </div>
          </header>

          <main className={styles.main}>{children}</main>
        </div>
      </ToastProvider>
    </RequireAuth>
  );
}
