'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { loginUser } from '@/services/auth';
import { getAuthInstance, getDb } from '@/lib/firebase';
import { Spinner } from '@/components/ui/Spinner';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { ThemeToggle } from '@/theme/ThemeToggle';
import { useI18n } from '@/i18n/I18nProvider';
import styles from '../auth.module.css';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleLogin = async (data: { email: string; password: string }) => {
    const auth = getAuthInstance();
    const db = getDb();
    await loginUser(auth, db, data.email, data.password);
    router.replace('/dashboard');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minBlockSize: '80vh' }}>
        <Spinner size={32} label={t('common.loading')} />
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <div className={styles.logoMonogram}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span className={styles.brandName}>Taskora</span>
          <span className={styles.versionBadge}>v2.4</span>
        </div>
        <div className={styles.topBarActions}>
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className={styles.mainArea}>
        <div className={styles.cardWrapper} data-testid="auth-card">
          <div className={styles.accentBar} />
          <div className={styles.cardBody}>
            <div className={styles.headerBlock}>
              <div className={styles.headerLogo}>
                <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <h1 className={styles.title}>{t('auth.login.title')}</h1>
              <p className={styles.subtitle}>{t('auth.login.subtitle')}</p>
            </div>

            <AuthForm mode="login" onSubmit={handleLogin} />

            <div className={styles.footerRow}>
              <span>{t('auth.login.noAccount')}</span>
              <Link
                href="/register"
                className={styles.switchLink}
                data-testid="auth-switch-link"
              >
                {t('auth.login.registerLink')}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className={styles.pageFooter}>
        <span>&copy; {new Date().getFullYear()} Taskora. All rights reserved.</span>
      </footer>
    </div>
  );
}
