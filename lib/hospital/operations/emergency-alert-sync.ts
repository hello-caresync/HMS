import type { SupabaseClient } from '@supabase/supabase-js';

import { isHospitalUuid } from '@/lib/hospital/resolve-hospital-context';
import { REGAL_FACILITY_CODE, REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';

import {
  registerEmergencyTriageIntake,
  type EmergencyPriorityTier,
} from './emergency-triage-sync';

export type EmergencyAlertRow = Record<string, unknown>;

function mapAlertSeverityToTier(severity: unknown): EmergencyPriorityTier {
  const raw = String(severity ?? 'code_red').toLowerCase();
  if (raw.includes('critical') || raw.includes('red') || raw.includes('p1')) {
    return 'P1 Critical';
  }
  if (raw.includes('urgent') || raw.includes('p2')) return 'P2 Urgent';
  return 'P3 Non-Urgent';
}

/** Hospital acknowledges an incoming alert and opens linked triage workflow. */
export async function acknowledgeEmergencyAlert(
  supabase: SupabaseClient,
  alertId: string,
  options?: {
    assigned_doctor_id?: string;
    assigned_doctor_name?: string;
  },
): Promise<{ ok: boolean; error?: string; triageId?: string }> {
  if (!alertId) return { ok: false, error: 'Missing alert id' };

  const { data: alertRow, error: fetchError } = await supabase
    .from('emergency_alerts')
    .select('*')
    .eq('id', alertId)
    .maybeSingle();

  if (fetchError) return { ok: false, error: fetchError.message };
  if (!alertRow) return { ok: false, error: 'Alert not found' };

  const alert = alertRow as EmergencyAlertRow;
  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('emergency_alerts')
    .update({
      status: 'Acknowledged',
      updated_at: now,
    })
    .eq('id', alertId);

  if (updateError) {
    const retry = await supabase
      .from('emergency_alerts')
      .update({ status: 'ACKNOWLEDGED' })
      .eq('id', alertId);
    if (retry.error) return { ok: false, error: retry.error.message };
  }

  const patientName = String(
    alert.patient_name ?? alert.patient_info ?? alert.patient_id ?? 'Emergency patient',
  );
  const complaint = String(
    alert.emergency_notes ?? alert.place_description ?? alert.patient_info ?? 'Emergency alert',
  );
  const priorityTier = mapAlertSeverityToTier(alert.severity);

  const triagePayload: Record<string, unknown> = {
    hospital_id: isHospitalUuid(String(alert.hospital_id ?? ''))
      ? String(alert.hospital_id)
      : null,
    facility_code: REGAL_FACILITY_CODE,
    hospital_code: alert.hospital_code ?? REGAL_HOSPITAL_CODE,
    emergency_alert_id: alertId,
    patient_name: patientName,
    patient_uhid: String(alert.patient_id ?? ''),
    priority_tier: priorityTier,
    chief_complaint: complaint,
    assigned_doctor_id: options?.assigned_doctor_id ?? 'RH-D02',
    assigned_doctor_name: options?.assigned_doctor_name ?? 'On-call ER physician',
    status: 'active',
    arrival_time: now,
    created_at: now,
    updated_at: now,
  };

  const { data: triageRow, error: triageError } = await supabase
    .from('emergency_triage')
    .insert(triagePayload)
    .select('*')
    .maybeSingle();

  if (!triageError && triageRow) {
    return { ok: true, triageId: String((triageRow as Record<string, unknown>).id ?? '') };
  }

  const intake = await registerEmergencyTriageIntake(supabase, {
    patient_name: patientName,
    patient_uhid: String(alert.patient_id ?? ''),
    chief_complaint: complaint,
    priority_tier: priorityTier,
    assigned_doctor_id: options?.assigned_doctor_id,
    assigned_doctor_name: options?.assigned_doctor_name,
    trigger_doctor_bypass: priorityTier === 'P1 Critical',
  });

  if (!intake.ok) {
    return { ok: false, error: intake.error ?? triageError?.message ?? 'Triage create failed' };
  }

  if (intake.triageId) {
    await supabase
      .from('emergency_triage')
      .update({ emergency_alert_id: alertId })
      .eq('id', intake.triageId);
  }

  return { ok: true, triageId: intake.triageId };
}

export async function loadEmergencyAlertsLive(
  supabase: SupabaseClient,
  hospitalId: string,
): Promise<EmergencyAlertRow[]> {
  const activeStatuses = ['active', 'Pending', 'ACKNOWLEDGED', 'Acknowledged', 'Dispatched'];

  const { data, error } = await supabase
    .from('emergency_alerts')
    .select('*')
    .eq('hospital_id', hospitalId)
    .in('status', activeStatuses)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.warn('loadEmergencyAlertsLive:', error.message);
    return [];
  }

  return (data ?? []) as EmergencyAlertRow[];
}
