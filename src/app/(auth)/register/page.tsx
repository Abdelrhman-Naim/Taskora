'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { registerUser } from '@/services/auth';
import { getAuthInstance, getDb } from '@/lib/firebase';
import { Spinner } from '@/components/ui/Spinner';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { ThemeToggle } from '@/theme/ThemeToggle';
import { useI18n } from '@/i18n/I18nProvider';
import styles from '../auth.module.css';

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!loading && user && !registering) {
      router.replace('/dashboard');
    }
  }, [user, loading, registering, router]);

  const handleRegister = async (data: { name?: string; email: string; password: string }) => {
    setRegistering(true);
    try {
      const auth = getAuthInstance();
      const db = getDb();
      await registerUser(auth, db, {
        name: data.name || '',
        email: data.email,
        password: data.password,
      });
      router.replace('/dashboard');
    } finally {
      setRegistering(false);
    }
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
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </div>
              <h1 className={styles.title}>{t('auth.register.title')}</h1>
              <p className={styles.subtitle}>{t('auth.register.subtitle')}</p>
            </div>

            <AuthForm mode="register" onSubmit={handleRegister} />

            <div className={styles.footerRow}>
              <span>{t('auth.register.hasAccount')}</span>
              <Link
                href="/login"
                className={styles.switchLink}
                data-testid="auth-switch-link"
              >
                {t('auth.register.loginLink')}
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
