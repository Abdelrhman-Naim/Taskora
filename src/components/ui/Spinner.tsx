import React from 'react';

interface SpinnerProps {
  size?: number;
  label?: string;
}

export function Spinner({ size = 28, label = 'Loading...' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          animation: 'spin 0.8s linear infinite',
          color: 'var(--primary)',
        }}
      >
        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" />
      </svg>
      <span className="sr-only" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
        {label}
      </span>
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
