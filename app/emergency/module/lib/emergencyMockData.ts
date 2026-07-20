import type {
  AmbulanceStatus,
  ErBedStatus,
  InvestigationStatus,
  MlcStatus,
  ProcedureStatus,
  TransferDisposition,
  TreatmentStatus,
  TriagePriority,
} from '../emergencyNav.types';
import { bumpTriagePriority } from '../emergencyNav.types';

export type TriageEntry = {
  id: string;
  erNumber: string;
  patientName: string;
  uhid: string;
  isUnknown: boolean;
  priority: TriagePriority;
  chiefComplaint: string;
  gcs: number;
  mlcFlag: boolean;
  arrivalTime: string;
  triageNurse: string;
  identityVerified: boolean;
};

export type ErTreatmentBed = {
  id: string;
  bedLabel: string;
  bay: string;
  status: ErBedStatus;
  patientName?: string;
  uhid?: string;
  assignedDoctor?: string;
  assignedNurse?: string;
  codeBlue?: boolean;
  treatmentStatus?: TreatmentStatus;
};

export type UrgentLabOrder = {
  id: string;
  patientName: string;
  testName: string;
  priority: TriagePriority;
  status: InvestigationStatus;
  orderedAt: string;
};

export type UrgentRadOrder = {
  id: string;
  patientName: string;
  studyName: string;
  modality: string;
  status: InvestigationStatus;
  orderedAt: string;
};

export type BloodBankRequest = {
  id: string;
  patientName: string;
  component: string;
  units: number;
  status: InvestigationStatus;
  urgency: TriagePriority;
};

export type EmergencyProcedure = {
  id: string;
  patientName: string;
  procedure: 'CPR' | 'Intubation' | 'Suturing' | 'Chest Tube';
  status: ProcedureStatus;
  teamLead: string;
  startedAt: string;
};

export type AmbulanceUnit = {
  id: string;
  vehicleId: string;
  callSign: string;
  status: AmbulanceStatus;
  crew: string;
  destination: string;
  etaMinutes: number | null;
  lastAlert: string;
};

export type MlcCase = {
  id: string;
  caseNumber: string;
  patientName: string;
  uhid: string;
  incidentType: string;
  policeStation: string;
  status: MlcStatus;
  injuryDocumentation: string;
  chainOfCustody: string;
  openedAt: string;
};

export type ErTransfer = {
  id: string;
  patientName: string;
  uhid: string;
  disposition: TransferDisposition;
  fromLocation: string;
  toLocation: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  charges: number;
};

export const ER_CENSUS = {
  currentPatients: 47,
  criticalPatients: 8,
  waitingPatients: 12,
  underTreatment: 19,
  avgResponseMinutes: 4.2,
  availableErBeds: 6,
  icuBedAvailability: 4,
  activeAmbulances: 5,
};

export const INITIAL_TRIAGE_STREAM: TriageEntry[] = [
  {
    id: 'tr1',
    erNumber: 'ER-2026-0841',
    patientName: 'Unknown Male — Trauma',
    uhid: 'TMP-ER-2026-0091',
    isUnknown: true,
    priority: 'Critical',
    chiefComplaint: 'RTA — polytrauma, GCS 8, hypotensive',
    gcs: 8,
    mlcFlag: true,
    arrivalTime: '2026-07-18T11:02:00',
    triageNurse: 'Sister Susan Joseph',
    identityVerified: false,
  },
  {
    id: 'tr2',
    erNumber: 'ER-2026-0842',
    patientName: 'Meera Krishnan',
    uhid: 'NX-2026-000415',
    isUnknown: false,
    priority: 'Emergent',
    chiefComplaint: 'Acute chest pain — suspected ACS',
    gcs: 15,
    mlcFlag: false,
    arrivalTime: '2026-07-18T11:08:00',
    triageNurse: 'Sister Priya Menon',
    identityVerified: true,
  },
  {
    id: 'tr3',
    erNumber: 'ER-2026-0843',
    patientName: 'Sanjay Rao',
    uhid: 'NX-2026-000365',
    isUnknown: false,
    priority: 'Urgent',
    chiefComplaint: 'High-grade fever + rigors — sepsis screen',
    gcs: 14,
    mlcFlag: false,
    arrivalTime: '2026-07-18T11:15:00',
    triageNurse: 'Sister Meera Iyer',
    identityVerified: true,
  },
  {
    id: 'tr4',
    erNumber: 'ER-2026-0844',
    patientName: 'Anita Desai',
    uhid: 'NX-2026-000329',
    isUnknown: false,
    priority: 'Non-Urgent',
    chiefComplaint: 'Minor laceration — left forearm',
    gcs: 15,
    mlcFlag: false,
    arrivalTime: '2026-07-18T11:22:00',
    triageNurse: 'Sister Lakshmi N.',
    identityVerified: true,
  },
  {
    id: 'tr5',
    erNumber: 'ER-2026-0840',
    patientName: 'Vikram Patel',
    uhid: 'NX-2026-000388',
    isUnknown: false,
    priority: 'Emergent',
    chiefComplaint: 'Stroke symptoms — FAST positive, onset 45 min',
    gcs: 12,
    mlcFlag: false,
    arrivalTime: '2026-07-18T10:55:00',
    triageNurse: 'Sister Susan Joseph',
    identityVerified: true,
  },
];

