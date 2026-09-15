import type { SupabaseClient } from '@supabase/supabase-js';

import { setNexoraRoleCookie } from '@/lib/auth/role-cookies';
import { resolveDoctorConsultationFee } from '@/lib/hospital/doctors';

export interface DoctorSession {
  doctorId: string;
  /** Registry UUID when available — used alongside staff code for queue matching. */
  doctorUuid?: string;
  doctorName: string;
  department?: string;
  specialization?: string;
  email?: string;
  hospitalCode?: string;
  portalRoute?: string;
  loggedInAt?: string;
  /** Profile portal aliases (historical session shape) */
  employeeId?: string;
  fullName?: string;
  doctor_name?: string;
  consultationFee?: number;
  opdRoom?: string;
  fee?: number;
  qualification?: string;
}

const SESSION_KEY = 'active_doctor_session';

export const DEFAULT_DOCTOR_EMPLOYEE_ID = 'RH-D01';
export const DEFAULT_DOCTOR_DISPLAY_NAME = 'Dr. Suriraju V';
export const DEFAULT_DOCTOR_DEPARTMENT = 'Clinical';
/** Admin-configured default when profile fee is not yet loaded (Dr. Suriraju). */
export const DEFAULT_DOCTOR_CONSULTATION_FEE = 1200;

export type ConsultationFeeSource = {
  consultation_fee?: unknown;
  fee?: unknown;
  consultationFee?: unknown;
};

/** Resolve fee from appointment row, session, or doctor registry — never silently use 500. */
export function resolveDoctorConsultationFeeFromSources(
  sources: Array<ConsultationFeeSource | null | undefined>,
  fallback = DEFAULT_DOCTOR_CONSULTATION_FEE,
): number {
  for (const source of sources) {
    if (!source) continue;
    const fromColumns = resolveDoctorConsultationFee(source as Record<string, unknown>, 0);
    if (fromColumns > 0) return fromColumns;
    const legacy = Number(source.consultationFee ?? 0);
    if (Number.isFinite(legacy) && legacy > 0) return legacy;
  }
  return fallback;
}

/** Load consultation fee from `public.doctors` for the logged-in clinician. */
export async function fetchDoctorCredentialConsultationFee(
  supabase: SupabaseClient,
  session: DoctorSession | null = loadDoctorWorkspaceSession(),
): Promise<number> {
  const cached = resolveDoctorConsultationFeeFromSources([session], 0);
  if (cached > 0) return cached;

  if (!session) return DEFAULT_DOCTOR_CONSULTATION_FEE;

  const doctorCode = String(session.employeeId ?? session.doctorId ?? '').trim();
  const email = String(session.email ?? '').trim().toLowerCase();
  const doctorName = String(session.doctorName ?? session.fullName ?? '').trim();

  const filters: string[] = [];
  if (doctorCode) {
    filters.push(
      `doctor_code.eq.${doctorCode}`,
      `registration_number.eq.${doctorCode}`,
      `doctor_id.eq.${doctorCode}`,
    );
  }
  if (email) filters.push(`email.eq.${email}`);
  if (!filters.length) return DEFAULT_DOCTOR_CONSULTATION_FEE;

  const { data } = await supabase
    .from('doctors')
    .select('consultation_fee, fee, full_name, doctor_name')
    .or(filters.join(','))
    .limit(5);

  const rows = Array.isArray(data) ? data : [];
  const nameMatch =
    rows.find((row) => {
      const name = String(
        (row as { full_name?: string; doctor_name?: string }).full_name ??
          (row as { doctor_name?: string }).doctor_name ??
          '',
      ).toLowerCase();
      return doctorName && name && (name.includes(doctorName.toLowerCase()) || doctorName.toLowerCase().includes(name));
    }) ?? rows[0];

  const resolved = resolveDoctorConsultationFeeFromSources(
    rows.length ? [nameMatch as ConsultationFeeSource] : [],
    0,
  );
  if (resolved > 0) {
    persistDoctorConsultationFee(resolved);
    return resolved;
  }

  return DEFAULT_DOCTOR_CONSULTATION_FEE;
}

/** Cache resolved fee on the active doctor session for offline/fast reload. */
export function persistDoctorConsultationFee(fee: number): void {
  const session = getDoctorSession();
  if (!session || !Number.isFinite(fee) || fee <= 0) return;
  setDoctorSession({ ...session, consultationFee: fee, fee });
}

export type ResolvedDoctorSession = {
  employeeId: string;
  doctorId: string;
  fullName: string;
  doctorName: string;
  department: string;
  email?: string;
  specialization?: string;
};

