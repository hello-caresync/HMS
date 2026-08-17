import type {
  LabRadStatus,
  PaymentStatus,
  PrescriptionStatus,
  PriorityTier,
  QueueStatus,
} from '../opdNav.types';

export type OpdQueueEntry = {
  id: string;
  tokenNumber: string;
  patientName: string;
  uhid: string;
  priority: PriorityTier;
  consultationRoom: string;
  assignedDoctor: string;
  status: QueueStatus;
  checkInTime: string;
  waitMinutes: number;
  identityVerified: boolean;
};

export type LabRequest = {
  id: string;
  patientName: string;
  uhid: string;
  testName: string;
  orderedBy: string;
  status: LabRadStatus;
  orderedAt: string;
};

export type RadiologyRequest = {
  id: string;
  patientName: string;
  uhid: string;
  studyName: string;
  modality: string;
  status: LabRadStatus;
  orderedAt: string;
};

export type PrescriptionTrack = {
  id: string;
  patientName: string;
  uhid: string;
  medicines: string;
  status: PrescriptionStatus;
  pharmacyStatus: string;
  medicineAvailable: boolean;
};

export type MinorProcedure = {
  id: string;
  patientName: string;
  procedure: 'Dressing' | 'Injection' | 'Nebulization' | 'ECG';
  room: string;
  nurse: string;
  status: 'Scheduled' | 'In Progress' | 'Completed';
  scheduledAt: string;
};

export type Recommendation = {
  id: string;
  patientName: string;
  uhid: string;
  type: 'External Referral' | 'Internal Referral' | 'Admit to IPD';
  target: string;
  reason: string;
  priority: 'Routine' | 'Urgent' | 'Critical';
  status: 'Pending' | 'Accepted' | 'Scheduled';
};

export type BillingLine = {
  id: string;
  patientName: string;
  uhid: string;
  visitId: string;
  consultationCharge: number;
  procedureFees: number;
  labRadiologyFees: number;
  outstandingBalance: number;
  paymentStatus: PaymentStatus;
};

export type FollowUpEntry = {
  id: string;
  patientName: string;
  uhid: string;
  doctor: string;
  followUpDate: string;
  reason: string;
  status: 'Scheduled' | 'Completed' | 'Missed';
};

export const OPD_CENSUS = {
  todayPatients: 186,
  waiting: 23,
  inConsultation: 14,
  completed: 142,
  noShow: 7,
  avgWaitMinutes: 18,
  doctorUtilizationPercent: 78,
  opdRevenue: 428500,
};

export const INITIAL_OPD_QUEUE: OpdQueueEntry[] = [
  {
    id: 'q1',
    tokenNumber: 'G-042',
    patientName: 'Rahul Sharma',
    uhid: 'NX-2026-000412',
    priority: 'General',
    consultationRoom: 'Room 3 — General Medicine',
    assignedDoctor: 'Dr. Rajesh Kumar',
    status: 'Waiting for Consultation',
    checkInTime: '2026-07-18T09:12:00',
    waitMinutes: 22,
    identityVerified: true,
  },
  {
    id: 'q2',
    tokenNumber: 'E-003',
    patientName: 'Sanjay Rao',
    uhid: 'NX-2026-000365',
    priority: 'Emergency Queue',
    consultationRoom: 'Room 1 — Emergency OPD',
    assignedDoctor: 'Dr. B. Joseph',
    status: 'Consultation in Progress',
    checkInTime: '2026-07-18T09:05:00',
    waitMinutes: 0,
    identityVerified: true,
  },
  {
    id: 'q3',
    tokenNumber: 'V-008',
    patientName: 'Deepa Singh',
    uhid: 'NX-2026-000352',
    priority: 'VIP',
    consultationRoom: 'Room 5 — VIP Suite',
    assignedDoctor: 'Dr. Anita Roy',
    status: 'Waiting for Consultation',
    checkInTime: '2026-07-18T09:28:00',
    waitMinutes: 8,
    identityVerified: true,
  },
  {
    id: 'q4',
    tokenNumber: 'G-043',
    patientName: 'Priya Patel',
    uhid: 'NX-2026-000413',
    priority: 'General',
    consultationRoom: 'Room 4 — Pulmonology',
    assignedDoctor: 'Dr. Meera Iyer',
    status: 'Consultation in Progress',
    checkInTime: '2026-07-18T09:18:00',
    waitMinutes: 0,
    identityVerified: true,
  },
  {
    id: 'q5',
    tokenNumber: 'G-041',
    patientName: 'Vikram Patel',
    uhid: 'NX-2026-000388',
    priority: 'General',
    consultationRoom: 'Room 3 — General Medicine',
    assignedDoctor: 'Dr. Rajesh Kumar',
    status: 'Consultation Completed',
    checkInTime: '2026-07-18T08:45:00',
    waitMinutes: 0,
    identityVerified: true,
  },
  {
    id: 'q6',
    tokenNumber: 'G-040',
    patientName: 'Anita Desai',
    uhid: 'NX-2026-000329',
    priority: 'General',
    consultationRoom: 'Room 2 — Orthopedics',
    assignedDoctor: 'Dr. Kapoor',
    status: 'No-show',
    checkInTime: '2026-07-18T08:30:00',
    waitMinutes: 45,
    identityVerified: false,
  },
];

