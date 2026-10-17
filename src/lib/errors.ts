export type AppErrorCode =
  | 'validation'
  | 'permission-denied'
  | 'not-found'
  | 'network'
  | 'unauthenticated'
  | 'email-in-use'
  | 'invalid-credentials'
  | 'weak-password'
  | 'unknown-user'
  | 'duplicate-member'
  | 'too-many-tasks'
  | 'unknown';

export class AppError extends Error {
  constructor(
    public code: AppErrorCode,
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function toAppError(e: unknown): AppError {
  if (e instanceof AppError) {
    return e;
  }

  const errObj =
    typeof e === 'object' && e !== null
      ? (e as { code?: string; message?: string })
      : {};
  const code = errObj.code || '';

  if (code === 'auth/email-already-in-use') {
    return new AppError('email-in-use', 'An account with this email already exists.');
  }

  if (
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-credential' ||
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-login-credentials'
  ) {
    return new AppError('invalid-credentials', 'Invalid email or password.');
  }

  if (code === 'auth/weak-password') {
    return new AppError('weak-password', 'Password is too weak. Must be at least 6 characters.');
  }

  if (code === 'permission-denied' || code === 'auth/permission-denied') {
    return new AppError('permission-denied', 'You do not have permission to perform this action.');
  }

  if (
    code === 'unavailable' ||
    code === 'network-request-failed' ||
    code === 'auth/network-request-failed'
  ) {
    return new AppError('network', 'Network connection unavailable. Please check your connection and try again.');
  }

  return new AppError('unknown', 'An unexpected error occurred. Please try again.');
}