/** Safe fallbacks when `getDoctorSession()` returns null or partial profile fields. */
export function resolveDoctorSessionIdentity(
  session: DoctorSession | null = getDoctorSession(),
): ResolvedDoctorSession {
  const employeeId = session?.employeeId || session?.doctorId || DEFAULT_DOCTOR_EMPLOYEE_ID;
  const fullName =
    session?.fullName ||
    session?.doctorName ||
    session?.doctor_name ||
    DEFAULT_DOCTOR_DISPLAY_NAME;
  const doctorName = session?.doctorName || fullName;

  return {
    employeeId,
    doctorId: session?.doctorId || employeeId,
    fullName,
    doctorName,
    department: session?.department || DEFAULT_DOCTOR_DEPARTMENT,
    email: session?.email,
    specialization: session?.specialization,
  };
}

export const DOCTOR_SESSION_CHANGED_EVENT = 'curasync:doctor-session-changed';

function dispatchSessionChanged(session: DoctorSession | null): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DOCTOR_SESSION_CHANGED_EVENT, { detail: session }));
}

function normalizeStoredSession(parsed: Partial<DoctorSession>): DoctorSession | null {
  const doctorId = parsed.doctorId ?? parsed.employeeId;
  const doctorName = parsed.doctorName ?? parsed.fullName ?? parsed.doctor_name;

  if (!doctorId || !doctorName) return null;

  const consultationFee = resolveDoctorConsultationFeeFromSources([parsed], 0);

  return {
    ...parsed,
    doctorId,
    doctorName,
    employeeId: parsed.employeeId ?? doctorId,
    fullName: parsed.fullName ?? doctorName,
    consultationFee: consultationFee > 0 ? consultationFee : parsed.consultationFee,
    fee: consultationFee > 0 ? consultationFee : parsed.fee,
  };
}

export function getDoctorSession(): DoctorSession | null {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<DoctorSession>;
    return normalizeStoredSession(parsed);
  } catch {
    return null;
  }
}

/** Persist session to both localStorage and sessionStorage. */
export function setDoctorSession(session: DoctorSession): void {
  if (typeof window === 'undefined') return;

  const normalized = normalizeStoredSession(session) ?? session;
  const payload = JSON.stringify(normalized);
  localStorage.setItem(SESSION_KEY, payload);
  sessionStorage.setItem(SESSION_KEY, payload);
  dispatchSessionChanged(normalized);
}

/** Login helper — optionally skip persisting to localStorage when "Remember me" is off. */
export function saveDoctorSession(session: DoctorSession, remember = true): void {
  if (typeof window === 'undefined') return;

  const payload = normalizeStoredSession({ ...session, loggedInAt: new Date().toISOString() }) ?? {
    ...session,
    loggedInAt: new Date().toISOString(),
  };
  const serialized = JSON.stringify(payload);
  sessionStorage.setItem(SESSION_KEY, serialized);

  if (remember) {
    localStorage.setItem(SESSION_KEY, serialized);
  } else {
    localStorage.removeItem(SESSION_KEY);
  }

  setNexoraRoleCookie('doctor');

  dispatchSessionChanged(payload);
}

export function clearDoctorSession(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(PORTAL_SESSION_KEY);
  sessionStorage.removeItem('current_doctor');
  localStorage.removeItem('curasync_cached_doctor_queue');
  dispatchSessionChanged(null);
}

/** Alias used by doctor shell and workspace components. */
export const getActiveDoctorSession = getDoctorSession;

const PORTAL_SESSION_KEY = 'doctor_session';

