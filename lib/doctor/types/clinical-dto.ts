export type OpdQueueItem = {
  id: string;
  token: string;
  patientId: string;
  patientName: string;
  chiefComplaint: string;
  priority: string;
  waitMinutes: number;
};

export type PatientDto = {
  id: string;
  mrn: string;
  fullName: string;
  age: number;
  gender: string;
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
};

export type IpdAdmissionDto = {
  id: string;
  ward: string;
  bed: string;
  losDays: number;
  dailyProgressNotesJson: unknown;
  patient: PatientDto;
};

export type EmergencyCaseDto = {
  id: string;
  patientId?: string | null;
  esiLevel: number;
  patientName: string;
  mrn: string;
  presentation: string;
  bay: string;
  statOrdersPending: number;
  vitals: { bp: string; hr: string; gcs: string };
  acknowledged?: boolean;
};

export type NotificationDto = {
  id: string;
  category: 'EMERGENCY' | 'CRITICAL_LAB' | 'OT' | 'PATIENT_MSG' | 'ALL';
  title: string;
  body: string;
  at: string;
  patientId?: string;
  acknowledged: boolean;
};