export const MOCK_LAB_REQUESTS: LabRequest[] = [
  { id: 'LR-9012', patientName: 'Rahul Sharma', uhid: 'NX-2026-000412', testName: 'Complete Blood Count (CBC)', orderedBy: 'Dr. Rajesh Kumar', status: 'In Progress', orderedAt: '2026-07-18T09:35:00' },
  { id: 'LR-9013', patientName: 'Priya Patel', uhid: 'NX-2026-000413', testName: 'Serum Lipase', orderedBy: 'Dr. Meera Iyer', status: 'Sample Collected', orderedAt: '2026-07-18T09:40:00' },
  { id: 'LR-9011', patientName: 'Vikram Patel', uhid: 'NX-2026-000388', testName: 'HbA1c', orderedBy: 'Dr. Rajesh Kumar', status: 'Report Ready', orderedAt: '2026-07-18T09:10:00' },
];

export const MOCK_RADIOLOGY_REQUESTS: RadiologyRequest[] = [
  { id: 'RR-4401', patientName: 'Rahul Sharma', uhid: 'NX-2026-000412', studyName: 'Chest X-Ray PA View', modality: 'X-Ray', status: 'Ordered', orderedAt: '2026-07-18T09:36:00' },
  { id: 'RR-4400', patientName: 'Priya Patel', uhid: 'NX-2026-000413', studyName: 'Ultrasound Abdomen', modality: 'USG', status: 'In Progress', orderedAt: '2026-07-18T09:42:00' },
  { id: 'RR-4398', patientName: 'Vikram Patel', uhid: 'NX-2026-000388', studyName: 'ECG 12-Lead', modality: 'ECG', status: 'Report Ready', orderedAt: '2026-07-18T09:05:00' },
];

export const MOCK_PRESCRIPTIONS: PrescriptionTrack[] = [
  { id: 'RX-7781', patientName: 'Vikram Patel', uhid: 'NX-2026-000388', medicines: 'Metformin 500mg · Atorvastatin 10mg', status: 'Fully Dispensed', pharmacyStatus: 'Collected at Counter 2', medicineAvailable: true },
  { id: 'RX-7782', patientName: 'Rahul Sharma', uhid: 'NX-2026-000412', medicines: 'Amoxicillin 500mg · Ambroxol Syrup', status: 'Sent to Pharmacy', pharmacyStatus: 'Awaiting dispensation', medicineAvailable: true },
  { id: 'RX-7783', patientName: 'Priya Patel', uhid: 'NX-2026-000413', medicines: 'Pantoprazole 40mg · Domperidone 10mg', status: 'Partially Dispensed', pharmacyStatus: 'Pantoprazole dispensed — Domperidone OOS', medicineAvailable: false },
];

export const MOCK_PROCEDURES: MinorProcedure[] = [
  { id: 'MP-101', patientName: 'Sanjay Rao', procedure: 'Nebulization', room: 'Procedure Bay 1', nurse: 'Sister Susan Joseph', status: 'In Progress', scheduledAt: '2026-07-18T09:50:00' },
  { id: 'MP-102', patientName: 'Arjun Das', procedure: 'Dressing', room: 'Procedure Bay 2', nurse: 'Sister Lakshmi N.', status: 'Scheduled', scheduledAt: '2026-07-18T10:15:00' },
  { id: 'MP-103', patientName: 'Meera Krishnan', procedure: 'Injection', room: 'Injection Room', nurse: 'Sister Meera Iyer', status: 'Completed', scheduledAt: '2026-07-18T09:20:00' },
  { id: 'MP-104', patientName: 'Rahul Sharma', procedure: 'ECG', room: 'ECG Room', nurse: 'Tech Rajan P.', status: 'Scheduled', scheduledAt: '2026-07-18T10:00:00' },
];

export const MOCK_RECOMMENDATIONS: Recommendation[] = [
  { id: 'REC-301', patientName: 'Sanjay Rao', uhid: 'NX-2026-000365', type: 'Admit to IPD', target: 'Admissions Module — Cardiology Ward', reason: 'Hypertensive crisis — step-up monitoring required', priority: 'Critical', status: 'Pending' },
  { id: 'REC-302', patientName: 'Priya Patel', uhid: 'NX-2026-000413', type: 'Internal Referral', target: 'Gastroenterology OPD', reason: 'Persistent epigastric pain — specialist evaluation', priority: 'Urgent', status: 'Scheduled' },
  { id: 'REC-303', patientName: 'Deepa Singh', uhid: 'NX-2026-000352', type: 'External Referral', target: 'City Neurology Centre', reason: 'Refractory migraine — tertiary neurology opinion', priority: 'Routine', status: 'Accepted' },
];

