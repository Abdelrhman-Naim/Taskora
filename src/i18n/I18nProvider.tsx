'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Locale, dirOf, LOCALE_COOKIE, DEFAULT_LOCALE } from './config';
import { en, MessageKey } from './en';
import { ar } from './ar';
import { translate, translatePlural } from './translate';
import { formatDueDate as fmtDueDate, formatNumber as fmtNumber } from './format';

export type PluralKey = 'tasks.count' | 'projects.count' | 'members.count' | string;

export interface I18nContextValue {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  t(key: MessageKey, params?: Record<string, string | number>): string;
  tp(key: PluralKey, count: number, params?: Record<string, string | number>): string;
  setLocale(l: Locale): void;
  formatDueDate(iso: string | null): string;
  formatNumber(n: number): string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const dictionaries = {
  en,
  ar,
};

export function I18nProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}): React.ReactElement {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const dir = dirOf(locale);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    if (typeof document !== 'undefined') {
      document.cookie = `${LOCALE_COOKIE}=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = nextLocale;
      document.documentElement.dir = dirOf(nextLocale);
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = dir;
    }
  }, [locale, dir]);

  const value = useMemo<I18nContextValue>(() => {
    const messages = dictionaries[locale] || dictionaries.en;
    return {
      locale,
      dir,
      t: (key: MessageKey, params?: Record<string, string | number>) =>
        translate(messages, key, params),
      tp: (key: PluralKey, count: number, params?: Record<string, string | number>) =>
        translatePlural(messages, locale, key, count, params),
      setLocale,
      formatDueDate: (iso: string | null) => fmtDueDate(iso, locale),
      formatNumber: (n: number) => fmtNumber(n, locale),
    };
  }, [locale, dir]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
