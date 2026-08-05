/**
 * Nexora Patient V0 — development authentication
 */

import { DEMO_PATIENT_EMAIL, DEMO_PATIENT_ID, DEMO_PATIENT_PASSWORD, SEED_PATIENT } from '@/lib/ecosystem/seed';

export const PATIENT_SESSION_KEY = 'nexora_patient_v0_session';

export type PatientSession = {
  patientId: string;
  email: string;
  fullName: string;
  mrn: string;
  signedInAt: string;
  rememberMe: boolean;
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

export async function patientLogin(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<{ ok: true; session: PatientSession } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));

  if (email === DEMO_PATIENT_EMAIL && password === DEMO_PATIENT_PASSWORD) {
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

  return { ok: false, error: 'Invalid email or password. Try patient@nexora.com / patient123' };
}
