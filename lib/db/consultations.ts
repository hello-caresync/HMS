import type { SupabaseClient } from '@supabase/supabase-js';

import { REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';

export type ConsultationRecord = {
  id: string;
  hospital_id: string;
  patient_id?: string | null;
  appointment_id?: string | null;
  uhid: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  department: string;
  symptoms?: string | null;
  diagnosis?: string | null;
  vitals?: Record<string, unknown>;
  medicines?: unknown[];
  status: string;
  consultation_date: string;
  created_at: string;
  updated_at: string;
};

export type ConsultationWriteInput = {
  hospitalId?: string;
  patientId?: string | null;
  appointmentId?: string | null;
  uhid: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  symptoms?: string;
  diagnosis?: string;
  vitals?: Record<string, unknown>;
  medicines?: unknown[];
  status?: string;
  consultationDate?: string;
};

function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export async function upsertConsultationRecord(
  supabase: SupabaseClient,
  input: ConsultationWriteInput,
): Promise<ConsultationRecord | null> {
  const hospitalId = input.hospitalId || REGAL_HOSPITAL_CODE;
  const payload: Record<string, unknown> = {
    hospital_id: hospitalId,
    patient_id: input.patientId || null,
    appointment_id: input.appointmentId || null,
    uhid: input.uhid,
    patient_name: input.patientName,
    doctor_id: input.doctorId,
    doctor_name: input.doctorName,
    department: input.department,
    symptoms: input.symptoms || null,
    diagnosis: input.diagnosis || null,
    vitals: input.vitals ?? {},
    medicines: input.medicines ?? [],
    status: input.status || 'CONFIRMED',
    consultation_date: input.consultationDate || todayDate(),
    updated_at: new Date().toISOString(),
  };

  if (input.appointmentId) {
    const { data: existing } = await supabase
      .from('consultations')
      .select('id')
      .eq('appointment_id', input.appointmentId)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from('consultations')
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .maybeSingle();
      if (error) {
        console.warn('upsertConsultationRecord update:', error.message);
        return null;
      }
      return (data as ConsultationRecord) ?? null;
    }
  }

  const { data, error } = await supabase
    .from('consultations')
    .insert(payload)
    .select('*')
    .maybeSingle();

  if (error) {
    console.warn('upsertConsultationRecord insert:', error.message);
    return null;
  }

  return (data as ConsultationRecord) ?? null;
}

export async function createConsultationFromAppointment(
  supabase: SupabaseClient,
  input: ConsultationWriteInput,
): Promise<void> {
  await upsertConsultationRecord(supabase, {
    ...input,
    status: input.status || 'QUEUED',
  });
}

export async function completeConsultationRecord(
  supabase: SupabaseClient,
  input: ConsultationWriteInput,
): Promise<void> {
  await upsertConsultationRecord(supabase, {
    ...input,
    status: input.status || 'COMPLETED',
  });
}

export async function fetchPatientConsultationHistory(
  supabase: SupabaseClient,
  filters: {
    hospitalId?: string;
    uhid?: string;
    patientId?: string;
    patientName?: string;
    limit?: number;
  },
): Promise<ConsultationRecord[]> {
  const hospitalId = filters.hospitalId || REGAL_HOSPITAL_CODE;
  const limit = filters.limit ?? 50;

  let query = supabase
    .from('consultations')
    .select('*')
    .eq('hospital_id', hospitalId)
    .order('consultation_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters.uhid?.trim()) {
    query = query.eq('uhid', filters.uhid.trim());
  } else if (filters.patientId?.trim()) {
    query = query.eq('patient_id', filters.patientId.trim());
  } else if (filters.patientName?.trim()) {
    query = query.eq('patient_name', filters.patientName.trim());
  } else {
    return [];
  }

  const { data, error } = await query;
  if (error) {
    console.warn('fetchPatientConsultationHistory:', error.message);
    return [];
  }

  return (data ?? []) as ConsultationRecord[];
}

export async function fetchDoctorConsultationHistory(
  supabase: SupabaseClient,
  doctorId: string,
  hospitalId: string = REGAL_HOSPITAL_CODE,
  limit = 80,
): Promise<ConsultationRecord[]> {
  if (!doctorId.trim()) return [];

  const { data, error } = await supabase
    .from('consultations')
    .select('*')
    .eq('hospital_id', hospitalId)
    .eq('doctor_id', doctorId.trim())
    .order('consultation_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('fetchDoctorConsultationHistory:', error.message);
    return [];
  }

  return (data ?? []) as ConsultationRecord[];
}
