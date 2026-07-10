import type {
  AdmissionPackageOption,
  BedOccupancyState,
  DepartmentOption,
  DoctorAvailabilityOption,
  QueueTokenEntry,
  SimulatedBedCell,
  WardTypeOption,
} from './types';

export const DEPARTMENT_OPTIONS: DepartmentOption[] = [
  { code: 'ENT', label: 'ENT · Otolaryngology' },
  { code: 'CAR', label: 'Cardiology' },
  { code: 'ORT', label: 'Orthopedics' },
  { code: 'PED', label: 'Pediatrics' },
  { code: 'GEN', label: 'General Medicine' },
  { code: 'DER', label: 'Dermatology' },
];

export const DOCTOR_AVAILABILITY: DoctorAvailabilityOption[] = [
  { id: 'doc-ent-1', name: 'Dr. Meera Iyer', departmentCode: 'ENT', slotLabel: 'OPD · 09:00–13:00', available: true },
  { id: 'doc-ent-2', name: 'Dr. Rajesh Kumar', departmentCode: 'ENT', slotLabel: 'OPD · 14:00–18:00', available: false },
  { id: 'doc-car-1', name: 'Dr. Priya Menon', departmentCode: 'CAR', slotLabel: 'OPD · 10:00–16:00', available: true },
  { id: 'doc-ort-1', name: 'Dr. Arjun Das', departmentCode: 'ORT', slotLabel: 'OPD · 09:30–12:30', available: true },
  { id: 'doc-ped-1', name: 'Dr. Lakshmi Nair', departmentCode: 'PED', slotLabel: 'OPD · 08:00–14:00', available: true },
  { id: 'doc-gen-1', name: 'Dr. Vikram Patel', departmentCode: 'GEN', slotLabel: 'OPD · Full day', available: false },
];

export const SEED_QUEUE_TOKENS: QueueTokenEntry[] = [
  { id: 'q1', tokenId: 'ENT-014', patientInitials: 'P.N.', department: 'ENT', doctor: 'Dr. Meera Iyer', waitingMinutes: 18, status: 'Waiting', bookedAt: '2026-07-10T08:42:00Z' },
  { id: 'q2', tokenId: 'CAR-007', patientInitials: 'R.S.', department: 'Cardiology', doctor: 'Dr. Priya Menon', waitingMinutes: 32, status: 'Waiting', bookedAt: '2026-07-10T08:28:00Z' },
  { id: 'q3', tokenId: 'PED-021', patientInitials: 'A.K.', department: 'Pediatrics', doctor: 'Dr. Lakshmi Nair', waitingMinutes: 6, status: 'In Consultation', bookedAt: '2026-07-10T09:04:00Z' },
  { id: 'q4', tokenId: 'ORT-003', patientInitials: 'S.M.', department: 'Orthopedics', doctor: 'Dr. Arjun Das', waitingMinutes: 45, status: 'Waiting', bookedAt: '2026-07-10T08:15:00Z' },
  { id: 'q5', tokenId: 'GEN-112', patientInitials: 'K.V.', department: 'General Medicine', doctor: 'Dr. Vikram Patel', waitingMinutes: 12, status: 'Rescheduled', bookedAt: '2026-07-10T07:50:00Z' },
];

export const ADMISSION_PACKAGES: AdmissionPackageOption[] = [
  { id: 'pkg-gen', label: 'General Ward · Standard Care', baseRate: 2500 },
  { id: 'pkg-icu', label: 'ICU · Critical Monitoring', baseRate: 12000 },
  { id: 'pkg-pvt', label: 'Private Suite · Premium', baseRate: 8500 },
  { id: 'pkg-mat', label: 'Maternity · Delivery Package', baseRate: 45000 },
];

function buildBedGrid(ward: WardTypeOption, prefix: string, states: BedOccupancyState[]): SimulatedBedCell[] {
  return states.map((state, i) => ({
    bedId: `${prefix}-${String(i + 1).padStart(2, '0')}`,
    label: `${prefix}-${String(i + 1).padStart(2, '0')}`,
    wardType: ward,
    state,
    patientInitials: state === 'occupied' ? ['H.M.', 'S.D.', 'I.K.', 'P.R.'][i % 4] : undefined,
    uhid: state === 'occupied' ? `NX-2026-${100240 + i}` : undefined,
  }));
}

export const SEED_BED_MATRIX: SimulatedBedCell[] = [
  ...buildBedGrid('General Bed', 'GEN', ['vacant', 'occupied', 'vacant', 'occupied', 'maintenance', 'vacant', 'occupied', 'vacant']),
  ...buildBedGrid('ICU Chamber', 'ICU', ['occupied', 'occupied', 'vacant', 'maintenance', 'occupied', 'vacant']),
  ...buildBedGrid('Private Suite', 'PVT', ['vacant', 'occupied', 'vacant', 'occupied']),
];

export function generateUhid(): string {
  const serial = String(Math.floor(100000 + Math.random() * 900000));
  return `NX-2026-${serial}`;
}

export function generateTokenId(departmentCode: string, existing: QueueTokenEntry[]): string {
  const prefix = departmentCode.toUpperCase();
  const count = existing.filter((t) => t.tokenId.startsWith(prefix)).length + 1;
  return `${prefix}-${String(count).padStart(3, '0')}`;
}

export function maskIdentityValue(raw: string, docType: import('./types').IdentityDocType): string {
  if (!raw.trim() || docType === 'none') return '';
  const normalized = raw.replace(/\s/g, '');
  if (normalized.length <= 4) return 'XXXX';
  const visible = normalized.slice(-4);
  return `${'X'.repeat(Math.min(8, normalized.length - 4))}-${visible}`;
}

export function getPatientInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => `${p[0]?.toUpperCase()}.`)
    .join('');
}
