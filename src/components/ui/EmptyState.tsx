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
        padding: '48px 24px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px dashed var(--border-color)',
        margin: '16px 0',
      }}
    >
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: action ? '20px' : '0' }}>
        {message}
      </p>

      {action && (
        action.href ? (
          <Link
            href={action.href}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-fg)',
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
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-fg)',
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
