import type { SupabaseClient } from '@supabase/supabase-js';

import { REGAL_FACILITY_CODE, REGAL_HOSPITAL_ID } from '@/lib/regal/constants';

export type EmergencyClinicalStatus = 'active' | 'in_treatment' | 'stabilized' | 'completed';

export type EmergencyClinicalCase = {
  id: string;
  patient_name: string;
  patient_uhid: string;
  priority_tier: string;
  chief_complaint: string;
  assigned_doctor_id: string;
  assigned_doctor_name: string;
  bp: string | null;
  spo2: number | null;
  pulse: number | null;
  temp: number | null;
  gcs: number | null;
  status: EmergencyClinicalStatus | string;
  doctor_bypass_triggered: boolean;
  doctor_prescription_notes: string | null;
  medications: unknown[];
  arrival_time: string | null;
  attended_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string | null;
};

export type DoctorEmergencyCompletionInput = {
  bp: string;
  spo2: number | null;
  pulse: number | null;
  temp: number | null;
  gcs: number | null;
  doctor_prescription_notes: string;
  medications?: unknown[];
  disposition?: 'stabilized' | 'completed';
};

function normalizeCase(row: Record<string, unknown>): EmergencyClinicalCase {
  return {
    id: String(row.id ?? ''),
    patient_name: String(row.patient_name ?? 'Patient'),
    patient_uhid: String(row.patient_uhid ?? ''),
    priority_tier: String(row.priority_tier ?? 'P1 Critical'),
    chief_complaint: String(row.chief_complaint ?? ''),
    assigned_doctor_id: String(row.assigned_doctor_id ?? ''),
    assigned_doctor_name: String(row.assigned_doctor_name ?? ''),
    bp: row.bp != null ? String(row.bp) : null,
    spo2: row.spo2 == null || row.spo2 === '' ? null : Number(row.spo2),
    pulse: row.pulse == null || row.pulse === '' ? null : Number(row.pulse),
    temp: row.temp == null || row.temp === '' ? null : Number(row.temp),
    gcs: row.gcs == null || row.gcs === '' ? null : Number(row.gcs),
    status: String(row.status ?? 'active'),
    doctor_bypass_triggered: Boolean(row.doctor_bypass_triggered),
    doctor_prescription_notes:
      row.doctor_prescription_notes != null ? String(row.doctor_prescription_notes) : null,
    medications: Array.isArray(row.medications) ? row.medications : [],
    arrival_time: row.arrival_time != null ? String(row.arrival_time) : null,
    attended_at: row.attended_at != null ? String(row.attended_at) : null,
    completed_at: row.completed_at != null ? String(row.completed_at) : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: row.updated_at != null ? String(row.updated_at) : null,
  };
}

/** Active bypass cases assigned to a specific doctor (live board). */
export async function loadAssignedEmergencyCases(
  supabase: SupabaseClient,
  doctorId: string,
  statuses: string[] = ['active', 'in_treatment'],
): Promise<EmergencyClinicalCase[]> {
  const { data, error } = await supabase
    .from('emergency_triage')
    .select('*')
    .eq('assigned_doctor_id', doctorId)
    .in('status', statuses)
    .order('created_at', { ascending: false });

  if (error || !data?.length) return [];
  return (data as Record<string, unknown>[]).map(normalizeCase);
}

/** Archived emergency records (stabilized / completed). */
export async function loadEmergencyClinicalArchive(
  supabase: SupabaseClient,
  facilityCode: string = REGAL_FACILITY_CODE,
  limit = 50,
): Promise<EmergencyClinicalCase[]> {
  const { data, error } = await supabase
    .from('emergency_triage')
    .select('*')
    .or(`facility_code.eq.${facilityCode},hospital_code.eq.${facilityCode},hospital_id.eq.${REGAL_HOSPITAL_ID}`)
    .in('status', ['stabilized', 'completed'])
    .order('completed_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error || !data?.length) return [];
  return (data as Record<string, unknown>[]).map(normalizeCase);
}

export async function attendEmergencyCase(
  supabase: SupabaseClient,
  caseId: string,
): Promise<{ ok: boolean; error?: string }> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('emergency_triage')
    .update({
      status: 'in_treatment',
      attended_at: now,
      updated_at: now,
    })
    .eq('id', caseId);

  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function completeEmergencyCase(
  supabase: SupabaseClient,
  caseId: string,
  input: DoctorEmergencyCompletionInput,
): Promise<{ ok: boolean; error?: string }> {
  const now = new Date().toISOString();
  const disposition = input.disposition ?? 'completed';

  const { error } = await supabase
    .from('emergency_triage')
    .update({
      bp: input.bp.trim() || 'Pending',
      spo2: input.spo2,
      pulse: input.pulse,
      temp: input.temp,
      gcs: input.gcs,
      doctor_prescription_notes: input.doctor_prescription_notes.trim(),
      medications: input.medications ?? [],
      status: disposition,
      completed_at: now,
      updated_at: now,
    })
    .eq('id', caseId);

  return error ? { ok: false, error: error.message } : { ok: true };
}
