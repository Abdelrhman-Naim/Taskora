'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { loginUser } from '@/services/auth';
import { getAuthInstance, getDb } from '@/lib/firebase';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { ThemeToggle } from '@/theme/ThemeToggle';
import { useI18n } from '@/i18n/I18nProvider';

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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minBlockSize: '100vh',
        padding: '24px 16px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ position: 'absolute', insetBlockStart: 24, insetInlineEnd: 24, display: 'flex', gap: 8 }}>
        <LocaleSwitcher />
        <ThemeToggle />
      </div>

      <div style={{ inlineSize: '100%', maxInlineSize: '28rem' }}>
        <Card>
          <div style={{ marginBlockEnd: '24px', textAlign: 'center' }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.75rem',
                fontWeight: 700,
                marginBlockStart: 0,
                marginBlockEnd: '8px',
                color: 'var(--fg)',
              }}
            >
              {t('auth.login.title')}
            </h1>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--fg-muted)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {t('auth.login.subtitle')}
            </p>
          </div>

          <AuthForm mode="login" onSubmit={handleLogin} />

          <div
            style={{
              marginBlockStart: '24px',
              textAlign: 'center',
              fontSize: '0.875rem',
              color: 'var(--fg-muted)',
            }}
          >
            {t('auth.login.noAccount')}{' '}
            <Link
              href="/register"
              style={{
                color: 'var(--accent)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              {t('auth.login.registerLink')}
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
