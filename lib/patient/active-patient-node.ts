import { readPatientAuthSession } from '@/lib/auth/patientAuth';
import { readPatientPortalSession } from '@/lib/patient/portal-session';

export const ACTIVE_PATIENT_ID_KEY = 'curasync_active_patient_id';
export const ACTIVE_PATIENT_NAME_KEY = 'curasync_patient_name';
export const DEFAULT_PATIENT_FALLBACK_ID = 'NX-PAT-9001';

export type StoredPatientIdentity = {
  activePatientId: string;
  identifiers: string[];
  patientName: string;
  uhid: string;
  email: string;
};

function uniqueIdentifiers(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = String(value ?? '').trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

/** Reads stored patient keys without minting a random node id. */
export function readStoredPatientIdentity(): StoredPatientIdentity {
  if (typeof window === 'undefined') {
    return {
      activePatientId: DEFAULT_PATIENT_FALLBACK_ID,
      identifiers: [DEFAULT_PATIENT_FALLBACK_ID],
      patientName: '',
      uhid: '',
      email: '',
    };
  }

  const authSession = readPatientAuthSession();
  const storedId = (localStorage.getItem(ACTIVE_PATIENT_ID_KEY) || '').trim();
  const session = readPatientPortalSession();
  const sessionId = (authSession?.patientId || session?.patient_id || '').trim();
  const uhid = (authSession?.uhid || session?.uhid || '').trim();
  const email = (authSession?.email || session?.email || '').trim();
  const activePatientId = storedId || sessionId || uhid || email || '';

  return {
    activePatientId,
    identifiers: uniqueIdentifiers([storedId, sessionId, uhid, email, activePatientId]),
    patientName: (
      authSession?.name ||
      session?.patient_name ||
      (typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_PATIENT_NAME_KEY) : '') ||
      ''
    ).trim(),
    uhid,
    email,
  };
}

export const getActivePatientId = (): string => {
  if (typeof window === 'undefined') return '';
  const authSession = readPatientAuthSession();
  if (authSession?.patientId) return authSession.patientId;
  const stored = (localStorage.getItem(ACTIVE_PATIENT_ID_KEY) || '').trim();
  if (stored) return stored;
  return readStoredPatientIdentity().activePatientId;
};

export const getActivePatientName = (): string => {
  if (typeof window === 'undefined') return '';
  const authSession = readPatientAuthSession();
  if (authSession?.name) return authSession.name;
  const portalSession = readPatientPortalSession();
  if (portalSession?.patient_name && portalSession.patient_name !== 'Verified Patient') {
    return portalSession.patient_name;
  }
  return localStorage.getItem(ACTIVE_PATIENT_NAME_KEY) || '';
};

export function persistActivePatientNode(id: string, name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_PATIENT_ID_KEY, id);
  localStorage.setItem(ACTIVE_PATIENT_NAME_KEY, name.trim());
}
