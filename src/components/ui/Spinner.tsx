import React from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './Button.module.css';

interface SpinnerProps {
  size?: number;
  label?: string;
}

export function Spinner({ size = 28, label }: SpinnerProps): React.ReactElement {
  const { t } = useI18n();
  const textLabel = label || t('common.loading');
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
      <span
        className={styles.spinner}
        style={{
          inlineSize: size,
          blockSize: size,
          borderColor: 'var(--accent)',
          borderInlineEndColor: 'transparent',
          borderWidth: Math.max(2, Math.round(size / 10)),
        }}
      />
      <span className="sr-only" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
        {textLabel}
      </span>
    </div>
  );
}
