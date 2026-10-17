'use client';

import React, { useRef } from 'react';
import { useTheme, Theme } from './ThemeProvider';
import { useI18n } from '@/i18n/I18nProvider';
import { MessageKey } from '@/i18n/en';
import styles from './ThemeToggle.module.css';

interface ThemeOption {
  value: Theme;
  key: MessageKey;
  icon: React.ReactNode;
}

const options: ThemeOption[] = [
  {
    value: 'system',
    key: 'theme.system',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    value: 'light',
    key: 'theme.light',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
  },
  {
    value: 'dark',
    key: 'theme.dark',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
  },
];

export function ThemeToggle(): React.ReactElement {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % options.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + options.length) % options.length;
    }

    if (nextIndex !== index) {
      const nextTheme = options[nextIndex].value;
      setTheme(nextTheme);
      buttonsRef.current[nextIndex]?.focus();
    }
  };

  return (
    <div className={styles.toggle} role="radiogroup" aria-label={t('nav.theme')}>
      {options.map((opt, i) => {
        const isSelected = theme === opt.value;
        return (
          <button
            key={opt.value}
            ref={(el) => { buttonsRef.current[i] = el; }}
            type="button"
            role="radio"
            data-theme-value={opt.value}
            aria-checked={isSelected}
            aria-label={t(opt.key)}
            tabIndex={isSelected ? 0 : -1}
            className={`${styles.option} ${isSelected ? styles.selected : ''}`}
            onClick={() => setTheme(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
          >
            {opt.icon}
          </button>
        );
      })}
    </div>
  );
}
