import { describe, it, expect } from 'vitest';
import {
  todayString,
  isOverdue,
  toDate,
  formatDueDate,
  APP_TIME_ZONE,
} from '@/lib/dates';

describe('dates helper', () => {
  it('has Asia/Riyadh as default time zone', () => {
    expect(APP_TIME_ZONE).toBe('Asia/Riyadh');
  });

  it('computes todayString in Asia/Riyadh accurately across UTC day boundaries', () => {
    // 2026-10-17 21:30:00 UTC is 2026-10-18 00:30:00 in Asia/Riyadh (UTC+3)
    const now = new Date('2026-10-17T21:30:00Z');
    expect(todayString(now)).toBe('2026-10-18');
  });

  it('calculates isOverdue correctly', () => {
    const today = '2026-10-18';

    // yesterday's date and not done -> overdue
    expect(isOverdue({ dueDate: '2026-10-17', status: 'todo' }, today)).toBe(true);
    expect(isOverdue({ dueDate: '2026-10-17', status: 'in_progress' }, today)).toBe(true);

    // today's date -> not overdue
    expect(isOverdue({ dueDate: '2026-10-18', status: 'todo' }, today)).toBe(false);

    // future date -> not overdue
    expect(isOverdue({ dueDate: '2026-10-19', status: 'todo' }, today)).toBe(false);

    // null due date -> not overdue
    expect(isOverdue({ dueDate: null, status: 'todo' }, today)).toBe(false);

    // past due date but status is done -> not overdue
    expect(isOverdue({ dueDate: '2020-01-01', status: 'done' }, today)).toBe(false);
  });

  it('handles toDate conversion for various timestamp representations', () => {
    const testDate = new Date('2026-10-17T12:00:00Z');

    // Firestore Timestamp-like object with toDate method
    const firestoreTimestamp = { toDate: () => testDate };
    expect(toDate(firestoreTimestamp)).toEqual(testDate);

    // Native Date
    expect(toDate(testDate)).toEqual(testDate);

    // Null or undefined
    expect(toDate(null)).toBeNull();
    expect(toDate(undefined)).toBeNull();
    expect(toDate('invalid')).toBeNull();
  });

  it('formats due date nicely', () => {
    expect(formatDueDate(null)).toBe('No due date');
    expect(formatDueDate('2026-10-18')).toBe('Oct 18, 2026');
  });
});
