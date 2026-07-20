export type PatientStatus = 'Outpatient' | 'Inpatient' | 'Emergency' | 'Discharged';

export type PatientRecord = {
  uhid: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  insuranceId: string;
  status: PatientStatus;
  department: string;
  registeredAt: string;
  bloodGroup: string;
  address: string;
  emergencyContact: string;
  familyMembers: string[];
  wardRoom: string;
  referralStatus: 'Direct' | 'Referral In' | 'Corporate' | 'Emergency Intake';
  allergies: string[];
  criticalConditions: string[];
  specialInstructions: string[];
  infectionAlerts: string[];
  identityVerified: boolean;
  aadhaarVerified: boolean;
  passportVerified: boolean;
  creditBalance: number;
  isReturning: boolean;
  checkInAt?: string;
};

export type TimelineEvent = {
  id: string;
  timestamp: string;
  type: 'registration' | 'consultation' | 'lab' | 'pharmacy' | 'admission' | 'discharge' | 'emergency';
  title: string;
  detail: string;
  department: string;
  provider?: string;
};

export type InvoiceLine = {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Partial';
};

export type CommLog = {
  id: string;
  channel: 'SMS' | 'Email' | 'WhatsApp';
  subject: string;
  sentAt: string;
  status: 'Delivered' | 'Failed' | 'Queued';
};

export const MOCK_PATIENTS: PatientRecord[] = [
  {
    uhid: 'NX-2026-000412',
    name: 'Rahul Sharma',
    age: 37,
    gender: 'Male',
    phone: '+91 98765 43210',
    insuranceId: 'STAR-HEALTH-88421',
    status: 'Inpatient',
    department: 'Cardiology',
    registeredAt: '2024-03-12',
    bloodGroup: 'O+',
    address: '42 M.G. Road, Bengaluru 560001',
    emergencyContact: 'Sunita Sharma (Spouse) · +91 98xxx xx210',
    familyMembers: ['Sunita Sharma (Spouse)', 'Amit Sharma (Son)'],
    wardRoom: 'Ward 3A · Bed 12',
    referralStatus: 'Referral In',
    allergies: ['Penicillin', 'Sulfa drugs'],
    criticalConditions: ['Type-2 Diabetes', 'Hypertension Stage-2'],
    specialInstructions: ['Fall risk — assist ambulation', 'Diabetic diet chart attached'],
    infectionAlerts: [],
    identityVerified: true,
    aadhaarVerified: true,
    passportVerified: false,
    creditBalance: 0,
    isReturning: true,
    checkInAt: '2026-07-17T08:42:00',
  },
  {
    uhid: 'NX-2026-000413',
    name: 'Priya Patel',
    age: 31,
    gender: 'Female',
    phone: '+91 87654 32109',
    insuranceId: 'ICICI-LOMBARD-77204',
    status: 'Outpatient',
    department: 'Pulmonology',
    registeredAt: '2025-01-08',
    bloodGroup: 'A-',
    address: '18 12th Main, Indiranagar, Bengaluru',
    emergencyContact: 'Rajesh Patel (Father) · +91 87xxx xx109',
    familyMembers: ['Rajesh Patel (Father)'],
    wardRoom: '—',
    referralStatus: 'Direct',
    allergies: ['Aspirin'],
    criticalConditions: ['Moderate Persistent Asthma'],
    specialInstructions: ['Nebulizer kit on person'],
    infectionAlerts: [],
    identityVerified: true,
    aadhaarVerified: true,
    passportVerified: true,
    creditBalance: 1500,
    isReturning: true,
    checkInAt: '2026-07-17T09:15:00',
  },
  {
    uhid: 'NX-2026-000415',
    name: 'Meera Krishnan',
    age: 47,
    gender: 'Female',
    phone: '+91 91234 56780',
    insuranceId: 'SELF-PAY',
    status: 'Emergency',
    department: 'Emergency Medicine',
    registeredAt: '2023-11-20',
    bloodGroup: 'AB+',
    address: '7 Koramangala 5th Block, Bengaluru',
    emergencyContact: 'Vikram Krishnan (Spouse) · +91 91xxx xx780',
    familyMembers: ['Vikram Krishnan (Spouse)'],
    wardRoom: 'ER Bay T-4',
    referralStatus: 'Emergency Intake',
    allergies: ['Latex', 'Shellfish'],
    criticalConditions: ['Hypertensive Crisis — active'],
    specialInstructions: ['Isolation precautions not required'],
    infectionAlerts: ['Contact precaution — MRSA screen pending'],
    identityVerified: true,
    aadhaarVerified: false,
    passportVerified: true,
    creditBalance: 0,
    isReturning: false,
    checkInAt: '2026-07-17T05:38:00',
  },
  {
    uhid: 'NX-2026-000419',
    name: 'Somnath Reddy',
    age: 58,
    gender: 'Male',
    phone: '+91 99887 76655',
    insuranceId: 'HDFC-ERG-90124',
    status: 'Discharged',
    department: 'Orthopedics',
    registeredAt: '2022-06-15',
    bloodGroup: 'B+',
    address: 'HSR Layout Sector 2, Bengaluru',
    emergencyContact: 'Lakshmi Reddy (Spouse) · +91 99xxx xx655',
    familyMembers: ['Lakshmi Reddy (Spouse)', 'Kiran Reddy (Son)'],
    wardRoom: '—',
    referralStatus: 'Corporate',
    allergies: [],
    criticalConditions: ['Post-TKR rehabilitation'],
    specialInstructions: ['Weight-bearing as tolerated — physio BID'],
    infectionAlerts: [],
    identityVerified: true,
    aadhaarVerified: true,
    passportVerified: false,
    creditBalance: 3200,
    isReturning: true,
    checkInAt: '2026-07-17T07:20:00',
  },
  {
    uhid: 'NX-2026-000421',
    name: 'Ananya Desai',
    age: 24,
    gender: 'Female',
    phone: '+91 99001 22334',
    insuranceId: 'STAR-HEALTH-90131',
    status: 'Outpatient',
    department: 'General Medicine',
    registeredAt: '2026-07-17',
    bloodGroup: 'O-',
    address: 'Whitefield, Bengaluru',
    emergencyContact: 'Ravi Desai (Father) · +91 99xxx xx334',
    familyMembers: ['Ravi Desai (Father)'],
    wardRoom: '—',
    referralStatus: 'Direct',
    allergies: [],
    criticalConditions: [],
    specialInstructions: [],
    infectionAlerts: [],
    identityVerified: false,
    aadhaarVerified: false,
    passportVerified: false,
    creditBalance: 0,
    isReturning: false,
    checkInAt: '2026-07-17T10:05:00',
  },
];

