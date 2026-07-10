import { SEED_PATIENTS } from '../../patients/lib/seedPatients';
import type { ClinicalChart, IPDAdmission, IPDBed, MarEntry, Ward } from '../types';
import { generateAdmissionId } from '../types';

export const WARDS: Ward[] = [
  {
    id: 'icu',
    name: 'ICU',
    floorId: 'floor-3',
    floorLabel: '3rd Floor · Critical Care',
    dailyRate: 8500,
    roomTypeLabel: 'ICU',
  },
  {
    id: 'ccu',
    name: 'CCU',
    floorId: 'floor-2',
    floorLabel: '2nd Floor · Cardiac Care',
    dailyRate: 7200,
    roomTypeLabel: 'CCU',
  },
  {
    id: 'general-ward',
    name: 'General Ward',
    floorId: 'floor-2',
    floorLabel: '2nd Floor · East Wing',
    dailyRate: 2500,
    roomTypeLabel: 'General',
  },
  {
    id: 'private-suite',
    name: 'Private Suite',
    floorId: 'floor-1',
    floorLabel: '1st Floor · Premium',
    dailyRate: 12000,
    roomTypeLabel: 'Private',
  },
];

export const PATIENT_OPTIONS = SEED_PATIENTS.filter((p) => !p.profile.isTemporary).map((p) => ({
  patientId: p.profile.id,
  name: `${p.profile.firstName} ${p.profile.lastName}`.trim(),
  uhid: p.profile.uhid,
}));

export const ADMITTING_DOCTORS = [
  'Dr. Priya Menon',
  'Dr. Arjun Das',
  'Dr. Lakshmi Nair',
  'Dr. Arjun Mehta',
];

const DEFAULT_MAR: MarEntry[] = [
  {
    id: 'mar-1',
    drugName: 'Ceftriaxone',
    dose: '1g IV',
    route: 'IV',
    schedules: [
      { time: '08:00', administered: true, administeredAt: '2026-07-10T08:12:00Z', administeredBy: 'Nurse Priya S.' },
      { time: '14:00', administered: false },
      { time: '20:00', administered: false },
    ],
  },
  {
    id: 'mar-2',
    drugName: 'Pantoprazole',
    dose: '40mg IV',
    route: 'IV',
    schedules: [
      { time: '08:00', administered: true, administeredAt: '2026-07-10T08:15:00Z', administeredBy: 'Nurse Priya S.' },
      { time: '14:00', administered: false },
      { time: '20:00', administered: false },
    ],
  },
  {
    id: 'mar-3',
    drugName: 'Paracetamol',
    dose: '650mg PO',
    route: 'PO',
    schedules: [
      { time: '08:00', administered: false },
      { time: '14:00', administered: false },
      { time: '20:00', administered: false },
    ],
  },
];

function buildClinical(overrides?: Partial<ClinicalChart>): ClinicalChart {
  return {
    progressNotes: overrides?.progressNotes ?? [
      {
        id: 'pn-1',
        timestamp: '2026-07-10T06:30:00Z',
        author: 'Dr. Arjun Mehta',
        note: 'Patient stable overnight. Vitals within acceptable range. Continue IV antibiotics.',
      },
      {
        id: 'pn-2',
        timestamp: '2026-07-09T18:00:00Z',
        author: 'Dr. Priya Menon',
        note: 'Post-admission review complete. Chest X-ray ordered. Monitor SpO₂ q4h.',
      },
      {
        id: 'pn-3',
        timestamp: '2026-07-09T08:00:00Z',
        author: 'Dr. Priya Menon',
        note: 'Admitted with acute febrile illness. Sepsis workup initiated.',
      },
    ],
    carePlans: overrides?.carePlans ?? [
      {
        id: 'cp-1',
        title: 'Sepsis Bundle Protocol',
        status: 'Active',
        details: 'Blood cultures × 2, IV fluids 30ml/kg, broad-spectrum antibiotics within 1hr',
      },
      {
        id: 'cp-2',
        title: 'Fall Risk Precautions',
        status: 'Active',
        details: 'Bed alarm on, non-slip footwear, assist with ambulation',
      },
    ],
    dietOrders: overrides?.dietOrders ?? [
      {
        id: 'diet-1',
        order: 'Liquid Diet — Low Sodium',
        restrictions: 'No added salt · Max 2g Na/day',
        status: 'Active',
      },
    ],
    marEntries: overrides?.marEntries ?? DEFAULT_MAR.map((m) => ({
      ...m,
      schedules: m.schedules.map((s) => ({ ...s })),
    })),
  };
}

