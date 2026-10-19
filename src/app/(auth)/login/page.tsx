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
    <div className={styles.splitPage} data-testid="page-ready">
      {/* Left Pane: Identity Rail */}
      <aside className={styles.identityRail} data-testid="auth-identity-rail">
        <header className={styles.brandHeader}>
          <div className={styles.logoMonogram}>T</div>
          <div className={styles.brandMeta}>
            <h1 className={styles.brandTitle}>Taskora</h1>
            <span className={styles.brandSubtitle}>Private Operations</span>
          </div>
        </header>

        <div className={styles.narrativeBlock}>
          <div className={styles.discretionBadge}>
            <span className={styles.discretionDot} />
            <span>RESTRICTED DISCRETION</span>
          </div>
          <h2 className={styles.narrativeHeadline}>
            Private precision for ambitious teams.
          </h2>
          <div className={styles.champagneRule} />
          <p className={styles.narrativeBody}>
            Engineered for sovereign family offices, private capital consortia, and institutional directors requiring cryptographically validated workflows.
          </p>
        </div>

        <footer className={styles.railFooter}>
          <span>Vault Node 01 // SHA-256</span>
          <span>v2.5</span>
        </footer>
      </aside>

      {/* Right Pane: Clean Form Plane */}
      <main className={styles.formPlane} data-testid="auth-form-plane">
        <div className={styles.topBarUtility}>
          <LocaleSwitcher />
          <ThemeToggle />
        </div>

        <div className={styles.formContentWrapper}>
          <div className={styles.cardWrapper} data-testid="auth-card">
            <div className={styles.headerBlock}>
              <h2 className={styles.title}>{t('auth.login.title')}</h2>
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

        <div className={styles.securityNote}>
          Strictly Confidential · All sessions cryptographically verified
        </div>
      </main>
    </div>
  );
}
