import { describe, it, expect } from 'vitest';
import { resolveLocale, dirOf } from '@/i18n/config';
import { translate, translatePlural } from '@/i18n/translate';
import { formatDueDate, formatNumber } from '@/i18n/format';
import { ar } from '@/i18n/ar';

describe('i18n Core: resolveLocale, translate, format and RTL', () => {
  describe('resolveLocale and dirOf', () => {
    it('resolves valid cookie preference first', () => {
      expect(resolveLocale('en', 'ar-SA,ar;q=0.9')).toBe('en');
      expect(resolveLocale('ar', 'en-US,en;q=0.9')).toBe('ar');
    });

    it('resolves from Accept-Language when cookie is missing or invalid', () => {
      expect(resolveLocale(undefined, 'ar-SA,ar;q=0.9,en;q=0.8')).toBe('ar');
      expect(resolveLocale(undefined, 'en-US,en;q=0.9,ar;q=0.5')).toBe('en');
      expect(resolveLocale('invalid', 'ar;q=0.9')).toBe('ar');
    });

    it('falls back to default locale "en" when no supported locale is matched', () => {
      expect(resolveLocale(undefined, 'fr-FR,fr;q=0.9,de;q=0.8')).toBe('en');
      expect(resolveLocale(undefined, undefined)).toBe('en');
    });

    it('returns correct direction for locale', () => {
      expect(dirOf('ar')).toBe('rtl');
      expect(dirOf('en')).toBe('ltr');
    });
  });

  describe('translate and translatePlural', () => {
    const testMessages = {
      'welcome.user': 'Welcome, {name}!',
      'tasks.count.zero': 'No tasks',
      'tasks.count.one': '1 task',
      'tasks.count.other': '{count} tasks',
    };

    it('interpolates named parameters in translate', () => {
      expect(translate(testMessages, 'welcome.user', { name: 'Sarah' })).toBe('Welcome, Sarah!');
    });

    it('returns key without throwing if key is missing', () => {
      expect(translate(testMessages, 'missing.key')).toBe('missing.key');
    });

    it('correctly resolves Arabic plurals (Review Focus #4)', () => {
      expect(translatePlural(ar, 'ar', 'tasks.count', 0)).toContain('مهام');
      expect(translatePlural(ar, 'ar', 'tasks.count', 1)).toContain('مهمة');
      expect(translatePlural(ar, 'ar', 'tasks.count', 2)).toContain('مهمتان');
      expect(translatePlural(ar, 'ar', 'tasks.count', 3)).toContain('3 مهام');
      expect(translatePlural(ar, 'ar', 'tasks.count', 11)).toContain('11 مهمة');
      expect(translatePlural(ar, 'ar', 'tasks.count', 100)).toContain('100 مهمة');
    });

    it('correctly resolves English plurals', () => {
      expect(translatePlural(testMessages, 'en', 'tasks.count', 1)).toBe('1 task');
      expect(translatePlural(testMessages, 'en', 'tasks.count', 5)).toBe('5 tasks');
    });
  });

  describe('formatDueDate and formatNumber', () => {
    it('returns empty string for null due date', () => {
      expect(formatDueDate(null, 'en')).toBe('');
      expect(formatDueDate(null, 'ar')).toBe('');
    });

    it('formats due date with Latin numerals and without timezone shift', () => {
      // 2026-10-17 must show day 17 regardless of local machine timezone
      const enDate = formatDueDate('2026-10-17', 'en');
      const arDate = formatDueDate('2026-10-17', 'ar');

      expect(enDate).toContain('17');
      expect(arDate).toContain('17');
      expect(enDate).toMatch(/Oct|October/);
      expect(arDate).toMatch(/أكتوبر/);

      // Verify Latin numerals (not Eastern Arabic numerals)
      expect(arDate).not.toMatch(/[٠-٩]/);
    });

    it('formats numbers with Latin numerals', () => {
      const formatted = formatNumber(1250, 'ar');
      expect(formatted).toMatch(/1[,.]?250/);
      expect(formatted).not.toMatch(/[٠-٩]/);
    });
  });
});