export const PATIENT_CENSUS = {
  totalRegistered: 12847,
  newToday: 47,
  returning: 312,
  active: 847,
  admitted: 389,
  discharged: 28,
  emergency: 46,
};

export const AGE_DISTRIBUTION = [
  { range: '0–18', count: 1420 },
  { range: '19–35', count: 3840 },
  { range: '36–50', count: 3210 },
  { range: '51–65', count: 2680 },
  { range: '65+', count: 1697 },
];

export const GENDER_DISTRIBUTION = [
  { label: 'Male', count: 6820 },
  { label: 'Female', count: 5890 },
  { label: 'Other', count: 137 },
];

export const ADMISSION_TREND = [
  { label: 'Mon', admissions: 38 },
  { label: 'Tue', admissions: 42 },
  { label: 'Wed', admissions: 45 },
  { label: 'Thu', admissions: 52 },
  { label: 'Fri', admissions: 48 },
  { label: 'Sat', admissions: 31 },
  { label: 'Sun', admissions: 24 },
];

export const RECENT_CHECKINS = MOCK_PATIENTS.filter((p) => p.checkInAt)
  .sort((a, b) => (b.checkInAt! > a.checkInAt! ? 1 : -1))
  .map((p) => ({
    uhid: p.uhid,
    name: p.name,
    status: p.status,
    checkInAt: p.checkInAt!,
    isNew: !p.isReturning,
  }));

export const PATIENT_ALERTS_HUB = MOCK_PATIENTS.flatMap((p) => [
  ...p.allergies.map((a) => ({
    id: `${p.uhid}-allergy-${a}`,
    uhid: p.uhid,
    patientName: p.name,
    type: 'allergy' as const,
    message: a,
    severity: 'high' as const,
  })),
  ...p.criticalConditions.map((c) => ({
    id: `${p.uhid}-critical-${c}`,
    uhid: p.uhid,
    patientName: p.name,
    type: 'critical' as const,
    message: c,
    severity: 'critical' as const,
  })),
  ...p.infectionAlerts.map((i) => ({
    id: `${p.uhid}-infection-${i}`,
    uhid: p.uhid,
    patientName: p.name,
    type: 'infection' as const,
    message: i,
    severity: 'high' as const,
  })),
  ...p.specialInstructions.map((s) => ({
    id: `${p.uhid}-instruction-${s}`,
    uhid: p.uhid,
    patientName: p.name,
    type: 'instruction' as const,
    message: s,
    severity: 'medium' as const,
  })),
]);

