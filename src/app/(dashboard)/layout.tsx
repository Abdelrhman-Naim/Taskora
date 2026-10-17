'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useAuth } from '@/hooks/useAuth';
import { logoutUser } from '@/services/auth';
import { getAuthInstance } from '@/lib/firebase';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    const auth = getAuthInstance();
    await logoutUser(auth);
    router.replace('/login');
  };

  return (
    <RequireAuth>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            backgroundColor: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-color)',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link
              href="/dashboard"
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                textDecoration: 'none',
              }}
            >
              TaskFlow
            </Link>
            <nav style={{ display: 'flex', gap: '16px' }}>
              <Link
                href="/dashboard"
                style={{
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                Dashboard
              </Link>
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user && (
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {user.displayName || user.email}
              </span>
            )}
            <button
              onClick={handleLogout}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--danger)',
                backgroundColor: 'transparent',
                border: '1px solid var(--danger-border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              Log out
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: '24px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </RequireAuth>
  );
}
