import { describe, it, expect } from 'vitest';
import {
  todayString,
  isOverdue,
  toDate,
  formatDueDate,
  nextDueDate,
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

  describe('nextDueDate (Task 55)', () => {
    it('advances daily by 1 day', () => {
      expect(nextDueDate('2026-10-18', 'daily', '2026-10-18')).toBe('2026-10-19');
    });

    it('advances weekly by 7 days', () => {
      expect(nextDueDate('2026-10-18', 'weekly', '2026-10-18')).toBe('2026-10-25');
    });

    it('advances monthly clamping to the end of the month', () => {
      expect(nextDueDate('2026-01-31', 'monthly', '2026-01-31')).toBe('2026-02-28');
      expect(nextDueDate('2028-01-31', 'monthly', '2028-01-31')).toBe('2028-02-29');
      expect(nextDueDate('2026-12-15', 'monthly', '2026-12-15')).toBe('2027-01-15');
    });

    it('advances to present if task is completed far past due date', () => {
      expect(nextDueDate('2026-01-10', 'weekly', '2026-10-18')).toBe('2026-10-24');
    });

    it('throws validation error for invalid date', () => {
      expect(() => nextDueDate('2026-02-30', 'daily')).toThrow();
      expect(() => nextDueDate('invalid-date', 'daily')).toThrow();
    });
  });
});
