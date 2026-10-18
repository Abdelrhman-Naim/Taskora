import { Locale, NUMBERING } from './config';
import { daysBetween } from '@/lib/dates';
import { MessageKey } from './en';

export function formatDueDate(d: string | null, locale: Locale): string {
  if (!d) return '';
  const parts = d.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return d;

  const [y, m, day] = parts;
  const date = new Date(Date.UTC(y, m - 1, day));

  const dtf = new Intl.DateTimeFormat(`${locale}-u-nu-latn-ca-gregory`, {
    timeZone: 'UTC',
    calendar: 'gregory',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return dtf.format(date);
}

export function formatNumber(n: number, locale: Locale): string {
  const nf = new Intl.NumberFormat(`${locale}-u-nu-${NUMBERING}`);
  return nf.format(n);
}

export function formatRelativeDay(
  due: string,
  today: string,
  t: (k: MessageKey) => string,
  tp: (k: string, count: number) => string
): string {
  const diff = daysBetween(today, due);
  if (diff === 0) {
    return t('common.today');
  }
  if (diff === 1) {
    return t('common.tomorrow');
  }
  if (diff > 1) {
    return tp('relative.inDays', diff);
  }
  return tp('relative.overdueDays', Math.abs(diff));
}

