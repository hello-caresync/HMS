/** Strict clinical domain types — Nexora Doctor App */

export type DoctorRole = 'Doctor' | 'Specialist' | 'Surgeon' | 'Attending Physician';

export type AppointmentType = 'OPD' | 'TELEMEDICINE' | 'FOLLOWUP';
export type AppointmentStatus = 'SCHEDULED' | 'CHECKED_IN' | 'IN_CONSULT' | 'COMPLETED' | 'CANCELLED';

export type EncounterStatus = 'IN_PROGRESS' | 'COMPLETED';
export type OrderUrgency = 'NORMAL' | 'STAT';
export type ClinicalOrderStatus = 'ORDERED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type IpdAdmissionStatus = 'ADMITTED' | 'TRANSFER_PENDING' | 'DISCHARGE_PLANNED' | 'DISCHARGED';
export type SurgeryStatus = 'REQUESTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';

export type ClinicalDocumentType =
  | 'PROGRESS_NOTE'
  | 'DISCHARGE_SUMMARY'
  | 'REFERRAL_LETTER'
  | 'MEDICAL_CERTIFICATE'
  | 'FITNESS_CERTIFICATE'
  | 'SICK_LEAVE';

export interface DoctorProfile {
  id: string;
  userId: string;
  fullName: string;
  specialization: string;
  licenseNumber: string;
  signatureUrl: string | null;
  consultationFees: { opd: number; followUp: number; tele: number };
  workingHoursJson: Record<string, { start: string; end: string; enabled: boolean }>;
  createdAt: string;
}

export interface ClinicalPatient {
  id: string;
  mrn: string;
  fullName: string;
  age: number;
  gender: string;
  bloodGroup: string;
  allergiesJson: string[];
  chronicConditionsJson: string[];
  createdAt: string;
}

export interface ClinicalAppointment {
  id: string;
  doctorId: string;
  patientId: string;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  scheduledAt: string;
}

export interface SoapNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface Icd10Entry {
  code: string;
  label: string;
}

export interface ClinicalEncounter {
  id: string;
  appointmentId: string | null;
  doctorId: string;
  patientId: string;
  chiefComplaint: string;
  hpi: string;
  physicalExamJson: Record<string, boolean | string>;
  diagnosisIcd10Json: Icd10Entry[];
  soapNotesJson: SoapNotes;
  status: EncounterStatus;
}

export interface PrescriptionMedicine {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface ClinicalPrescription {
  id: string;
  encounterId: string;
  doctorId: string;
  patientId: string;
  medicinesJson: PrescriptionMedicine[];
  digitalSignatureApplied: boolean;
  status: ClinicalOrderStatus;
}

export interface LabOrder {
  id: string;
  encounterId: string;
  patientId: string;
  doctorId: string;
  testCodesJson: string[];
  urgency: OrderUrgency;
  status: ClinicalOrderStatus;
  resultsJson: Record<string, { value: string; unit: string; critical?: boolean }> | null;
}

export interface RadiologyOrder {
  id: string;
  encounterId: string;
  patientId: string;
  doctorId: string;
  modality: string;
  bodyPart: string;
  urgency: OrderUrgency;
  imageUrlsJson: string[];
  reportText: string | null;
  status: ClinicalOrderStatus;
}

export interface IpdAdmission {
  id: string;
  patientId: string;
  doctorId: string;
  wardName: string;
  bedNumber: string;
  admissionDate: string;
  dailyProgressNotesJson: { date: string; soap: SoapNotes }[];
  status: IpdAdmissionStatus;
}

export interface SurgeryRecord {
  id: string;
  patientId: string;
  surgeonDoctorId: string;
  otRoom: string;
  procedureName: string;
  scheduledTime: string;
  preOpNotes: string;
  operativeNotes: string;
  postOpOrders: string;
  status: SurgeryStatus;
}

export interface TelemedicineSession {
  id: string;
  appointmentId: string;
  roomId: string;
  callDurationSeconds: number;
  chatTranscriptJson: { at: string; from: string; message: string }[];
}

export interface ClinicalDocument {
  id: string;
  patientId: string;
  doctorId: string;
  documentType: ClinicalDocumentType;
  contentJson: Record<string, unknown>;
  digitalSignature: string | null;
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

export interface OpdQueuePatient {
  id: string;
  token: string;
  patientId: string;
  patientName: string;
  chiefComplaint: string;
  priority: 'Routine' | 'Urgent' | 'STAT';
  waitMinutes: number;
}

export interface EmergencyCase {
  id: string;
  triageLevel: 1 | 2 | 3 | 4 | 5;
  patientName: string;
  presentation: string;
  bay: string;
  statOrdersPending: number;
}

export interface ClinicalNotification {
  id: string;
  type: 'EMERGENCY' | 'STAT_LAB' | 'CRITICAL_IMAGING' | 'OT_CHANGE' | 'PATIENT_MESSAGE';
  title: string;
  body: string;
  at: string;
  read: boolean;
}

/** Re-export legacy aliases */
export type { ClinicalPatient as Patient };
