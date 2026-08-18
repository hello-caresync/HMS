import type { SupabaseClient } from '@supabase/supabase-js';

import { emitEcosystemSystemEvent } from '@/lib/ecosystem/messaging-service';
import { REGAL_FACILITY_CODE, REGAL_HOSPITAL_ID } from '@/lib/regal/constants';

export type EmergencyPriorityTier = 'P1 Critical' | 'P2 Urgent' | 'P3 Non-Urgent';

export type EmergencyIntakeInput = {
  patient_name: string;
  patient_uhid?: string;
  chief_complaint: string;
  priority_tier: EmergencyPriorityTier;
  bp?: string;
  spo2?: number;
  pulse?: number;
  temp?: number;
  gcs?: number;
  assigned_doctor_id?: string;
  assigned_doctor_name?: string;
  trigger_doctor_bypass?: boolean;
};

export type EmergencyTriageSyncResult = {
  ok: boolean;
  error?: string;
  triageId?: string;
  row?: Record<string, unknown>;
};

function clockLabel(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function newTraumaUhid(): string {
  return `RH-ER-${String(Math.floor(100000 + Math.random() * 900000))}`;
}

/** Map UI / legacy priority codes to canonical tier labels. */
export function priorityTierFromCode(code: string): EmergencyPriorityTier {
  const normalized = code.trim().toUpperCase();
  if (normalized.startsWith('P1')) return 'P1 Critical';
  if (normalized.startsWith('P2')) return 'P2 Urgent';
  return 'P3 Non-Urgent';
}

/** Short code for badges (P1 / P2 / P3). */
export function priorityCodeFromTier(tier: unknown): string {
  const normalized = String(tier ?? 'P3').toUpperCase();
  if (normalized.startsWith('P1')) return 'P1';
  if (normalized.startsWith('P2')) return 'P2';
  return 'P3';
}

/** Normalize unified emergency_triage or legacy emergency_triages rows for the hospital UI. */
export function normalizeEmergencyTriageRow(row: Record<string, unknown>): Record<string, unknown> {
  const legacyVitals = (row.vitals ?? {}) as Record<string, unknown>;
  const priorityRaw = row.priority_tier ?? row.priority ?? 'P3';
  const priority = priorityCodeFromTier(priorityRaw);

  return {
    ...row,
    id: String(row.id ?? ''),
    patient_name: row.patient_name,
    patient_uhid: row.patient_uhid ?? row.uhid,
    chief_complaint: row.chief_complaint ?? row.complaint,
    priority,
    priority_tier: priorityTierFromCode(String(priorityRaw)),
    status: row.status ?? 'active',
    surgeon: row.assigned_doctor_name ?? row.surgeon ?? row.doctor_name,
    doctor_name: row.assigned_doctor_name ?? row.doctor_name,
    assigned_doctor_id: row.assigned_doctor_id,
    assigned_doctor_name: row.assigned_doctor_name,
    arrival: row.arrival_time ?? row.arrival,
    doctor_bypass_triggered: Boolean(row.doctor_bypass_triggered),
    vitals: {
      bp: row.bp ?? legacyVitals.bp,
      spo2: row.spo2 ?? legacyVitals.spo2,
      pulse: row.pulse ?? legacyVitals.pulse,
      temp: row.temp ?? legacyVitals.temp,
      gcs: row.gcs ?? legacyVitals.gcs,
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function queryEmergencyTriageTable(
  supabase: SupabaseClient,
  table: 'emergency_triage' | 'emergency_triages',
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error || !data?.length) return [];
  return data as Record<string, unknown>[];
}

/** Live-only trauma board load — never injects mock seed patients. */
export async function loadEmergencyTriagesLive(
  supabase: SupabaseClient,
  facilityCode: string = REGAL_FACILITY_CODE,
): Promise<Record<string, unknown>[]> {
  try {
    const filtered = await supabase
      .from('emergency_triage')
      .select('*')
      .or(`facility_code.eq.${facilityCode},hospital_code.eq.${facilityCode},hospital_id.eq.${REGAL_HOSPITAL_ID}`)
      .order('created_at', { ascending: false })
      .limit(100);

    let rows: Record<string, unknown>[] = [];
    if (!filtered.error && filtered.data?.length) {
      rows = filtered.data as Record<string, unknown>[];
    } else {
      rows = await queryEmergencyTriageTable(supabase, 'emergency_triage');
    }

    if (!rows.length) {
      rows = await queryEmergencyTriageTable(supabase, 'emergency_triages');
    }

    return rows.map((row) => normalizeEmergencyTriageRow(row));
  } catch {
    return [];
  }
}

async function insertEmergencyTriageRow(
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  const { data, error } = await supabase.from('emergency_triage').insert(payload).select('*').single();
  if (!error && data) return { data: data as Record<string, unknown>, error: null };

  const legacyPriority = priorityCodeFromTier(payload.priority_tier);
  const legacyPayload = {
    patient_name: payload.patient_name,
    patient_id: null,
    chief_complaint: payload.chief_complaint,
    priority: legacyPriority,
    vitals: {
      bp: payload.bp,
      spo2: payload.spo2,
      pulse: payload.pulse,
      temp: payload.temp,
      gcs: payload.gcs,
    },
    status: payload.status ?? 'active',
  };

  const retry = await supabase.from('emergency_triages').insert(legacyPayload).select('*').single();
  if (!retry.error && retry.data) {
    return { data: retry.data as Record<string, unknown>, error: null };
  }

  return {
    data: null,
    error: error?.message ?? retry.error?.message ?? 'Emergency triage insert failed',
  };
}

async function broadcastDoctorBypass(
  supabase: SupabaseClient,
  input: {
    triageId: string;
    patientName: string;
    chiefComplaint: string;
    priorityTier: EmergencyPriorityTier;
    vitals: Record<string, unknown>;
  },
): Promise<void> {
  await emitEcosystemSystemEvent(supabase, {
    event_type: 'EMERGENCY_BYPASS_TRIGGERED',
    source_app: 'hospital',
    severity: 'critical',
    target_roles: ['doctor', 'hospital', 'patient'],
    payload: {
      message: `${input.priorityTier}: ${input.patientName} — ${input.chiefComplaint}`,
      triage_id: input.triageId,
      patient_name: input.patientName,
      chief_complaint: input.chiefComplaint,
      priority_tier: input.priorityTier,
      vitals: input.vitals,
      facility_code: REGAL_FACILITY_CODE,
      alarm: true,
    },
  });

  await supabase.from('system_events').insert({
    event_type: 'EMERGENCY_BYPASS_TRIGGERED',
    payload: {
      message: `${input.priorityTier}: ${input.patientName} — ${input.chiefComplaint}`,
      triageId: input.triageId,
      vitals: input.vitals,
    },
    severity: 'critical',
    target_roles: ['hospital', 'doctor'],
  });
}

/** Admit a trauma case to the live emergency board and optionally broadcast doctor bypass. */
export async function registerEmergencyTriageIntake(
  supabase: SupabaseClient,
  input: EmergencyIntakeInput,
): Promise<EmergencyTriageSyncResult> {
  const now = new Date().toISOString();
  const uhid = input.patient_uhid?.trim() || newTraumaUhid();
  const bypass =
    input.trigger_doctor_bypass ?? input.priority_tier === 'P1 Critical';

  const payload: Record<string, unknown> = {
    hospital_id: REGAL_HOSPITAL_ID,
    facility_code: REGAL_FACILITY_CODE,
    hospital_code: REGAL_FACILITY_CODE,
    patient_name: input.patient_name.trim(),
    patient_uhid: uhid,
    priority_tier: input.priority_tier,
    chief_complaint: input.chief_complaint.trim() || 'Emergency intake',
    assigned_doctor_id: input.assigned_doctor_id ?? 'RH-D02',
    assigned_doctor_name: input.assigned_doctor_name ?? 'Dr. Chandrakanth S. Kesari',
    bp: input.bp?.trim() || '120/80',
    spo2: input.spo2 ?? 98,
    pulse: input.pulse ?? 80,
    temp: input.temp ?? 37.0,
    gcs: input.gcs ?? 15,
    status: 'active',
    doctor_bypass_triggered: bypass,
    arrival_time: clockLabel(),
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await insertEmergencyTriageRow(supabase, payload);
  if (error) {
    return { ok: false, error };
  }

  const row = normalizeEmergencyTriageRow(data ?? payload);
  const triageId = String(row.id ?? '');

  if (bypass) {
    await broadcastDoctorBypass(supabase, {
      triageId,
      patientName: input.patient_name.trim(),
      chiefComplaint: String(payload.chief_complaint),
      priorityTier: input.priority_tier,
      vitals: row.vitals as Record<string, unknown>,
    });
  }

  return { ok: true, triageId, row };
}

export async function countActiveEmergencyTriages(
  supabase: SupabaseClient,
): Promise<number> {
  const primary = await supabase
    .from('emergency_triage')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  if (!primary.error && primary.count != null) {
    return primary.count;
  }

  const legacy = await supabase
    .from('emergency_triages')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  return legacy.count ?? 0;
}
