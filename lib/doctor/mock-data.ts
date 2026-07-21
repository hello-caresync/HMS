import type { EmrTimelineEvent, Patient } from '@/types/doctor';

import { MOCK_DOCTOR_PROFILE, MOCK_PATIENTS as RAW, MOCK_DRUG_CATALOG } from '@/lib/mock-data';

export const MOCK_DOCTOR = {
  id: MOCK_DOCTOR_PROFILE.id,
  name: MOCK_DOCTOR_PROFILE.fullName,
  specialization: MOCK_DOCTOR_PROFILE.specialization,
  regId: MOCK_DOCTOR_PROFILE.licenseNumber,
};

export { MOCK_ICD10 } from '@/lib/mock-data';

/** @deprecated use MOCK_DRUG_CATALOG from @/lib/mock-data */
export const MOCK_DRUGS = MOCK_DRUG_CATALOG.map((d) => ({ name: d.brand, generic: d.generic }));

export const MOCK_PATIENTS: Patient[] = RAW.map((p) => ({
  id: p.id,
  medicalRecordNumber: p.mrn,
  fullName: p.fullName,
  age: p.age,
  gender: p.gender,
  bloodGroup: p.bloodGroup,
  allergiesJson: p.allergies,
  chronicConditionsJson: p.chronicConditions,
}));

export const MOCK_EMR_TIMELINE: EmrTimelineEvent[] = [
  {
    id: 'tl-1',
    patientId: 'pat-1',
    at: '2026-07-21T09:30:00',
    category: 'Encounter',
    title: 'OPD Consultation',
    summary: 'Chief complaint: fatigue · HbA1c 7.8% · Metformin dose adjusted',
  },
  {
    id: 'tl-2',
    patientId: 'pat-1',
    at: '2026-07-18T11:00:00',
    category: 'Lab',
    title: 'Lipid Panel',
    summary: 'LDL 142 mg/dL · statin therapy recommended',
  },
  {
    id: 'tl-3',
    patientId: 'pat-3',
    at: '2026-07-21T08:15:00',
    category: 'Lab',
    title: 'Critical Potassium',
    summary: 'K+ 6.1 mmol/L · STAT repeat · nephrology consult',
  },
];
