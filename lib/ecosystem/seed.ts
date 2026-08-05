import type {
  EcosystemAppointment,
  EcosystemDoctor,
  FamilyMember,
  HospitalBranch,
  EcosystemLabOrder,
  EcosystemNotification,
  EcosystemPatient,
  EcosystemPrescription,
  EcosystemRadiologyOrder,
  EcosystemState,
  VisitRecord,
  VitalRecord,
} from './types';

import { computeOpdAnalytics } from '@/lib/opd/analytics';

export const DEMO_PATIENT_ID = 'pat-v0-9021';
export const DEMO_PATIENT_EMAIL = 'patient@nexora.com';
export const DEMO_PATIENT_PASSWORD = 'patient123';

export const SEED_BRANCHES: HospitalBranch[] = [
  {
    id: 'branch-main',
    name: 'Nexora Main Campus',
    code: 'MAIN',
    address: '42 Healthcare Avenue, Block A',
    city: 'Kochi',
  },
  {
    id: 'branch-city',
    name: 'Nexora City Centre Clinic',
    code: 'CITY',
    address: '18 MG Road, Level 3',
    city: 'Kochi',
  },
  {
    id: 'branch-north',
    name: 'Nexora North Wing',
    code: 'NORTH',
    address: '7 Wellness Park Road',
    city: 'Ernakulam',
  },
];

export const SEED_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'fam-child-1',
    primaryPatientId: DEMO_PATIENT_ID,
    fullName: 'Riya Srinivasan',
    relation: 'child',
    dateOfBirth: '2018-06-12',
    mrn: 'ID_NEX_9021-C1',
  },
  {
    id: 'fam-parent-1',
    primaryPatientId: DEMO_PATIENT_ID,
    fullName: 'R. Srinivasan',
    relation: 'parent',
    dateOfBirth: '1965-11-03',
    mrn: 'ID_NEX_9021-P1',
  },
];

export const SEED_DOCTORS: EcosystemDoctor[] = [
  {
    id: '00000000-0000-4000-a000-000000000101',
    name: 'Dr. Aishwarya D S',
    email: 'hospital@curasync.com',
    department: 'General Medicine',
    specialization: 'Internal Medicine · General Physician',
    experience: '12 years',
    languages: ['English', 'Hindi', 'Malayalam'],
    rating: 4.8,
    reviewCount: 214,
    availableToday: true,
    photoInitials: 'AD',
    bio: 'Primary care physician specializing in chronic disease management and preventive health.',
    consultationFee: 800,
    slots: ['09:00', '09:30', '10:00', '11:00', '14:00', '15:30', '16:00'],
    roomNumber: 'Room 2',
    tokenPrefix: 'GEN',
    avgConsultMinutes: 10,
    branchId: 'branch-main',
    historicalDelayMinutes: 6,
  },
  {
    id: '00000000-0000-4000-a000-000000000102',
    name: 'Dr. Rajesh Kumar',
    email: 'doctor@nexora.com',
    department: 'Cardiology',
    specialization: 'Cardiology · Interventional',
    experience: '18 years',
    languages: ['English', 'Hindi', 'Tamil'],
    rating: 4.9,
    reviewCount: 328,
    availableToday: true,
    photoInitials: 'RK',
    bio: 'Interventional cardiologist with expertise in hypertension, heart failure, and lipid disorders.',
    consultationFee: 1200,
    slots: ['10:00', '10:30', '11:30', '15:00', '16:30'],
    roomNumber: 'Room 4',
    tokenPrefix: 'CARD',
    avgConsultMinutes: 15,
    branchId: 'branch-main',
    historicalDelayMinutes: 12,
  },
  {
    id: '00000000-0000-4000-a000-000000000103',
    name: 'Dr. Meera Iyer',
    email: 'ortho@nexora.com',
    department: 'Orthopedics',
    specialization: 'Orthopedic Surgery · Trauma',
    experience: '15 years',
    languages: ['English', 'Hindi'],
    rating: 4.7,
    reviewCount: 156,
    availableToday: false,
    photoInitials: 'MI',
    bio: 'Orthopedic surgeon focused on sports injuries, joint care, and fracture management.',
    consultationFee: 1000,
    slots: ['09:30', '11:00', '14:30'],
    roomNumber: 'Room 6',
    tokenPrefix: 'ORT',
    avgConsultMinutes: 14,
    branchId: 'branch-city',
    historicalDelayMinutes: 9,
  },
  {
    id: '00000000-0000-4000-a000-000000000104',
    name: 'Dr. Priya Menon',
    email: 'pediatric@nexora.com',
    department: 'Pediatrics',
    specialization: 'Pediatrics · Neonatology',
    experience: '10 years',
    languages: ['English', 'Malayalam'],
    rating: 4.9,
    reviewCount: 189,
    availableToday: true,
    photoInitials: 'PM',
    bio: 'Pediatrician providing comprehensive child health, vaccination, and growth monitoring.',
    consultationFee: 700,
    slots: ['09:00', '10:30', '11:30', '15:00', '16:00'],
    roomNumber: 'Room 1',
    tokenPrefix: 'PED',
    avgConsultMinutes: 11,
    branchId: 'branch-north',
    historicalDelayMinutes: 5,
  },
];

