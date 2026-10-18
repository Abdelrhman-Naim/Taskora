import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  message: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--sp-7) var(--sp-5)',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px dashed var(--border)',
        margin: 'var(--sp-4) 0',
      }}
    >
      <h3 style={{ fontSize: 'var(--fs-3)', fontWeight: 600, color: 'var(--text)', marginBottom: 'var(--sp-2)' }}>
        {title}
      </h3>
      <p style={{ fontSize: 'var(--fs-1)', color: 'var(--text-muted)', maxWidth: '400px', marginBottom: action ? 'var(--sp-5)' : '0' }}>
        {message}
      </p>

      {action && (
        action.href ? (
          <Link
            href={action.href}
            style={{
              padding: 'var(--sp-2) var(--sp-4)',
              fontSize: 'var(--fs-1)',
              fontWeight: 600,
              backgroundColor: 'var(--accent)',
              color: 'var(--on-accent)',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
            }}
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            style={{
              padding: 'var(--sp-2) var(--sp-4)',
              fontSize: 'var(--fs-1)',
              fontWeight: 600,
              backgroundColor: 'var(--accent)',
              color: 'var(--on-accent)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
