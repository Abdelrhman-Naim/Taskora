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
      <div className="flex justify-center items-center min-h-[80vh]">
        <Spinner size={32} label={t('common.loading')} />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full grid grid-cols-1 md:grid-cols-[minmax(360px,480px)_1fr] bg-bg text-text box-border" data-testid="page-ready">
      {/* Left Pane: Identity Rail */}
      <aside className="hidden md:flex bg-sidebar-bg border-e border-sidebar-border p-8 flex-col justify-between gap-6 relative overflow-hidden min-h-[100dvh] box-border" data-testid="auth-identity-rail" dir="ltr">
        <header className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-surface border border-accent text-accent flex items-center justify-center font-[family-name:var(--font-display)] text-lg font-bold shrink-0">T</div>
          <div className="flex flex-col">
            <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-sidebar-text m-0 leading-tight">Taskora</h1>
            <span className="font-[family-name:var(--font-body)] text-[0.7rem] tracking-wider uppercase text-sidebar-text-3 m-0">Private Operations</span>
          </div>
        </header>

        <div className="flex flex-col gap-4 max-w-[380px]">
          <div className="inline-flex items-center gap-2 py-1 px-2.5 rounded-full bg-surface-sunken border border-line text-[0.6875rem] font-semibold tracking-widest text-text-3 uppercase w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span>ENCLAVE PROVISIONING</span>
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-sidebar-text m-0 leading-snug">
            Editorial task orchestration for high-trust teams.
          </h2>
          <div className="w-full h-px bg-accent opacity-40 my-2" />
          <p className="text-sidebar-text-2 text-sm leading-relaxed m-0">
            Establish institutional credentials to participate in cryptographically partitioned ledgers with verifiable audit logs.
          </p>
        </div>

        <footer className="flex items-center justify-between text-xs text-sidebar-text-3 font-mono pt-4 border-t border-sidebar-border/40">
          <span>Zurich Enclave // HSM v4.2</span>
          <span>Active</span>
        </footer>
      </aside>

      {/* Right Pane: Clean Form Plane */}
      <main className="flex flex-col justify-between p-4 sm:p-6 md:p-12 relative min-h-[100dvh] box-border" data-testid="auth-form-plane">
        <div className="flex items-center justify-end gap-3 mb-6">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>

        <div className="flex-1 flex items-center justify-center py-4">
          <div className="w-full max-w-[440px] mx-auto bg-surface border border-line rounded-lg p-5 sm:p-6 md:p-8 shadow-sm box-border" data-testid="auth-card">
            <div className="flex md:hidden items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-md bg-surface border border-accent text-accent flex items-center justify-center font-[family-name:var(--font-display)] text-lg font-bold shrink-0">T</div>
              <div className="flex flex-col">
                <span className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-sidebar-text m-0 leading-tight">Taskora</span>
                <span className="font-[family-name:var(--font-body)] text-[0.7rem] tracking-wider uppercase text-sidebar-text-3 m-0">Private Operations</span>
              </div>
            </div>
            <div className="mb-6 text-start">
              <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-semibold tracking-tight text-text m-0 mb-2">{t('auth.register.title')}</h2>
              <p className="font-[family-name:var(--font-body)] text-sm text-text-2 leading-normal m-0">{t('auth.register.subtitle')}</p>
            </div>

            <AuthForm mode="register" onSubmit={handleRegister} />

            <div className="mt-6 pt-4 border-t border-line text-center text-sm text-text-2">
              <span>{t('auth.register.hasAccount')}</span>
              <Link
                href="/login"
                className="text-accent font-semibold no-underline hover:underline ms-1"
                data-testid="auth-switch-link"
              >
                {t('auth.register.loginLink')}
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-4 text-center text-xs text-text-3 font-mono">
          {t('auth.register.securityNote')}
        </div>
      </main>
    </div>
  );
}
