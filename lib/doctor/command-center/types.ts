/** Canonical CuraSync shared-backend types — exact PostgreSQL schema alignment */

export type OpdTokenStatus =
  | 'ISSUED'
  | 'CALLED'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'CANCELLED';

export type AppointmentStatus =
  | 'requested'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type DiagnosisSeverity = 'Mild' | 'Moderate' | 'Severe' | 'Critical';

export type LabOrderStatus = 'ORDERED' | 'PROCESSING' | 'REPORT_READY' | 'CANCELLED';

export type EmergencySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type DoctorRecord = {
  doctor_id: string;
  full_name: string;
  email?: string;
  specialization?: string;
  department?: string;
  registration_number?: string;
  availability_hours?: string;
  working_days?: string;
  is_notifications_enabled?: boolean;
};

export type LiveQueueRow = {
  id: string;
  token_id?: string;
  appointment_id: string | null;
  doctor_id: string;
  patient_id: string;
  token_number: string;
  sequence_number: number;
  status: OpdTokenStatus;
  estimated_wait_minutes?: number;
  called_at?: string | null;
  completed_at?: string | null;
  patient_name: string;
  gender?: string;
  blood_group?: string;
  allergies?: string;
  chronic_conditions?: string;
  chief_complaint?: string;
  reason_for_visit?: string;
  department?: string;
  appointment_date?: string;
  appointment_time?: string;
  dob?: string;
  phone?: string;
  age?: number;
};

export type DashboardKpis = {
  todaysOpd: number;
  waiting: number;
  completed: number;
  pendingFollowUps: number;
  criticalAlerts: number;
};

export type PatientRegistryRow = {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  blood_group?: string;
  allergies?: string;
  chronic_conditions?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  age?: number;
};

/** Distinct patient row for doctor records search sidebar. */
export type EncounterPatientRow = {
  id: string;
  patient_id: string;
  patient_name: string;
  age?: number;
  gender?: string;
  created_at?: string;
  last_status?: string;
};

/** Unified timeline row returned by fetchPatientMedicalTimeline. */
export type PatientMedicalTimelineItem = {
  id: string;
  type: 'CONSULTATION' | 'PRESCRIPTION' | 'VITALS' | string;
  title: string;
  diagnosis?: string;
  notes?: string;
  doctor_name?: string;
  medications?: unknown[];
  instructions?: string;
  vitalsSummary?: string;
  date?: string;
  raw?: Record<string, unknown>;
};

export type ConsultationRecord = {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  chief_complaint?: string;
  symptoms?: string[];
  clinical_examination?: string;
  doctor_notes?: string;
  follow_up_date?: string;
};

export type DiagnosisRecord = {
  id: string;
  consultation_id: string;
  patient_id: string;
  primary_diagnosis: string;
  secondary_diagnosis?: string;
  icd10_code: string;
  severity: DiagnosisSeverity;
};

export type PrescriptionItem = {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

export type VitalsRecord = {
  temperature?: string;
  blood_pressure?: string;
  pulse?: string;
  spo2?: string;
  weight?: string;
};

export type LabOrder = {
  id: string;
  consultation_id: string;
  patient_id: string;
  doctor_id: string;
  test_names: string[];
  status: LabOrderStatus;
  report_url?: string;
};

export type EmergencyAlert = {
  id: string;
  patient_id: string;
  doctor_id?: string;
  location?: string;
  severity: EmergencySeverity;
  status: string;
  patient_name?: string;
  message?: string;
  emergency_contact?: string;
  vitals_summary?: string;
  created_at?: string;
};

export type CompleteEncounterPayload = {
  consultationId: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  chiefComplaint: string;
  symptoms: string[];
  clinicalExamination: string;
  doctorNotes: string;
  primaryDiagnosis: string;
  icd10Code: string;
  diagnosisSeverity: DiagnosisSeverity;
  prescriptions: PrescriptionItem[];
  followUpDate?: string;
  labTests?: string[];
  vitals?: VitalsRecord;
  appointmentId?: string;
};

/** @deprecated Use LiveQueueRow — kept for component migration */
export type OpdToken = LiveQueueRow & { doctor_name?: string; priority?: string };
