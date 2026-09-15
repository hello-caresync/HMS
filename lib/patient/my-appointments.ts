import type { SupabaseClient } from '@supabase/supabase-js';

import {
  buildPatientScopeOrFilter,
  hasVerifiedPatientIdentity,
  readPatientAuthSession,
  rowMatchesPatientSession,
  type PatientAuthSession,
} from '@/lib/auth/patientAuth';
import { readPatientPortalSession } from '@/lib/patient/portal-session';

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
  created_at?: string;
};

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

function mapRowToAppointmentRecord(row: Record<string, unknown>): MyAppointmentRecord {
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
    doctor_name: String(row.doctor_name ?? 'Consulting physician'),
    department: String(row.department ?? 'General Medicine'),
    hospital_name: String(row.hospital_name ?? 'Regal Hospital'),
    appointment_date: String(row.appointment_date ?? ''),
    slot_time: String(row.slot_time ?? row.appointment_time ?? row.time_slot ?? '—'),
    fee: consultationFee > 0 ? `₹${consultationFee.toLocaleString('en-IN')}` : undefined,
    reason: String(row.reason_for_visit ?? row.reason ?? row.chief_complaint ?? '').trim() || undefined,
    token_number: tokenValue,
    queue_status: String(row.queue_status ?? row.status ?? 'WAITING'),
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

async function fetchScopedTableRows(
  supabase: SupabaseClient,
  table: 'appointments' | 'patient_appointments',
  scopeFilter: string,
  session: PatientAuthSession,
): Promise<MyAppointmentRecord[]> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .or(scopeFilter)
    .order('created_at', { ascending: false });

  if (error || !data?.length) return [];

  return data
    .filter((row) => rowMatchesPatientSession(row as Record<string, unknown>, session))
    .map((row) => mapRowToAppointmentRecord(row as Record<string, unknown>))
    .filter((row) => row.id);
}

function mergeAppointmentLists(rows: MyAppointmentRecord[]): MyAppointmentRecord[] {
  return deduplicateAppointments(rows);
}

export function filterLocalAppointmentsForSession(
  rows: unknown[],
  session: PatientAuthSession,
): MyAppointmentRecord[] {
  if (!Array.isArray(rows)) return [];

  return rows
    .filter((row) => row && typeof row === 'object')
    .filter((row) => rowMatchesPatientSession(row as Record<string, unknown>, session))
    .map((row) => mapRowToAppointmentRecord(row as Record<string, unknown>))
    .filter((row) => row.id);
}

/** Fetches appointments strictly scoped to the verified patient session. */
export async function fetchMyPrivateAppointments(
  supabase: SupabaseClient,
  sessionOverride?: PatientAuthSession | null,
): Promise<{ session: PatientAuthSession | null; appointments: MyAppointmentRecord[] }> {
  const session = sessionOverride ?? resolveActivePatientSession();
  if (!session || !hasVerifiedPatientIdentity(session)) {
    return { session: null, appointments: [] };
  }

  const scopeFilter = buildPatientScopeOrFilter(session);
  if (!scopeFilter) {
    return { session, appointments: [] };
  }

  const [appointmentRows, legacyRows] = await Promise.all([
    fetchScopedTableRows(supabase, 'appointments', scopeFilter, session),
    fetchScopedTableRows(supabase, 'patient_appointments', scopeFilter, session),
  ]);

  return {
    session,
    appointments: mergeAppointmentLists([...appointmentRows, ...legacyRows]),
  };
}

export { resolveActivePatientSession };
