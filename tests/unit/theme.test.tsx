import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme, ThemeToggle, THEME_COOKIE } from '@/theme/ThemeProvider';

function TestConsumer() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('system')}>Set System</button>
    </div>
  );
}

describe('ThemeProvider and ThemeToggle', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.cookie = `${THEME_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });

  it('initializes with default or provided theme', () => {
    render(
      <ThemeProvider initialTheme="system">
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme').textContent).toBe('system');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('setTheme("dark") sets data-theme="dark" on root and writes cookie', () => {
    render(
      <ThemeProvider initialTheme="system">
        <TestConsumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('Set Dark'));
    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.cookie).toContain(`${THEME_COOKIE}=dark`);
  });

  it('setTheme("system") removes data-theme attribute on root and writes cookie', () => {
    render(
      <ThemeProvider initialTheme="dark">
        <TestConsumer />
      </ThemeProvider>
    );

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    fireEvent.click(screen.getByText('Set System'));
    expect(screen.getByTestId('current-theme').textContent).toBe('system');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    expect(document.cookie).toContain(`${THEME_COOKIE}=system`);
  });

  it('ThemeToggle renders a radiogroup with 3 options and accessible labels', () => {
    render(
      <ThemeProvider initialTheme="system">
        <ThemeToggle />
      </ThemeProvider>
    );

    const group = screen.getByRole('radiogroup');
    expect(group).toBeInTheDocument();

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);

    // Initial system theme selected
    const systemRadio = screen.getByRole('radio', { name: /system/i });
    expect(systemRadio).toHaveAttribute('aria-checked', 'true');

    const darkRadio = screen.getByRole('radio', { name: /dark/i });
    expect(darkRadio).toHaveAttribute('aria-checked', 'false');

    // Click dark option
    fireEvent.click(darkRadio);
    expect(darkRadio).toHaveAttribute('aria-checked', 'true');
    expect(systemRadio).toHaveAttribute('aria-checked', 'false');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('supports keyboard navigation via arrow keys in ThemeToggle', () => {
    render(
      <ThemeProvider initialTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    );

    const lightRadio = screen.getByRole('radio', { name: /light/i });
    lightRadio.focus();

    // Arrow Right moves to next (dark)
    fireEvent.keyDown(lightRadio, { key: 'ArrowRight' });
    const darkRadio = screen.getByRole('radio', { name: /dark/i });
    expect(darkRadio).toHaveAttribute('aria-checked', 'true');

    // Arrow Left moves back
    fireEvent.keyDown(darkRadio, { key: 'ArrowLeft' });
    expect(screen.getByRole('radio', { name: /light/i })).toHaveAttribute('aria-checked', 'true');
  });
});
