'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Icon } from './Icon';
import styles from './Toast.module.css';

export interface ToastItem {
  id: string;
  kind: 'success' | 'error';
  message: string;
}

export interface ToastContextValue {
  show(kind: 'success' | 'error', message: string): void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((kind: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, kind, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className={styles.container} aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`${styles.toast} ${styles[toast.kind]}`}
          >
            <span className={styles.icon}>
              {toast.kind === 'success' ? (
                <Icon name="check" size={16} />
              ) : (
                <Icon name="alert" size={16} />
              )}
            </span>
            <span className={styles.message}>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful fallback if used outside provider
    return {
      show: (kind: 'success' | 'error', message: string) => {
        // Fallback or console log
        if (typeof console !== 'undefined') {
          console.info(`[Toast ${kind}] ${message}`);
        }
      },
    };
  }
  return ctx;
}

export function Toast({
  kind,
  message,
}: {
  kind: 'success' | 'error';
  message: string;
}): React.ReactElement {
  return (
    <div role="status" className={`${styles.toast} ${styles[kind]}`}>
      <span className={styles.icon}>
        {kind === 'success' ? <Icon name="check" size={16} /> : <Icon name="alert" size={16} />}
      </span>
      <span className={styles.message}>{message}</span>
    </div>
  );
}
