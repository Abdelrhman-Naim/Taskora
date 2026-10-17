export const LOCALES = ['en', 'ar'] as const;
export type Locale = typeof LOCALES[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'tf-locale';
export const NUMBERING = 'latn';

export function dirOf(l: Locale): 'ltr' | 'rtl' {
  return l === 'ar' ? 'rtl' : 'ltr';
}

export function isValidLocale(val: unknown): val is Locale {
  return val === 'en' || val === 'ar';
}

export function resolveLocale(cookieValue?: string, acceptLanguage?: string): Locale {
  if (cookieValue && isValidLocale(cookieValue)) {
    return cookieValue;
  }

  if (acceptLanguage) {
    const parts = acceptLanguage
      .split(',')
      .map((item) => {
        const [tag, qPart] = item.trim().split(';');
        const q = qPart ? parseFloat(qPart.replace('q=', '')) : 1.0;
        return { tag: tag.trim().toLowerCase(), q };
      })
      .sort((a, b) => b.q - a.q);

    for (const { tag } of parts) {
      if (tag === 'ar' || tag.startsWith('ar-')) {
        return 'ar';
      }
      if (tag === 'en' || tag.startsWith('en-')) {
        return 'en';
      }
    }
  }

  return DEFAULT_LOCALE;
}
