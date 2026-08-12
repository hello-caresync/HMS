export type QueuePriority = 'ROUTINE' | 'URGENT' | 'EMERGENCY';
export type QueueStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type OpdQueueItem = {
  id: string;
  token_number: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  age: number;
  gender: string;
  blood_group?: string | null;
  diagnosis?: string | null;
  vitals?: { bp?: string; hr?: string; temp?: string; spo2?: string } | null;
  allergies?: string[] | null;
  priority: QueuePriority;
  status: QueueStatus;
  appointment_date?: string;
  slot_time?: string | null;
  department?: string | null;
  hospital_name?: string | null;
  created_at?: string;
};

export type ClinicalNote = {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  diagnosis_disease?: string | null;
  prescription: string;
  clinical_advice?: string | null;
  queue_id?: string | null;
  department?: string | null;
  created_at?: string;
};

export type ClinicalAdviceMessage = {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  message: string;
  priority: string;
  sender_type: 'doctor' | 'patient';
  created_at: string;
};

export type BookOpdInput = {
  patientId: string;
  patientName: string;
  /** Canonical `doctors.doctor_id` UUID — never RH-Dxx or display name */
  doctorId: string;
  doctorName: string;
  department: string;
  hospitalName: string;
  appointmentDate: string;
  slotTime: string;
  tokenNumber: string | number;
  reasonForVisit?: string;
  appointmentId?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  allergies?: string[];
  priority?: QueuePriority;
};
