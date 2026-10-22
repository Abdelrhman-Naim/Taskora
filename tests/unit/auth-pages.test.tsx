import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render';
import LoginPage from '@/app/(auth)/login/page';
import RegisterPage from '@/app/(auth)/register/page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/login',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
  }),
}));

describe('Auth Pages — Obsidian Ledger Layout', () => {
  it('LoginPage renders split layout with identity rail, champagne rule, and form plane', () => {
    renderWithProviders(<LoginPage />);

    const rail = screen.getByTestId('auth-identity-rail');
    const formPlane = screen.getByTestId('auth-form-plane');
    const card = screen.getByTestId('auth-card');
    const emailInput = screen.getByTestId('auth-email-input');
    const passwordInput = screen.getByTestId('auth-password-input');
    const submitBtn = screen.getByTestId('auth-submit-btn');

    expect(rail).toBeDefined();
    expect(formPlane).toBeDefined();
    expect(card).toBeDefined();
    expect(emailInput).toBeDefined();
    expect(passwordInput).toBeDefined();
    expect(submitBtn).toBeDefined();
  });

  it('RegisterPage renders split layout with identity rail and form plane', () => {
    renderWithProviders(<RegisterPage />);

    const rail = screen.getByTestId('auth-identity-rail');
    const formPlane = screen.getByTestId('auth-form-plane');
    const card = screen.getByTestId('auth-card');
    const nameInput = screen.getByTestId('auth-name-input');
    const emailInput = screen.getByTestId('auth-email-input');
    const submitBtn = screen.getByTestId('auth-submit-btn');

    expect(rail).toBeDefined();
    expect(formPlane).toBeDefined();
    expect(card).toBeDefined();
    expect(nameInput).toBeDefined();
    expect(emailInput).toBeDefined();
    expect(submitBtn).toBeDefined();
  });

  it('renders identity rail with Arabic text and dir="rtl" when locale is ar', () => {
    renderWithProviders(<LoginPage />, { locale: 'ar' });

    const rail = screen.getByTestId('auth-identity-rail');
    expect(rail.getAttribute('dir')).toBe('rtl');
    expect(screen.getByText('دقة واحترافية متقدمة لفرق العمل الطموحة.')).toBeDefined();
    expect(screen.getByText('خصوصية وأمان مقيّد')).toBeDefined();
  });

  it('RegisterPage renders identity rail with Arabic text and dir="rtl" when locale is ar', () => {
    renderWithProviders(<RegisterPage />, { locale: 'ar' });

    const rail = screen.getByTestId('auth-identity-rail');
    expect(rail.getAttribute('dir')).toBe('rtl');
    expect(screen.getByText('تنظيم مهام احترافي وموثوق لفرق العمل المتميزة.')).toBeDefined();
    expect(screen.getByText('تهيئة بيئة العمل')).toBeDefined();
  });
});
