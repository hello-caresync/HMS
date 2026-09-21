import { SESSION_KEYS } from '@/lib/auth/ecosystem-sessions';
import { setNexoraRoleCookie } from '@/lib/auth/role-cookies';
import { ensurePatientIdPersisted } from '@/lib/clinical/bridge';
import { CACHE_KEYS } from '@/lib/persistence/local-cache';

export const PATIENT_SESSION_STORAGE_KEY = 'patient_session';
export const PATIENT_USER_STORAGE_KEY = 'patient_user';

export type PatientAuthSession = {
  patientId: string;
  name: string;
  phone: string;
  email: string;
  loginTimestamp: string;
  uhid?: string;
  hospitalId?: string;
  hospitalName?: string;
};

const LEGACY_PATIENT_KEYS = [
  PATIENT_SESSION_STORAGE_KEY,
  PATIENT_USER_STORAGE_KEY,
  SESSION_KEYS.patient,
  'curasync_patient_session',
  'curasync_active_patient_id',
  'curasync_patient_id',
  'curasync_patient_name',
  'patient_full_name',
  'curasync_patient_email',
  'curasync_patient_logged_in',
  'curasync_selected_hospital',
  'selected_hospital_name',
  'curasync_appointments',
  'patient_id',
  'nexora_patient_v0_session',
  CACHE_KEYS.patientAppointments,
  CACHE_KEYS.patientAppointmentsAlt,
  CACHE_KEYS.patientPrescriptions,
] as const;

function normalizePhoneDigits(value?: string | null): string {
  return String(value ?? '').replace(/\D/g, '').slice(-10);
}

function normalizeEmail(value?: string | null): string {
  return String(value ?? '').trim().toLowerCase();
}

/** Purges all patient session and cached appointment keys before a new login. */
export function clearPatientAuthStorage(): void {
  if (typeof window === 'undefined') return;

  sessionStorage.clear();

  for (const key of LEGACY_PATIENT_KEYS) {
    localStorage.removeItem(key);
  }

  document.cookie = 'curasync_patient_session=; path=/; max-age=0; SameSite=Lax';
}

export function persistPatientAuthSession(params: {
  patientId: string;
  name: string;
  phone: string;
  email: string;
  uhid?: string;
  hospitalId?: string;
  hospitalName?: string;
}): PatientAuthSession {
  if (typeof window === 'undefined') {
    return {
      patientId: params.patientId,
      name: params.name.trim(),
      phone: params.phone.trim(),
      email: normalizeEmail(params.email),
      loginTimestamp: new Date().toISOString(),
      uhid: params.uhid,
      hospitalId: params.hospitalId,
      hospitalName: params.hospitalName,
    };
  }

  clearPatientAuthStorage();

  const newSession: PatientAuthSession = {
    patientId: params.patientId,
    name: params.name.trim(),
    phone: params.phone.trim(),
    email: normalizeEmail(params.email),
    loginTimestamp: new Date().toISOString(),
    uhid: params.uhid,
    hospitalId: params.hospitalId,
    hospitalName: params.hospitalName,
  };

  localStorage.setItem(PATIENT_SESSION_STORAGE_KEY, JSON.stringify(newSession));

  const legacyPayload = {
    uhid: params.uhid ?? '',
    patient_id: params.patientId,
    patient_name: newSession.name,
    full_name: newSession.name,
    name: newSession.name,
    email: newSession.email,
    phone: newSession.phone,
    hospital_id: params.hospitalId ?? 'HOSP-01',
    hospital_name: params.hospitalName ?? 'Regal Hospital',
    hospital: params.hospitalName ?? 'Regal Hospital',
    role: 'patient',
    authenticated: true,
    authenticatedAt: newSession.loginTimestamp,
    login_time: newSession.loginTimestamp,
  };

  localStorage.setItem(SESSION_KEYS.patient, JSON.stringify(legacyPayload));
  localStorage.setItem('curasync_active_patient_id', params.patientId);
  localStorage.setItem('curasync_patient_id', params.patientId);
  localStorage.setItem('curasync_patient_name', newSession.name);
  localStorage.setItem('patient_full_name', newSession.name);
  if (newSession.email) localStorage.setItem('curasync_patient_email', newSession.email);
  if (params.hospitalName) {
    localStorage.setItem('curasync_selected_hospital', params.hospitalName);
    localStorage.setItem('selected_hospital_name', params.hospitalName);
  }
  localStorage.setItem('curasync_patient_logged_in', 'true');
  document.cookie = 'curasync_patient_session=active; path=/; max-age=86400; SameSite=Lax';
  setNexoraRoleCookie('patient');
  ensurePatientIdPersisted(params.patientId);

  return newSession;
}

