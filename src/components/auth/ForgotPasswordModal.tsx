'use client';

import React, { useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { useErrorMessage } from '@/i18n/useErrorMessage';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { emailSchema } from '@/lib/validation';
import { resetPassword } from '@/services/auth';
import { getAuthInstance } from '@/lib/firebase';

export interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export function ForgotPasswordModal({
  isOpen,
  onClose,
  defaultEmail = '',
}: ForgotPasswordModalProps): React.ReactElement | null {
  const { t } = useI18n();
  const getErrorMessage = useErrorMessage();
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Sync defaultEmail when modal opens if email was empty
  React.useEffect(() => {
    if (isOpen) {
      if (defaultEmail && !email) {
        setEmail(defaultEmail);
      }
      setError(null);
      setIsSuccess(false);
    }
  }, [isOpen, defaultEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailParsed = emailSchema.safeParse(email.trim());
    if (!emailParsed.success) {
      setError(t('validation.email.invalid'));
      return;
    }

    setLoading(true);
    try {
      const auth = getAuthInstance();
      await resetPassword(auth, email.trim());
      setIsSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setIsSuccess(false);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={t('auth.reset.title')}
      description={isSuccess ? undefined : t('auth.reset.description')}
      size="sm"
    >
      {isSuccess ? (
        <div className="flex flex-col gap-4 py-2" data-testid="reset-success-message">
          <div className="flex items-center gap-3 p-3 rounded-md bg-st-done-bg border border-st-done-fg text-st-done-fg text-sm">
            <Icon name="check" size={18} />
            <span>{t('auth.reset.success')}</span>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="primary"
              onClick={handleClose}
              data-testid="reset-done-btn"
            >
              {t('auth.reset.backToLogin')}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 pt-2">
          {error && (
            <div
              role="alert"
              className="p-2.5 rounded-md bg-st-overdue-bg border border-st-overdue-fg text-st-overdue-fg text-xs font-medium flex items-center gap-2"
              data-testid="reset-error-alert"
            >
              <Icon name="alert" size={16} />
              <span>{error}</span>
            </div>
          )}

          <Field
            id="reset-email"
            label={t('auth.reset.emailLabel')}
            required
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder={t('auth.reset.emailPlaceholder')}
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                data-testid="reset-email-input"
              />
            )}
          </Field>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={loading}
              data-testid="reset-cancel-btn"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              data-testid="reset-submit-btn"
            >
              {loading ? t('auth.reset.loading') : t('auth.reset.button')}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
