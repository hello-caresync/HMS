/** Nexora Doctor App — consolidated mock clinical data */

export const MOCK_DOCTOR_PROFILE = {
  id: 'doc-1',
  fullName: 'Dr. Aishwarya D S, MD',
  specialization: 'Internal Medicine · Cardiology',
  licenseNumber: 'REG_NEX_MD_9021',
  signaturePreview: 'Verified · Dr. Aishwarya D S',
};

export type MockPatient = {
  id: string;
  mrn: string;
  fullName: string;
  age: number;
  gender: string;
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
  diagnosis?: string;
};

export const MOCK_PATIENTS: MockPatient[] = [
  {
    id: 'pat-1',
    mrn: 'NX-MRN-9021',
    fullName: 'Aishwarya D S',
    age: 34,
    gender: 'Female',
    bloodGroup: 'O+',
    allergies: ['Penicillin', 'Sulfa drugs'],
    chronicConditions: ['Type 2 Diabetes', 'Hypertension'],
    diagnosis: 'E11.9 Type 2 diabetes mellitus',
  },
  {
    id: 'pat-2',
    mrn: 'NX-MRN-8841',
    fullName: 'P. Nandini',
    age: 52,
    gender: 'Female',
    bloodGroup: 'A+',
    allergies: [],
    chronicConditions: ['Post-cholecystectomy'],
    diagnosis: 'K80.20 Cholelithiasis',
  },
  {
    id: 'pat-3',
    mrn: 'NX-MRN-4398',
    fullName: 'K. Venkatesh',
    age: 61,
    gender: 'Male',
    bloodGroup: 'B+',
    allergies: ['Aspirin'],
    chronicConditions: ['CKD Stage 3', 'Atrial fibrillation'],
    diagnosis: 'I48.91 Atrial fibrillation',
  },
];

export type IpdWardGroup = 'ICU' | 'CCU' | 'General Male' | 'General Female' | 'Private';

export type IpdCensusRow = {
  id: string;
  ward: IpdWardGroup;
  patientId: string;
  name: string;
  mrn: string;
  bed: string;
  vitals: { bp: string; hr: string; spo2: string; critical?: boolean };
  losDays: number;
  attending: string;
  soapHistory: { at: string; author: string; s: string; o: string; a: string; p: string }[];
};

export const MOCK_IPD_CENSUS: IpdCensusRow[] = [
  {
    id: 'ipd-1',
    ward: 'ICU',
    patientId: 'pat-3',
    name: 'K. Venkatesh',
    mrn: 'NX-MRN-4398',
    bed: 'ICU-04',
    vitals: { bp: '98/62', hr: '112', spo2: '91', critical: true },
    losDays: 3,
    attending: 'Dr. Aishwarya D S',
    soapHistory: [
      {
        at: '2026-07-21T06:00:00',
        author: 'Dr. Aishwarya D S',
        s: 'Dyspnea overnight, reduced urine output',
        o: 'Crackles bilateral · K+ 6.1 on morning labs',
        a: 'Hyperkalemia · AKI on CKD',
        p: 'Insulin-dextrose · dialysis consult · telemetry',
      },
    ],
  },
  {
    id: 'ipd-2',
    ward: 'CCU',
    patientId: 'pat-2',
    name: 'P. Nandini',
    mrn: 'NX-MRN-8841',
    bed: 'CCU-12',
    vitals: { bp: '132/78', hr: '68', spo2: '97' },
    losDays: 1,
    attending: 'Dr. Rajesh Kumar',
    soapHistory: [],
  },
  {
    id: 'ipd-3',
    ward: 'General Female',
    patientId: 'pat-1',
    name: 'Aishwarya D S',
    mrn: 'NX-MRN-9021',
    bed: 'GW-F-218',
    vitals: { bp: '128/82', hr: '78', spo2: '98' },
    losDays: 2,
    attending: 'Dr. Aishwarya D S',
    soapHistory: [],
  },
  {
    id: 'ipd-4',
    ward: 'General Male',
    patientId: 'pat-er-1',
    name: 'R. Suresh',
    mrn: 'NX-MRN-7712',
    bed: 'GW-M-105',
    vitals: { bp: '118/76', hr: '84', spo2: '99' },
    losDays: 4,
    attending: 'Dr. Meera Iyer',
    soapHistory: [],
  },
  {
    id: 'ipd-5',
    ward: 'Private',
    patientId: 'pat-priv-1',
    name: 'V. Lakshmi',
    mrn: 'NX-MRN-6601',
    bed: 'PVT-301',
    vitals: { bp: '124/80', hr: '72', spo2: '99' },
    losDays: 1,
    attending: 'Dr. Aishwarya D S',
    soapHistory: [],
  },
];

export type EmergencyTriageCase = {
  id: string;
  esiLevel: 1 | 2 | 3 | 4 | 5;
  patientName: string;
  mrn: string;
  presentation: string;
  bay: string;
  statOrdersPending: number;
  vitals: { bp: string; hr: string; gcs: string };
};