export const SEED_PATIENT: EcosystemPatient = {
  id: DEMO_PATIENT_ID,
  fullName: 'Aishwarya D S',
  email: DEMO_PATIENT_EMAIL,
  phone: '+91 98765 43210',
  mrn: 'ID_NEX_9021',
  dateOfBirth: '1992-03-15',
  bloodGroup: 'B+',
  gender: 'Female',
  emergencyContactName: 'R. Srinivasan',
  emergencyContactPhone: '+91 97654 32109',
  insuranceProvider: 'Star Health · Gold Plan',
  insurancePolicyId: 'SH-GOLD-9021-2026',
};

function tomorrowAt(hour: number, minute = 0): { date: string; time: string; endTime: string } {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, minute, 0, 0);
  const end = new Date(d);
  end.setMinutes(end.getMinutes() + 30);
  return {
    date: d.toISOString().slice(0, 10),
    time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    endTime: end.toTimeString().slice(0, 5),
  };
}

const upcoming = tomorrowAt(10, 30);

export const SEED_APPOINTMENTS: EcosystemAppointment[] = [
  {
    id: 'appt-seed-1',
    patientId: DEMO_PATIENT_ID,
    patientName: SEED_PATIENT.fullName,
    patientMrn: SEED_PATIENT.mrn,
    doctorId: SEED_DOCTORS[1].id,
    doctorName: SEED_DOCTORS[1].name,
    department: SEED_DOCTORS[1].department,
    date: upcoming.date,
    time: upcoming.time,
    endTime: upcoming.endTime,
    reason: 'Hypertension follow-up · medication review',
    status: 'Confirmed',
    type: 'OPD',
    token: 'C-042',
    location: 'OPD Block A · Room 4',
    roomNumber: 'Room 4',
    sequentialToken: 'CARD-018',
    estimatedWaitMinutes: 18,
    delayStatus: 'on-time',
    qrPayload: 'NEXORA:CHECKIN:appt-seed-1:ID_NEX_9021',
    queuePosition: 3,
    branchId: 'branch-main',
    branchName: 'Nexora Main Campus',
    estimatedCost: 1200,
    priorityTier: 'standard',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const SEED_PRESCRIPTIONS: EcosystemPrescription[] = [
  {
    id: 'rx-seed-1',
    patientId: DEMO_PATIENT_ID,
    patientName: SEED_PATIENT.fullName,
    doctorId: SEED_DOCTORS[0].id,
    doctorName: SEED_DOCTORS[0].name,
    appointmentId: 'appt-hist-1',
    issuedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    status: 'active',
    medicines: [
      {
        id: 'med-1',
        name: 'Metformin',
        dosage: '500 mg',
        frequency: 'Twice daily after food',
        duration: '30 days',
        instructions: 'Take with meals. Monitor blood glucose.',
      },
      {
        id: 'med-2',
        name: 'Amlodipine',
        dosage: '5 mg',
        frequency: 'Once daily morning',
        duration: '30 days',
        instructions: 'Take at the same time each day.',
      },
    ],
  },
];

export const SEED_LAB_ORDERS: EcosystemLabOrder[] = [
  {
    id: 'lab-seed-1',
    patientId: DEMO_PATIENT_ID,
    patientName: SEED_PATIENT.fullName,
    doctorId: SEED_DOCTORS[1].id,
    doctorName: SEED_DOCTORS[1].name,
    testName: 'Lipid Panel',
    status: 'ready',
    orderedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    completedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    resultSummary: 'LDL 104 mg/dL · HDL 52 mg/dL · Triglycerides 138 mg/dL',
  },
  {
    id: 'lab-seed-2',
    patientId: DEMO_PATIENT_ID,
    patientName: SEED_PATIENT.fullName,
    doctorId: SEED_DOCTORS[0].id,
    doctorName: SEED_DOCTORS[0].name,
    testName: 'HbA1c',
    status: 'processing',
    orderedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

export const SEED_RAD_ORDERS: EcosystemRadiologyOrder[] = [
  {
    id: 'rad-seed-1',
    patientId: DEMO_PATIENT_ID,
    patientName: SEED_PATIENT.fullName,
    doctorId: SEED_DOCTORS[1].id,
    doctorName: SEED_DOCTORS[1].name,
    studyName: 'Chest X-Ray · PA View',
    status: 'completed',
    orderedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    completedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    findings: 'Normal cardiac silhouette. Lungs clear. No acute findings.',
  },
];

export const SEED_VISITS: VisitRecord[] = [
  {
    id: 'visit-1',
    patientId: DEMO_PATIENT_ID,
    date: new Date(Date.now() - 7 * 86400000).toISOString(),
    doctorName: SEED_DOCTORS[0].name,
    department: 'General Medicine',
    diagnosis: 'Type 2 Diabetes · Essential Hypertension',
    summary: 'Medication review · HbA1c ordered · lifestyle counselling',
    appointmentId: 'appt-hist-1',
  },
];

export const SEED_VITALS: VitalRecord[] = [
  {
    id: 'vit-1',
    patientId: DEMO_PATIENT_ID,
    recordedAt: new Date().toISOString(),
    bp: '120/80',
    pulse: '72',
    temperature: '98.4°F',
    spo2: '98%',
    weight: '62 kg',
  },
];

export const SEED_NOTIFICATIONS: EcosystemNotification[] = [
  {
    id: 'notif-1',
    patientId: DEMO_PATIENT_ID,
    title: 'Appointment Confirmed',
    body: `Your appointment with ${SEED_DOCTORS[1].name} is confirmed for tomorrow at ${upcoming.time}.`,
    category: 'appointment',
    read: false,
    createdAt: new Date().toISOString(),
    relatedId: 'appt-seed-1',
  },
  {
    id: 'notif-2',
    patientId: DEMO_PATIENT_ID,
    title: 'Lab Report Ready',
    body: 'Your Lipid Panel results are available in Medical Records.',
    category: 'lab',
    read: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    relatedId: 'lab-seed-1',
  },
  {
    id: 'notif-3',
    patientId: DEMO_PATIENT_ID,
    title: 'Prescription Ready',
    body: 'Dr. Aishwarya D S issued a new prescription. View in Prescriptions.',
    category: 'prescription',
    read: true,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    relatedId: 'rx-seed-1',
  },
];

export function buildSeedState(): EcosystemState {
  const appt = SEED_APPOINTMENTS[0];
  const state: EcosystemState = {
    version: 3,
    branches: SEED_BRANCHES,
    familyMembers: SEED_FAMILY_MEMBERS,
    patients: [SEED_PATIENT],
    doctors: SEED_DOCTORS,
    appointments: SEED_APPOINTMENTS,
    prescriptions: SEED_PRESCRIPTIONS,
    labOrders: SEED_LAB_ORDERS,
    radiologyOrders: SEED_RAD_ORDERS,
    visits: SEED_VISITS,
    vitals: SEED_VITALS,
    notifications: SEED_NOTIFICATIONS,
    hospitalQueue: appt
      ? [
          {
            id: 'hq-seed-1',
            appointmentId: appt.id,
            token: appt.token,
            sequentialToken: appt.sequentialToken,
            patientName: appt.patientName,
            department: appt.department,
            doctorName: appt.doctorName,
            scheduledTime: `${appt.date} ${appt.time}`,
            status: appt.status,
            roomNumber: appt.roomNumber,
            createdAt: appt.createdAt,
          },
        ]
      : [],
    billingInvoices: [],
    opdDisplay: {
      calledPatientName: null,
      calledToken: null,
      sequentialToken: null,
      roomNumber: null,
      doctorName: null,
      department: null,
      lastCalledAt: null,
      voiceLanguage: 'en',
      queuePaused: false,
      waitingHallCapacity: 80,
      waitingHallOccupancy: 24,
    },
    opdAnalytics: computeOpdAnalytics(SEED_APPOINTMENTS, SEED_DOCTORS),
  };
  return state;
}

export const DEPARTMENTS = [
  'General Medicine',
  'Cardiology',
  'Orthopedics',
  'Pediatrics',
  'Dermatology',
  'Neurology',
  'Gynecology',
];