export const INITIAL_ER_BEDS: ErTreatmentBed[] = [
  { id: 'eb1', bedLabel: 'Resus-1', bay: 'Resuscitation Bay', status: 'Occupied', patientName: 'Unknown Male — Trauma', uhid: 'TMP-ER-2026-0091', assignedDoctor: 'Dr. B. Joseph', assignedNurse: 'Sister Susan Joseph', codeBlue: true, treatmentStatus: 'Under Treatment' },
  { id: 'eb2', bedLabel: 'Trauma-2', bay: 'Trauma Bay', status: 'Occupied', patientName: 'Vikram Patel', uhid: 'NX-2026-000388', assignedDoctor: 'Dr. Anita Roy', assignedNurse: 'Sister Priya Menon', codeBlue: false, treatmentStatus: 'Under Treatment' },
  { id: 'eb3', bedLabel: 'Obs-5', bay: 'Observation', status: 'Occupied', patientName: 'Meera Krishnan', uhid: 'NX-2026-000415', assignedDoctor: 'Dr. Rajesh Kumar', assignedNurse: 'Sister Meera Iyer', treatmentStatus: 'Observation' },
  { id: 'eb4', bedLabel: 'Obs-6', bay: 'Observation', status: 'Available' },
  { id: 'eb5', bedLabel: 'Fast-3', bay: 'Fast Track', status: 'Occupied', patientName: 'Anita Desai', uhid: 'NX-2026-000329', assignedDoctor: 'Dr. Kapoor', assignedNurse: 'Sister Lakshmi N.', treatmentStatus: 'Under Treatment' },
  { id: 'eb6', bedLabel: 'Obs-7', bay: 'Observation', status: 'Reserved' },
  { id: 'eb7', bedLabel: 'Resus-2', bay: 'Resuscitation Bay', status: 'Cleaning' },
];

export const MOCK_URGENT_LABS: UrgentLabOrder[] = [
  { id: 'UL-901', patientName: 'Unknown Male — Trauma', testName: 'ABG + Lactate + Crossmatch', priority: 'Critical', status: 'In Progress', orderedAt: '2026-07-18T11:05:00' },
  { id: 'UL-902', patientName: 'Meera Krishnan', testName: 'Troponin-I · CK-MB · D-Dimer', priority: 'Emergent', status: 'Sample Collected', orderedAt: '2026-07-18T11:10:00' },
  { id: 'UL-903', patientName: 'Sanjay Rao', testName: 'Blood Culture × 2 · Procalcitonin', priority: 'Urgent', status: 'Ordered', orderedAt: '2026-07-18T11:18:00' },
];

export const MOCK_URGENT_RAD: UrgentRadOrder[] = [
  { id: 'UR-501', patientName: 'Unknown Male — Trauma', studyName: 'Whole Body CT Trauma Protocol', modality: 'CT', status: 'In Progress', orderedAt: '2026-07-18T11:06:00' },
  { id: 'UR-502', patientName: 'Vikram Patel', studyName: 'CT Brain Plain + CTA Head/Neck', modality: 'CT', status: 'Ordered', orderedAt: '2026-07-18T11:00:00' },
];

export const MOCK_BLOOD_BANK: BloodBankRequest[] = [
  { id: 'BB-301', patientName: 'Unknown Male — Trauma', component: 'PRBC O-Negative', units: 4, status: 'In Progress', urgency: 'Critical' },
  { id: 'BB-302', patientName: 'Meera Krishnan', component: 'Platelets A+', units: 1, status: 'Ordered', urgency: 'Emergent' },
];

export const MOCK_PROCEDURES: EmergencyProcedure[] = [
  { id: 'EP-101', patientName: 'Unknown Male — Trauma', procedure: 'CPR', status: 'In Progress', teamLead: 'Dr. B. Joseph', startedAt: '2026-07-18T11:03:00' },
  { id: 'EP-102', patientName: 'Unknown Male — Trauma', procedure: 'Intubation', status: 'Completed', teamLead: 'Dr. B. Joseph', startedAt: '2026-07-18T11:04:00' },
  { id: 'EP-103', patientName: 'Anita Desai', procedure: 'Suturing', status: 'In Progress', teamLead: 'Dr. Kapoor', startedAt: '2026-07-18T11:25:00' },
];

