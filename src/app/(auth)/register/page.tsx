'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { registerUser } from '@/services/auth';
import { getAuthInstance, getDb } from '@/lib/firebase';
import { Spinner } from '@/components/ui/Spinner';

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleRegister = async (data: { name?: string; email: string; password: string }) => {
    const auth = getAuthInstance();
    const db = getDb();
    await registerUser(auth, db, {
      name: data.name || '',
      email: data.email,
      password: data.password,
    });
    router.replace('/dashboard');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Spinner size={32} label="Loading..." />
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
        minHeight: '80vh',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'var(--bg-card)',
          padding: '32px 24px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Create an Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Get started with TaskFlow for your team
          </p>
        </div>

        <AuthForm mode="register" onSubmit={handleRegister} />

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
