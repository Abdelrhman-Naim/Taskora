import { describe, it, expect } from 'vitest';
import {
  projectInputSchema,
  taskInputSchema,
  registerSchema,
  emailSchema,
  fieldErrors,
} from '@/lib/validation';

describe('projectInputSchema', () => {
  it('rejects name shorter than 3 characters', () => {
    const res = projectInputSchema.safeParse({ name: 'ab', description: '' });
    expect(res.success).toBe(false);
  });

  it('accepts name with 3 characters', () => {
    const res = projectInputSchema.safeParse({ name: 'abc', description: '' });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.name).toBe('abc');
    }
  });

  it('accepts name with 80 characters', () => {
    const res = projectInputSchema.safeParse({ name: 'a'.repeat(80), description: '' });
    expect(res.success).toBe(true);
  });

  it('rejects name with 81 characters', () => {
    const res = projectInputSchema.safeParse({ name: 'a'.repeat(81), description: '' });
    expect(res.success).toBe(false);
  });

  it('rejects whitespace-only name after trim', () => {
    const res = projectInputSchema.safeParse({ name: '   ', description: '' });
    expect(res.success).toBe(false);
  });

  it('accepts description up to 1000 characters', () => {
    const res = projectInputSchema.safeParse({ name: 'Valid Project', description: 'd'.repeat(1000) });
    expect(res.success).toBe(true);
  });

  it('rejects description longer than 1000 characters', () => {
    const res = projectInputSchema.safeParse({ name: 'Valid Project', description: 'd'.repeat(1001) });
    expect(res.success).toBe(false);
  });

  it('defaults missing description to empty string', () => {
    const res = projectInputSchema.safeParse({ name: 'Valid Project' });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.description).toBe('');
    }
  });
});

