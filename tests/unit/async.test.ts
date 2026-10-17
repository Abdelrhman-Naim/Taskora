import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withWriteGuard } from '@/lib/async';
import { AppError } from '@/lib/errors';

describe('withWriteGuard', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  it('resolves successfully if operation completes in time', async () => {
    const op = vi.fn().mockResolvedValue('success');
    const result = await withWriteGuard(op, 5000);
    expect(result).toBe('success');
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('rejects immediately with network error when navigator is offline without calling op', async () => {
    Object.defineProperty(global, 'navigator', {
      value: { onLine: false },
      configurable: true,
      writable: true,
    });

    const op = vi.fn().mockResolvedValue('success');

    await expect(withWriteGuard(op, 5000)).rejects.toThrowError(AppError);
    await expect(withWriteGuard(op, 5000)).rejects.toMatchObject({
      code: 'network',
    });
    expect(op).not.toHaveBeenCalled();
  });

  it('rejects with network error when operation times out', async () => {
    Object.defineProperty(global, 'navigator', {
      value: { onLine: true },
      configurable: true,
      writable: true,
    });

    const hangingOp = () => new Promise<string>(() => {}); // never resolves

    const guardPromise = withWriteGuard(hangingOp, 8000);

    vi.advanceTimersByTime(8001);

    await expect(guardPromise).rejects.toThrowError(AppError);
    await expect(guardPromise).rejects.toMatchObject({
      code: 'network',
    });
  });
});
