'use client';

import React, { useState } from 'react';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { projectInputSchema, fieldErrors } from '@/lib/validation';
import { AppError } from '@/lib/errors';
import { useI18n } from '@/i18n/I18nProvider';
import { useErrorMessage } from '@/i18n/useErrorMessage';
import { MessageKey } from '@/i18n/en';

interface ProjectFormProps {
  initialValues?: { name: string; description: string };
  onSubmit: (data: { name: string; description: string }) => Promise<void>;
  submitLabel?: string;
}

export function ProjectForm({
  initialValues = { name: '', description: '' },
  onSubmit,
  submitLabel,
}: ProjectFormProps): React.ReactElement {
  const { t } = useI18n();
  const getErrorMessage = useErrorMessage();
  const [name, setName] = useState(initialValues.name);
  const [description, setDescription] = useState(initialValues.description);
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

    const parsed = projectInputSchema.safeParse({ name, description });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(parsed.data);
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
    <form
      onSubmit={handleSubmit}
      noValidate
      data-testid="edit-project-form"
      style={{
        inlineSize: '100%',
        maxInlineSize: '560px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
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

      <Field
        id="project-name"
        label={t('project.field.name')}
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
            placeholder={t('project.field.namePlaceholder')}
            data-testid="project-name-input"
          />
        )}
      </Field>

      <Field
        id="project-description"
        label={t('project.field.description')}
        error={translateError(errors.description)}
      >
        {(fieldProps) => (
          <Textarea
            {...fieldProps}
            dir="auto"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            rows={4}
            placeholder={t('project.field.descriptionPlaceholder')}
            data-testid="project-description-input"
          />
        )}
      </Field>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBlockStart: '8px' }}>
        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          data-testid="save-project-btn"
        >
          {submitting
            ? t('common.saving')
            : submitLabel || t('common.save')}
        </Button>
      </div>
    </form>
  );
}
