'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'system' | 'light' | 'dark';
export const THEME_COOKIE = 'tf-theme';

export function parseTheme(val?: string | null): Theme {
  if (val === 'light' || val === 'dark' || val === 'system') return val;
  return 'system';
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function applyThemeToDom(theme: Theme) {
  if (typeof document === 'undefined') return;
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

function writeThemeCookie(theme: Theme) {
  if (typeof document === 'undefined') return;
  const maxAge = 60 * 60 * 24 * 365; // 1 year
  document.cookie = `${THEME_COOKIE}=${theme}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

export function ThemeProvider({
  initialTheme = 'system',
  children,
}: {
  initialTheme?: Theme;
  children: ReactNode;
}): React.ReactElement {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme]);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    applyThemeToDom(nextTheme);
    writeThemeCookie(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}

export { ThemeToggle } from './ThemeToggle';
