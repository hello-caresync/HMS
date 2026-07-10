export interface PatientVitals {
  bp: string;
  pulse: number;
  temp: number;
  spO2: number;
  weight: number;
  weightUnit: 'kg';
  recordedAt: string;
  recordedBy: string;
}

export interface PatientDemographics {
  dateOfBirth: string;
  bloodGroup: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  insuranceId?: string;
}

export interface NurseAssessment {
  chiefComplaint: string;
  triageLevel: 'Routine' | 'Urgent' | 'Emergent';
  painScore: number;
  notes: string;
  assessedAt: string;
  assessedBy: string;
}

export interface SafetyAlert {
  id: string;
  type: 'allergy' | 'fall-risk' | 'anticoagulant' | 'pregnancy' | 'other';
  label: string;
  severity: 'high' | 'medium';
}

export interface SoapNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface DiagnosisEntry {
  id: string;
  term: string;
  icd10Code: string;
  icd10Description: string;
  isPrimary: boolean;
}

export interface PrescriptionLine {
  id: string;
  medicineId: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export type LabOrderCode = 'CBC' | 'LFT' | 'RFT' | 'HbA1c' | 'TSH' | 'Lipid Panel';

export type RadiologyOrderCode = 'Chest X-Ray' | 'MRI' | 'CT Scan' | 'Ultrasound' | 'ECG';

export type FollowUpTimeline =
  | '3 days'
  | '1 week'
  | '2 weeks'
  | '1 month'
  | '3 months'
  | 'None';

export type ReferralType = 'Follow-up' | 'Specialist Referral' | 'Surgery Consult' | 'None';

export interface ConsultationEncounter {
  id: string;
  patientId: string;
  uhid: string;
  patientName: string;
  age: number;
  gender: string;
  tokenNumber: string;
  doctorName: string;
  department: string;
  demographics: PatientDemographics;
  vitals: PatientVitals;
  nurseAssessment: NurseAssessment;
  safetyAlerts: SafetyAlert[];
  allergies: string[];
  medicalHistory: string[];
  soap: SoapNotes;
  diagnoses: DiagnosisEntry[];
  prescriptions: PrescriptionLine[];
  labOrders: LabOrderCode[];
  radiologyOrders: RadiologyOrderCode[];
  followUp: FollowUpTimeline;
  referralType: ReferralType;
  referralNotes: string;
  followUpDate?: string;
  status: 'draft' | 'finalized';
  finalizedAt?: string;
  digitalSignatureId?: string;
}

export interface FinalizeHandshake {
  encounterId: string;
  pharmacyLogId: string;
  billingLedgerId: string;
  prescriptionCount: number;
  labOrderCount: number;
  radiologyOrderCount: number;
  signedAt: string;
  message: string;
}

export const LAB_ORDERS: { code: LabOrderCode; label: string }[] = [
  { code: 'CBC', label: 'CBC' },
  { code: 'LFT', label: 'Liver Function Test' },
  { code: 'RFT', label: 'Renal Function Test' },
  { code: 'HbA1c', label: 'HbA1c' },
  { code: 'TSH', label: 'TSH' },
  { code: 'Lipid Panel', label: 'Lipid Panel' },
];

export const RADIOLOGY_ORDERS: { code: RadiologyOrderCode; label: string }[] = [
  { code: 'Chest X-Ray', label: 'Chest X-Ray' },
  { code: 'MRI', label: 'MRI' },
  { code: 'CT Scan', label: 'CT Scan' },
  { code: 'Ultrasound', label: 'Ultrasound' },
  { code: 'ECG', label: 'ECG' },
];

export const DOSAGE_OPTIONS = ['250 mg', '500 mg', '650 mg', '5 mg', '10 mg', '20 mg', '40 mg'];

export const FREQUENCY_OPTIONS = ['1-0-0 (OD)', '1-0-1 (BD)', '1-1-1 (TID)', '0-0-1 (HS)', 'SOS'];

export const DURATION_OPTIONS = ['3 days', '5 days', '7 days', '10 days', '14 days', '1 month'];

export const FOLLOW_UP_OPTIONS: FollowUpTimeline[] = [
  '3 days',
  '1 week',
  '2 weeks',
  '1 month',
  '3 months',
  'None',
];

export const REFERRAL_OPTIONS: ReferralType[] = [
  'None',
  'Follow-up',
  'Specialist Referral',
  'Surgery Consult',
];

export function generatePrescriptionLineId(): string {
  return `rx-${Date.now().toString(36)}`;
}

export function generateEncounterId(): string {
  return `enc-${Date.now().toString(36)}`;
}

export function generateDiagnosisId(): string {
  return `dx-${Date.now().toString(36)}`;
}
