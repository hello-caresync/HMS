export type QueueTokenStatus = 'ISSUED' | 'CALLED' | 'IN_CONSULTATION' | 'COMPLETED' | string;

export type DoctorRecord = {
  doctor_id: string;
  full_name?: string;
  email?: string;
  department?: string;
  registration_number?: string;
  specialization?: string;
  is_notifications_enabled?: boolean;
};

export type LiveQueueRow = {
  id: string;
  appointment_id?: string | null;
  doctor_id?: string;
  patient_id?: string | null;
  token_number?: string | number;
  sequence_number?: number;
  status?: QueueTokenStatus;
  estimated_wait_minutes?: number;
  patient_name?: string;
  uhid?: string;
  gender?: string;
  blood_group?: string;
  dob?: string;
  phone?: string;
  age?: number | string;
  chief_complaint?: string;
  reason_for_visit?: string;
  department?: string;
};

export type OpdToken = LiveQueueRow;
export type OPDToken = LiveQueueRow & {
  patient_profiles?: {
    full_name?: string;
    gender?: string;
    blood_group?: string;
    dob?: string;
    phone?: string;
  };
};

export type PrescriptionItem = {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
};

export type PatientMedicalTimelineItem = {
  id: string;
  type: 'CONSULTATION' | 'PRESCRIPTION' | 'VITALS' | string;
  created_at: string;
  title?: string;
  date?: string;
  diagnosis?: string;
  notes?: string;
  doctor_name?: string;
  medications?: { name: string }[];
  instructions?: string;
  vitalsSummary?: string;
};

export type DoctorQueueRow = {
  id: string;
  appointment_id?: string;
  patient_id?: string | null;
  patient_name?: string;
  name?: string;
  uhid?: string;
  phone?: string;
  patient_phone?: string;
  age?: number | string;
  gender?: string;
  blood_group?: string;
  chief_complaint?: string;
  reason_for_visit?: string;
  status?: string;
  queue_status?: string;
  token_number?: string | number;
  sequence_number?: number;
  appointment_time?: string;
  time_slot?: string;
  appointment_type?: string;
  source?: string;
  department?: string;
  vitals?: Record<string, unknown> | string | null;
  vitals_summary?: string;
  doctor_id?: string;
  doctor_code?: string;
  doctor_employee_id?: string;
  doctor_name?: string;
  appointment_date?: string;
  created_at?: string;
  consultation_fee?: number | string;
  fee?: number | string;
  _source_table?: string;
};