export const MOCK_AMBULANCES: AmbulanceUnit[] = [
  { id: 'amb1', vehicleId: 'AMB-07', callSign: 'Alpha-7', status: 'En Route', crew: 'Paramedic Raj + EMT Suresh', destination: 'City Ring Road — RTA site', etaMinutes: 8, lastAlert: 'ETA updated — traffic delay on NH-48' },
  { id: 'amb2', vehicleId: 'AMB-03', callSign: 'Bravo-3', status: 'At Scene', crew: 'Paramedic Anita + Driver Mohan', destination: 'Koramangala 4th Block', etaMinutes: null, lastAlert: 'Patient extricated — loading in 5 min' },
  { id: 'amb3', vehicleId: 'AMB-12', callSign: 'Charlie-12', status: 'Returning', crew: 'Paramedic Joseph + EMT Ravi', destination: 'Nexora ER Bay 1', etaMinutes: 12, lastAlert: 'Critical patient onboard — pre-alert sent' },
  { id: 'amb4', vehicleId: 'AMB-05', callSign: 'Delta-5', status: 'Available', crew: 'Standby crew', destination: 'Station — ER Annex', etaMinutes: null, lastAlert: 'Ready for dispatch' },
  { id: 'amb5', vehicleId: 'AMB-09', callSign: 'Echo-9', status: 'Dispatched', crew: 'Paramedic Lakshmi + EMT Arun', destination: 'Indiranagar Metro incident', etaMinutes: 15, lastAlert: 'Dispatch confirmed 11:28' },
];

export const MOCK_MLC_CASES: MlcCase[] = [
  {
    id: 'mlc1',
    caseNumber: 'MLC-2026-0441',
    patientName: 'Unknown Male — Trauma',
    uhid: 'TMP-ER-2026-0091',
    incidentType: 'Road Traffic Accident — hit-and-run suspected',
    policeStation: 'HSR Layout PS',
    status: 'Police Notified',
    injuryDocumentation: 'Open tibial fracture R · scalp laceration · hemothorax suspected',
    chainOfCustody: 'Clothing bag #MLC-441-A sealed 11:10 · blood samples logged',
    openedAt: '2026-07-18T11:08:00',
  },
  {
    id: 'mlc2',
    caseNumber: 'MLC-2026-0438',
    patientName: 'Rahul Sharma',
    uhid: 'NX-2026-000412',
    incidentType: 'Workplace injury — fall from height',
    policeStation: 'Electronic City PS',
    status: 'Documentation Complete',
    injuryDocumentation: 'Lumbar compression fracture · contusions bilateral knees',
    chainOfCustody: 'Hard hat & safety harness retained — exhibit #MLC-438-B',
    openedAt: '2026-07-17T16:20:00',
  },
];

export const MOCK_TRANSFERS: ErTransfer[] = [
  { id: 'ET-801', patientName: 'Meera Krishnan', uhid: 'NX-2026-000415', disposition: 'Transfer to ICU', fromLocation: 'ER Obs-5', toLocation: 'ICU-4 Bed 05', status: 'Pending', charges: 8500 },
  { id: 'ET-802', patientName: 'Vikram Patel', uhid: 'NX-2026-000388', disposition: 'Transfer to OT', fromLocation: 'ER Trauma-2', toLocation: 'Neuro OT-2', status: 'In Progress', charges: 12400 },
  { id: 'ET-803', patientName: 'Unknown Male — Trauma', uhid: 'TMP-ER-2026-0091', disposition: 'Admit to IPD', fromLocation: 'Resus-1', toLocation: 'Trauma IPD Ward 7A', status: 'Pending', charges: 25000 },
];

export const RESPONSE_TIME_ANALYSIS = [
  { interval: '00–05 min', count: 18, target: 20 },
  { interval: '05–10 min', count: 14, target: 15 },
  { interval: '10–15 min', count: 9, target: 10 },
  { interval: '15–20 min', count: 4, target: 5 },
  { interval: '20+ min', count: 2, target: 2 },
];

export const MORTALITY_TREND = [
  { month: 'Jan', erVisits: 1420, mortality: 1.8 },
  { month: 'Feb', erVisits: 1380, mortality: 1.6 },
  { month: 'Mar', erVisits: 1510, mortality: 1.9 },
  { month: 'Apr', erVisits: 1460, mortality: 1.7 },
  { month: 'May', erVisits: 1580, mortality: 2.0 },
  { month: 'Jun', erVisits: 1620, mortality: 1.8 },
];

export const ER_DOCTORS = ['Dr. B. Joseph', 'Dr. Anita Roy', 'Dr. Rajesh Kumar', 'Dr. Kapoor'];

export function searchEmergency(query: string, triage: TriageEntry[]): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  return triage.filter(
    (t) =>
      t.patientName.toLowerCase().includes(q) ||
      t.uhid.toLowerCase().includes(q) ||
      t.erNumber.toLowerCase().includes(q) ||
      t.chiefComplaint.toLowerCase().includes(q),
  ).length;
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export { bumpTriagePriority };
