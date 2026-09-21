import type { SupabaseClient } from '@supabase/supabase-js';

import {
  buildPatientScopeOrFilter,
  hasVerifiedPatientIdentity,
  readPatientAuthSession,
  rowMatchesPatientSession,
  type PatientAuthSession,
} from '@/lib/auth/patientAuth';
import { resolveActiveAuthUser } from '@/lib/auth/resolve-active-auth-user';
import { readPatientPortalSession } from '@/lib/patient/portal-session';
import { resolveEffectivePatientId } from '@/lib/patient/resolve-effective-patient-id';

export type MyAppointmentRecord = {
  id: string;
  patient_id?: string;
  patient_name: string;
  doctor_name: string;
  department: string;
  hospital_name?: string;
  appointment_date: string;
  slot_time: string;
  fee?: string;
  reason?: string;
  token_number: number | string;
  queue_status?: string;
  status?: string;
  booking_for?: string;
  created_at?: string;
};

const APPOINTMENTS_DOCTOR_JOIN_SELECT = `
  *,
  doctor:doctors (
    id,
    full_name,
    specialty,
    department
  )
`;

function resolveActivePatientSession(): PatientAuthSession | null {
  return readPatientAuthSession() ?? (() => {
    const portal = readPatientPortalSession();
    if (!portal) return null;
    return {
      patientId: portal.patient_id,
      name: portal.patient_name,
      phone: portal.phone,
      email: portal.email ?? '',
      loginTimestamp: new Date().toISOString(),
      uhid: portal.uhid || undefined,
      hospitalId: portal.hospital_id || undefined,
      hospitalName: portal.hospital_name || undefined,
    };
  })();
}

export function resolveAppointmentRecordKey(item: Pick<MyAppointmentRecord, 'id' | 'patient_name' | 'appointment_date' | 'slot_time'>): string {
  const id = String(item.id ?? '').trim();
  if (id) return id;
  return `${item.patient_name}-${item.appointment_date}-${item.slot_time}`;
}

/** Removes duplicate appointment rows, preferring the newest `created_at` per key. */
export function deduplicateAppointments(items: MyAppointmentRecord[]): MyAppointmentRecord[] {
  const byKey = new Map<string, MyAppointmentRecord>();

  for (const item of items) {
    const key = resolveAppointmentRecordKey(item);
    if (!key) continue;

    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      continue;
    }

    const existingTime = existing.created_at ? Date.parse(existing.created_at) : 0;
    const nextTime = item.created_at ? Date.parse(item.created_at) : 0;
    if (nextTime >= existingTime) {
      byKey.set(key, item);
    }
  }

  return [...byKey.values()].sort((a, b) => {
    const aTime = a.created_at ? Date.parse(a.created_at) : 0;
    const bTime = b.created_at ? Date.parse(b.created_at) : 0;
    return bTime - aTime;
  });
}

function readNestedDoctor(row: Record<string, unknown>): Record<string, unknown> | null {
  const doctor = row.doctor;
  if (!doctor || typeof doctor !== 'object') return null;
  return doctor as Record<string, unknown>;
}

