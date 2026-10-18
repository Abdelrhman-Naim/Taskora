'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import styles from './Dialog.module.css';

export interface DialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  // ConfirmDialog compatibility props
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function Dialog({
  isOpen,
  title,
  description,
  children,
  onClose,
  triggerRef,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDangerous = false,
  onConfirm,
  onCancel,
}: DialogProps): React.ReactElement | null {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const handleClose = useCallback(() => {
    if (onClose) onClose();
    if (onCancel) onCancel();
  }, [onClose, onCancel]);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement;
    const triggerEl = triggerRef?.current;

    const dialogEl = dialogRef.current;
    if (dialogEl) {
      const focusable = dialogEl.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        dialogEl.focus();
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key === 'Tab') {
        const dialogNode = dialogRef.current;
        if (!dialogNode) return;

        const focusable = Array.from(
          dialogNode.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus to triggerRef or previously focused element
      if (triggerEl) {
        triggerEl.focus();
      } else if (previouslyFocusedRef.current) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [isOpen, handleClose, triggerRef]);

  if (!isOpen) return null;

  const descText = description || message;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={descText ? 'dialog-desc' : undefined}
        tabIndex={-1}
        className={styles.dialog}
        data-testid="confirm-dialog"
      >
        <h2 id="dialog-title" className={styles.title}>
          {title}
        </h2>
        {descText && (
          <p id="dialog-desc" className={styles.description}>
            {descText}
          </p>
        )}

        {children ? (
          children
        ) : (
          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleClose}
              data-testid="confirm-dialog-cancel-btn"
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              data-testid="confirm-dialog-confirm-btn"
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: isDangerous ? 'var(--st-overdue-bg)' : 'var(--accent)',
                color: isDangerous ? 'var(--st-overdue-fg)' : 'var(--on-accent)',
                border: isDangerous ? '1px solid var(--st-overdue-fg)' : '1px solid transparent',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              {confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
