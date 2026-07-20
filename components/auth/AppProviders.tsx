'use client';

import React from 'react';

import AuthSessionWatchdog from './AuthSessionWatchdog';
import { AuthProvider, SessionGuard } from '@/app/context/AuthProvider';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthSessionWatchdog />
      <SessionGuard>{children}</SessionGuard>
    </AuthProvider>
  );
}