const ADM_VIKRAM: IPDAdmission = {
  id: 'adm-seed-001',
  patientId: 'pat-seed-003',
  patientName: 'V.P.',
  uhid: 'NEX-2026-1003',
  admittingDoctor: 'Dr. Priya Menon',
  admittedAt: '2026-07-07T14:30:00Z',
  status: 'Active',
  clinical: buildClinical(),
  recordLocked: false,
  billingClearanceSent: false,
  currentDailyRate: 8500,
  rateHistory: [
    { wardId: 'icu', wardName: 'ICU', dailyRate: 8500, from: '2026-07-07T14:30:00Z' },
  ],
};

const ADM_RAJESH: IPDAdmission = {
  id: 'adm-seed-002',
  patientId: 'pat-seed-002',
  patientName: 'R.K.',
  uhid: 'NEX-2026-1002',
  admittingDoctor: 'Dr. Arjun Das',
  admittedAt: '2026-07-08T09:00:00Z',
  status: 'Active',
  clinical: buildClinical({
    progressNotes: [
      {
        id: 'pn-r1',
        timestamp: '2026-07-10T07:00:00Z',
        author: 'Dr. Arjun Das',
        note: 'Post-orthopedic fixation day 2. Pain controlled. PT consult ordered.',
      },
    ],
    dietOrders: [
      { id: 'diet-r1', order: 'Regular Diet — High Protein', status: 'Active' },
    ],
    marEntries: [
      {
        id: 'mar-r1',
        drugName: 'Tramadol',
        dose: '50mg PO',
        route: 'PO',
        schedules: [
          { time: '08:00', administered: true, administeredAt: '2026-07-10T08:05:00Z', administeredBy: 'Nurse Anil K.' },
          { time: '14:00', administered: false },
          { time: '20:00', administered: false },
        ],
      },
    ],
  }),
  recordLocked: false,
  billingClearanceSent: false,
  currentDailyRate: 2500,
  rateHistory: [
    { wardId: 'general-ward', wardName: 'General Ward', dailyRate: 2500, from: '2026-07-08T09:00:00Z' },
  ],
};

const ADM_ANANYA: IPDAdmission = {
  id: 'adm-seed-003',
  patientId: 'pat-seed-001',
  patientName: 'A.S.',
  uhid: 'NEX-2026-1001',
  admittingDoctor: 'Dr. Lakshmi Nair',
  admittedAt: '2026-07-06T11:00:00Z',
  status: 'Active',
  clinical: buildClinical({
    dietOrders: [
      { id: 'diet-a1', order: 'Diabetic Diet — 1800 kcal', restrictions: 'Low CHO', status: 'Active' },
    ],
  }),
  recordLocked: false,
  billingClearanceSent: false,
  currentDailyRate: 12000,
  rateHistory: [
    { wardId: 'private-suite', wardName: 'Private Suite', dailyRate: 12000, from: '2026-07-06T11:00:00Z' },
  ],
};

const ADM_HARISH: IPDAdmission = {
  id: 'adm-seed-004',
  patientId: 'pat-seed-harish',
  patientName: 'H.M.',
  uhid: 'NEX-2026-1010',
  admittingDoctor: 'Dr. Arjun Mehta',
  admittedAt: '2026-07-09T16:00:00Z',
  status: 'Active',
  clinical: buildClinical({
    carePlans: [
      {
        id: 'cp-h1',
        title: 'Post-PCI Monitoring',
        status: 'Active',
        details: 'Telemetry, dual antiplatelet therapy, strict bed rest 24hr',
      },
    ],
  }),
  recordLocked: false,
  billingClearanceSent: false,
  currentDailyRate: 7200,
  rateHistory: [
    { wardId: 'ccu', wardName: 'CCU', dailyRate: 7200, from: '2026-07-09T16:00:00Z' },
  ],
};

