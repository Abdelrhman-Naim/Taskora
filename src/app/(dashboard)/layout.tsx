'use client';

import React, { ReactNode } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { ToastProvider } from '@/components/ui/Toast';

export default function DashboardLayout({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <ToastProvider>
      <AppShell>
        {children}
      </AppShell>
    </ToastProvider>
  );
}
