import type { Metadata } from 'next';
import './globals.css';
import { AuthProviderClient } from '@/components/auth/AuthProviderClient';

export const metadata: Metadata = {
  title: 'TaskFlow',
  description: 'Task and project management for small teams',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <AuthProviderClient>{children}</AuthProviderClient>
      </body>
    </html>
  );
}