export const MOCK_BILLING: BillingLine[] = [
  { id: 'BL-5501', patientName: 'Vikram Patel', uhid: 'NX-2026-000388', visitId: 'OPD-2026-8805', consultationCharge: 800, procedureFees: 0, labRadiologyFees: 1200, outstandingBalance: 0, paymentStatus: 'Paid' },
  { id: 'BL-5502', patientName: 'Rahul Sharma', uhid: 'NX-2026-000412', visitId: 'OPD-2026-8801', consultationCharge: 800, procedureFees: 350, labRadiologyFees: 1850, outstandingBalance: 1200, paymentStatus: 'Partial' },
  { id: 'BL-5503', patientName: 'Priya Patel', uhid: 'NX-2026-000413', visitId: 'OPD-2026-8802', consultationCharge: 1200, procedureFees: 0, labRadiologyFees: 2400, outstandingBalance: 3600, paymentStatus: 'Outstanding' },
  { id: 'BL-5504', patientName: 'Deepa Singh', uhid: 'NX-2026-000352', visitId: 'OPD-2026-8803', consultationCharge: 2500, procedureFees: 0, labRadiologyFees: 0, outstandingBalance: 0, paymentStatus: 'Paid' },
];

export const MOCK_FOLLOWUPS: FollowUpEntry[] = [
  { id: 'FU-801', patientName: 'Vikram Patel', uhid: 'NX-2026-000388', doctor: 'Dr. Rajesh Kumar', followUpDate: '2026-07-25', reason: 'Diabetes review — HbA1c follow-up', status: 'Scheduled' },
  { id: 'FU-802', patientName: 'Rahul Sharma', uhid: 'NX-2026-000412', doctor: 'Dr. Rajesh Kumar', followUpDate: '2026-07-23', reason: 'Bronchitis — review cough resolution', status: 'Scheduled' },
  { id: 'FU-803', patientName: 'Anita Desai', uhid: 'NX-2026-000329', doctor: 'Dr. Kapoor', followUpDate: '2026-07-11', reason: 'Post-TKR physiotherapy review', status: 'Missed' },
];

export const DOCTOR_OPD_REPORT = [
  { doctor: 'Dr. Rajesh Kumar', patients: 42, avgConsultMin: 12, revenue: 98400 },
  { doctor: 'Dr. Meera Iyer', patients: 28, avgConsultMin: 15, revenue: 67200 },
  { doctor: 'Dr. Anita Roy', patients: 18, avgConsultMin: 18, revenue: 89000 },
  { doctor: 'Dr. Kapoor', patients: 24, avgConsultMin: 14, revenue: 72800 },
];

export const CONSULTATION_TIME_ANALYSIS = [
  { slot: '08–09', avgMin: 11, patients: 22 },
  { slot: '09–10', avgMin: 14, patients: 38 },
  { slot: '10–11', avgMin: 16, patients: 41 },
  { slot: '11–12', avgMin: 13, patients: 35 },
  { slot: '12–13', avgMin: 10, patients: 18 },
];

export const WAITING_TIME_ANALYSIS = [
  { hour: '08:00', avgWait: 8, peak: 12 },
  { hour: '09:00', avgWait: 18, peak: 32 },
  { hour: '10:00', avgWait: 22, peak: 38 },
  { hour: '11:00', avgWait: 15, peak: 24 },
  { hour: '12:00', avgWait: 10, peak: 16 },
];

export const OPD_DOCTORS = ['Dr. Rajesh Kumar', 'Dr. Meera Iyer', 'Dr. Anita Roy', 'Dr. Kapoor', 'Dr. B. Joseph'];

export function searchOpd(query: string, queue: OpdQueueEntry[]): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  return queue.filter(
    (r) =>
      r.patientName.toLowerCase().includes(q) ||
      r.uhid.toLowerCase().includes(q) ||
      r.tokenNumber.toLowerCase().includes(q) ||
      r.assignedDoctor.toLowerCase().includes(q),
  ).length;
}

export { formatINR as formatInr } from '@/lib/utils/currency';

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export function advanceQueueStatus(current: QueueStatus): QueueStatus {
  const flow: QueueStatus[] = ['Waiting for Consultation', 'Consultation in Progress', 'Consultation Completed'];
  const idx = flow.indexOf(current);
  if (idx === -1 || idx === flow.length - 1) return current;
  return flow[idx + 1];
}
