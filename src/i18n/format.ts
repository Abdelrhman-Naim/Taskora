import { Locale, NUMBERING } from './config';

export function formatDueDate(d: string | null, locale: Locale): string {
  if (!d) return '';
  const parts = d.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return d;

  const [y, m, day] = parts;
  const date = new Date(Date.UTC(y, m - 1, day));

  const dtf = new Intl.DateTimeFormat(`${locale}-u-nu-${NUMBERING}`, {
    timeZone: 'UTC',
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
