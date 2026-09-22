import type { SupabaseClient } from '@supabase/supabase-js';

import { buildPatientScopeOrFilter, readPatientAuthSession } from '@/lib/auth/patientAuth';
import { readStoredPatientIdentity, type StoredPatientIdentity } from '@/lib/patient/active-patient-node';
import {
  resolveActivePatientSession,
  resolvePatientAppointmentContext,
} from '@/lib/patient/my-appointments';
import { readPatientPortalSession } from '@/lib/patient/portal-session';
import { supabase } from '@/lib/supabaseClient';

export type PrescriptionMedicineItem = {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
};

export type NormalizedPrescription = {
  id: string;
  appointment_id?: string;
  patient_id?: string;
  patient_name?: string;
  uhid?: string;
  email?: string;
  doctor_name?: string;
  doctor_id?: string;
  department?: string;
  hospital_name?: string;
  diagnosis?: string;
  clinical_notes?: string;
  dietary_instructions?: string;
  doctor_advice?: string;
  reported_symptoms?: string;
  medicines: PrescriptionMedicineItem[];
  medications: PrescriptionMedicineItem[];
  instructions?: string;
  follow_up_date?: string;
  status?: string;
  issued_at?: string;
  created_at?: string;
};

export type PendingConsultation = {
  id: string;
  appointment_date: string;
  slot_time: string;
  doctor_name: string;
  department?: string;
  reported_symptoms?: string;
  status?: string;
  created_at?: string;
};

export type PatientPrescriptionsFeed = {
  prescriptions: NormalizedPrescription[];
  pendingConsultation: PendingConsultation | null;
  resolvedPatientId: string | null;
  authUserId: string | null;
};

const PRESCRIPTIONS_JOIN_SELECT = `
  id,
  appointment_id,
  patient_id,
  patient_name,
  uhid,
  email,
  doctor_id,
  doctor_name,
  department,
  hospital_name,
  diagnosis,
  clinical_notes,
  examination_findings,
  medicines,
  medications,
  instructions,
  dietary_instructions,
  doctor_instructions,
  doctor_advice,
  follow_up_date,
  status,
  issued_at,
  dispatched_at,
  created_at,
  doctor:doctors (
    id,
    full_name,
    specialty,
    department,
    doctor_id
  ),
  appointment:appointments (
    id,
    appointment_id,
    appointment_date,
    appointment_time,
    slot_time,
    reason,
    reason_for_visit,
    chief_complaint,
    symptoms
  )
`;

const COMPLETED_APPOINTMENT_STATUSES = new Set([
  'completed',
  'complete',
  'done',
  'billing_pending',
  'billing-pending',
  'dispatched',
  'cancelled',
  'canceled',
]);

function isMissingColumn(message: string, column: string): boolean {
  const msg = message.toLowerCase();
  return (
    msg.includes(`column prescriptions.${column} does not exist`) ||
    msg.includes(`column ${column} does not exist`) ||
    msg.includes(`'${column}' column`) ||
    msg.includes(`.${column} does not exist`)
  );
}

