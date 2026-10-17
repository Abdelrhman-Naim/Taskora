export type Theme = 'system' | 'light' | 'dark';
export const THEMES: Theme[] = ['system', 'light', 'dark'];
export const THEME_COOKIE = 'tf-theme';

export function parseTheme(val?: string | null): Theme {
  if (val === 'light' || val === 'dark' || val === 'system') return val;
  return 'system';
}