export const MOCK_EMERGENCY_CASES: EmergencyTriageCase[] = [
  {
    id: 'er-1',
    esiLevel: 1,
    patientName: 'Unknown Male · Trauma',
    mrn: 'ER-TMP-991',
    presentation: 'MVC · hypotension · suspected intra-abdominal bleed',
    bay: 'Trauma Bay 1',
    statOrdersPending: 3,
    vitals: { bp: '82/50', hr: '128', gcs: '12' },
  },
  {
    id: 'er-2',
    esiLevel: 2,
    patientName: 'K. Venkatesh',
    mrn: 'NX-MRN-4398',
    presentation: 'Chest pain · STEMI rule-out',
    bay: 'Trauma Bay 3',
    statOrdersPending: 2,
    vitals: { bp: '110/70', hr: '96', gcs: '15' },
  },
  {
    id: 'er-3',
    esiLevel: 3,
    patientName: 'S. Priya',
    mrn: 'NX-MRN-5520',
    presentation: 'Abdominal pain · appendicitis query',
    bay: 'Fast Track 2',
    statOrdersPending: 0,
    vitals: { bp: '122/78', hr: '88', gcs: '15' },
  },
];

export type DrugCatalogEntry = {
  id: string;
  brand: string;
  generic: string;
  route: string;
  interactsWith?: string[];
  allergyConflict?: string[];
};

export const MOCK_DRUG_CATALOG: DrugCatalogEntry[] = [
  { id: 'd1', brand: 'Metformin 500mg', generic: 'Metformin', route: 'PO' },
  { id: 'd2', brand: 'Amoxicillin 500mg', generic: 'Amoxicillin', route: 'PO', allergyConflict: ['Penicillin'] },
  { id: 'd3', brand: 'Aspirin 75mg', generic: 'Aspirin', route: 'PO', allergyConflict: ['Aspirin'], interactsWith: ['Warfarin'] },
  { id: 'd4', brand: 'Warfarin 5mg', generic: 'Warfarin', route: 'PO', interactsWith: ['Aspirin'] },
  { id: 'd5', brand: 'Atorvastatin 20mg', generic: 'Atorvastatin', route: 'PO' },
  { id: 'd6', brand: 'Paracetamol 650mg', generic: 'Paracetamol', route: 'PO' },
];

export type DocumentTemplateType =
  | 'DISCHARGE_SUMMARY'
  | 'REFERRAL_LETTER'
  | 'MEDICAL_FITNESS'
  | 'SICK_LEAVE'
  | 'PROGRESS_NOTE';

export const DOCUMENT_TYPE_LABELS: Record<DocumentTemplateType, string> = {
  DISCHARGE_SUMMARY: 'Discharge Summary',
  REFERRAL_LETTER: 'Referral Letter',
  MEDICAL_FITNESS: 'Medical Fitness Certificate',
  SICK_LEAVE: 'Sick Leave Certificate',
  PROGRESS_NOTE: 'Progress Notes',
};

export type ChatChannel = {
  id: string;
  name: string;
  role: string;
  unread: number;
  lastMessage: string;
  lastAt: string;
};

export const MOCK_CHAT_CHANNELS: ChatChannel[] = [
  { id: 'ch-nurse', name: 'Nursing Station · Ward 3', role: 'Nursing', unread: 2, lastMessage: 'Vitals updated for ICU-04', lastAt: '10:12' },
  { id: 'ch-lab', name: 'Pathology Lab', role: 'Lab', unread: 1, lastMessage: 'STAT Troponin resulted', lastAt: '10:08' },
  { id: 'ch-rad', name: 'Radiology · PACS', role: 'Radiology', unread: 0, lastMessage: 'CT head prelim read available', lastAt: '09:45' },
  { id: 'ch-pharm', name: 'Central Pharmacy', role: 'Pharmacy', unread: 0, lastMessage: 'Rx #9021 dispensed', lastAt: '09:30' },
  { id: 'ch-admin', name: 'On-Call Admin', role: 'Admin', unread: 1, lastMessage: 'Bed board updated · ICU bed 6 open', lastAt: '08:55' },
];

export type ChatMessage = {
  id: string;
  channelId: string;
  sender: string;
  body: string;
  at: string;
  stat?: boolean;
  attachment?: string;
};

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'm1', channelId: 'ch-nurse', sender: 'Charge Nurse', body: 'Dr, please review ICU-04 potassium trend.', at: '10:10', stat: true },
  { id: 'm2', channelId: 'ch-nurse', sender: 'You', body: 'On my way · ordered repeat BMP STAT.', at: '10:11' },
  { id: 'm3', channelId: 'ch-lab', sender: 'Lab Tech', body: 'Troponin I 0.04 ng/mL · within normal limits.', at: '10:08' },
  { id: 'm4', channelId: 'ch-admin', sender: 'Bed Manager', body: 'ICU bed 6 available if needed.', at: '08:55' },
];

export type ClinicalNotification = {
  id: string;
  category: 'ALL' | 'EMERGENCY' | 'CRITICAL_LAB' | 'OT' | 'PATIENT_MSG';
  title: string;
  body: string;
  at: string;
  patientId?: string;
  acknowledged: boolean;
};

