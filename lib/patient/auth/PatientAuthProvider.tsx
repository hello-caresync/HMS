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
  clearPatientSession,
  getPatientSession,
  patientLogin,
  type PatientSession,
} from '@/lib/patient/auth/dev-auth';
import { usePatientAppStore } from '@/lib/patient/store/patient-app-store';

type PatientAuthContextValue = {
  session: PatientSession | null;
  isLoading: boolean;
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<PatientSession>;
  signOut: () => void;
};

const PatientAuthContext = createContext<PatientAuthContextValue | null>(null);

export function PatientAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PatientSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const setActiveProfile = usePatientAppStore((s) => s.setActiveProfile);

  useEffect(() => {
    const s = getPatientSession();
    setSession(s);
    if (s) {
      setActiveProfile({
        id: s.patientId,
        displayName: s.fullName,
        mrn: s.mrn,
      });
    }
    setIsLoading(false);
  }, [setActiveProfile]);

  const signIn = useCallback(
    async (email: string, password: string, rememberMe: boolean) => {
      const result = await patientLogin(email, password, rememberMe);
      if (!result.ok) throw new Error(result.error);
      setSession(result.session);
      setActiveProfile({
        id: result.session.patientId,
        displayName: result.session.fullName,
        mrn: result.session.mrn,
      });
      return result.session;
    },
    [setActiveProfile],
  );

  const signOut = useCallback(() => {
    clearPatientSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, isLoading, signIn, signOut }),
    [session, isLoading, signIn, signOut],
  );

  return <PatientAuthContext.Provider value={value}>{children}</PatientAuthContext.Provider>;
}

export function usePatientAuth() {
  const ctx = useContext(PatientAuthContext);
  if (!ctx) throw new Error('usePatientAuth must be used within PatientAuthProvider');
  return ctx;
}

export function PatientAuthGuard({ children }: { children: ReactNode }) {
  const { session, isLoading } = usePatientAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthRoute = pathname?.startsWith('/patient/auth');

  useEffect(() => {
    if (isLoading) return;
    if (!session && !isAuthRoute) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
      router.replace(`/patient/auth/login${next}`);
    }
    if (session && isAuthRoute) {
      router.replace('/patient/dashboard');
    }
  }, [session, isLoading, isAuthRoute, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-patient-canvas text-patient-plum">
        <p className="text-sm font-bold">Loading Nexora Patient…</p>
      </div>
    );
  }

  if (!session && !isAuthRoute) return null;
  return <>{children}</>;
}
