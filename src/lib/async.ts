import { AppError } from './errors';

/**
 * Wraps an async write operation with an offline check and timeout guard.
 * Rejects immediately with AppError('network') if offline, or if the operation
 * exceeds the timeout duration.
 */
export async function withWriteGuard<T>(
  op: () => Promise<T>,
  timeoutMs = 8000
): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new AppError(
      'network',
      'You are currently offline. Please check your internet connection.'
    );
  }

  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(
        new AppError(
          'network',
          'Operation timed out. Please check your internet connection and try again.'
        )
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([op(), timeoutPromise]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}
