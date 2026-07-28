import type {
  ActivityItem,
  AnalyticsData,
  Appointment,
  ChatChannel,
  ChatMessage,
  ClinicalOrder,
  Consultation,
  DoctorProfile,
  DrugCatalogEntry,
  Notification,
  Patient,
} from './types';

const today = new Date();
const iso = (h: number, m = 0) => {
  const d = new Date(today);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export const SEED_PATIENTS: Patient[] = [
  {
    id: 'pat-1',
    mrn: 'NX-MRN-9021',
    fullName: 'Aishwarya D S',
    age: 34,
    gender: 'Female',
    bloodGroup: 'O+',
    phone: '+91 98765 43210',
    email: 'aishwarya@email.com',
    allergies: ['Penicillin', 'Sulfa drugs'],
    chronicConditions: ['Type 2 Diabetes', 'Hypertension'],
    diagnosis: 'E11.9 Type 2 diabetes mellitus',
    vitals: { bp: '128/82', hr: '78', temp: '98.4°F', spo2: '98%', weight: '62 kg', height: '165 cm', recordedAt: iso(8, 30) },
    medications: [
      { id: 'm1', name: 'Metformin 500mg', dose: '500mg', frequency: 'BD', since: '2024-01-15' },
      { id: 'm2', name: 'Amlodipine 5mg', dose: '5mg', frequency: 'OD', since: '2023-06-01' },
    ],
    visits: [
      { id: 'v1', date: '2026-07-14', type: 'OPD Follow-up', doctor: 'Dr. Aishwarya D S', summary: 'Diabetes review — HbA1c improved to 7.2%' },
      { id: 'v2', date: '2026-06-01', type: 'OPD', doctor: 'Dr. Aishwarya D S', summary: 'Routine check-up, medication adjusted' },
    ],
    labReports: [
      { id: 'lr1', test: 'HbA1c', result: '7.2%', status: 'completed', orderedAt: '2026-07-10', completedAt: '2026-07-12' },
      { id: 'lr2', test: 'Fasting Glucose', result: 'Pending', status: 'pending', orderedAt: iso(9, 0) },
    ],
    radiologyReports: [],
    documents: [{ id: 'd1', title: 'Previous discharge summary', type: 'Discharge', uploadedAt: '2026-06-01' }],
  },
  {
    id: 'pat-2',
    mrn: 'NX-MRN-8841',
    fullName: 'P. Nandini',
    age: 52,
    gender: 'Female',
    bloodGroup: 'A+',
    phone: '+91 98765 11111',
    allergies: [],
    chronicConditions: ['Post-cholecystectomy'],
    diagnosis: 'K80.20 Cholelithiasis',
    vitals: { bp: '132/78', hr: '68', temp: '98.1°F', spo2: '97%', recordedAt: iso(9, 15) },
    medications: [{ id: 'm3', name: 'Paracetamol 650mg', dose: '650mg', frequency: 'SOS', since: '2026-07-01' }],
    visits: [{ id: 'v3', date: '2026-07-01', type: 'Surgery Follow-up', doctor: 'Dr. Meera Iyer', summary: 'Post lap cholecystectomy — healing well' }],
    labReports: [{ id: 'lr3', test: 'LFT Panel', result: 'Normal', status: 'completed', orderedAt: '2026-07-05', completedAt: '2026-07-06' }],
    radiologyReports: [{ id: 'rr1', study: 'USG Abdomen', findings: 'Post-operative changes, no collection', status: 'completed', orderedAt: '2026-07-08', completedAt: '2026-07-08' }],
    documents: [],
  },
  {
    id: 'pat-3',
    mrn: 'NX-MRN-4398',
    fullName: 'K. Venkatesh',
    age: 61,
    gender: 'Male',
    bloodGroup: 'B+',
    phone: '+91 98765 22222',
    allergies: ['Aspirin'],
    chronicConditions: ['CKD Stage 3', 'Atrial fibrillation'],
    diagnosis: 'I48.91 Atrial fibrillation',
    vitals: { bp: '98/62', hr: '112', temp: '99.1°F', spo2: '91%', recordedAt: iso(7, 0) },
    medications: [
      { id: 'm4', name: 'Warfarin 5mg', dose: '5mg', frequency: 'OD', since: '2025-03-01' },
      { id: 'm5', name: 'Furosemide 40mg', dose: '40mg', frequency: 'OD', since: '2026-07-18' },
    ],
    visits: [{ id: 'v4', date: '2026-07-18', type: 'IPD Admission', doctor: 'Dr. Aishwarya D S', summary: 'Admitted for hyperkalemia management' }],
    labReports: [
      { id: 'lr4', test: 'Potassium', result: '6.2 mmol/L — CRITICAL', status: 'completed', orderedAt: iso(6, 30), completedAt: iso(7, 0) },
      { id: 'lr5', test: 'Troponin I', result: '0.04 ng/mL', status: 'completed', orderedAt: iso(8, 0), completedAt: iso(8, 30) },
    ],
    radiologyReports: [{ id: 'rr2', study: 'Chest X-Ray', findings: 'Cardiomegaly, mild pulmonary congestion', status: 'completed', orderedAt: iso(7, 30), completedAt: iso(8, 0) }],
    documents: [],
  },
];

export function buildSeedAppointments(doctorId: string): Appointment[] {
  return [
    { id: 'appt-1', patientId: 'pat-1', patientName: 'Aishwarya D S', mrn: 'NX-MRN-9021', time: iso(9, 0), endTime: iso(9, 30), type: 'in-person', status: 'completed', chiefComplaint: 'Diabetes follow-up', token: 'OPD-101', doctorId },
    { id: 'appt-2', patientId: 'pat-2', patientName: 'P. Nandini', mrn: 'NX-MRN-8841', time: iso(10, 0), endTime: iso(10, 30), type: 'in-person', status: 'in-progress', chiefComplaint: 'Post-surgery review', token: 'OPD-102', doctorId },
    { id: 'appt-3', patientId: 'pat-3', patientName: 'K. Venkatesh', mrn: 'NX-MRN-4398', time: iso(11, 0), endTime: iso(11, 30), type: 'in-person', status: 'waiting', chiefComplaint: 'Chest pain, dyspnea', token: 'OPD-103', doctorId },
    { id: 'appt-4', patientId: 'pat-1', patientName: 'Aishwarya D S', mrn: 'NX-MRN-9021', time: iso(14, 0), endTime: iso(14, 30), type: 'teleconsult', status: 'scheduled', chiefComplaint: 'Medication review', token: 'TELE-104', doctorId },
    { id: 'appt-5', patientId: 'pat-2', patientName: 'P. Nandini', mrn: 'NX-MRN-8841', time: iso(15, 30), endTime: iso(16, 0), type: 'in-person', status: 'scheduled', chiefComplaint: 'Wound check', token: 'OPD-105', doctorId },
    { id: 'appt-6', patientId: 'pat-3', patientName: 'K. Venkatesh', mrn: 'NX-MRN-4398', time: iso(8, 0), endTime: iso(8, 30), type: 'in-person', status: 'cancelled', chiefComplaint: 'Rescheduled', token: 'OPD-106', doctorId },
  ];
}

export function buildSeedOrders(doctorId: string): ClinicalOrder[] {
  return [
    { id: 'ord-1', type: 'lab', patientId: 'pat-3', patientName: 'K. Venkatesh', title: 'BMP + Troponin STAT', department: 'Pathology', status: 'completed', orderedAt: iso(7, 0), completedAt: iso(8, 30), progress: 100, doctorId },
    { id: 'ord-2', type: 'lab', patientId: 'pat-1', patientName: 'Aishwarya D S', title: 'Fasting Glucose', department: 'Pathology', status: 'pending', orderedAt: iso(9, 0), progress: 20, doctorId },
    { id: 'ord-3', type: 'radiology', patientId: 'pat-3', patientName: 'K. Venkatesh', title: 'Chest X-Ray PA', department: 'Radiology', status: 'completed', orderedAt: iso(7, 30), completedAt: iso(8, 0), progress: 100, doctorId },
    { id: 'ord-4', type: 'radiology', patientId: 'pat-2', patientName: 'P. Nandini', title: 'USG Abdomen', department: 'Radiology', status: 'in-progress', orderedAt: iso(10, 30), progress: 60, doctorId },
    { id: 'ord-5', type: 'prescription', patientId: 'pat-1', patientName: 'Aishwarya D S', title: 'Metformin + Amlodipine', department: 'Pharmacy', status: 'completed', orderedAt: iso(9, 30), completedAt: iso(10, 0), progress: 100, doctorId },
    { id: 'ord-6', type: 'admission', patientId: 'pat-3', patientName: 'K. Venkatesh', title: 'ICU Admission Request', department: 'Admissions', status: 'in-progress', orderedAt: iso(8, 0), progress: 75, doctorId },
    { id: 'ord-7', type: 'procedure', patientId: 'pat-2', patientName: 'P. Nandini', title: 'Wound dressing change', department: 'Nursing', status: 'pending', orderedAt: iso(11, 0), progress: 0, doctorId },
    { id: 'ord-8', type: 'surgery', patientId: 'pat-2', patientName: 'P. Nandini', title: 'Lap Cholecystectomy follow-up', department: 'Surgery', status: 'completed', orderedAt: '2026-07-01', completedAt: '2026-07-01', progress: 100, doctorId },
  ];
}

export const SEED_CHANNELS: ChatChannel[] = [
  { id: 'ch-patient-1', name: 'Aishwarya D S', role: 'patient', unread: 1, lastMessage: 'Can I eat before the fasting labs?', lastAt: '10:40' },
  { id: 'ch-nurse', name: 'Nursing Station · Ward 3', role: 'nurse', unread: 2, lastMessage: 'Vitals updated for ICU-04', lastAt: '10:12' },
  { id: 'ch-reception', name: 'OPD Reception', role: 'reception', unread: 0, lastMessage: 'Patient Nandini checked in', lastAt: '09:55' },
  { id: 'ch-lab', name: 'Pathology Lab', role: 'lab', unread: 1, lastMessage: 'STAT Troponin resulted', lastAt: '10:08' },
  { id: 'ch-rad', name: 'Radiology · PACS', role: 'radiology', unread: 0, lastMessage: 'CXR prelim read available', lastAt: '09:45' },
  { id: 'ch-pharm', name: 'Central Pharmacy', role: 'pharmacy', unread: 0, lastMessage: 'Rx #9021 dispensed', lastAt: '09:30' },
];

export const SEED_MESSAGES: ChatMessage[] = [
  { id: 'msg-1', channelId: 'ch-patient-1', sender: 'Aishwarya D S', body: 'Good morning doctor, can I eat before tomorrow fasting labs?', at: '10:40' },
  { id: 'msg-2', channelId: 'ch-nurse', sender: 'Charge Nurse', body: 'Dr, please review ICU-04 potassium trend.', at: '10:10' },
  { id: 'msg-3', channelId: 'ch-nurse', sender: 'You', body: 'On my way · ordered repeat BMP STAT.', at: '10:11', isDoctor: true },
  { id: 'msg-4', channelId: 'ch-lab', sender: 'Lab Tech', body: 'Troponin I 0.04 ng/mL · within normal limits.', at: '10:08' },
  { id: 'msg-5', channelId: 'ch-reception', sender: 'Reception', body: 'P. Nandini checked in for 10:00 appointment.', at: '09:55' },
];

export const SEED_NOTIFICATIONS: Notification[] = [
  { id: 'n1', category: 'emergency', title: 'Critical potassium', body: 'K+ 6.2 mmol/L · K. Venkatesh · ICU-04', at: iso(10, 8), read: false, patientId: 'pat-3' },
  { id: 'n2', category: 'lab', title: 'Lab result ready', body: 'Troponin I resulted for K. Venkatesh', at: iso(10, 8), read: false, patientId: 'pat-3' },
  { id: 'n3', category: 'patient', title: 'Patient message', body: 'Aishwarya D S asked about fasting labs', at: iso(10, 40), read: false, patientId: 'pat-1' },
  { id: 'n4', category: 'radiology', title: 'Radiology report', body: 'Chest X-Ray prelim read available', at: iso(9, 45), read: true, patientId: 'pat-3' },
];

export const SEED_ACTIVITIES: ActivityItem[] = [
  { id: 'a1', action: 'Consultation completed', detail: 'Aishwarya D S — Diabetes follow-up', at: iso(9, 30) },
  { id: 'a2', action: 'Lab order placed', detail: 'Fasting Glucose for Aishwarya D S', at: iso(9, 0) },
  { id: 'a3', action: 'Prescription sent', detail: 'Metformin + Amlodipine → Pharmacy', at: iso(9, 30) },
  { id: 'a4', action: 'Admission requested', detail: 'K. Venkatesh → ICU', at: iso(8, 0) },
];

export const SEED_DRUGS: DrugCatalogEntry[] = [
  { id: 'd1', brand: 'Metformin 500mg', generic: 'Metformin' },
  { id: 'd2', brand: 'Amoxicillin 500mg', generic: 'Amoxicillin', allergyConflict: ['Penicillin'] },
  { id: 'd3', brand: 'Aspirin 75mg', generic: 'Aspirin', allergyConflict: ['Aspirin'], interactsWith: ['Warfarin'] },
  { id: 'd4', brand: 'Warfarin 5mg', generic: 'Warfarin', interactsWith: ['Aspirin'] },
  { id: 'd5', brand: 'Atorvastatin 20mg', generic: 'Atorvastatin' },
  { id: 'd6', brand: 'Paracetamol 650mg', generic: 'Paracetamol' },
  { id: 'd7', brand: 'Amlodipine 5mg', generic: 'Amlodipine' },
  { id: 'd8', brand: 'Cotrimoxazole DS', generic: 'Sulfamethoxazole', allergyConflict: ['Sulfa drugs'] },
];

export function buildSeedConsultations(): Consultation[] {
  return [
    {
      id: 'con-1',
      appointmentId: 'appt-2',
      patientId: 'pat-2',
      status: 'draft',
      subjective: 'Post-operative pain, improving appetite',
      objective: 'Abdominal wound clean, no discharge. Vitals stable.',
      assessment: 'Post lap cholecystectomy — recovering well',
      plan: 'Continue analgesia PRN, wound review in 1 week',
      diagnosis: 'K91.89 Post-procedural complication, unspecified',
      treatmentPlan: 'Wound care, dietary advice',
      prescription: [{ id: 'rx1', drug: 'Paracetamol 650mg', dose: '650mg', frequency: 'SOS', duration: '5 days' }],
      updatedAt: iso(10, 15),
    },
  ];
}

export function buildDoctorProfile(doctorId: string, fullName: string, email: string, specialization: string, licenseNumber: string): DoctorProfile {
  return {
    id: doctorId,
    fullName,
    email,
    department: 'Internal Medicine',
    specialization,
    hospital: 'Nexora General Hospital',
    licenseNumber,
    phone: '+91 98765 00000',
    workingHours: [
      { day: 'Mon–Fri', start: '09:00', end: '17:00' },
      { day: 'Sat', start: '09:00', end: '13:00' },
    ],
    availability: 'available',
  };
}

export const ANALYTICS_BY_PERIOD: Record<'weekly' | 'monthly' | 'yearly', AnalyticsData> = {
  weekly: {
    patientsSeen: 42,
    appointments: 48,
    avgConsultMinutes: 14,
    followUpRate: 82,
    prescriptionCount: 38,
    labOrders: 24,
    radiologyOrders: 12,
    satisfaction: 4.7,
    trend: [
      { label: 'Mon', consultations: 8 },
      { label: 'Tue', consultations: 7 },
      { label: 'Wed', consultations: 9 },
      { label: 'Thu', consultations: 6 },
      { label: 'Fri', consultations: 10 },
      { label: 'Sat', consultations: 2 },
    ],
  },
  monthly: {
    patientsSeen: 168,
    appointments: 192,
    avgConsultMinutes: 15,
    followUpRate: 79,
    prescriptionCount: 142,
    labOrders: 96,
    radiologyOrders: 48,
    satisfaction: 4.6,
    trend: [
      { label: 'W1', consultations: 38 },
      { label: 'W2', consultations: 42 },
      { label: 'W3', consultations: 45 },
      { label: 'W4', consultations: 43 },
    ],
  },
  yearly: {
    patientsSeen: 2016,
    appointments: 2304,
    avgConsultMinutes: 14,
    followUpRate: 81,
    prescriptionCount: 1704,
    labOrders: 1152,
    radiologyOrders: 576,
    satisfaction: 4.65,
    trend: [
      { label: 'Jan', consultations: 156 },
      { label: 'Apr', consultations: 168 },
      { label: 'Jul', consultations: 172 },
      { label: 'Oct', consultations: 164 },
    ],
  },
};
