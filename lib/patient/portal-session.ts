import { readPatientAuthSession } from '@/lib/auth/patientAuth';
import { SESSION_KEYS } from '@/lib/auth/ecosystem-sessions';
import { isHospitalUuid, readStoredHospitalUuid } from '@/lib/hospital/resolve-hospital-context';

export type PatientPortalSession = {
  patient_id: string;
  uhid: string;
  patient_name: string;
  phone: string;
  hospital_id: string;
  hospital_name: string;
  email?: string;
  age?: number | null;
  gender?: string;
};

export type ActivePatientFormIdentity = {
  patient_id: string;
  patient_name: string;
  phone: string;
  email: string;
  uhid: string;
  age?: number | null;
  gender?: string;
};

/** Verified session fields for booking / profile forms — never stale localStorage defaults. */
export function resolveActivePatientFormIdentity(): ActivePatientFormIdentity | null {
  const authSession = readPatientAuthSession();
  const portalSession = readPatientPortalSession();
  if (!authSession && !portalSession) return null;

  const patientName = String(
    authSession?.name ?? portalSession?.patient_name ?? '',
  ).trim();
  const patientId = String(
    authSession?.patientId ?? portalSession?.patient_id ?? '',
  ).trim();

  if (!patientName || patientName === 'Verified Patient') return null;

  return {
    patient_id: patientId,
    patient_name: patientName,
    phone: String(authSession?.phone ?? portalSession?.phone ?? '').trim(),
    email: String(authSession?.email ?? portalSession?.email ?? '').trim(),
    uhid: String(authSession?.uhid ?? portalSession?.uhid ?? '').trim(),
    age: portalSession?.age ?? null,
    gender: portalSession?.gender,
  };
}

export function mintPatientUhid(): string {
  return `NX-PAT-${Math.floor(1000 + Math.random() * 9000)}`;
}

/** Regal Hospital patients-table UHID format (NOT NULL column). */
export function mintRegalHospitalUhid(): string {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `UHID-RH-${new Date().getFullYear()}-${randomSuffix}`;
}

export function resolvePatientUhid(
  candidates: Array<string | null | undefined>,
): string {
  for (const candidate of candidates) {
    const value = String(candidate ?? '').trim();
    if (value) return value;
  }
  return mintRegalHospitalUhid();
}

export function readPatientPortalSession(): PatientPortalSession | null {
  if (typeof window === 'undefined') return null;

  const authSession = readPatientAuthSession();
  if (authSession) {
    return {
      patient_id: authSession.patientId,
      uhid: authSession.uhid || '',
      patient_name: authSession.name,
      phone: authSession.phone,
      hospital_id: authSession.hospitalId || '',
      hospital_name: authSession.hospitalName || 'Regal Hospital',
      email: authSession.email,
    };
  }

  const raw = localStorage.getItem(SESSION_KEYS.patient);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const patientName = String(
      parsed.patient_name ?? parsed.full_name ?? parsed.name ?? '',
    ).trim();
    const uhid = String(parsed.uhid ?? parsed.patient_uhid ?? '').trim();
    const rawHospitalId = String(
      parsed.hospital_id ?? parsed.hospitalId ?? readStoredHospitalUuid() ?? '',
    ).trim();
    const hospitalId = isHospitalUuid(rawHospitalId) ? rawHospitalId : '';

    return {
      patient_id: String(parsed.patient_id ?? parsed.id ?? ''),
      uhid: uhid || '',
      patient_name: patientName,
      phone: String(parsed.phone ?? parsed.mobile ?? ''),
      hospital_id: hospitalId,
      hospital_name: String(parsed.hospital_name ?? parsed.hospital ?? 'Regal Hospital'),
      email: parsed.email ? String(parsed.email) : undefined,
      age: Number.isFinite(Number(parsed.age)) ? Number(parsed.age) : null,
      gender: parsed.gender ? String(parsed.gender) : undefined,
    };
  } catch {
    return null;
  }
}

export function persistPatientPortalSession(session: PatientPortalSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEYS.patient, JSON.stringify(session));
  localStorage.setItem('curasync_active_patient_id', session.patient_id);
  localStorage.setItem('curasync_patient_id', session.patient_id);
  localStorage.setItem('curasync_patient_name', session.patient_name);
  localStorage.setItem('patient_full_name', session.patient_name);
  if (session.email) localStorage.setItem('curasync_patient_email', session.email);
  localStorage.setItem('curasync_patient_logged_in', 'true');
}
