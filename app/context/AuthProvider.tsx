'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { APP_ROUTES } from '../lib/routes';
import {
  getCurrentSession,
  INACTIVITY_TIMEOUT_MS,
  isSessionExpired,
  logUserActivity,
  refreshSessionActivity,
  resolvePostLoginRoute,
  signOut,
  touchSessionActivity,
  type HospitalStaffProfile,
} from '../lib/auth';

type AuthContextValue = {
  session: HospitalStaffProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: (reason?: string) => void;
  refreshActivity: () => void;
  setSession: (session: HospitalStaffProfile | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Internal back-office ERP routes — external portals (patient/vendor) excluded */
const PROTECTED_PREFIXES = [
  '/admin',
  '/dashboard',
  '/master-data',
  '/staff',
  '/settings',
  '/patients',
  '/appointments',
  '/admissions',
  '/opd',
  '/ipd',
  '/ipd-management',
  '/emergency',
  '/ot-coordination',
  '/emr',
  '/laboratory',
  '/radiology',
  '/pharmacy',
  '/billing',
  '/payments',
  '/insurance',
  '/insurance-tpa',
  '/inventory',
  '/lab',
  '/procurement',
  '/vendor-coordination',
  '/finance',
  '/hr',
  '/reports',
  '/assets',
];

const ACTIVITY_PERSIST_INTERVAL_MS = 30_000;

function isProtectedPath(pathname: string): boolean {
  if (pathname.startsWith('/admin/onboarding')) return false;
  if (pathname === '/') return true;
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isPublicAuthPath(pathname: string): boolean {
  return pathname.startsWith('/login') || pathname.startsWith('/admin/onboarding');
}

function shouldUpdateSession(prev: HospitalStaffProfile | null, next: HospitalStaffProfile): boolean {
  if (!prev) return true;
  return (
    prev.userId !== next.userId ||
    prev.employeeId !== next.employeeId ||
    prev.email !== next.email ||
    prev.role !== next.role ||
    prev.department !== next.department ||
    prev.mfaPending !== next.mfaPending ||
    prev.lastActivityAtUtc !== next.lastActivityAtUtc
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSessionState] = useState<HospitalStaffProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const timerRef = useRef<number | null>(null);
  const lastPersistRef = useRef<number>(0);
  const sessionRef = useRef<HospitalStaffProfile | null>(null);

  sessionRef.current = session;

  const applySessionUpdate = useCallback((next: HospitalStaffProfile | null) => {
    setSessionState((prev) => {
      if (next === null) return null;
      if (!shouldUpdateSession(prev, next)) return prev;
      return next;
    });
  }, []);

  const logout = useCallback(
    (reason = 'manual') => {
      const userId = sessionRef.current?.userId;
      signOut(userId);
      setSessionState(null);

      if (reason === 'inactivity') {
        logUserActivity(userId ?? 'anonymous', 'Session timeout — inactivity', 'Hospital IAM');
      }

      router.push(`${APP_ROUTES.login}?reason=${reason}`);
    },
    [router],
  );

  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  const refreshActivity = useCallback(() => {
    const updated = refreshSessionActivity();
    if (!updated) return;
    applySessionUpdate(updated);
  }, [applySessionUpdate]);

  const setSession = useCallback(
    (next: HospitalStaffProfile | null) => {
      if (next === null) {
        setSessionState(null);
        return;
      }
      applySessionUpdate(next);
    },
    [applySessionUpdate],
  );

  useEffect(() => {
    const existing = getCurrentSession();
    if (existing && isSessionExpired(existing)) {
      signOut(existing.userId);
      setSessionState(null);
    } else {
      setSessionState(existing);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const userId = session?.userId;
    if (!userId) return;

    const persistActivityThrottled = () => {
      const now = Date.now();
      if (now - lastPersistRef.current < ACTIVITY_PERSIST_INTERVAL_MS) return;

      lastPersistRef.current = now;
      const updated = touchSessionActivity();
      if (!updated) return;

      setSessionState((prev) => {
        if (!shouldUpdateSession(prev, updated)) return prev;
        return updated;
      });
    };

    const resetTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }

      timerRef.current = window.setTimeout(() => {
        logoutRef.current('inactivity');
      }, INACTIVITY_TIMEOUT_MS);

      persistActivityThrottled();
    };

    const events: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    resetTimer();
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [session?.userId]);

  useEffect(() => {
    if (isLoading) return;

    if (isProtectedPath(pathname) && !session) {
      router.replace(`${APP_ROUTES.login}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (isPublicAuthPath(pathname) && session && pathname === APP_ROUTES.login) {
      router.replace(resolvePostLoginRoute(session.role));
    }
  }, [isLoading, pathname, router, session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      isAuthenticated: Boolean(session),
      logout,
      refreshActivity,
      setSession,
    }),
    [session, isLoading, logout, refreshActivity, setSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (!isProtectedPath(pathname)) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f172a] text-slate-900">
        <p className="font-mono text-xs uppercase tracking-wider">Securing Nexora staff session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