function readNestedRecord(raw: Record<string, unknown>, key: string): Record<string, unknown> | null {
  const value = raw[key];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function parseMedicinesField(raw: unknown): PrescriptionMedicineItem[] {
  if (!raw) return [];

  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  const medicines: PrescriptionMedicineItem[] = [];
  for (const med of parsed) {
    const item = med as Record<string, unknown>;
    const name = String(item.name || item.medicine || item.drug || item.medicine_name || '').trim();
    if (!name) continue;
    medicines.push({
      name,
      dosage: item.dosage ? String(item.dosage) : item.dose ? String(item.dose) : undefined,
      frequency: item.frequency
        ? String(item.frequency)
        : item.timing
          ? String(item.timing)
          : undefined,
      duration: item.duration ? String(item.duration) : undefined,
      instructions: item.instructions ? String(item.instructions) : undefined,
    });
  }
  return medicines;
}

export function normalizePrescriptionRow(raw: Record<string, unknown>): NormalizedPrescription {
  const doctor = readNestedRecord(raw, 'doctor');
  const appointment = readNestedRecord(raw, 'appointment');
  const medicines = parseMedicinesField(raw.medicines);
  const medications = parseMedicinesField(raw.medications);
  const list = medicines.length > 0 ? medicines : medications;

  const reportedSymptoms = String(
    appointment?.symptoms ??
      appointment?.reason_for_visit ??
      appointment?.chief_complaint ??
      appointment?.reason ??
      raw.symptoms ??
      '',
  ).trim();

  const doctorAdvice = String(
    raw.doctor_advice ??
      raw.dietary_instructions ??
      raw.doctor_instructions ??
      raw.instructions ??
      '',
  ).trim();

  const notes = raw.clinical_notes
    ? String(raw.clinical_notes)
    : raw.examination_findings
      ? String(raw.examination_findings)
      : undefined;

  return {
    id: String(raw.id ?? `${raw.appointment_id ?? 'rx'}-${raw.created_at ?? Date.now()}`),
    appointment_id: raw.appointment_id
      ? String(raw.appointment_id)
      : appointment?.appointment_id
        ? String(appointment.appointment_id)
        : appointment?.id
          ? String(appointment.id)
          : undefined,
    patient_id: raw.patient_id ? String(raw.patient_id) : undefined,
    patient_name: raw.patient_name ? String(raw.patient_name) : undefined,
    uhid: raw.uhid ? String(raw.uhid) : undefined,
    email: raw.email ? String(raw.email) : undefined,
    doctor_name: String(raw.doctor_name ?? doctor?.full_name ?? doctor?.name ?? '').trim() || undefined,
    doctor_id: String(raw.doctor_id ?? doctor?.doctor_id ?? doctor?.id ?? '').trim() || undefined,
    department: String(
      raw.department ?? doctor?.department ?? doctor?.specialty ?? '',
    ).trim() || undefined,
    hospital_name: raw.hospital_name
      ? String(raw.hospital_name)
      : 'Regal Hospital • Main Branch',
    diagnosis: raw.diagnosis ? String(raw.diagnosis) : undefined,
    clinical_notes: notes,
    dietary_instructions: doctorAdvice || undefined,
    doctor_advice: doctorAdvice || undefined,
    reported_symptoms: reportedSymptoms || undefined,
    instructions: doctorAdvice || undefined,
    follow_up_date: raw.follow_up_date ? String(raw.follow_up_date) : undefined,
    status: raw.status ? String(raw.status) : undefined,
    issued_at: raw.issued_at
      ? String(raw.issued_at)
      : raw.dispatched_at
        ? String(raw.dispatched_at)
        : raw.created_at
          ? String(raw.created_at)
          : undefined,
    created_at: raw.created_at ? String(raw.created_at) : undefined,
    medicines: list,
    medications: list,
  };
}

export function prescriptionMatchesPatient(
  row: NormalizedPrescription,
  identity: StoredPatientIdentity,
): boolean {
  const candidates = new Set(identity.identifiers.map((id) => id.toLowerCase()));
  const pid = (row.patient_id || '').trim();
  const uhid = (row.uhid || '').trim();
  const email = (row.email || '').trim();

  if (pid && candidates.has(pid.toLowerCase())) return true;
  if (uhid && candidates.has(uhid.toLowerCase())) return true;
  if (email && candidates.has(email.toLowerCase())) return true;

  const name = (row.patient_name || '').trim().toLowerCase();
  if (identity.patientName && name === identity.patientName.toLowerCase()) return true;
  return false;
}

function normalizePendingAppointment(row: Record<string, unknown>): PendingConsultation {
  return {
    id: String(row.appointment_id ?? row.id ?? ''),
    appointment_date: String(row.appointment_date ?? row.created_at ?? '').slice(0, 10),
    slot_time: String(row.slot_time ?? row.appointment_time ?? row.time_slot ?? '—'),
    doctor_name: String(row.doctor_name ?? 'Assigned clinician'),
    department: row.department ? String(row.department) : undefined,
    reported_symptoms: String(
      row.symptoms ?? row.reason_for_visit ?? row.chief_complaint ?? row.reason ?? '',
    ).trim() || undefined,
    status: row.status ? String(row.status) : row.queue_status ? String(row.queue_status) : undefined,
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

function isPendingAppointmentStatus(status?: string): boolean {
  const normalized = String(status ?? 'waiting').trim().toLowerCase().replace(/_/g, '-');
  if (!normalized) return true;
  if (COMPLETED_APPOINTMENT_STATUSES.has(normalized)) return false;
  if (normalized.includes('complete') || normalized.includes('cancel')) return false;
  return true;
}

function appointmentHasPrescription(
  appointment: PendingConsultation,
  prescriptions: NormalizedPrescription[],
): boolean {
  const appointmentKeys = new Set(
    [appointment.id].map((value) => String(value).trim()).filter(Boolean),
  );
  return prescriptions.some((rx) => {
    const rxAppointmentId = String(rx.appointment_id ?? '').trim();
    return rxAppointmentId && appointmentKeys.has(rxAppointmentId);
  });
}

function resolvePatientSession() {
  return (
    readPatientAuthSession() ??
    (() => {
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
    })()
  );
}

async function queryPrescriptionsRows(
  client: SupabaseClient,
  linkedPatientIds: string[],
  scopeFilter: string | null,
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  const rowsByKey = new Map<string, Record<string, unknown>>();

  const addRows = (rows: Record<string, unknown>[]) => {
    for (const row of rows) {
      rowsByKey.set(String(row.id ?? row.appointment_id ?? JSON.stringify(row)), row);
    }
  };

  const uniqueIds = [...new Set(linkedPatientIds.map((id) => String(id).trim()).filter(Boolean))];

  if (uniqueIds.length > 0) {
    const joined = await client
      .from('prescriptions')
      .select(PRESCRIPTIONS_JOIN_SELECT)
      .in('patient_id', uniqueIds)
      .order('created_at', { ascending: false });

    if (!joined.error && joined.data?.length) {
      addRows(joined.data as Record<string, unknown>[]);
    } else {
      const plain = await client
        .from('prescriptions')
        .select('*')
        .in('patient_id', uniqueIds)
        .order('created_at', { ascending: false });

      if (plain.error) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[prescriptions-feed] patient_id.in error:', plain.error.message);
        }
      } else if (plain.data?.length) {
        addRows(plain.data as Record<string, unknown>[]);
      }
    }
  }

  if (scopeFilter) {
    const joined = await client
      .from('prescriptions')
      .select(PRESCRIPTIONS_JOIN_SELECT)
      .or(scopeFilter)
      .order('created_at', { ascending: false });

    if (!joined.error && joined.data?.length) {
      addRows(joined.data as Record<string, unknown>[]);
    } else {
      const plain = await client
        .from('prescriptions')
        .select('*')
        .or(scopeFilter)
        .order('created_at', { ascending: false });

      if (!plain.error && plain.data?.length) {
        addRows(plain.data as Record<string, unknown>[]);
      } else if (plain.error && process.env.NODE_ENV === 'development') {
        console.debug('[prescriptions-feed] scope.or error:', plain.error.message);
      }
    }
  }

  return { rows: [...rowsByKey.values()], error: null };
}

async function queryLatestPendingAppointment(
  client: SupabaseClient,
  linkedPatientIds: string[],
  scopeFilter: string | null,
): Promise<PendingConsultation | null> {
  const uniqueIds = [...new Set(linkedPatientIds.map((id) => String(id).trim()).filter(Boolean))];
  const rowsByKey = new Map<string, Record<string, unknown>>();

  const addRows = (rows: Record<string, unknown>[]) => {
    for (const row of rows) {
      rowsByKey.set(String(row.appointment_id ?? row.id ?? JSON.stringify(row)), row);
    }
  };

  if (uniqueIds.length > 0) {
    const byPatientId = await client
      .from('appointments')
      .select('*')
      .in('patient_id', uniqueIds)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!byPatientId.error && byPatientId.data?.length) {
      addRows(byPatientId.data as Record<string, unknown>[]);
    }
  }

  if (scopeFilter) {
    const byScope = await client
      .from('appointments')
      .select('*')
      .or(scopeFilter)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!byScope.error && byScope.data?.length) {
      addRows(byScope.data as Record<string, unknown>[]);
    }
  }

  const pending = [...rowsByKey.values()]
    .map((row) => normalizePendingAppointment(row))
    .filter((row) => row.id && isPendingAppointmentStatus(row.status))
    .sort((a, b) => {
      const aTime = a.created_at ? Date.parse(a.created_at) : 0;
      const bTime = b.created_at ? Date.parse(b.created_at) : 0;
      return bTime - aTime;
    });

  return pending[0] ?? null;
}

