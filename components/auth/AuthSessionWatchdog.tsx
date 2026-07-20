'use client';

import { useCallback, useRef } from 'react';

import { useAuthSession } from '@/hooks/useAuthSession';
import { useAuth } from '@/app/context/AuthProvider';

/**
 * Mounts the Phase 1 session watchdog — pings `/api/auth/session` on interval
 * and forces logout when idle or token expiry is detected server-side.
 */
export default function AuthSessionWatchdog() {
  const { logout, isAuthenticated } = useAuth();
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  const handleForcedLogout = useCallback((reason: string) => {
    logoutRef.current(reason);
  }, []);

  useAuthSession({
    enabled: isAuthenticated,
    onForcedLogout: handleForcedLogout,
  });

  return null;
}
