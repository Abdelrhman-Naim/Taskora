'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { registerUser } from '@/services/auth';
import { getAuthInstance, getDb } from '@/lib/firebase';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { ThemeToggle } from '@/theme/ThemeToggle';
import { useI18n } from '@/i18n/I18nProvider';

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
                color: 'var(--text)',
              }}
            >
              {t('auth.register.title')}
            </h1>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {t('auth.register.subtitle')}
            </p>
          </div>

          <AuthForm mode="register" onSubmit={handleRegister} />

          <div
            style={{
              marginBlockStart: '24px',
              textAlign: 'center',
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
            }}
          >
            {t('auth.register.hasAccount')}{' '}
            <Link
              href="/login"
              style={{
                color: 'var(--accent)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              {t('auth.register.loginLink')}
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