/** Live feed: latest prescriptions + pending consultation when dispatch has not occurred. */
export async function fetchPatientPrescriptionsFeed(
  client: SupabaseClient = supabase,
): Promise<PatientPrescriptionsFeed> {
  const session = resolvePatientSession();
  if (!session) {
    return { prescriptions: [], pendingConsultation: null, resolvedPatientId: null, authUserId: null };
  }

  const context = await resolvePatientAppointmentContext(client, session);
  const scopeFilter = buildPatientScopeOrFilter(
    session,
    context.linkedPatientIds,
    context.familyMemberNames,
  );

  if (process.env.NODE_ENV === 'development') {
    console.debug('[prescriptions-feed] authUserId:', context.authUserId);
    console.debug('[prescriptions-feed] resolvedPatientId:', context.resolvedPatientId);
    console.debug('[prescriptions-feed] linkedPatientIds:', context.linkedPatientIds);
    console.debug('[prescriptions-feed] scopeFilter:', scopeFilter);
  }

  const { rows, error } = await queryPrescriptionsRows(client, context.linkedPatientIds, scopeFilter);
  if (error && process.env.NODE_ENV === 'development') {
    console.debug('[prescriptions-feed] query error:', error);
  }

  const prescriptions = rows
    .map((row) => normalizePrescriptionRow(row))
    .sort((a, b) => {
      const aTime = a.created_at ? Date.parse(a.created_at) : 0;
      const bTime = b.created_at ? Date.parse(b.created_at) : 0;
      return bTime - aTime;
    });

  const pendingConsultationRaw = await queryLatestPendingAppointment(
    client,
    context.linkedPatientIds,
    scopeFilter,
  );

  const pendingConsultation =
    pendingConsultationRaw && !appointmentHasPrescription(pendingConsultationRaw, prescriptions)
      ? pendingConsultationRaw
      : null;

  if (process.env.NODE_ENV === 'development') {
    console.debug('[prescriptions-feed] prescriptions count:', prescriptions.length);
    console.debug('[prescriptions-feed] latest created_at:', prescriptions[0]?.created_at ?? null);
    console.debug('[prescriptions-feed] pendingConsultation:', pendingConsultation);
  }

  return {
    prescriptions,
    pendingConsultation,
    resolvedPatientId: context.resolvedPatientId,
    authUserId: context.authUserId,
  };
}

