import { supabase } from '@/lib/supabaseClient';

import { getDoctorSession } from './session';
import { DOCTOR_STORAGE_KEYS, readJsonStorage, writeJsonStorage } from './storage-keys';

export type ClinicalMessage = {
  id: string;
  patient_name: string;
  doctor_name: string;
  doctor_employee_id: string;
  message: string;
  priority: 'normal' | 'urgent';
  created_at: string;
};

export async function sendClinicalMessage(input: {
  patientName: string;
  message: string;
  priority?: 'normal' | 'urgent';
}): Promise<{ ok: true; record: ClinicalMessage } | { ok: false; error: string }> {
  const session = getDoctorSession();
  const trimmed = input.message.trim();
  if (!trimmed) return { ok: false, error: 'Message cannot be empty.' };

  const record: ClinicalMessage = {
    id: `msg_${Date.now()}`,
    patient_name: input.patientName,
    doctor_name: session.fullName,
    doctor_employee_id: session.employeeId,
    message: trimmed,
    priority: input.priority ?? 'normal',
    created_at: new Date().toISOString(),
  };

  const local = readLocalClinicalMessages();
  writeJsonStorage(DOCTOR_STORAGE_KEYS.messages, [record, ...local]);

  try {
    const { error } = await supabase.from('patient_messages').insert({
      patient_name: record.patient_name,
      doctor_name: record.doctor_name,
      doctor_employee_id: record.doctor_employee_id,
      message: record.message,
      priority: record.priority,
      created_at: record.created_at,
    });
    if (error) {
      return { ok: true, record };
    }
  } catch {
    /* local-only dispatch */
  }

  return { ok: true, record };
}

export function readLocalClinicalMessages(patientName?: string): ClinicalMessage[] {
  const current = readJsonStorage<ClinicalMessage[]>(DOCTOR_STORAGE_KEYS.messages, []);
  const legacy = readJsonStorage<ClinicalMessage[]>(DOCTOR_STORAGE_KEYS.legacyMessages, []);
  const all = current.length
    ? current
    : legacy;
  if (!current.length && legacy.length) {
    writeJsonStorage(DOCTOR_STORAGE_KEYS.messages, legacy);
  }
  if (!patientName) return all;
  return all.filter((m) => m.patient_name === patientName);
}
