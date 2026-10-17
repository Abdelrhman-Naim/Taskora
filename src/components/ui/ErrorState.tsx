import React from 'react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '32px 24px',
        backgroundColor: 'var(--danger-bg)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--danger-border)',
        margin: '16px 0',
      }}
    >
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--danger)', marginBottom: '6px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: onRetry ? '16px' : '0' }}>
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-fg)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