export const MOCK_NOTIFICATIONS: ClinicalNotification[] = [
  {
    id: 'n1',
    category: 'EMERGENCY',
    title: 'Trauma Bay 1 activation',
    body: 'ESI Level 1 · MVC · team pagers sent',
    at: '2026-07-21T10:15:00',
    acknowledged: false,
  },
  {
    id: 'n2',
    category: 'CRITICAL_LAB',
    title: 'Panic value · Potassium',
    body: 'K+ 6.2 mmol/L · Venkatesh · ICU-04',
    at: '2026-07-21T10:08:00',
    patientId: 'pat-3',
    acknowledged: false,
  },
  {
    id: 'n3',
    category: 'OT',
    title: 'OT schedule change',
    body: 'Lap cholecystectomy moved to OT-2 · 14:30',
    at: '2026-07-21T09:00:00',
    acknowledged: true,
  },
  {
    id: 'n4',
    category: 'PATIENT_MSG',
    title: 'Patient portal message',
    body: 'Aishwarya D S asked about fasting labs',
    at: '2026-07-21T08:40:00',
    patientId: 'pat-1',
    acknowledged: false,
  },
];

export type CalendarEventType = 'OPD' | 'OT' | 'WARD' | 'TELE' | 'LEAVE';

export type CalendarEvent = {
  id: string;
  title: string;
  type: CalendarEventType;
  start: string;
  end: string;
  location: string;
};

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: 'e1', title: 'OPD Block A', type: 'OPD', start: '2026-07-21T09:00:00', end: '2026-07-21T12:00:00', location: 'Clinic 2' },
  { id: 'e2', title: 'Lap Cholecystectomy', type: 'OT', start: '2026-07-21T14:30:00', end: '2026-07-21T16:30:00', location: 'OT-2' },
  { id: 'e3', title: 'ICU Ward Round', type: 'WARD', start: '2026-07-21T07:30:00', end: '2026-07-21T08:30:00', location: 'ICU' },
  { id: 'e4', title: 'Tele · Follow-up', type: 'TELE', start: '2026-07-21T17:00:00', end: '2026-07-21T17:30:00', location: 'Virtual' },
  { id: 'e5', title: 'Academic leave', type: 'LEAVE', start: '2026-07-22T00:00:00', end: '2026-07-22T23:59:00', location: '—' },
];

export const CALENDAR_EVENT_COLORS: Record<CalendarEventType, string> = {
  OPD: 'bg-blue-500/90',
  OT: 'bg-purple-500/90',
  WARD: 'bg-emerald-600/90',
  TELE: 'bg-teal-500/90',
  LEAVE: 'bg-slate-400/90',
};

export const MOCK_ANALYTICS = {
  kpis: {
    totalConsultations: 428,
    opdRatio: 68,
    ipdRatio: 32,
    avgConsultMinutes: 14,
    followUpRetention: 82,
  },
  consultationTrend: [
    { date: 'Mon', opd: 42, ipd: 12 },
    { date: 'Tue', opd: 38, ipd: 15 },
    { date: 'Wed', opd: 45, ipd: 11 },
    { date: 'Thu', opd: 40, ipd: 14 },
    { date: 'Fri', opd: 52, ipd: 18 },
    { date: 'Sat', opd: 28, ipd: 8 },
    { date: 'Sun', opd: 18, ipd: 6 },
  ],
  diagnosisBreakdown: [
    { name: 'Hypertension', value: 24 },
    { name: 'Type 2 DM', value: 19 },
    { name: 'URI', value: 14 },
    { name: 'CAD', value: 11 },
    { name: 'Other', value: 32 },
  ],
  surgeryOutcomes: [
    { name: 'Elective', success: 96, complications: 4 },
    { name: 'Emergency', success: 88, complications: 12 },
    { name: 'Day care', success: 99, complications: 1 },
  ],
  rxDistribution: [
    { name: 'Cardiology', count: 120 },
    { name: 'Endocrine', count: 95 },
    { name: 'Antibiotics', count: 72 },
    { name: 'Analgesics', count: 88 },
  ],
};

export const MOCK_ICD10 = [
  { code: 'I10', label: 'Essential (primary) hypertension' },
  { code: 'E11.9', label: 'Type 2 diabetes mellitus without complications' },
  { code: 'J06.9', label: 'Acute upper respiratory infection, unspecified' },
  { code: 'R07.9', label: 'Chest pain, unspecified' },
];

export const MOCK_AI_DIFFERENTIALS = [
  { diagnosis: 'Acute coronary syndrome', confidence: 0.82 },
  { diagnosis: 'Pulmonary embolism', confidence: 0.54 },
  { diagnosis: 'Aortic dissection', confidence: 0.31 },
  { diagnosis: 'GERD / musculoskeletal pain', confidence: 0.28 },
];

export const MOCK_GUIDELINES = [
  { id: 'g1', title: 'ESC 2023 ACS Guidelines', topic: 'Chest pain · troponin pathway' },
  { id: 'g2', title: 'ADA Standards of Care 2026', topic: 'Type 2 diabetes management' },
  { id: 'g3', title: 'KDIGO CKD staging', topic: 'eGFR · nephrology referral' },
];
