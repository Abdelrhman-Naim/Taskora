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
        padding: 'var(--sp-6) var(--sp-5)',
        backgroundColor: 'var(--st-overdue-bg)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        margin: 'var(--sp-4) 0',
      }}
    >
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-2)', fontWeight: 600, color: 'var(--st-overdue-fg)', marginBottom: 'var(--sp-1)' }}>
        {title}
      </h3>
      <p style={{ fontSize: 'var(--fs-1)', color: 'var(--text-muted)', maxWidth: '420px', marginBottom: onRetry ? 'var(--sp-4)' : '0' }}>
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: 'var(--sp-2) var(--sp-4)',
            fontSize: 'var(--fs-0)',
            fontWeight: 600,
            backgroundColor: 'var(--accent)',
            color: 'var(--on-accent)',
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
