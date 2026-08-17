import type { SupabaseClient } from '@supabase/supabase-js';

import { emitSystemEvent } from './events';
import type { EmergencyTriageRow, TriagePriority } from './types';

export async function fetchEmergencyTriages(
  supabase: SupabaseClient,
): Promise<EmergencyTriageRow[]> {
  const { data, error } = await supabase
    .from('emergency_triages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(40);

  if (error) {
    console.warn('[fetchEmergencyTriages]', error.message);
    return [];
  }
  return (data ?? []) as EmergencyTriageRow[];
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
  const { data, error } = await supabase
    .from('emergency_triages')
    .insert({
      patient_name: input.patientName,
      patient_id: input.patientId ?? null,
      chief_complaint: input.chiefComplaint,
      priority: input.priority,
      vitals: input.vitals ?? {},
      status: 'active',
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message || 'Failed to register triage');

  const triageId = String(data.id);

  if (input.priority === 'P1') {
    await emitSystemEvent(
      supabase,
      'EMERGENCY_BYPASS_TRIGGERED',
      {
        message: `P1 CRITICAL: ${input.patientName} — ${input.chiefComplaint}`,
        triageId,
        patientName: input.patientName,
        priority: 'P1',
        relatedId: triageId,
        alarm: true,
      },
      { severity: 'critical', targetRoles: ['doctor', 'hospital'] },
    );

    await supabase.from('notifications').insert({
      title: 'EMERGENCY P1 — Doctor Bypass',
      body: `${input.patientName}: ${input.chiefComplaint}`,
      category: 'emergency',
      severity: 'critical',
      related_id: triageId,
    });
  }

  return { success: true, triage: data as EmergencyTriageRow };
}

export function countActiveTriages(rows: EmergencyTriageRow[]) {
  const active = rows.filter((r) => r.status !== 'discharged' && r.status !== 'closed');
  return {
    p1: active.filter((r) => r.priority === 'P1').length,
    p2: active.filter((r) => r.priority === 'P2').length,
    p3: active.filter((r) => r.priority === 'P3').length,
    total: active.length,
  };
}
