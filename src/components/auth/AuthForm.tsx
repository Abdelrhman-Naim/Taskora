'use client';

import React, { useState } from 'react';
import { Field } from '@/components/ui/Field';
import { registerSchema, emailSchema, fieldErrors } from '@/lib/validation';
import { AppError } from '@/lib/errors';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (data: { name?: string; email: string; password: string }) => Promise<void>;
}

export function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setErrors({});

    if (mode === 'register') {
      const parsed = registerSchema.safeParse({ name, email, password });
      if (!parsed.success) {
        setErrors(fieldErrors(parsed.error));
        return;
      }
    } else {
      const emailParsed = emailSchema.safeParse(email);
      const newErrors: Record<string, string> = {};
      if (!emailParsed.success) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!password || password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    setSubmitting(true);
    try {
      await onSubmit({
        ...(mode === 'register' ? { name: name.trim() } : {}),
        email: email.trim(),
        password,
      });
    } catch (err) {
      if (err instanceof AppError) {
        if (err.fields) {
          setErrors(err.fields);
        } else {
          setGeneralError(err.message);
        }
      } else if (err instanceof Error) {
        setGeneralError(err.message);
      } else {
        setGeneralError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: '15px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
    outline: 'none',
    width: '100%',
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ width: '100%' }}>
      {generalError && (
        <div
          role="alert"
          style={{
            padding: '12px',
            marginBottom: '16px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger)',
            fontSize: '14px',
          }}
        >
          {generalError}
        </div>
      )}

      {mode === 'register' && (
        <Field id="name" label="Full Name" error={errors.name} required>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            style={{
              ...inputStyle,
              borderColor: errors.name ? 'var(--danger)' : 'var(--border-color)',
            }}
            placeholder="John Doe"
            autoComplete="name"
          />
        </Field>
      )}

      <Field id="email" label="Email Address" error={errors.email} required>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          style={{
            ...inputStyle,
            borderColor: errors.email ? 'var(--danger)' : 'var(--border-color)',
          }}
          placeholder="user@example.test"
          autoComplete="email"
        />
      </Field>

      <Field id="password" label="Password" error={errors.password} required>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          style={{
            ...inputStyle,
            borderColor: errors.password ? 'var(--danger)' : 'var(--border-color)',
          }}
          placeholder="••••••••"
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
        />
      </Field>

      <button
        type="submit"
        disabled={submitting}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--primary-fg)',
          backgroundColor: submitting ? 'var(--text-muted)' : 'var(--primary)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          cursor: submitting ? 'not-allowed' : 'pointer',
          marginTop: '8px',
          transition: 'background-color 0.2s',
        }}
      >
        {submitting
          ? mode === 'register'
            ? 'Creating account...'
            : 'Logging in...'
          : mode === 'register'
          ? 'Sign up'
          : 'Log in'}
      </button>
    </form>
  );
}
