'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  clearDevSession,
  apiLogin,
  getDevSession,
  type DevDoctorSession,
} from '@/lib/doctor/auth/dev-auth';

type DoctorAuthContextValue = {
  session: DevDoctorSession | null;
  isLoading: boolean;
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<DevDoctorSession>;
  signOut: () => void;
};

const DoctorAuthContext = createContext<DoctorAuthContextValue | null>(null);

export function DoctorAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DevDoctorSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSession(getDevSession());
    setIsLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string, rememberMe: boolean) => {
    const result = await apiLogin(email, password, rememberMe);
    if (!result.ok) {
      throw new Error(result.error);
    }
    setSession(result.session);
    return result.session;
  }, []);

  const signOut = useCallback(() => {
    clearDevSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, isLoading, signIn, signOut }),
    [session, isLoading, signIn, signOut],
  );

  return <DoctorAuthContext.Provider value={value}>{children}</DoctorAuthContext.Provider>;
}

export function useDoctorAuth() {
  const ctx = useContext(DoctorAuthContext);
  if (!ctx) throw new Error('useDoctorAuth must be used within DoctorAuthProvider');
  return ctx;
}

/** Redirects unauthenticated users to login; redirects authenticated users away from login. */
export function DoctorAuthGuard({ children }: { children: ReactNode }) {
  const { session, isLoading } = useDoctorAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthRoute = pathname?.startsWith('/doctor/auth');

  useEffect(() => {
    if (isLoading) return;
    if (!session && !isAuthRoute) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
      router.replace(`/doctor/auth/login${next}`);
    }
    if (session && isAuthRoute) {
      router.replace('/doctor/dashboard');
    }
  }, [session, isLoading, isAuthRoute, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF5]">
        <p className="text-sm text-[#5C5A4E]">Loading workspace…</p>
      </div>
    );
  }

  if (!session && !isAuthRoute) return null;
  if (session && isAuthRoute) return null;

  return <>{children}</>;
}
