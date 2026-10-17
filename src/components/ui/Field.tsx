import React from 'react';

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function Field({ id, label, error, required, children }: FieldProps) {
  const errorId = `${id}-error`;

  return (
    <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column' }}>
      <label
        htmlFor={id}
        style={{
          marginBottom: '6px',
          fontWeight: 600,
          fontSize: '14px',
          color: 'var(--text-primary)',
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>}
      </label>

      {children}

      {error && (
        <span
          id={errorId}
          role="alert"
          style={{
            color: 'var(--danger)',
            fontSize: '13px',
            marginTop: '4px',
            display: 'block',
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
