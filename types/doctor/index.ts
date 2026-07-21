/** Nexora Doctor App — canonical TypeScript models (mirrors Prisma / Supabase) */

export type DoctorRole = 'Doctor' | 'Specialist' | 'Surgeon' | 'Attending Physician';

export type AppointmentType = 'OPD' | 'TELEMEDICINE' | 'FOLLOWUP';
export type AppointmentStatus = 'SCHEDULED' | 'CHECKED_IN' | 'IN_CONSULT' | 'COMPLETED' | 'CANCELLED';

export type EncounterStatus = 'IN_PROGRESS' | 'COMPLETED';

export type LabUrgency = 'NORMAL' | 'STAT';
export type OrderStatus = 'ORDERED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type SurgeryStatus = 'REQUESTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';

export type DocumentType =
  | 'PROGRESS_NOTE'
  | 'DISCHARGE_SUMMARY'
  | 'REFERRAL_LETTER'
  | 'MEDICAL_CERTIFICATE'
  | 'FITNESS_CERTIFICATE'
  | 'SICK_LEAVE';

export interface Doctor {
  id: string;
  userId: string;
  name: string;
  specialization: string;
  signatureUrl: string | null;
  consultationFee: number;
  workingHoursJson: Record<string, { start: string; end: string; enabled: boolean }>;
  createdAt: string;
}

export interface Patient {
  id: string;
  medicalRecordNumber: string;
  fullName: string;
  age: number;
  gender: string;
  bloodGroup: string;
  allergiesJson: string[];
  chronicConditionsJson: string[];
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  scheduledAt: string;
}

export interface Encounter {
  id: string;
  appointmentId: string | null;
  doctorId: string;
  patientId: string;
  chiefComplaint: string;
  hpi: string;
  diagnosisIcd10Json: { code: string; label: string }[];
  physicalExamJson: Record<string, unknown>;
  soapNotesJson: { s: string; o: string; a: string; p: string };
  status: EncounterStatus;
}

export interface PrescriptionMedicine {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  encounterId: string;
  doctorId: string;
  patientId: string;
  medicinesJson: PrescriptionMedicine[];
  digitalSignature: string | null;
  status: OrderStatus;
}

export interface LabOrder {
  id: string;
  encounterId: string;
  patientId: string;
  testNamesJson: string[];
  urgency: LabUrgency;
  status: OrderStatus;
  resultsJson: Record<string, unknown> | null;
}

export interface RadiologyOrder {
  id: string;
  encounterId: string;
  patientId: string;
  modality: string;
  bodyPart: string;
  urgency: LabUrgency;
  imageUrlsJson: string[];
  reportText: string | null;
  status: OrderStatus;
}

export interface IpdAdmission {
  id: string;
  patientId: string;
  doctorId: string;
  wardNumber: string;
  bedNumber: string;
  admissionDate: string;
  dailyNotesJson: { date: string; soap: string }[];
  dischargeStatus: 'ADMITTED' | 'DISCHARGE_PLANNED' | 'DISCHARGED';
}

export interface Surgery {
  id: string;
  patientId: string;
  surgeonDoctorId: string;
  otRoom: string;
  surgeryType: string;
  scheduledTime: string;
  preOpNotes: string;
  postOpOrders: string;
  status: SurgeryStatus;
}

export interface TelemedicineSession {
  id: string;
  appointmentId: string;
  roomId: string;
  chatHistoryJson: { at: string; from: string; message: string }[];
  callDuration: number;
}

export interface ClinicalDocument {
  id: string;
  patientId: string;
  doctorId: string;
  documentType: DocumentType;
  contentJson: Record<string, unknown>;
  signatureApplied: boolean;
  createdAt: string;
}

export interface EmrTimelineEvent {
  id: string;
  patientId: string;
  at: string;
  category: 'Encounter' | 'Lab' | 'Radiology' | 'Prescription' | 'Admission' | 'Surgery';
  title: string;
  summary: string;
}