function mapRowToAppointmentRecord(row: Record<string, unknown>): MyAppointmentRecord {
  const doctor = readNestedDoctor(row);
  const consultationFee = Number(row.consultation_fee ?? row.fee ?? 0);
  const tokenRaw = row.token_number ?? row.token;
  const tokenValue =
    tokenRaw == null || tokenRaw === ''
      ? '—'
      : typeof tokenRaw === 'number'
        ? tokenRaw
        : String(tokenRaw);

  return {
    id: String(row.appointment_id ?? row.id ?? ''),
    patient_id: row.patient_id ? String(row.patient_id) : undefined,
    patient_name: String(row.patient_name ?? row.full_name ?? ''),
    doctor_name: String(row.doctor_name ?? doctor?.full_name ?? doctor?.name ?? 'Consulting physician'),
    department: String(
      row.department ?? doctor?.department ?? doctor?.specialty ?? 'General Medicine',
    ),
    hospital_name: String(row.hospital_name ?? 'Regal Hospital'),
    appointment_date: String(row.appointment_date ?? row.created_at ?? '').slice(0, 10),
    slot_time: String(row.slot_time ?? row.appointment_time ?? row.time_slot ?? '—'),
    fee: consultationFee > 0 ? `₹${consultationFee.toLocaleString('en-IN')}` : undefined,
    reason: String(row.reason_for_visit ?? row.reason ?? row.chief_complaint ?? '').trim() || undefined,
    token_number: tokenValue,
    queue_status: String(row.queue_status ?? row.status ?? 'WAITING'),
    status: String(row.status ?? row.queue_status ?? 'WAITING'),
    booking_for: row.booking_for ? String(row.booking_for) : undefined,
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

function scopeRowsToSession(
  rows: Record<string, unknown>[],
  session: PatientAuthSession,
  linkedPatientIds: string[],
): MyAppointmentRecord[] {
  return rows
    .filter((row) => rowMatchesPatientSession(row, session, linkedPatientIds))
    .map((row) => mapRowToAppointmentRecord(row))
    .filter((row) => row.id);
}

async function fetchAppointmentsForPatient(
  supabase: SupabaseClient,
  scopeFilter: string,
  session: PatientAuthSession,
  linkedPatientIds: string[],
): Promise<MyAppointmentRecord[]> {
  const withDoctor = await supabase
    .from('appointments')
    .select(APPOINTMENTS_DOCTOR_JOIN_SELECT)
    .or(scopeFilter)
    .order('created_at', { ascending: false });

  if (!withDoctor.error && withDoctor.data?.length) {
    return scopeRowsToSession(withDoctor.data as Record<string, unknown>[], session, linkedPatientIds);
  }

  const plain = await supabase
    .from('appointments')
    .select('*')
    .or(scopeFilter)
    .order('created_at', { ascending: false });

  if (plain.error || !plain.data?.length) return [];

  return scopeRowsToSession(plain.data as Record<string, unknown>[], session, linkedPatientIds);
}

async function fetchLegacyPatientAppointments(
  supabase: SupabaseClient,
  scopeFilter: string,
  session: PatientAuthSession,
  linkedPatientIds: string[],
): Promise<MyAppointmentRecord[]> {
  const { data, error } = await supabase
    .from('patient_appointments')
    .select('*')
    .or(scopeFilter)
    .order('created_at', { ascending: false });

  if (error || !data?.length) return [];

  return scopeRowsToSession(data as Record<string, unknown>[], session, linkedPatientIds);
}

function mergeAppointmentLists(rows: MyAppointmentRecord[]): MyAppointmentRecord[] {
  return deduplicateAppointments(rows);
}

export function filterLocalAppointmentsForSession(
  rows: unknown[],
  session: PatientAuthSession,
  linkedPatientIds: string[] = [],
): MyAppointmentRecord[] {
  if (!Array.isArray(rows)) return [];

  return rows
    .filter((row) => row && typeof row === 'object')
    .filter((row) => rowMatchesPatientSession(row as Record<string, unknown>, session, linkedPatientIds))
    .map((row) => mapRowToAppointmentRecord(row as Record<string, unknown>))
    .filter((row) => row.id);
}

/** Fetches OPD appointments scoped to the signed-in patient from `public.appointments`. */
export async function fetchMyPrivateAppointments(
  supabase: SupabaseClient,
  sessionOverride?: PatientAuthSession | null,
): Promise<{ session: PatientAuthSession | null; appointments: MyAppointmentRecord[] }> {
  const session = sessionOverride ?? resolveActivePatientSession();
  if (!session || !hasVerifiedPatientIdentity(session)) {
    return { session: null, appointments: [] };
  }

  const authContext = await resolveActiveAuthUser(supabase, session.patientId);
  const resolvedPatient = await resolveEffectivePatientId(supabase, {
    phone: session.phone,
    sessionPatientId: authContext?.userId || session.patientId,
  });

  const linkedPatientIds = resolvedPatient.linkedPatientIds;
  const scopeFilter = buildPatientScopeOrFilter(session, linkedPatientIds);
  if (!scopeFilter) {
    return { session, appointments: [] };
  }

  if (process.env.NODE_ENV === 'development') {
    console.debug('[my-appointments] User ID:', authContext?.userId ?? session.patientId);
    console.debug('[my-appointments] Patient ID:', resolvedPatient.patientRecordId);
    console.debug('[my-appointments] Scope filter:', scopeFilter);
  }

  const [appointmentRows, legacyRows] = await Promise.all([
    fetchAppointmentsForPatient(supabase, scopeFilter, session, linkedPatientIds),
    fetchLegacyPatientAppointments(supabase, scopeFilter, session, linkedPatientIds),
  ]);

  const appointments = mergeAppointmentLists([...appointmentRows, ...legacyRows]);

  if (process.env.NODE_ENV === 'development') {
    console.debug('[my-appointments] Fetched rows:', appointments.length);
  }

  return {
    session,
    appointments,
  };
}

export { resolveActivePatientSession };
