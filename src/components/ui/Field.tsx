import React from 'react';
import styles from './Field.module.css';

export interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children:
    | React.ReactNode
    | ((args: {
        id: string;
        'aria-invalid': boolean;
        'aria-describedby'?: string;
      }) => React.ReactNode);
}

export function Field({
  id,
  label,
  error,
  hint,
  required,
  className = '',
  children,
}: FieldProps): React.ReactElement {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = errorId || hintId || undefined;

  const content =
    typeof children === 'function'
      ? children({
          id,
          'aria-invalid': Boolean(error),
          'aria-describedby': describedBy,
        })
      : children;

  return (
    <div className={`${styles.field} ${className}`.trim()}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span aria-hidden="true" style={{ color: 'var(--st-overdue-fg)', marginInlineStart: 4 }}>*</span>}
      </label>

      {content}

      {hint && !error && (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      )}

      {error && (
        <span id={errorId} role="alert" className={styles.error}>
          {error}
        </span>
      )}
    </div>
  );
}
