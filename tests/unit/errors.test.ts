import { describe, it, expect } from 'vitest';
import { AppError, toAppError } from '@/lib/errors';

describe('errors handling and mapping', () => {
  it('preserves existing AppError', () => {
    const original = new AppError('validation', 'Name is required', { name: 'Name is required' });
    const converted = toAppError(original);
    expect(converted).toBe(original);
    expect(converted.code).toBe('validation');
    expect(converted.fields).toEqual({ name: 'Name is required' });
  });

  it('maps auth/email-already-in-use to email-in-use', () => {
    const err = { code: 'auth/email-already-in-use', message: 'Raw Firebase: email exists' };
    const mapped = toAppError(err);
    expect(mapped.code).toBe('email-in-use');
    expect(mapped.message).not.toContain('Raw Firebase');
  });

  it('maps auth/wrong-password and auth/invalid-credential to invalid-credentials', () => {
    expect(toAppError({ code: 'auth/wrong-password' }).code).toBe('invalid-credentials');
    expect(toAppError({ code: 'auth/invalid-credential' }).code).toBe('invalid-credentials');
    expect(toAppError({ code: 'auth/user-not-found' }).code).toBe('invalid-credentials');
  });

  it('maps auth/weak-password to weak-password', () => {
    expect(toAppError({ code: 'auth/weak-password' }).code).toBe('weak-password');
  });

  it('maps permission-denied', () => {
    expect(toAppError({ code: 'permission-denied' }).code).toBe('permission-denied');
  });

  it('maps unavailable to network', () => {
    expect(toAppError({ code: 'unavailable' }).code).toBe('network');
  });

  it('maps unknown errors without leaking raw error text', () => {
    const err = new Error('Secret database internal stack trace');
    const mapped = toAppError(err);
    expect(mapped.code).toBe('unknown');
    expect(mapped.message).not.toContain('Secret database internal stack trace');
    expect(mapped.message).toBe('An unexpected error occurred. Please try again.');
  });
});
