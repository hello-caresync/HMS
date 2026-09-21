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

import { logoutPatientSession, readPatientAuthSession } from '@/lib/auth/patientAuth';
import {
  clearPatientSession,
  getPatientSession,
  patientLogin,
  type PatientSession,
} from '@/lib/patient/auth/dev-auth';
import { persistPatientPortalSession, readPatientPortalSession } from '@/lib/patient/portal-session';
import { usePatientAppStore } from '@/lib/patient/store/patient-app-store';

export type PatientAuthPatient = {
  id: string;
  email: string;
  name: string;
  uhid: string;
};

type PatientAuthContextValue = {
  session: PatientSession | null;
  patient: PatientAuthPatient | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<PatientSession>;
  signOut: () => void;
  login: (email?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const PatientAuthContext = createContext<PatientAuthContextValue | null>(null);

const EMPTY_AUTH: PatientAuthContextValue = {
  session: null,
  patient: null,
  isAuthenticated: false,
  isLoading: false,
  signIn: async () => {
    throw new Error('Patient auth is not available');
  },
  signOut: () => {},
  login: async () => {},
  logout: async () => {},
};

function readLocalPatientSnapshot(): {
  session: PatientSession;
  patient: PatientAuthPatient;
} | null {
  if (typeof window === 'undefined') return null;

  const authSession = readPatientAuthSession();
  const v0 = getPatientSession();
  const portal = readPatientPortalSession();
  const fallbackEmail = (localStorage.getItem('curasync_patient_email') || '').trim();
  const fallbackId = (
    localStorage.getItem('curasync_active_patient_id') ||
    localStorage.getItem('curasync_patient_id') ||
    'NX-PAT-9001'
  ).trim();
  const fallbackName = (
    localStorage.getItem('curasync_patient_name') ||
    localStorage.getItem('patient_full_name') ||
    'Verified Patient'
  ).trim();
  const loggedIn = localStorage.getItem('curasync_patient_logged_in') === 'true';

  const id = (authSession?.patientId || v0?.patientId || portal?.patient_id || fallbackId).trim();
  const email = (authSession?.email || v0?.email || portal?.email || fallbackEmail).trim();
  const name = (authSession?.name || v0?.fullName || portal?.patient_name || fallbackName).trim();
  const uhid = (authSession?.uhid || portal?.uhid || v0?.mrn || id).trim();

  if (!authSession && !v0 && !portal && !fallbackEmail && !loggedIn) {
    return null;
  }

  return {
    session: {
      patientId: id,
      email: email || `${id}@patient.local`,
      fullName: name || 'Verified Patient',
      mrn: uhid || id,
      signedInAt: v0?.signedInAt || new Date().toISOString(),
      rememberMe: v0?.rememberMe ?? true,
    },
    patient: {
      id,
      email: email || `${id}@patient.local`,
      name: name || 'Verified Patient',
      uhid: uhid || id,
    },
  };
}

function toContextValue(
  session: PatientSession | null,
  patient: PatientAuthPatient | null,
  isLoading: boolean,
  signIn: PatientAuthContextValue['signIn'],
  signOut: PatientAuthContextValue['signOut'],
  login: PatientAuthContextValue['login'],
  logout: PatientAuthContextValue['logout'],
): PatientAuthContextValue {
  return {
    session,
    patient,
    isAuthenticated: Boolean(session || patient),
    isLoading,
    signIn,
    signOut,
    login,
    logout,
  };
}

export function PatientAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PatientSession | null>(() => readLocalPatientSnapshot()?.session ?? null);
  const [patient, setPatient] = useState<PatientAuthPatient | null>(() => readLocalPatientSnapshot()?.patient ?? null);
  const [isLoading, setIsLoading] = useState(() => !readLocalPatientSnapshot());
  const setActiveProfile = usePatientAppStore((s) => s.setActiveProfile);

  useEffect(() => {
    const snapshot = readLocalPatientSnapshot();
    if (snapshot) {
      setSession(snapshot.session);
      setPatient(snapshot.patient);
      persistPatientPortalSession({
        patient_id: snapshot.session.patientId,
        uhid: snapshot.session.mrn,
        patient_name: snapshot.session.fullName,
        phone: '',
        hospital_id: 'HOSP-01',
        hospital_name: 'Regal Hospital',
        email: snapshot.session.email,
      });
      setActiveProfile({
        id: snapshot.session.patientId,
        displayName: snapshot.session.fullName,
        mrn: snapshot.session.mrn,
      });
    }
    setIsLoading(false);
  }, [setActiveProfile]);

  const signIn = useCallback(
    async (email: string, password: string, rememberMe: boolean) => {
      const result = await patientLogin(email, password, rememberMe);
      if (!result.ok) throw new Error(result.error);
      setSession(result.session);
      setPatient({
        id: result.session.patientId,
        email: result.session.email,
        name: result.session.fullName,
        uhid: result.session.mrn,
      });
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
    logoutPatientSession();
    setSession(null);
    setPatient(null);
  }, []);

  const login = useCallback(
    async (email?: string, password?: string) => {
      if (!email || !password) return;
      await signIn(email, password, true);
    },
    [signIn],
  );

  const logout = useCallback(async () => {
    signOut();
  }, [signOut]);

  const value = useMemo(
    () => toContextValue(session, patient, isLoading, signIn, signOut, login, logout),
    [session, patient, isLoading, signIn, signOut, login, logout],
  );

  return <PatientAuthContext.Provider value={value}>{children}</PatientAuthContext.Provider>;
}

export function usePatientAuth() {
  const ctx = useContext(PatientAuthContext);

  if (!ctx) {
    if (typeof window !== 'undefined') {
      const snapshot = readLocalPatientSnapshot();
      const fallbackEmail = localStorage.getItem('curasync_patient_email');
      const fallbackId = localStorage.getItem('curasync_active_patient_id') || 'NX-PAT-9001';
      const fallbackName = localStorage.getItem('curasync_patient_name') || 'Verified Patient';

      if (snapshot || fallbackEmail) {
        const patient = snapshot?.patient ?? {
          id: fallbackId,
          email: fallbackEmail || '',
          name: fallbackName,
          uhid: fallbackId,
        };
        const session = snapshot?.session ?? {
          patientId: patient.id,
          email: patient.email,
          fullName: patient.name,
          mrn: patient.uhid,
          signedInAt: new Date().toISOString(),
          rememberMe: true,
        };

        return toContextValue(
          session,
          patient,
          false,
          async () => session,
          () => {},
          async () => {},
          async () => {
            localStorage.removeItem('curasync_patient_email');
            localStorage.removeItem('curasync_patient_logged_in');
          },
        );
      }
    }

    return EMPTY_AUTH;
  }

  return ctx;
}

export function PatientAuthGuard({ children }: { children: ReactNode }) {
  const { session, isLoading } = usePatientAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthRoute = pathname?.startsWith('/patient/auth') || pathname === '/patient/login';

  useEffect(() => {
    if (isLoading) return;
    if (!session && !isAuthRoute) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
      router.replace(`/patient/login${next}`);
    }
    if (session && isAuthRoute) {
      router.replace('/patient/dashboard');
    }
  }, [session, isLoading, isAuthRoute, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-patient-canvas text-patient-plum">
        <p className="text-sm font-bold">Loading patient portal…</p>
      </div>
    );
  }

  if (!session && !isAuthRoute) return null;
  return <>{children}</>;
}
