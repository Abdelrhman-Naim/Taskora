import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render';
import { AuthForm } from '@/components/auth/AuthForm';
import { AppError } from '@/lib/errors';
import * as authService from '@/services/auth';

vi.mock('@/services/auth', () => ({
  resetPassword: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/firebase', () => ({
  getAuthInstance: vi.fn(() => ({})),
  getDb: vi.fn(() => ({})),
}));

describe('AuthForm Component', () => {
  it('renders all required form fields with associated labels and data-testids', () => {
    renderWithProviders(<AuthForm mode="register" onSubmit={vi.fn()} />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /sign up|register/i });

    expect(nameInput).toBeDefined();
    expect(emailInput).toBeDefined();
    expect(passwordInput).toBeDefined();
    expect(submitBtn).toBeDefined();

    expect(nameInput.getAttribute('data-testid')).toBe('auth-name-input');
    expect(emailInput.getAttribute('data-testid')).toBe('auth-email-input');
    expect(passwordInput.getAttribute('data-testid')).toBe('auth-password-input');
    expect(submitBtn.getAttribute('data-testid')).toBe('auth-submit-btn');
  });

  it('shows inline validation error for invalid email without calling onSubmit (TC-02)', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<AuthForm mode="register" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Valid Name' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'abc' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: '123456' } });

    fireEvent.click(screen.getByRole('button', { name: /sign up|register/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeDefined();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows inline validation error for short password', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<AuthForm mode="register" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Valid Name' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: '12345' } });

    fireEvent.click(screen.getByRole('button', { name: /sign up|register/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeDefined();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables submit button and shows loading state during submission', async () => {
    let resolveSubmit: () => void = () => {};
    const pendingSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        })
    );

    renderWithProviders(<AuthForm mode="login" onSubmit={pendingSubmit} />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: '123456' } });

    const submitBtn = screen.getByRole('button', { name: /log in|sign in/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(submitBtn).toBeDisabled();
    });

    resolveSubmit();

    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled();
    });
  });

  it('displays friendly AppError message when service rejects', async () => {
    const failingSubmit = vi.fn().mockRejectedValue(
      new AppError('email-in-use', 'An account with this email already exists.')
    );

    renderWithProviders(<AuthForm mode="register" onSubmit={failingSubmit} />);

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Valid Name' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: '123456' } });

    fireEvent.click(screen.getByRole('button', { name: /sign up|register/i }));

    await waitFor(() => {
      expect(screen.getByText(/account with this email already exists/i)).toBeDefined();
    });
  });

  it('renders forgot password trigger in login mode and opens modal', async () => {
    renderWithProviders(<AuthForm mode="login" onSubmit={vi.fn()} />);

    const forgotTrigger = screen.getByTestId('forgot-password-link');
    expect(forgotTrigger).toBeDefined();

    fireEvent.click(forgotTrigger);

    await waitFor(() => {
      expect(screen.getByTestId('reset-email-input')).toBeDefined();
      expect(screen.getByTestId('reset-submit-btn')).toBeDefined();
    });
  });

  it('submitting forgot password modal sends reset email', async () => {
    renderWithProviders(<AuthForm mode="login" onSubmit={vi.fn()} />);

    fireEvent.click(screen.getByTestId('forgot-password-link'));

    await waitFor(() => {
      expect(screen.getByTestId('reset-email-input')).toBeDefined();
    });

    const resetEmailInput = screen.getByTestId('reset-email-input');
    fireEvent.change(resetEmailInput, { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByTestId('reset-submit-btn'));

    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith(expect.anything(), 'user@example.com');
      expect(screen.getByTestId('reset-success-message')).toBeDefined();
    });
  });
});
