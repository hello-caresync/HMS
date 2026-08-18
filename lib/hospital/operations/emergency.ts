import type { SupabaseClient } from '@supabase/supabase-js';

import {
  countActiveEmergencyTriages,
  loadEmergencyTriagesLive,
  normalizeEmergencyTriageRow,
  priorityTierFromCode,
  registerEmergencyTriageIntake,
  type EmergencyIntakeInput,
  type EmergencyPriorityTier,
} from './emergency-triage-sync';
import { emitSystemEvent } from './events';
import type { EmergencyTriageRow, TriagePriority } from './types';

export {
  countActiveEmergencyTriages,
  loadEmergencyTriagesLive,
  normalizeEmergencyTriageRow,
  priorityTierFromCode,
  registerEmergencyTriageIntake,
  type EmergencyIntakeInput,
  type EmergencyPriorityTier,
};

export async function fetchEmergencyTriages(
  supabase: SupabaseClient,
): Promise<EmergencyTriageRow[]> {
  const rows = await loadEmergencyTriagesLive(supabase);
  return rows as EmergencyTriageRow[];
}

export async function registerEmergencyTriage(
  supabase: SupabaseClient,
  input: {
    patientName: string;
    patientId?: string;
    chiefComplaint: string;
    priority: TriagePriority;
    vitals?: Record<string, unknown>;
  },
) {
  const vitals = input.vitals ?? {};
  const result = await registerEmergencyTriageIntake(supabase, {
    patient_name: input.patientName,
    patient_uhid: input.patientId,
    chief_complaint: input.chiefComplaint,
    priority_tier: priorityTierFromCode(input.priority),
    bp: vitals.bp != null ? String(vitals.bp) : undefined,
    spo2: vitals.spo2 != null ? Number(vitals.spo2) : undefined,
    pulse: vitals.pulse != null ? Number(vitals.pulse) : undefined,
    temp: vitals.temp != null ? Number(vitals.temp) : undefined,
    gcs: vitals.gcs != null ? Number(vitals.gcs) : undefined,
    trigger_doctor_bypass: input.priority === 'P1',
  });

  if (!result.ok) {
    throw new Error(result.error ?? 'Failed to register triage');
  }

  return { success: true, triage: result.row as EmergencyTriageRow };
}

export function countActiveTriages(rows: EmergencyTriageRow[]) {
  const active = rows.filter((r) => r.status !== 'discharged' && r.status !== 'closed');
  return {
    p1: active.filter((r) => String(r.priority).startsWith('P1')).length,
    p2: active.filter((r) => String(r.priority).startsWith('P2')).length,
    p3: active.filter((r) => String(r.priority).startsWith('P3')).length,
    total: active.length,
  };
}
