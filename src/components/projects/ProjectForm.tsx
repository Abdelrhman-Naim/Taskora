'use client';

import React, { useState } from 'react';
import { Field } from '@/components/ui/Field';
import { projectInputSchema, fieldErrors } from '@/lib/validation';
import { AppError } from '@/lib/errors';

interface ProjectFormProps {
  initialValues?: { name: string; description: string };
  onSubmit: (data: { name: string; description: string }) => Promise<void>;
  submitLabel?: string;
}

export function ProjectForm({
  initialValues = { name: '', description: '' },
  onSubmit,
  submitLabel = 'Save Project',
}: ProjectFormProps) {
  const [name, setName] = useState(initialValues.name);
  const [description, setDescription] = useState(initialValues.description);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    <form onSubmit={handleSubmit} noValidate style={{ width: '100%', maxWidth: '560px' }}>
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

      <Field id="projectName" label="Project Name" error={errors.name} required>
        <input
          id="projectName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
          style={{
            ...inputStyle,
            borderColor: errors.name ? 'var(--danger)' : 'var(--border-color)',
          }}
          placeholder="e.g. Website Redesign"
        />
      </Field>

      <Field id="projectDescription" label="Description" error={errors.description}>
        <textarea
          id="projectDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={submitting}
          rows={4}
          style={{
            ...inputStyle,
            borderColor: errors.description ? 'var(--danger)' : 'var(--border-color)',
            resize: 'vertical',
          }}
          placeholder="Brief details about the project goals..."
        />
      </Field>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '10px 20px',
            fontSize: '15px',
            fontWeight: 600,
            backgroundColor: submitting ? 'var(--text-muted)' : 'var(--primary)',
            color: 'var(--primary-fg)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