/** @deprecated Prefer fetchPatientPrescriptionsFeed for live patient portal data. */
export async function queryPrescriptionsForPatient(
  identity: StoredPatientIdentity = readStoredPatientIdentity(),
): Promise<NormalizedPrescription[]> {
  const feed = await fetchPatientPrescriptionsFeed(supabase);
  if (feed.prescriptions.length > 0) return feed.prescriptions;

  const run = async (includeUhid: boolean, includeName: boolean) => {
    let query = supabase.from('prescriptions').select('*').order('created_at', { ascending: false });
    const parts: string[] = [];
    for (const id of identity.identifiers) {
      if (!id || id.includes(',')) continue;
      parts.push(`patient_id.eq.${id}`);
      if (includeUhid) parts.push(`uhid.eq.${id}`);
    }
    if (includeName && identity.patientName) {
      parts.push(`patient_name.ilike.%${identity.patientName.replace(/,/g, ' ').trim()}%`);
    }
    const orFilter = parts.join(',');
    if (orFilter) query = query.or(orFilter);
    return query;
  };

  try {
    let { data, error } = await run(true, true);
    if (error && isMissingColumn(error.message, 'uhid')) {
      const retry = await run(false, true);
      data = retry.data;
      error = retry.error;
    }
    if (error && isMissingColumn(error.message, 'patient_name')) {
      const retry = await run(false, false);
      data = retry.data;
      error = retry.error;
    }
    if (error) {
      console.error('[Patient Prescriptions] fetch failed:', error.message);
      return [];
    }
    return ((data ?? []) as Record<string, unknown>[]).map((row) => normalizePrescriptionRow(row));
  } catch (err: unknown) {
    console.error('[Patient Prescriptions] fetch crashed:', err);
    return [];
  }
}

export { resolveActivePatientSession };
