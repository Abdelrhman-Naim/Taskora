'use client';

import React, { useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './LabelsInput.module.css';

export interface LabelsInputProps {
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
  id?: string;
}

export function LabelsInput({
  value,
  onChange,
  max = 5,
  id = 'labels-input-field',
}: LabelsInputProps): React.ReactElement {
  const { t } = useI18n();
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addLabel = (raw: string) => {
    setError(null);
    const trimmed = raw.replace(/,/g, '').trim();
    if (!trimmed) return;

    // Check duplicate case-insensitively
    const isDuplicate = value.some(
      (l) => l.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setInputValue('');
      return;
    }

    if (value.length >= max) {
      setError(t('validation.labels.limit'));
      return;
    }

    onChange([...value, trimmed]);
    setInputValue('');
  };

  const removeLabel = (index: number) => {
    setError(null);
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addLabel(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeLabel(value.length - 1);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.chipBox}>
        {value.map((label, idx) => (
          <span key={idx} className={styles.chip}>
            <bdi className={styles.chipText}>{label}</bdi>
            <button
              type="button"
              className={styles.removeChipBtn}
              onClick={() => removeLabel(idx)}
              aria-label={`Remove label ${label}`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </span>
        ))}
        <input
          id={id}
          data-testid="labels-input-field"
          type="text"
          className={styles.input}
          placeholder={value.length === 0 ? t('task.labels.placeholder') : ''}
          value={inputValue}
          onChange={(e) => {
            setError(null);
            setInputValue(e.target.value);
          }}
          onKeyDown={handleKeyDown}
        />
      </div>
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
}
