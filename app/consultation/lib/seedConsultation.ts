import { SEED_MASTER_DATA } from '../../master-data/lib/seedData';
import type { ConsultationEncounter, SafetyAlert, SoapNotes } from '../types';
import { generateEncounterId } from '../types';

export const MEDICINE_CATALOG = SEED_MASTER_DATA.medicines.map((m) => ({
  id: m.id,
  label: `${m.brandName} (${m.genericName})`,
  genericName: m.genericName,
  brandName: m.brandName,
}));

const SAFETY_ALERTS: SafetyAlert[] = [
  { id: 'sa1', type: 'allergy', label: 'Penicillin — Anaphylaxis risk', severity: 'high' },
  { id: 'sa2', type: 'allergy', label: 'Sulfa drugs — Rash / Hives', severity: 'high' },
  { id: 'sa3', type: 'anticoagulant', label: 'On Aspirin 75mg — Bleeding precaution', severity: 'medium' },
];

export const ACTIVE_ENCOUNTER: ConsultationEncounter = {
  id: generateEncounterId(),
  patientId: 'pat-seed-002',
  uhid: 'NEX-2026-1002',
  patientName: 'R.S.',
  age: 42,
  gender: 'Male',
  tokenNumber: 'CAR-002',
  doctorName: 'Dr. Arjun Mehta',
  department: 'Cardiology',
  demographics: {
    dateOfBirth: '1984-03-15',
    bloodGroup: 'B+',
    phone: '+91 91234 56789',
    email: 'rahul.sharma@email.com',
    address: '14, Lake View Apartments, Koramangala, Bengaluru — 560034',
    emergencyContact: 'Priya Sharma (Spouse) · +91 98765 11111',
    insuranceId: 'INS-NEX-8842',
  },
  vitals: {
    bp: '142/92',
    pulse: 84,
    temp: 98.6,
    spO2: 96,
    weight: 78.5,
    weightUnit: 'kg',
    recordedAt: new Date().toISOString(),
    recordedBy: 'Nurse Kavitha R.',
  },
  nurseAssessment: {
    chiefComplaint: 'Intermittent chest discomfort × 3 days, worse on exertion',
    triageLevel: 'Urgent',
    painScore: 4,
    notes: 'No diaphoresis. Mild pallor noted. ECG ordered at triage.',
    assessedAt: new Date(Date.now() - 45 * 60_000).toISOString(),
    assessedBy: 'Nurse Kavitha R.',
  },
  safetyAlerts: SAFETY_ALERTS,
  allergies: ['Penicillin', 'Sulfa drugs'],
  medicalHistory: [
    'Hypertension — on Telmisartan 40mg OD',
    'Dyslipidemia — Rosuvastatin 10mg HS',
    'Former smoker (quit 2019)',
    'Family Hx: Father — MI at 58',
  ],
  soap: {
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  },
  diagnoses: [],
  prescriptions: [],
  labOrders: [],
  radiologyOrders: [],
  followUp: '1 week',
  referralType: 'None',
  referralNotes: '',
  status: 'draft',
};

export const EMPTY_SOAP: SoapNotes = {
  subjective: '',
  objective: '',
  assessment: '',
  plan: '',
};
