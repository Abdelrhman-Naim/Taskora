'use client';

import React, { useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { MessageKey } from '@/i18n/en';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { registerSchema, emailSchema, fieldErrors } from '@/lib/validation';
import { AppError } from '@/lib/errors';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (data: { name?: string; email: string; password: string }) => Promise<void>;
}

export function AuthForm({ mode, onSubmit }: AuthFormProps): React.ReactElement {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const translateError = (errKeyOrMsg: string | undefined): string | undefined => {
    if (!errKeyOrMsg) return undefined;
    const translated = t(errKeyOrMsg as MessageKey);
    return translated !== errKeyOrMsg ? translated : errKeyOrMsg;
  };

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
        newErrors.email = 'validation.email.invalid';
      }
      if (!password || password.length < 6) {
        newErrors.password = 'validation.password.length';
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
          const key = `error.${err.code}` as MessageKey;
          const translated = t(key);
          setGeneralError(translated !== key ? translated : err.message);
        }
      } else if (err instanceof Error) {
        setGeneralError(err.message);
      } else {
        setGeneralError(t('error.unexpected'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ inlineSize: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {generalError && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--st-overdue-bg)',
            border: '1px solid var(--st-overdue-fg)',
            color: 'var(--st-overdue-fg)',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          {generalError}
        </div>
      )}

      {mode === 'register' && (
        <Field
          id="name"
          label={t('auth.field.name')}
          error={translateError(errors.name)}
          required
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              type="text"
              dir="auto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              placeholder={t('auth.field.namePlaceholder')}
              autoComplete="name"
            />
          )}
        </Field>
      )}

      <Field
        id="email"
        label={t('auth.field.email')}
        error={translateError(errors.email)}
        required
      >
        {(fieldProps) => (
          <Input
            {...fieldProps}
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            placeholder={t('auth.field.emailPlaceholder')}
            autoComplete="email"
          />
        )}
      </Field>

      <Field
        id="password"
        label={t('auth.field.password')}
        error={translateError(errors.password)}
        required
      >
        {(fieldProps) => (
          <Input
            {...fieldProps}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            placeholder={t('auth.field.passwordPlaceholder')}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          />
        )}
      </Field>

      <Button
        type="submit"
        variant="primary"
        loading={submitting}
        style={{ marginBlockStart: 8, inlineSize: '100%' }}
      >
        {submitting
          ? mode === 'register'
            ? t('auth.register.loading')
            : t('auth.login.loading')
          : mode === 'register'
          ? t('auth.register.button')
          : t('auth.login.button')}
      </Button>
    </form>
  );
}
