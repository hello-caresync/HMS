/**
 * Nexora Patient V0 — authentication
 */

import { DEMO_PATIENT_EMAIL, DEMO_PATIENT_ID, DEMO_PATIENT_PASSWORD, SEED_PATIENT } from '@/lib/ecosystem/seed';

export const PATIENT_SESSION_KEY = 'nexora_patient_v0_session';

const IS_NON_PRODUCTION = process.env.NODE_ENV !== 'production';

export type PatientSession = {
  patientId: string;
  email: string;
  fullName: string;
  mrn: string;
  signedInAt: string;
  rememberMe: boolean;
  accessToken?: string;
};

export function getPatientSession(): PatientSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PATIENT_SESSION_KEY);
    return raw ? (JSON.parse(raw) as PatientSession) : null;
  } catch {
    return null;
  }
}

export function setPatientSession(session: PatientSession, rememberMe: boolean) {
  localStorage.setItem(PATIENT_SESSION_KEY, JSON.stringify(session));
  if (!rememberMe) {
    sessionStorage.setItem(PATIENT_SESSION_KEY, '1');
  }
}

export function clearPatientSession() {
  localStorage.removeItem(PATIENT_SESSION_KEY);
  sessionStorage.removeItem(PATIENT_SESSION_KEY);
}

function devPatientLogin(
  email: string,
  password: string,
  rememberMe: boolean,
): { ok: true; session: PatientSession } | { ok: false; error: string } {
  if (!IS_NON_PRODUCTION) {
    return { ok: false, error: 'Demo login is disabled in production.' };
  }

  if (email.trim().toLowerCase() === DEMO_PATIENT_EMAIL && password === DEMO_PATIENT_PASSWORD) {
    const session: PatientSession = {
      patientId: DEMO_PATIENT_ID,
      email: DEMO_PATIENT_EMAIL,
      fullName: SEED_PATIENT.fullName,
      mrn: SEED_PATIENT.mrn,
      signedInAt: new Date().toISOString(),
      rememberMe,
    };
    setPatientSession(session, rememberMe);
    return { ok: true, session };
  }

  return { ok: false, error: 'Invalid email or password.' };
}

export async function patientLogin(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<{ ok: true; session: PatientSession } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/patient/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = (await res.json()) as {
      success?: boolean;
      accessToken?: string;
      user?: {
        patientId: string;
        email: string;
        fullName: string;
        mrn: string;
      };
      error?: string;
    };

    if (res.ok && data.success && data.user) {
      const session: PatientSession = {
        patientId: data.user.patientId,
        email: data.user.email,
        fullName: data.user.fullName,
        mrn: data.user.mrn,
        signedInAt: new Date().toISOString(),
        rememberMe,
        accessToken: data.accessToken,
      };
      setPatientSession(session, rememberMe);
      return { ok: true, session };
    }

    return { ok: false, error: data.error ?? 'Invalid email or password.' };
  } catch {
    return { ok: false, error: 'Unable to reach the authentication service.' };
  }
}

/** Local demo login — development only; not used as a silent API fallback. */
export function patientDevLogin(
  email: string,
  password: string,
  rememberMe: boolean,
): { ok: true; session: PatientSession } | { ok: false; error: string } {
  return devPatientLogin(email, password, rememberMe);
}