export function readPatientAuthSession(): PatientAuthSession | null {
  if (typeof window === 'undefined') return null;

  const rawPrimary = localStorage.getItem(PATIENT_SESSION_STORAGE_KEY);
  if (rawPrimary) {
    try {
      const parsed = JSON.parse(rawPrimary) as Partial<PatientAuthSession>;
      const name = String(parsed.name ?? '').trim();
      const patientId = String(parsed.patientId ?? '').trim();
      if (name && patientId) {
        return {
          patientId,
          name,
          phone: String(parsed.phone ?? '').trim(),
          email: normalizeEmail(parsed.email),
          loginTimestamp: String(parsed.loginTimestamp ?? new Date().toISOString()),
          uhid: parsed.uhid ? String(parsed.uhid) : undefined,
          hospitalId: parsed.hospitalId ? String(parsed.hospitalId) : undefined,
          hospitalName: parsed.hospitalName ? String(parsed.hospitalName) : undefined,
        };
      }
    } catch {
      /* fall through */
    }
  }

  const rawLegacy = localStorage.getItem(SESSION_KEYS.patient);
  if (!rawLegacy) return null;

  try {
    const parsed = JSON.parse(rawLegacy) as Record<string, unknown>;
    const name = String(parsed.patient_name ?? parsed.full_name ?? parsed.name ?? '').trim();
    const patientId = String(parsed.patient_id ?? parsed.id ?? '').trim();
    if (!name || !patientId) return null;

    return {
      patientId,
      name,
      phone: String(parsed.phone ?? parsed.mobile ?? '').trim(),
      email: normalizeEmail(String(parsed.email ?? '')),
      loginTimestamp: String(
        parsed.loginTimestamp ?? parsed.login_time ?? parsed.authenticatedAt ?? new Date().toISOString(),
      ),
      uhid: parsed.uhid ? String(parsed.uhid) : undefined,
      hospitalId: parsed.hospital_id ? String(parsed.hospital_id) : undefined,
      hospitalName: parsed.hospital_name ? String(parsed.hospital_name) : undefined,
    };
  } catch {
    return null;
  }
}

function escapeOrFilterValue(value: string): string {
  return value.replace(/,/g, ' ').trim();
}

/** Builds a Supabase `.or()` filter scoped to the active patient. */
export function buildPatientScopeOrFilter(
  session: PatientAuthSession,
  linkedPatientIds: string[] = [],
): string | null {
  const parts: string[] = [];
  const phoneDigits = normalizePhoneDigits(session.phone);
  const phoneRaw = escapeOrFilterValue(session.phone);

  for (const patientId of linkedPatientIds) {
    const id = escapeOrFilterValue(patientId);
    if (id) parts.push(`patient_id.eq.${id}`);
  }

  if (session.patientId) {
    parts.push(`patient_id.eq.${escapeOrFilterValue(session.patientId)}`);
  }
  if (session.uhid) {
    parts.push(`uhid.eq.${session.uhid}`);
  }
  if (phoneDigits) {
    parts.push(`patient_phone.ilike.%${phoneDigits}%`);
    parts.push(`phone.ilike.%${phoneDigits}%`);
  }
  if (phoneRaw) {
    parts.push(`patient_phone.eq.${phoneRaw}`);
    parts.push(`phone.eq.${phoneRaw}`);
  }
  if (session.email) {
    const email = escapeOrFilterValue(session.email);
    parts.push(`patient_email.ilike.${email}`);
    parts.push(`email.ilike.${email}`);
  }
  if (session.name) {
    const name = escapeOrFilterValue(session.name);
    if (name) parts.push(`patient_name.ilike.${name}`);
  }

  const unique = [...new Set(parts.filter(Boolean))];
  return unique.length > 0 ? unique.join(',') : null;
}

/** Returns true when the session has enough identity to scope private records. */
export function hasVerifiedPatientIdentity(session: PatientAuthSession | null): boolean {
  if (!session) return false;
  return Boolean(
    session.patientId?.trim() ||
      session.uhid?.trim() ||
      normalizePhoneDigits(session.phone) ||
      normalizeEmail(session.email) ||
      session.name?.trim(),
  );
}

/** Client-side guard so unrelated rows never render for the signed-in patient. */
export function rowMatchesPatientSession(
  row: Record<string, unknown>,
  session: PatientAuthSession,
  linkedPatientIds: string[] = [],
): boolean {
  const phoneDigits = normalizePhoneDigits(session.phone);
  const rowPhone = normalizePhoneDigits(String(row.phone ?? row.patient_phone ?? ''));
  const rowEmail = normalizeEmail(String(row.email ?? row.patient_email ?? ''));
  const rowPatientId = String(row.patient_id ?? '').trim();
  const rowUhid = String(row.uhid ?? '').trim();
  const rowName = String(row.patient_name ?? row.full_name ?? '').trim().toLowerCase();
  const sessionName = session.name.trim().toLowerCase();
  const linkedIds = new Set(
    [...linkedPatientIds, session.patientId].map((value) => String(value ?? '').trim()).filter(Boolean),
  );

  if (rowPatientId && linkedIds.has(rowPatientId)) return true;
  if (session.patientId && rowPatientId && rowPatientId === session.patientId) return true;
  if (session.uhid && rowUhid && rowUhid === session.uhid) return true;
  if (phoneDigits && rowPhone && rowPhone === phoneDigits) return true;
  if (session.email && rowEmail && rowEmail === session.email) return true;
  if (sessionName && rowName && rowName === sessionName) return true;
  return false;
}

export function logoutPatientSession(): void {
  clearPatientAuthStorage();
}
