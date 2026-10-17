'use client';

import React, { useRef } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { Locale } from '@/i18n/config';
import styles from './LocaleSwitcher.module.css';

interface LocaleOption {
  value: Locale;
  label: string;
  shortLabel: string;
  lang: string;
}

export function LocaleSwitcher(): React.ReactElement {
  const { locale, setLocale, t } = useI18n();
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const options: LocaleOption[] = [
    {
      value: 'en',
      label: t('locale.en'),
      shortLabel: 'EN',
      lang: 'en',
    },
    {
      value: 'ar',
      label: t('locale.ar'),
      shortLabel: 'ع',
      lang: 'ar',
    },
  ];

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
      const nextLocale = options[nextIndex].value;
      setLocale(nextLocale);
      buttonsRef.current[nextIndex]?.focus();
    }
  };

  return (
    <div className={styles.switcher} role="radiogroup" aria-label={t('nav.language')}>
      {options.map((opt, i) => {
        const isSelected = locale === opt.value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              buttonsRef.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={opt.label}
            lang={opt.lang}
            tabIndex={isSelected ? 0 : -1}
            className={`${styles.option} ${isSelected ? styles.selected : ''}`}
            onClick={() => setLocale(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
          >
            {opt.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
