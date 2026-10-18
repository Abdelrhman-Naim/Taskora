'use client';

import React, { useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { useErrorMessage } from '@/i18n/useErrorMessage';
import { MessageKey } from '@/i18n/en';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { registerSchema, emailSchema, fieldErrors } from '@/lib/validation';
import { AppError } from '@/lib/errors';
import styles from './AuthForm.module.css';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (data: { name?: string; email: string; password: string }) => Promise<void>;
}

export function AuthForm({ mode, onSubmit }: AuthFormProps): React.ReactElement {
  const { t } = useI18n();
  const getErrorMessage = useErrorMessage();
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
      if (err instanceof AppError && err.fields) {
        setErrors(err.fields);
      } else {
        setGeneralError(getErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className={styles.form}>
      {generalError && (
        <div role="alert" className={styles.alert}>
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
              data-testid="auth-name-input"
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
            data-testid="auth-email-input"
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
            data-testid="auth-password-input"
          />
        )}
      </Field>

      <Button
        type="submit"
        variant="primary"
        loading={submitting}
        className={styles.submitButton}
        data-testid="auth-submit-btn"
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
