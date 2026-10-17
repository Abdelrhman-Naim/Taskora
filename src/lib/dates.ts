import { Task } from '@/types';

export const APP_TIME_ZONE = 'Asia/Riyadh';

/**
 * Returns 'YYYY-MM-DD' representation of the given or current date in the application timezone.
 */
export function todayString(now: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
}

/**
 * A task is overdue if dueDate is set, earlier than today in the application timezone,
 * and status is NOT done.
 */
export function isOverdue(
  t: Pick<Task, 'dueDate' | 'status'>,
  today: string = todayString()
): boolean {
  if (!t.dueDate || t.status === 'done') {
    return false;
  }
  return t.dueDate < today;
}

/**
 * Safely converts Firestore Timestamp, Date, or unknown to Date | null.
 */
export function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: () => unknown }).toDate === 'function') {
    try {
      const d = (v as { toDate: () => unknown }).toDate();
      return d instanceof Date && !isNaN(d.getTime()) ? d : null;
    } catch {
      return null;
    }
  }
  if (v instanceof Date) {
    return isNaN(v.getTime()) ? null : v;
  }
  return null;
}

/**
 * Formats YYYY-MM-DD string into a standard display label.
 */
export function formatDueDate(d: string | null): string {
  if (!d) return 'No due date';
  const parts = d.split('-');
  if (parts.length !== 3) return d;
  const [year, month, day] = parts.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (isNaN(date.getTime())) return d;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
