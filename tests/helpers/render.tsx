import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ThemeProvider, Theme } from '@/theme/ThemeProvider';
import { I18nProvider } from '@/i18n/I18nProvider';
import { Locale } from '@/i18n/config';

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: Locale;
  theme?: Theme;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    locale = 'en',
    theme = 'light',
    ...options
  }: RenderWithProvidersOptions = {}
): RenderResult {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider initialTheme={theme}>
        <I18nProvider initialLocale={locale}>{children}</I18nProvider>
      </ThemeProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
