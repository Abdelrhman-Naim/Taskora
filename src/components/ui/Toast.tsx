'use client';

import React, { useEffect } from 'react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
  durationMs?: number;
}

export function Toast({
  message,
  type = 'info',
  onClose,
  durationMs = 4000,
}: ToastProps) {
  useEffect(() => {
    if (!durationMs || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onClose]);

  const bgMap = {
    success: 'var(--success-bg, #f0fdf4)',
    error: 'var(--danger-bg, #fef2f2)',
    info: 'var(--surface, #ffffff)',
  };

  const borderMap = {
    success: 'var(--success, #16a34a)',
    error: 'var(--danger, #dc2626)',
    info: 'var(--border, #cbd5e1)',
  };

  const textMap = {
    success: 'var(--success, #16a34a)',
    error: 'var(--danger, #dc2626)',
    info: 'var(--text-primary, #0f172a)',
  };

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        padding: '12px 18px',
        backgroundColor: bgMap[type],
        border: `1px solid ${borderMap[type]}`,
        borderRadius: 'var(--radius-sm, 4px)',
        color: textMap[type],
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        fontWeight: 500,
        maxWidth: '400px',
      }}
    >
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            padding: '2px',
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
}
