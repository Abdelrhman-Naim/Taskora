import type { Metadata, Viewport } from 'next';
import { cookies, headers } from 'next/headers';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';
import { AuthProviderClient } from '@/components/auth/AuthProviderClient';
import { parseTheme, THEME_COOKIE } from '@/theme/config';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { resolveLocale, dirOf, LOCALE_COOKIE } from '@/i18n/config';
import { I18nProvider } from '@/i18n/I18nProvider';
import { en } from '@/i18n/en';
import { ar } from '@/i18n/ar';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--f-inter',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--f-cairo',
});

const fontClasses = `${inter.variable} ${cairo.variable}`;

export async function generateViewport(): Promise<Viewport> {
  return {
    colorScheme: 'light dark',
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: '#F8FAFC' },
      { media: '(prefers-color-scheme: dark)', color: '#0B1118' },
    ],
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const headersList = await headers();
  const locale = resolveLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headersList.get('accept-language') ?? undefined
  );
  const dict = locale === 'ar' ? ar : en;

  return {
    title: dict['app.name'],
    description: dict['app.description'],
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const headersList = await headers();
  const locale = resolveLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headersList.get('accept-language') ?? undefined
  );
  const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <html
      lang={locale}
      dir={dirOf(locale)}
      data-theme={theme === 'system' ? undefined : theme}
      className={fontClasses}
    >
      <body>
        <ThemeProvider initialTheme={theme}>
          <I18nProvider initialLocale={locale}>
            <AuthProviderClient>{children}</AuthProviderClient>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