export type DoctorQueueIdentifiers = {
  codes: string[];
  nameTokens: string[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function isUuidValue(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function addDoctorCode(codes: Set<string>, value: unknown): void {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return;
  if (isUuidValue(trimmed)) {
    codes.add(trimmed.toLowerCase());
    codes.add(trimmed.toUpperCase());
    return;
  }
  codes.add(trimmed.toUpperCase());
}

function addDoctorNameToken(nameTokens: Set<string>, value: unknown): void {
  const normalized = normalizeDoctorName(String(value ?? ''));
  const token = normalized.split(' ').find((part) => part.length >= 3);
  if (token) nameTokens.add(token);
}

export function readPortalDoctorSessionPayload(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;

  for (const key of [PORTAL_SESSION_KEY, 'current_doctor']) {
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!raw) continue;
    try {
      return asRecord(JSON.parse(raw));
    } catch {
      continue;
    }
  }

  return null;
}

/** Merge active session with portal payload (`doctor_session`) for queue scoping. */
export function loadDoctorWorkspaceSession(): DoctorSession | null {
  const active = getDoctorSession();
  const portal = readPortalDoctorSessionPayload();

  if (!active && !portal) return null;

  const doctorCode = String(portal?.doctorCode ?? portal?.employeeId ?? '').trim().toUpperCase();
  const portalUuid = String(portal?.doctorId ?? '').trim();
  const doctorName = String(
    active?.doctorName ??
      active?.fullName ??
      portal?.doctorName ??
      portal?.fullName ??
      '',
  ).trim();

  if (!doctorName && !doctorCode && !portalUuid && !active?.doctorId) {
    return null;
  }

  const queueDoctorId = doctorCode || String(active?.doctorId ?? portalUuid).trim().toUpperCase();
  const doctorUuid =
    (isUuidValue(portalUuid) ? portalUuid : '') ||
    (active?.doctorUuid && isUuidValue(active.doctorUuid) ? active.doctorUuid : '') ||
    (active?.doctorId && isUuidValue(active.doctorId) ? active.doctorId : '');

  return normalizeStoredSession({
    ...(active ?? {}),
    doctorId: queueDoctorId || String(active?.doctorId ?? portalUuid),
    doctorUuid: doctorUuid || undefined,
    employeeId: doctorCode || active?.employeeId || queueDoctorId,
    doctorName: doctorName || DEFAULT_DOCTOR_DISPLAY_NAME,
    fullName: active?.fullName ?? String(portal?.fullName ?? doctorName),
    department:
      active?.department ??
      String(portal?.department ?? DEFAULT_DOCTOR_DEPARTMENT),
    email: active?.email ?? String(portal?.email ?? ''),
    hospitalCode:
      active?.hospitalCode ?? String(portal?.hospitalId ?? portal?.hospitalCode ?? ''),
    portalRoute: active?.portalRoute ?? String(portal?.portalRoute ?? '/doctor/dashboard'),
    consultationFee:
      active?.consultationFee ??
      (portal?.consultationFee != null ? Number(portal.consultationFee) : undefined) ??
      (portal?.consultation_fee != null ? Number(portal.consultation_fee) : undefined),
    fee:
      active?.fee ??
      (portal?.fee != null ? Number(portal.fee) : undefined) ??
      (portal?.consultation_fee != null ? Number(portal.consultation_fee) : undefined),
  });
}

export function getDoctorQueueIdentifiers(
  session: DoctorSession | null = loadDoctorWorkspaceSession(),
): DoctorQueueIdentifiers {
  const codes = new Set<string>();
  const nameTokens = new Set<string>();
  const portal = readPortalDoctorSessionPayload();

  if (session) {
    addDoctorCode(codes, session.doctorUuid);
    addDoctorCode(codes, session.doctorId);
    addDoctorCode(codes, session.employeeId);
    addDoctorNameToken(nameTokens, session.doctorName);
    addDoctorNameToken(nameTokens, session.fullName);
    addDoctorNameToken(nameTokens, session.doctor_name);
  }

  if (portal) {
    addDoctorCode(codes, portal.doctorCode);
    addDoctorCode(codes, portal.employeeId);
    addDoctorCode(codes, portal.doctorId);
    addDoctorNameToken(nameTokens, portal.doctorName);
    addDoctorNameToken(nameTokens, portal.fullName);
  }

  return {
    codes: Array.from(codes),
    nameTokens: Array.from(nameTokens),
  };
}

function normalizeDoctorName(name: string): string {
  return name
    .replace(/^dr\.?\s*/i, '')
    .replace(/\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function extractAppointmentDoctorCode(item: Record<string, unknown>): string {
  const candidates = [item.doctor_code, item.doctor_employee_id, item.doctor_id].map((value) =>
    String(value ?? '')
      .trim()
      .toUpperCase(),
  );

  return candidates.find(Boolean) ?? '';
}

function namesMatch(itemName: string, sessionName: string): boolean {
  if (!itemName || !sessionName) return false;
  if (itemName === sessionName) return true;

  const sessionTokens = sessionName.split(' ').filter((token) => token.length >= 3);
  const itemTokens = itemName.split(' ').filter((token) => token.length >= 3);
  if (sessionTokens.length === 0 || itemTokens.length === 0) return false;

  const primarySession = sessionTokens[0];
  const primaryItem = itemTokens[0];
  return (
    primaryItem === primarySession ||
    itemName.includes(primarySession) ||
    sessionName.includes(primaryItem)
  );
}

function expandDoctorMatchCodes(value: unknown): string[] {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return [];
  if (isUuidValue(trimmed)) {
    return [trimmed.toLowerCase(), trimmed.toUpperCase()];
  }
  return [trimmed.toUpperCase()];
}

export function appointmentMatchesDoctorIdentifiers(
  item: Record<string, unknown>,
  identifiers: DoctorQueueIdentifiers,
): boolean {
  const itemCodes = [
    item.doctor_code,
    item.doctor_employee_id,
    item.doctor_id,
    item.doctor_uuid,
  ]
    .flatMap((value) => expandDoctorMatchCodes(value))
    .filter(Boolean);

  if (identifiers.codes.some((code) => itemCodes.includes(code))) {
    return true;
  }

  const itemName = normalizeDoctorName(String(item.doctor_name ?? ''));
  if (!itemName) return false;

  return identifiers.nameTokens.some((token) => itemName.includes(token));
}

/** Match the signed-in clinician by any stored code, UUID, or name token. */
export function appointmentBelongsToDoctor(
  item: Record<string, unknown>,
  session: DoctorSession,
): boolean {
  return appointmentMatchesDoctorIdentifiers(item, getDoctorQueueIdentifiers(session));
}