export const MOCK_TIMELINE: TimelineEvent[] = [
  {
    id: 't1',
    timestamp: '2026-07-14T08:22:00',
    type: 'registration',
    title: 'Initial Registration',
    detail: 'UHID NX-2026-000412 provisioned · Walk-in intake desk',
    department: 'Front Office',
    provider: 'Reception — Priya N.',
  },
  {
    id: 't2',
    timestamp: '2026-07-14T09:05:00',
    type: 'consultation',
    title: 'Cardiology OPD Consultation',
    detail: 'Chief complaint: exertional dyspnea · ECG ordered',
    department: 'Cardiology',
    provider: 'Dr. Anita Roy',
  },
  {
    id: 't3',
    timestamp: '2026-07-14T10:30:00',
    type: 'lab',
    title: 'Laboratory — Cardiac Panel',
    detail: 'Troponin-I, BNP, Lipid profile · STAT processing',
    department: 'Laboratory',
  },
  {
    id: 't4',
    timestamp: '2026-07-14T11:45:00',
    type: 'consultation',
    title: 'Echo & Stress Test Review',
    detail: 'LVEF 48% · admission recommended for optimization',
    department: 'Cardiology',
    provider: 'Dr. Anita Roy',
  },
  {
    id: 't5',
    timestamp: '2026-07-14T14:10:00',
    type: 'admission',
    title: 'IPD Admission',
    detail: 'Ward 3A · Bed 12 · CCU-capable telemetry bed',
    department: 'Inpatient Services',
  },
  {
    id: 't6',
    timestamp: '2026-07-15T08:00:00',
    type: 'pharmacy',
    title: 'Pharmacy Dispensing',
    detail: 'Metoprolol 25mg, Atorvastatin 40mg, Aspirin 75mg dispensed',
    department: 'Pharmacy',
  },
  {
    id: 't7',
    timestamp: '2026-07-16T09:30:00',
    type: 'lab',
    title: 'Repeat Troponin — Trending',
    detail: 'Troponin-I declining · critical value cleared',
    department: 'Laboratory',
  },
];

export const MOCK_INVOICES: InvoiceLine[] = [
  { id: 'INV-8847', date: '2026-07-15', description: 'IPD Day-2 Bed Charges — Ward 3A', amount: 12400, status: 'Pending' },
  { id: 'INV-8842', date: '2026-07-14', description: 'Cardiac Panel + Echo', amount: 18200, status: 'Paid' },
  { id: 'INV-8839', date: '2026-07-14', description: 'OPD Consultation Fee', amount: 850, status: 'Paid' },
  { id: 'INV-8831', date: '2026-07-14', description: 'Pharmacy — Cardiac medications', amount: 2460, status: 'Partial' },
];

export const MOCK_COMM_LOGS: CommLog[] = [
  { id: 'c1', channel: 'SMS', subject: 'Appointment reminder — Cardiology follow-up 18 Jul', sentAt: '2026-07-17T07:00:00', status: 'Delivered' },
  { id: 'c2', channel: 'WhatsApp', subject: 'Lab report available — Troponin trend report', sentAt: '2026-07-16T11:30:00', status: 'Delivered' },
  { id: 'c3', channel: 'Email', subject: 'Discharge summary draft for review', sentAt: '2026-07-16T16:45:00', status: 'Delivered' },
  { id: 'c4', channel: 'SMS', subject: 'Outstanding balance notification — ₹12,400', sentAt: '2026-07-17T08:15:00', status: 'Queued' },
];

export function searchPatients(query: string, patients = MOCK_PATIENTS): PatientRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return patients;
  return patients.filter(
    (p) =>
      p.uhid.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
      p.insuranceId.toLowerCase().includes(q),
  );
}

export function getPatientByUhid(uhid: string): PatientRecord | undefined {
  return MOCK_PATIENTS.find((p) => p.uhid === uhid);
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
