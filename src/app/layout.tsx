import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Newsreader, Amiri, Hanken_Grotesk, IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';
import { AuthProviderClient } from '@/components/auth/AuthProviderClient';
import { parseTheme, ThemeProvider } from '@/theme/ThemeProvider';

const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  variable: '--f-newsreader',
});

const amiri = Amiri({
  subsets: ['arabic'],
  display: 'swap',
  weight: ['400', '700'],
  variable: '--f-amiri',
});

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--f-hanken',
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  display: 'swap',
  weight: ['400', '700'],
  variable: '--f-plex-arabic',
});

const fontClasses = `${newsreader.variable} ${amiri.variable} ${hanken.variable} ${plexArabic.variable}`;

export const metadata: Metadata = {
  title: 'Taskora',
  description: 'Task and project management for small teams',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const theme = parseTheme(cookieStore.get('tf-theme')?.value);

  return (
    <html
      lang="en"
      dir="ltr"
      data-theme={theme === 'system' ? undefined : theme}
      className={fontClasses}
    >
      <body>
        <ThemeProvider initialTheme={theme}>
          <AuthProviderClient>{children}</AuthProviderClient>
        </ThemeProvider>
      </body>
    </html>
  );
}
