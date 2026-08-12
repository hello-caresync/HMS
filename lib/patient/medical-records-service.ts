import { supabase } from '@/lib/supabaseClient';
import { resolvePatientDbId } from '@/lib/patient/constants';

export type MedicalRecordRow = {
  id: string;
  patient_id: string;
  doctor_id?: string;
  consultation_id?: string;
  appointment_id?: string;
  record_type: string;
  summary: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  doctor_name?: string;
};

export async function fetchPatientMedicalRecords(
  sessionPatientId?: string | null,
): Promise<MedicalRecordRow[]> {
  const patientId = resolvePatientDbId(sessionPatientId);

  try {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*, doctors(full_name)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error || !data?.length) return [];

    return data.map((row: Record<string, unknown>) => {
      const doctor = Array.isArray(row.doctors) ? row.doctors[0] : row.doctors;
      return {
        id: String(row.id),
        patient_id: String(row.patient_id),
        doctor_id: row.doctor_id ? String(row.doctor_id) : undefined,
        consultation_id: row.consultation_id ? String(row.consultation_id) : undefined,
        appointment_id: row.appointment_id ? String(row.appointment_id) : undefined,
        record_type: String(row.record_type ?? 'consultation_summary'),
        summary: String(row.summary ?? ''),
        metadata: (row.metadata as Record<string, unknown>) ?? {},
        created_at: row.created_at ? String(row.created_at) : undefined,
        doctor_name: doctor?.full_name ? String(doctor.full_name) : undefined,
      };
    });
  } catch {
    return [];
  }
}
