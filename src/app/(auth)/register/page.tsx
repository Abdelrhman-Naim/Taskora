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
    <div className={styles.splitPage} data-testid="page-ready">
      {/* Left Pane: Identity Rail */}
      <aside className={styles.identityRail} data-testid="auth-identity-rail" dir="ltr">
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
            <span>ENCLAVE PROVISIONING</span>
          </div>
          <h2 className={styles.narrativeHeadline}>
            Editorial task orchestration for high-trust teams.
          </h2>
          <div className={styles.champagneRule} />
          <p className={styles.narrativeBody}>
            Establish institutional credentials to participate in cryptographically partitioned ledgers with verifiable audit logs.
          </p>
        </div>

        <footer className={styles.railFooter}>
          <span>Zurich Enclave // HSM v4.2</span>
          <span>Active</span>
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
              <h2 className={styles.title}>{t('auth.register.title')}</h2>
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

        <div className={styles.securityNote}>
          {t('auth.register.securityNote')}
        </div>
      </main>
    </div>
  );
}