describe('taskInputSchema', () => {
  it('rejects title shorter than 3 chars or longer than 120 chars or whitespace', () => {
    expect(taskInputSchema.safeParse({ title: 'ab', description: '', priority: 'low', assigneeId: null, dueDate: null }).success).toBe(false);
    expect(taskInputSchema.safeParse({ title: 'abc', description: '', priority: 'low', assigneeId: null, dueDate: null }).success).toBe(true);
    expect(taskInputSchema.safeParse({ title: 'a'.repeat(120), description: '', priority: 'low', assigneeId: null, dueDate: null }).success).toBe(true);
    expect(taskInputSchema.safeParse({ title: 'a'.repeat(121), description: '', priority: 'low', assigneeId: null, dueDate: null }).success).toBe(false);
    expect(taskInputSchema.safeParse({ title: '   ', description: '', priority: 'low', assigneeId: null, dueDate: null }).success).toBe(false);
  });

  it('rejects invalid priority', () => {
    const res = taskInputSchema.safeParse({
      title: 'Task Title',
      description: '',
      priority: 'urgent',
      assigneeId: null,
      dueDate: null,
    });
    expect(res.success).toBe(false);
  });

  it('validates dueDate correctly', () => {
    // invalid date values
    expect(taskInputSchema.safeParse({
      title: 'Task Title',
      description: '',
      priority: 'low',
      assigneeId: null,
      dueDate: '2026-13-40',
    }).success).toBe(false);

    // valid format & calendar date
    expect(taskInputSchema.safeParse({
      title: 'Task Title',
      description: '',
      priority: 'low',
      assigneeId: null,
      dueDate: '2026-10-17',
    }).success).toBe(true);

    // null allowed
    expect(taskInputSchema.safeParse({
      title: 'Task Title',
      description: '',
      priority: 'low',
      assigneeId: null,
      dueDate: null,
    }).success).toBe(true);
  });

  it('allows assigneeId to be string or null', () => {
    expect(taskInputSchema.safeParse({
      title: 'Task Title',
      description: '',
      priority: 'medium',
      assigneeId: 'user123',
      dueDate: null,
    }).success).toBe(true);

    expect(taskInputSchema.safeParse({
      title: 'Task Title',
      description: '',
      priority: 'medium',
      assigneeId: null,
      dueDate: null,
    }).success).toBe(true);
  });

  it('validates checklist limits and item text lengths', () => {
    const validItems = Array.from({ length: 20 }, (_, i) => ({
      id: `item-${i}`,
      text: `Item ${i + 1}`,
      done: false,
    }));

    // Up to 20 items accepted
    const res20 = taskInputSchema.safeParse({
      title: 'Task Title',
      priority: 'low',
      checklist: validItems,
    });
    expect(res20.success).toBe(true);

    // 21 items rejected with validation.checklist.limit
    const res21 = taskInputSchema.safeParse({
      title: 'Task Title',
      priority: 'low',
      checklist: [...validItems, { id: 'item-21', text: 'Extra item', done: false }],
    });
    expect(res21.success).toBe(false);
    if (!res21.success) {
      const errors = fieldErrors(res21.error);
      expect(errors.checklist).toBe('validation.checklist.limit');
    }

    // Empty item text rejected
    const resEmpty = taskInputSchema.safeParse({
      title: 'Task Title',
      priority: 'low',
      checklist: [{ id: '1', text: '   ', done: false }],
    });
    expect(resEmpty.success).toBe(false);

    // Item text > 120 chars rejected
    const resLong = taskInputSchema.safeParse({
      title: 'Task Title',
      priority: 'low',
      checklist: [{ id: '1', text: 'a'.repeat(121), done: false }],
    });
    expect(resLong.success).toBe(false);
  });

  it('validates labels limit, length, and case-insensitive uniqueness', () => {
    // Up to 5 labels accepted
    const res5 = taskInputSchema.safeParse({
      title: 'Task Title',
      priority: 'low',
      labels: ['bug', 'frontend', 'ui', 'urgent', 'release'],
    });
    expect(res5.success).toBe(true);

    // 6 labels rejected with validation.labels.limit
    const res6 = taskInputSchema.safeParse({
      title: 'Task Title',
      priority: 'low',
      labels: ['bug', 'frontend', 'ui', 'urgent', 'release', 'v2'],
    });
    expect(res6.success).toBe(false);
    if (!res6.success) {
      const errors = fieldErrors(res6.error);
      expect(errors.labels).toBe('validation.labels.limit');
    }

    // Label length 1..24
    expect(taskInputSchema.safeParse({
      title: 'Task Title',
      priority: 'low',
      labels: ['a'.repeat(24)],
    }).success).toBe(true);

    expect(taskInputSchema.safeParse({
      title: 'Task Title',
      priority: 'low',
      labels: ['a'.repeat(25)],
    }).success).toBe(false);

    // Duplicate labels case-insensitive rejected
    const resDup = taskInputSchema.safeParse({
      title: 'Task Title',
      priority: 'low',
      labels: ['Bug', 'bug'],
    });
    expect(resDup.success).toBe(false);
  });

  it('validates recurrence and requires dueDate when recurrence is not none', () => {
    // Valid recurrence with dueDate
    expect(taskInputSchema.safeParse({
      title: 'Task Title',
      priority: 'low',
      dueDate: '2026-10-25',
      recurrence: 'weekly',
    }).success).toBe(true);

    // recurrence='none' without dueDate is valid
    expect(taskInputSchema.safeParse({
      title: 'Task Title',
      priority: 'low',
      dueDate: null,
      recurrence: 'none',
    }).success).toBe(true);

    // recurrence !== 'none' without dueDate is rejected with validation.recurrence.needsDueDate
    const resNoDue = taskInputSchema.safeParse({
      title: 'Task Title',
      priority: 'low',
      dueDate: null,
      recurrence: 'daily',
    });
    expect(resNoDue.success).toBe(false);
    if (!resNoDue.success) {
      const errors = fieldErrors(resNoDue.error);
      expect(errors.recurrence).toBe('validation.recurrence.needsDueDate');
    }

    // Invalid recurrence value rejected
    const resInvalid = taskInputSchema.safeParse({
      title: 'Task Title',
      priority: 'low',
      recurrence: 'yearly',
    });
    expect(resInvalid.success).toBe(false);
  });
});

describe('registerSchema & emailSchema', () => {
  it('rejects invalid email', () => {
    expect(emailSchema.safeParse('abc').success).toBe(false);
    expect(emailSchema.safeParse('user@example.com').success).toBe(true);
  });

  it('validates register input password length and name', () => {
    expect(registerSchema.safeParse({ name: 'User', email: 'user@example.com', password: '123' }).success).toBe(false);
    expect(registerSchema.safeParse({ name: 'User', email: 'user@example.com', password: '12345' }).success).toBe(false);
    expect(registerSchema.safeParse({ name: 'User', email: 'user@example.com', password: '123456' }).success).toBe(true);
    expect(registerSchema.safeParse({ name: '   ', email: 'user@example.com', password: '123456' }).success).toBe(false);
  });
});

describe('fieldErrors', () => {
  it('returns a record of field error message keys', () => {
    const res = registerSchema.safeParse({ name: '', email: 'notanemail', password: '12' });
    expect(res.success).toBe(false);
    if (!res.success) {
      const errors = fieldErrors(res.error);
      expect(errors.name).toBe('validation.name.required');
      expect(errors.email).toBe('validation.email.invalid');
      expect(errors.password).toBe('validation.password.length');
    }
  });
});