export const SEED_ADMISSIONS: Record<string, IPDAdmission> = {
  [ADM_VIKRAM.id]: ADM_VIKRAM,
  [ADM_RAJESH.id]: ADM_RAJESH,
  [ADM_ANANYA.id]: ADM_ANANYA,
  [ADM_HARISH.id]: ADM_HARISH,
};

export const SEED_BEDS: IPDBed[] = [
  // ICU — Floor 3
  { id: 'bed-icu-01', wardId: 'icu', bedLabel: 'ICU-01', status: 'Occupied', admissionId: ADM_VIKRAM.id },
  { id: 'bed-icu-02', wardId: 'icu', bedLabel: 'ICU-02', status: 'Available' },
  { id: 'bed-icu-03', wardId: 'icu', bedLabel: 'ICU-03', status: 'Housekeeping' },
  { id: 'bed-icu-04', wardId: 'icu', bedLabel: 'ICU-04', status: 'Available' },
  { id: 'bed-icu-05', wardId: 'icu', bedLabel: 'ICU-05', status: 'Available' },
  { id: 'bed-icu-06', wardId: 'icu', bedLabel: 'ICU-06', status: 'Available' },
  // CCU — Floor 2
  { id: 'bed-ccu-01', wardId: 'ccu', bedLabel: 'CCU-01', status: 'Occupied', admissionId: ADM_HARISH.id },
  { id: 'bed-ccu-02', wardId: 'ccu', bedLabel: 'CCU-02', status: 'Available' },
  { id: 'bed-ccu-03', wardId: 'ccu', bedLabel: 'CCU-03', status: 'Housekeeping' },
  { id: 'bed-ccu-04', wardId: 'ccu', bedLabel: 'CCU-04', status: 'Available' },
  // General Ward — Floor 2
  { id: 'bed-gw-01', wardId: 'general-ward', bedLabel: 'GW-101', status: 'Occupied', admissionId: ADM_RAJESH.id },
  { id: 'bed-gw-02', wardId: 'general-ward', bedLabel: 'GW-102', status: 'Available' },
  { id: 'bed-gw-03', wardId: 'general-ward', bedLabel: 'GW-103', status: 'Available' },
  { id: 'bed-gw-04', wardId: 'general-ward', bedLabel: 'GW-104', status: 'Housekeeping' },
  { id: 'bed-gw-05', wardId: 'general-ward', bedLabel: 'GW-105', status: 'Available' },
  { id: 'bed-gw-06', wardId: 'general-ward', bedLabel: 'GW-106', status: 'Available' },
  // Private Suite — Floor 1
  { id: 'bed-ps-01', wardId: 'private-suite', bedLabel: 'PS-401', status: 'Occupied', admissionId: ADM_ANANYA.id },
  { id: 'bed-ps-02', wardId: 'private-suite', bedLabel: 'PS-402', status: 'Available' },
  { id: 'bed-ps-03', wardId: 'private-suite', bedLabel: 'PS-403', status: 'Available' },
  { id: 'bed-ps-04', wardId: 'private-suite', bedLabel: 'PS-404', status: 'Housekeeping' },
];

export function createAdmission(
  patientId: string,
  admittingDoctor: string,
  wardId: Ward['id'],
): IPDAdmission | null {
  const patient = PATIENT_OPTIONS.find((p) => p.patientId === patientId);
  const ward = WARDS.find((w) => w.id === wardId);
  if (!patient || !ward) return null;

  const now = new Date().toISOString();
  return {
    id: generateAdmissionId(),
    patientId: patient.patientId,
    patientName: patient.name,
    uhid: patient.uhid,
    admittingDoctor,
    admittedAt: now,
    status: 'Active',
    clinical: buildClinical({ progressNotes: [], carePlans: [], dietOrders: [], marEntries: [] }),
    recordLocked: false,
    billingClearanceSent: false,
    currentDailyRate: ward.dailyRate,
    rateHistory: [{ wardId: ward.id, wardName: ward.name, dailyRate: ward.dailyRate, from: now }],
  };
}
