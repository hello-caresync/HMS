import type { SupabaseClient } from '@supabase/supabase-js';

export type Patient360Source = {
  id?: string | null;
  patient_id?: string | null;
  patientId?: string | null;
  appointment_id?: string | null;
  uhid?: string | null;
  patient_name?: string | null;
  name?: string | null;
};

export type Patient360HistoryItem = {
  id: string;
  type: string;
  created_at: string;
  diagnosis?: string;
  clinical_notes?: string;
  medications?: { name: string }[];
  title?: string;
  summary?: string;
  doctor_name?: string;
};

function uniqueIds(...values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  for (const value of values) {
    const clean = String(value ?? '').trim();
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
  }
  return [...seen];
}

export function resolvePatient360Keys(patient: Patient360Source): {
  currentPatientId: string;
  appointmentId: string;
  uhid: string;
  patientName: string;
  lookupIds: string[];
} {
  const currentPatientId = String(
    patient.patient_id || patient.patientId || patient.uhid || patient.id || '',
  ).trim();
  const appointmentId = String(patient.appointment_id || patient.id || '').trim();
  const uhid = String(patient.uhid || currentPatientId || '').trim();
  const patientName = String(patient.patient_name || patient.name || '').trim();

  return {
    currentPatientId,
    appointmentId,
    uhid,
    patientName,
    lookupIds: uniqueIds(currentPatientId, appointmentId, uhid, patient.id),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function medicineNames(raw: unknown): { name: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const row = asRecord(item);
      const name = String(row.name ?? row.drug ?? row.medicine_name ?? '').trim();
      return name ? { name } : null;
    })
    .filter((item): item is { name: string } => Boolean(item));
}

function mapHistoryRow(row: Record<string, unknown>, type: string): Patient360HistoryItem {
  return {
    id: String(row.id ?? `${type}-${row.created_at ?? Date.now()}`),
    type,
    created_at: String(row.created_at ?? row.issued_at ?? new Date().toISOString()),
    diagnosis: String(row.diagnosis ?? row.chief_complaint ?? row.record_type ?? '').trim() || undefined,
    clinical_notes: String(
      row.clinical_notes ?? row.doctor_notes ?? row.summary ?? row.instructions ?? row.result_summary ?? '',
    ).trim() || undefined,
    medications: medicineNames(row.medications ?? row.medicines),
    title: String(row.test_name ?? row.study_name ?? '').trim() || undefined,
    summary: String(row.result_summary ?? row.report_summary ?? row.status ?? '').trim() || undefined,
    doctor_name: row.doctor_name ? String(row.doctor_name) : undefined,
  };
}

async function selectByIdentifiers(
  supabase: SupabaseClient,
  table: string,
  ids: string[],
  patientName: string,
): Promise<Record<string, unknown>[]> {
  const queries = [
    ids.length ? supabase.from(table).select('*').in('patient_id', ids).order('created_at', { ascending: false }) : null,
    ids.length ? supabase.from(table).select('*').in('uhid', ids).order('created_at', { ascending: false }) : null,
    ids.length
      ? supabase.from(table).select('*').in('appointment_id', ids).order('created_at', { ascending: false })
      : null,
    patientName
      ? supabase.from(table).select('*').eq('patient_name', patientName).order('created_at', { ascending: false })
      : null,
  ].filter(Boolean);

  const results = await Promise.allSettled(queries);
  const rows: Record<string, unknown>[] = [];

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    const payload = result.value as { data?: unknown; error?: { message?: string } };
    if (payload.error || !Array.isArray(payload.data)) continue;
    rows.push(...payload.data.map((item) => asRecord(item)));
  }

  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = String(row.id ?? `${row.created_at}-${row.diagnosis ?? ''}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchPatient360History(
  supabase: SupabaseClient,
  patient: Patient360Source,
): Promise<Patient360HistoryItem[]> {
  const keys = resolvePatient360Keys(patient);
  if (keys.lookupIds.length === 0 && !keys.patientName) return [];

  const [consultations, prescriptions, medicalRecords, clinicalRecords, labOrders, radiologyOrders] =
    await Promise.all([
      selectByIdentifiers(supabase, 'consultations', keys.lookupIds, keys.patientName),
      selectByIdentifiers(supabase, 'prescriptions', keys.lookupIds, keys.patientName),
      selectByIdentifiers(supabase, 'medical_records', keys.lookupIds, keys.patientName),
      selectByIdentifiers(supabase, 'hospital_clinical_records', keys.lookupIds, keys.patientName),
      selectByIdentifiers(supabase, 'lab_orders', keys.lookupIds, keys.patientName),
      selectByIdentifiers(supabase, 'radiology_orders', keys.lookupIds, keys.patientName),
    ]);

  return [
    ...consultations.map((row) => mapHistoryRow(row, 'CONSULTATION')),
    ...prescriptions.map((row) => mapHistoryRow(row, 'PRESCRIPTION')),
    ...medicalRecords.map((row) => mapHistoryRow(row, 'RECORD')),
    ...clinicalRecords.map((row) => mapHistoryRow(row, 'CLINICAL')),
    ...labOrders.map((row) => mapHistoryRow(row, 'LAB')),
    ...radiologyOrders.map((row) => mapHistoryRow(row, 'RADIOLOGY')),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function buildOptimisticHistoryItem(input: {
  diagnosis: string;
  clinicalNotes: string;
  medications: { name: string }[];
}): Patient360HistoryItem {
  return {
    id: `local-${Date.now()}`,
    type: 'CONSULTATION',
    created_at: new Date().toISOString(),
    diagnosis: input.diagnosis,
    clinical_notes: input.clinicalNotes,
    medications: input.medications,
  };
}
