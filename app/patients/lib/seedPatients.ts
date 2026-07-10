import type { PatientRecord } from '../types';

export const SEED_PATIENTS: PatientRecord[] = [
  {
    profile: {
      id: 'pat-seed-001',
      uhid: 'NEX-2026-1001',
      firstName: 'Ananya',
      lastName: 'Sharma',
      dob: '1992-04-18',
      gender: 'Female',
      bloodGroup: 'B+',
      nationalIdOptional: 'XXXX-XXXX-9012',
      phone: '+91 98765 43210',
      email: 'ananya.sharma@email.com',
      isTemporary: false,
      registeredAt: '2026-07-01T08:30:00Z',
    },
    address: {
      patientId: 'pat-seed-001',
      street: '42 MG Road, Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      zipCode: '560034',
    },
    emergencyContact: {
      patientId: 'pat-seed-001',
      contactName: 'Rahul Sharma',
      relationship: 'Spouse',
      phone: '+91 98765 00001',
    },
    insurance: {
      patientId: 'pat-seed-001',
      billingType: 'Corporate',
      providerName: 'Star Health',
      policyNumber: 'SH-8844221',
      corporateGroupCode: 'TCS-GRP-09',
      validityDate: '2027-03-31',
    },
  },
  {
    profile: {
      id: 'pat-seed-002',
      uhid: 'NEX-2026-1002',
      firstName: 'Rajesh',
      lastName: 'Kumar',
      dob: '1978-11-02',
      gender: 'Male',
      bloodGroup: 'O+',
      phone: '+91 91234 56789',
      email: 'rajesh.k@email.com',
      isTemporary: false,
      registeredAt: '2026-07-03T10:15:00Z',
    },
    address: {
      patientId: 'pat-seed-002',
      street: '18 Park Street',
      city: 'Kolkata',
      state: 'West Bengal',
      zipCode: '700016',
    },
    emergencyContact: {
      patientId: 'pat-seed-002',
      contactName: 'Sunita Kumar',
      relationship: 'Wife',
      phone: '+91 91234 00002',
    },
    insurance: {
      patientId: 'pat-seed-002',
      billingType: 'Insurance',
      providerName: 'ICICI Lombard',
      policyNumber: 'IL-7729100',
      validityDate: '2026-12-31',
    },
  },
  {
    profile: {
      id: 'pat-seed-003',
      uhid: 'NEX-2026-TMP-0012',
      firstName: 'Unknown',
      lastName: 'MVA',
      dob: '',
      gender: 'Male',
      bloodGroup: 'Unknown',
      phone: '—',
      isTemporary: true,
      estimatedAge: 34,
      registeredAt: '2026-07-09T05:48:00Z',
    },
    address: null,
    emergencyContact: null,
    insurance: {
      patientId: 'pat-seed-003',
      billingType: 'Self',
    },
  },
];

export function formatPhoneDisplay(phone: string): string {
  return phone || '—';
}
