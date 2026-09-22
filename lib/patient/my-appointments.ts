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
  doctor_id?: string;
  doctor_name: string;
  department: string;
  hospital_name?: string;
  appointment_date: string;
  slot_time: string;
  fee?: string;
  reason?: string;
  symptoms?: string;
  token_number: number | string;
  queue_status?: string;
  status?: string;
  booking_for?: string;
  beneficiary_relation?: string;
  is_self?: boolean;
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

export function resolveAppointmentRecordKey(
  item: Pick<MyAppointmentRecord, 'id' | 'patient_name' | 'appointment_date' | 'slot_time'>,
): string {
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
    const dateCompare = b.appointment_date.localeCompare(a.appointment_date);
    if (dateCompare !== 0) return dateCompare;
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

function normalizeBookingRelation(row: Record<string, unknown>): string | undefined {
  const relation = String(
    row.beneficiary_relation ?? row.booking_for ?? row.relation ?? '',
  ).trim();
  if (!relation || relation.toUpperCase() === 'SELF') return undefined;
  return relation;
}

function mapRowToAppointmentRecord(
  row: Record<string, unknown>,
  session?: PatientAuthSession | null,
): MyAppointmentRecord {
  const doctor = readNestedDoctor(row);
  const consultationFee = Number(row.consultation_fee ?? row.fee ?? 0);
  const tokenRaw = row.token_number ?? row.token;
  const tokenValue =
    tokenRaw == null || tokenRaw === ''
      ? '—'
      : typeof tokenRaw === 'number'
        ? tokenRaw
        : String(tokenRaw);
  const appointmentDate = String(row.appointment_date ?? row.created_at ?? '').slice(0, 10);
  const slotTime = String(row.slot_time ?? row.appointment_time ?? row.time_slot ?? '—');
  const patientName = String(row.patient_name ?? row.full_name ?? '').trim();
  const bookingFor = row.booking_for ? String(row.booking_for).trim() : undefined;
  const beneficiaryRelation = normalizeBookingRelation(row);
  const sessionName = session?.name?.trim().toLowerCase() ?? '';
  const isSelf =
    !beneficiaryRelation &&
    (!bookingFor || bookingFor.toUpperCase() === 'SELF') &&
    (!sessionName || patientName.toLowerCase() === sessionName);

  const clinicalReason =
    String(row.reason_for_visit ?? row.reason ?? row.chief_complaint ?? row.symptoms ?? '').trim() ||
    undefined;
  const doctorId = String(
    row.doctor_id ?? row.doctor_code ?? row.doctor_uuid ?? doctor?.id ?? '',
  ).trim();

  return {
    id: String(row.appointment_id ?? row.id ?? `${patientName}-${appointmentDate}-${slotTime}`),
    patient_id: row.patient_id ? String(row.patient_id) : undefined,
    patient_name: patientName,
    doctor_id: doctorId || undefined,
    doctor_name: String(row.doctor_name ?? doctor?.full_name ?? doctor?.name ?? 'Consulting physician'),
    department: String(
      row.department ?? doctor?.department ?? doctor?.specialty ?? 'General Medicine',
    ),
    hospital_name: String(row.hospital_name ?? 'Regal Hospital'),
    appointment_date: appointmentDate,
    slot_time: slotTime,
    fee: consultationFee > 0 ? `₹${consultationFee.toLocaleString('en-IN')}` : undefined,
    reason: clinicalReason,
    symptoms: String(row.symptoms ?? clinicalReason ?? '').trim() || undefined,
    token_number: tokenValue,
    queue_status: String(row.queue_status ?? row.status ?? 'WAITING'),
    status: String(row.status ?? row.queue_status ?? 'WAITING'),
    booking_for: bookingFor,
    beneficiary_relation: beneficiaryRelation,
    is_self: isSelf,
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

function mapRowsFromDatabase(
  rows: Record<string, unknown>[],
  session?: PatientAuthSession | null,
): MyAppointmentRecord[] {
  return rows
    .map((row) => mapRowToAppointmentRecord(row, session))
    .filter((row) => row.patient_name && row.appointment_date);
}

function scopeRowsToSession(
  rows: Record<string, unknown>[],
  session: PatientAuthSession,
  linkedPatientIds: string[],
  familyMemberNames: string[] = [],
): MyAppointmentRecord[] {
  return rows
    .filter((row) => rowMatchesPatientSession(row, session, linkedPatientIds, familyMemberNames))
    .map((row) => mapRowToAppointmentRecord(row, session))
    .filter((row) => row.patient_name && row.appointment_date);
}

function logDevFetch(label: string, payload: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== 'development') return;
  console.debug(`[my-appointments] ${label}`, payload);
}

async function queryAppointmentsByPatientIds(
  supabase: SupabaseClient,
  patientIds: string[],
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  if (patientIds.length === 0) {
    return { rows: [], error: null };
  }

  const withDoctor = await supabase
    .from('appointments')
    .select(APPOINTMENTS_DOCTOR_JOIN_SELECT)
    .in('patient_id', patientIds)
    .order('appointment_date', { ascending: false })
    .order('created_at', { ascending: false });

  logDevFetch('patient_id.in(with doctor join)', {
    patientIds,
    count: withDoctor.data?.length ?? 0,
    error: withDoctor.error?.message ?? null,
  });

  if (!withDoctor.error && withDoctor.data?.length) {
    return { rows: withDoctor.data as Record<string, unknown>[], error: null };
  }

  const plain = await supabase
    .from('appointments')
    .select('*')
    .in('patient_id', patientIds)
    .order('appointment_date', { ascending: false })
    .order('created_at', { ascending: false });

  logDevFetch('patient_id.in(plain)', {
    patientIds,
    count: plain.data?.length ?? 0,
    error: plain.error?.message ?? withDoctor.error?.message ?? null,
  });

  if (plain.error) {
    return { rows: [], error: plain.error.message };
  }

  return { rows: (plain.data as Record<string, unknown>[]) ?? [], error: null };
}

async function queryAppointmentsByScopeFilter(
  supabase: SupabaseClient,
  scopeFilter: string,
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  const withDoctor = await supabase
    .from('appointments')
    .select(APPOINTMENTS_DOCTOR_JOIN_SELECT)
    .or(scopeFilter)
    .order('appointment_date', { ascending: false })
    .order('created_at', { ascending: false });

  logDevFetch('scope.or(with doctor join)', {
    scopeFilter,
    count: withDoctor.data?.length ?? 0,
    error: withDoctor.error?.message ?? null,
  });

  if (!withDoctor.error && withDoctor.data?.length) {
    return { rows: withDoctor.data as Record<string, unknown>[], error: null };
  }

  const plain = await supabase
    .from('appointments')
    .select('*')
    .or(scopeFilter)
    .order('appointment_date', { ascending: false })
    .order('created_at', { ascending: false });

  logDevFetch('scope.or(plain)', {
    scopeFilter,
    count: plain.data?.length ?? 0,
    error: plain.error?.message ?? withDoctor.error?.message ?? null,
  });

  if (plain.error) {
    return { rows: [], error: plain.error.message };
  }

  return { rows: (plain.data as Record<string, unknown>[]) ?? [], error: null };
}

async function fetchAppointmentsForPatient(
  supabase: SupabaseClient,
  scopeFilter: string | null,
  linkedPatientIds: string[],
  session: PatientAuthSession,
): Promise<MyAppointmentRecord[]> {
  const rowsByKey = new Map<string, Record<string, unknown>>();

  const addRows = (rows: Record<string, unknown>[]) => {
    for (const row of rows) {
      const key = String(row.appointment_id ?? row.id ?? JSON.stringify(row));
      rowsByKey.set(key, row);
    }
  };

  const uniqueIds = [...new Set(linkedPatientIds.map((id) => String(id).trim()).filter(Boolean))];
  if (uniqueIds.length > 0) {
    const byPatientId = await queryAppointmentsByPatientIds(supabase, uniqueIds);
    addRows(byPatientId.rows);
  }

  if (scopeFilter) {
    const byScope = await queryAppointmentsByScopeFilter(supabase, scopeFilter);
    addRows(byScope.rows);
  }

  // Trust server-scoped rows — do not re-filter with client session guards.
  return mapRowsFromDatabase([...rowsByKey.values()], session);
}

async function fetchLegacyPatientAppointments(
  supabase: SupabaseClient,
  scopeFilter: string | null,
  linkedPatientIds: string[],
  session: PatientAuthSession,
): Promise<MyAppointmentRecord[]> {
  const uniqueIds = [...new Set(linkedPatientIds.map((id) => String(id).trim()).filter(Boolean))];
  const rowsByKey = new Map<string, Record<string, unknown>>();

  const addRows = (rows: Record<string, unknown>[]) => {
    for (const row of rows) {
      const key = String(row.appointment_id ?? row.id ?? JSON.stringify(row));
      rowsByKey.set(key, row);
    }
  };

  if (uniqueIds.length > 0) {
    const byPatientId = await supabase
      .from('patient_appointments')
      .select('*')
      .in('patient_id', uniqueIds)
      .order('created_at', { ascending: false });

    if (!byPatientId.error && byPatientId.data?.length) {
      addRows(byPatientId.data as Record<string, unknown>[]);
    }
  }

  if (scopeFilter) {
    const byScope = await supabase
      .from('patient_appointments')
      .select('*')
      .or(scopeFilter)
      .order('created_at', { ascending: false });

    if (!byScope.error && byScope.data?.length) {
      addRows(byScope.data as Record<string, unknown>[]);
    }
  }

  if (rowsByKey.size === 0) return [];

  return mapRowsFromDatabase([...rowsByKey.values()], session);
}

export function filterLocalAppointmentsForSession(
  rows: unknown[],
  session: PatientAuthSession,
  linkedPatientIds: string[] = [],
  familyMemberNames: string[] = [],
): MyAppointmentRecord[] {
  if (!Array.isArray(rows)) return [];

  return rows
    .filter((row) => row && typeof row === 'object')
    .filter((row) =>
      rowMatchesPatientSession(row as Record<string, unknown>, session, linkedPatientIds, familyMemberNames),
    )
    .map((row) => mapRowToAppointmentRecord(row as Record<string, unknown>, session))
    .filter((row) => row.patient_name && row.appointment_date);
}

export type PatientAppointmentFetchContext = {
  authUserId: string | null;
  resolvedPatientId: string | null;
  linkedPatientIds: string[];
  familyMemberNames: string[];
};

/** Resolves dual auth/profile identifiers for appointment scoping. */
export async function resolvePatientAppointmentContext(
  supabase: SupabaseClient,
  session: PatientAuthSession,
): Promise<PatientAppointmentFetchContext> {
  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData.user ?? null;

  let patientProfile: { id: string } | null = null;
  if (authUser) {
    const profileResult = await supabase
      .from('patients')
      .select('id, email')
      .or(`id.eq.${authUser.id},email.eq.${authUser.email ?? ''}`)
      .maybeSingle();

    if (!profileResult.error && profileResult.data?.id) {
      patientProfile = { id: String(profileResult.data.id) };
    }
  }

  const resolvedPatientId =
    patientProfile?.id ?? authUser?.id ?? session.patientId ?? null;

  const resolvedPatient = await resolveEffectivePatientId(supabase, {
    phone: session.phone,
    sessionPatientId: resolvedPatientId || session.patientId,
    email: authUser?.email || session.email,
  });

  const linkedPatientIds = [
    ...new Set([
      ...resolvedPatient.linkedPatientIds,
      authUser?.id ?? '',
      resolvedPatientId ?? '',
      session.patientId,
    ].map((value) => String(value).trim()).filter(Boolean)),
  ];

  return {
    authUserId: authUser?.id ?? null,
    resolvedPatientId,
    linkedPatientIds,
    familyMemberNames: resolvedPatient.familyMemberNames,
  };
}

/** Fetches OPD appointments scoped to the signed-in patient from `public.appointments`. */
export async function fetchMyPrivateAppointments(
  supabase: SupabaseClient,
  sessionOverride?: PatientAuthSession | null,
): Promise<{ session: PatientAuthSession | null; appointments: MyAppointmentRecord[]; context: PatientAppointmentFetchContext | null }> {
  const session = sessionOverride ?? resolveActivePatientSession();
  if (!session || !hasVerifiedPatientIdentity(session)) {
    return { session: null, appointments: [], context: null };
  }

  await resolveActiveAuthUser(supabase, session.patientId);
  const context = await resolvePatientAppointmentContext(supabase, session);
  const scopeFilter = buildPatientScopeOrFilter(
    session,
    context.linkedPatientIds,
    context.familyMemberNames,
  );

  if (!scopeFilter && context.linkedPatientIds.length === 0) {
    return { session, appointments: [], context };
  }

  logDevFetch('identity resolution', {
    authUserId: context.authUserId,
    resolvedPatientId: context.resolvedPatientId,
    linkedPatientIds: context.linkedPatientIds,
    scopeFilter,
  });

  const [appointmentRows, legacyRows] = await Promise.all([
    fetchAppointmentsForPatient(supabase, scopeFilter, context.linkedPatientIds, session),
    fetchLegacyPatientAppointments(supabase, scopeFilter, context.linkedPatientIds, session),
  ]);

  const appointments = deduplicateAppointments([...appointmentRows, ...legacyRows]);

  logDevFetch('final merged rows', {
    appointmentsCount: appointments.length,
    fromAppointmentsTable: appointmentRows.length,
    fromLegacyTable: legacyRows.length,
  });

  return {
    session,
    appointments,
    context,
  };
}

export async function cancelPatientAppointment(
  supabase: SupabaseClient,
  appointmentId: string,
): Promise<{ ok: boolean; error?: string }> {
  const id = String(appointmentId).trim();
  if (!id) return { ok: false, error: 'Missing appointment id' };

  const payload = {
    status: 'CANCELLED',
    queue_status: 'CANCELLED',
    updated_at: new Date().toISOString(),
  };

  const byAppointmentId = await supabase
    .from('appointments')
    .update(payload)
    .eq('appointment_id', id)
    .select('appointment_id')
    .maybeSingle();

  if (!byAppointmentId.error && byAppointmentId.data) {
    return { ok: true };
  }

  const byId = await supabase
    .from('appointments')
    .update(payload)
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (!byId.error && byId.data) {
    return { ok: true };
  }

  return { ok: false, error: byAppointmentId.error?.message ?? byId.error?.message ?? 'Cancel failed' };
}

export { resolveActivePatientSession };
