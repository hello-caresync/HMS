import type { PatientDto } from '@/lib/doctor/types/clinical-dto';

export type OpdQueueStatus =
  | 'SCHEDULED'
  | 'CHECKED_IN'
  | 'WAITING'
  | 'IN_CONSULT'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FINISHED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type OpdQueueCard = {
  id: string;
  token: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  uhid: string;
  appointmentTime: string;
  department: string;
  chiefComplaint: string;
  vitalsStatus: 'normal' | 'attention' | 'critical';
  waitMinutes: number;
  visitType: 'OPD' | 'Follow-up' | 'Teleconsult' | 'Emergency Walk-in';
  priority: 'Routine' | 'Urgent' | 'STAT';
  hasAllergies: boolean;
  allergyList: string[];
  insuranceStatus: 'Verified' | 'Pending' | 'Cash';
  status: OpdQueueStatus;
};

export type OpdDashboardStats = {
  todayTotal: number;
  waiting: number;
  checkedIn: number;
  ongoing: number;
  completed: number;
  followUpsToday: number;
  teleconsultations: number;
  emergencyWalkIns: number;
};

export type IpdRiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export type IpdPatientCard = {
  id: string;
  patientId: string;
  bed: string;
  ward: string;
  room: string;
  admissionDate: string;
  attendingDoctor: string;
  primaryDiagnosis: string;
  riskLevel: IpdRiskLevel;
  losDays: number;
  insuranceStatus: 'Verified' | 'Pending' | 'Cash';
  currentCondition: string;
  status: 'ADMITTED' | 'DISCHARGE_PLANNED' | 'DISCHARGED';
  patient: PatientDto;
  pendingProgressNotes: boolean;
  pendingOrders: number;
  isIcu: boolean;
};

export type IpdDashboardStats = {
  todayAdmissions: number;
  currentInpatients: number;
  icuPatients: number;
  criticalPatients: number;
  dischargeDue: number;
  roundsToday: number;
  pendingProgressNotes: number;
  pendingOrders: number;
};

export type CareCenterInsights = {
  patientsSeenToday: number;
  avgConsultMinutes: number;
  admissions: number;
  discharges: number;
  followUpRate: number;
  criticalCases: number;
  labOrders: number;
  radiologyOrders: number;
  prescriptionCount: number;
  revenueContribution: number;
  patientSatisfaction: number;
};

export type CareCenterFilter =
  | 'all'
  | 'waiting'
  | 'in_consult'
  | 'completed'
  | 'emergency'
  | 'follow_up'
  | 'admitted'
  | 'icu'
  | 'high_risk'
  | 'discharge_today';
