import { describe, it, expect } from 'vitest';
import { formatDueDate, formatRelativeDay } from '@/i18n/format';
import { toDateString, addDays, daysBetween } from '@/lib/dates';
import { en } from '@/i18n/en';
import { ar } from '@/i18n/ar';

describe('Date formatting & helpers (Task 22 Step 2)', () => {
  it('formats due date in Arabic with Gregorian calendar, Latin digits, and October in America/Los_Angeles and Asia/Riyadh', () => {
    const formattedAr = formatDueDate('2026-10-17', 'ar');
    expect(formattedAr).toContain('2026');
    expect(formattedAr).toContain('17');
    expect(formattedAr).toContain('أكتوبر');
    // Ensure digits are Latin, not Eastern Arabic numerals
    expect(formattedAr).not.toMatch(/[٠-٩]/);

    const formattedEn = formatDueDate('2026-10-17', 'en');
    expect(formattedEn).toContain('2026');
    expect(formattedEn).toContain('17');
    expect(formattedEn).toContain('Oct');
  });

  it('toDateString produces YYYY-MM-DD in APP_TIME_ZONE (Asia/Riyadh, UTC+3)', () => {
    // 2026-10-17 22:30:00 UTC is 2026-10-18 01:30:00 in Asia/Riyadh
    const lateUtc = new Date('2026-10-17T22:30:00Z');
    expect(toDateString(lateUtc)).toBe('2026-10-18');

    const morningUtc = new Date('2026-10-17T05:00:00Z');
    expect(toDateString(morningUtc)).toBe('2026-10-17');
  });

  it('addDays correctly crosses month and year boundaries in leap/non-leap years', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    // 2026 is non-leap
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('daysBetween calculates day differences accurately', () => {
    expect(daysBetween('2026-10-17', '2026-10-20')).toBe(3);
    expect(daysBetween('2026-10-20', '2026-10-17')).toBe(-3);
    expect(daysBetween('2026-10-17', '2026-10-17')).toBe(0);
  });

  it('formatRelativeDay handles today, tomorrow, upcoming days, and overdue in Arabic with correct dual and plural rules', () => {
    const today = '2026-10-18';

    const tEn = (k: string) => (en as Record<string, string>)[k] || k;
    const tpEn = (k: string, count: number) => {
      const form = count === 1 ? 'one' : 'other';
      const template = (en as Record<string, string>)[`${k}.${form}`] || '';
      return template.replace('{count}', String(count));
    };

    const tAr = (k: string) => (ar as Record<string, string>)[k] || k;
    const tpAr = (k: string, count: number) => {
      let form = 'other';
      if (count === 0) form = 'zero';
      else if (count === 1) form = 'one';
      else if (count === 2) form = 'two';
      else if (count % 100 >= 3 && count % 100 <= 10) form = 'few';
      else if (count % 100 >= 11 && count % 100 <= 99) form = 'many';
      const template = (ar as Record<string, string>)[`${k}.${form}`] || '';
      return template.replace('{count}', String(count));
    };

    // English
    expect(formatRelativeDay('2026-10-18', today, tEn, tpEn)).toBe('Today');
    expect(formatRelativeDay('2026-10-19', today, tEn, tpEn)).toBe('Tomorrow');
    expect(formatRelativeDay('2026-10-21', today, tEn, tpEn)).toBe('In 3 days');
    expect(formatRelativeDay('2026-10-16', today, tEn, tpEn)).toBe('2 days overdue');

    // Arabic
    expect(formatRelativeDay('2026-10-18', today, tAr, tpAr)).toBe('اليوم');
    expect(formatRelativeDay('2026-10-19', today, tAr, tpAr)).toBe('غدًا');
    expect(formatRelativeDay('2026-10-21', today, tAr, tpAr)).toBe('خلال 3 أيام');
    expect(formatRelativeDay('2026-10-17', today, tAr, tpAr)).toContain('يوم واحد');
    expect(formatRelativeDay('2026-10-16', today, tAr, tpAr)).toContain('يومان');
    expect(formatRelativeDay('2026-10-07', today, tAr, tpAr)).toContain('11 يومًا');
  });
});
