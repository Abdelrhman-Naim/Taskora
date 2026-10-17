'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '@/hooks/useAuth';

export function AuthProviderClient({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
