import type {
  Appointment,
  BlockedSlot,
  CommunicationLog,
  Department,
  Doctor,
  QueueEntry,
} from '../types';
import { computeLiveWaitMinutes, deriveQueueStatus, formatDeptToken } from '../types';

const TODAY = '2026-07-09';

export const SEED_DEPARTMENTS: Department[] = [
  {
    id: 'dept-cardio',
    name: 'Cardiology',
    tokenPrefix: 'CAR',
    roomLabel: 'Cabin C-12',
    maxQueueCapacity: 8,
  },
  {
    id: 'dept-ortho',
    name: 'Orthopedics',
    tokenPrefix: 'ORT',
    roomLabel: 'Cabin O-04',
    maxQueueCapacity: 6,
  },
  {
    id: 'dept-peds',
    name: 'Pediatrics',
    tokenPrefix: 'PED',
    roomLabel: 'Cabin P-07',
    maxQueueCapacity: 10,
  },
];

export const SEED_DOCTORS: Doctor[] = [
  {
    id: 'doc-001',
    name: 'Dr. Priya Menon',
    specialization: 'Cardiology',
    departmentId: 'dept-cardio',
  },
  {
    id: 'doc-002',
    name: 'Dr. Arjun Das',
    specialization: 'Orthopedics',
    departmentId: 'dept-ortho',
  },
  {
    id: 'doc-003',
    name: 'Dr. Lakshmi Nair',
    specialization: 'Pediatrics',
    departmentId: 'dept-peds',
  },
  {
    id: 'doc-004',
    name: 'Dr. Rahul Verma',
    specialization: 'Pediatrics',
    departmentId: 'dept-peds',
  },
];

export const SEED_BLOCKED_SLOTS: BlockedSlot[] = [
  { doctorId: 'doc-001', date: TODAY, startTime: '12:00', reason: 'Department meeting' },
  { doctorId: 'doc-001', date: TODAY, startTime: '12:15', reason: 'Department meeting' },
  { doctorId: 'doc-003', date: TODAY, startTime: '13:00', reason: 'Lunch break' },
  { doctorId: 'doc-003', date: TODAY, startTime: '13:15', reason: 'Lunch break' },
];

export const SEED_COMMUNICATION_LOGS: CommunicationLog[] = [
  {
    id: 'log-001',
    channel: 'WhatsApp',
    patientName: 'R.S.',
    message: 'Reminder sent for 14:30 slot',
    slotTime: '14:30',
    deliveryStatus: 'Delivered',
    timestamp: '2026-07-09T08:45:00Z',
  },
  {
    id: 'log-002',
    channel: 'SMS',
    patientName: 'A.S.',
    message: 'Check-in confirmed. Token CAR-001 assigned.',
    slotTime: '09:00',
    deliveryStatus: 'Delivered',
    timestamp: '2026-07-09T08:52:00Z',
  },
  {
    id: 'log-003',
    channel: 'Email',
    patientName: 'R.K.',
    message: 'Follow-up appointment confirmation for 09:30',
    slotTime: '09:30',
    deliveryStatus: 'Delivered',
    timestamp: '2026-07-09T07:30:00Z',
  },
  {
    id: 'log-004',
    channel: 'WhatsApp',
    patientName: 'V.P.',
    message: 'Walk-in token PED-003 — estimated wait 24 mins',
    deliveryStatus: 'Delivered',
    timestamp: '2026-07-09T09:15:00Z',
  },
  {
    id: 'log-005',
    channel: 'SMS',
    patientName: 'M.I.',
    message: 'Appointment reminder for 11:00 — please arrive 10 mins early',
    slotTime: '11:00',
    deliveryStatus: 'Pending',
    timestamp: '2026-07-09T10:00:00Z',
  },
  {
    id: 'log-006',
    channel: 'Email',
    patientName: 'S.R.',
    message: 'Cancellation notice — slot released for 14:00',
    slotTime: '14:00',
    deliveryStatus: 'Delivered',
    timestamp: '2026-07-09T11:20:00Z',
  },
];

export const SEED_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-001',
    doctorId: 'doc-001',
    doctorName: 'Dr. Priya Menon',
    departmentId: 'dept-cardio',
    patientId: 'pat-seed-001',
    patientName: 'A.S.',
    uhid: 'NEX-2026-1001',
    phone: '+91 98765 43210',
    date: TODAY,
    startTime: '09:00',
    endTime: '09:15',
    status: 'In-Consultation',
    appointmentType: 'Online',
    bookingChannel: 'Online',
    tokenNumber: 'CAR-001',
    checkedIn: true,
    assignedRoom: 'Cabin C-12',
  },
  {
    id: 'apt-002',
    doctorId: 'doc-001',
    doctorName: 'Dr. Priya Menon',
    departmentId: 'dept-cardio',
    patientId: 'pat-seed-002',
    patientName: 'R.K.',
    uhid: 'NEX-2026-1002',
    phone: '+91 91234 56789',
    date: TODAY,
    startTime: '09:30',
    endTime: '09:45',
    status: 'Confirmed',
    appointmentType: 'Follow-up',
    bookingChannel: 'Online',
    tokenNumber: 'CAR-002',
    checkedIn: true,
    assignedRoom: 'Cabin C-12',
  },
  {
    id: 'apt-003',
    doctorId: 'doc-003',
    doctorName: 'Dr. Lakshmi Nair',
    departmentId: 'dept-peds',
    patientId: 'pat-new',
    patientName: 'V.P.',
    uhid: 'NEX-2026-1003',
    phone: '+91 99887 76655',
    date: TODAY,
    startTime: '10:00',
    endTime: '10:15',
    status: 'Walk-in',
    appointmentType: 'Walk-In',
    bookingChannel: 'Walk-in',
    tokenNumber: 'PED-003',
    checkedIn: true,
    assignedRoom: 'Cabin P-07',
  },
  {
    id: 'apt-004',
    doctorId: 'doc-001',
    doctorName: 'Dr. Priya Menon',
    departmentId: 'dept-cardio',
    patientId: 'pat-x',
    patientName: 'M.I.',
    uhid: 'NEX-2026-1004',
    phone: '+91 90001 12233',
    date: TODAY,
    startTime: '11:00',
    endTime: '11:15',
    status: 'Confirmed',
    appointmentType: 'Online',
    bookingChannel: 'Online',
    checkedIn: false,
  },
  {
    id: 'apt-005',
    doctorId: 'doc-001',
    doctorName: 'Dr. Priya Menon',
    departmentId: 'dept-cardio',
    patientId: 'pat-y',
    patientName: 'S.R.',
    uhid: 'NEX-2026-1005',
    phone: '+91 91111 22334',
    date: TODAY,
    startTime: '14:00',
    endTime: '14:15',
    status: 'Cancelled',
    appointmentType: 'Online',
    bookingChannel: 'Online',
    checkedIn: false,
  },
  {
    id: 'apt-006',
    doctorId: 'doc-002',
    doctorName: 'Dr. Arjun Das',
    departmentId: 'dept-ortho',
    patientId: 'pat-z',
    patientName: 'P.M.',
    uhid: 'NEX-2026-1006',
    phone: '+91 92222 33445',
    date: TODAY,
    startTime: '10:30',
    endTime: '10:45',
    status: 'Confirmed',
    appointmentType: 'Walk-In',
    bookingChannel: 'Walk-in',
    tokenNumber: 'ORT-001',
    checkedIn: true,
    assignedRoom: 'Cabin O-04',
  },
  {
    id: 'apt-007',
    doctorId: 'doc-003',
    doctorName: 'Dr. Lakshmi Nair',
    departmentId: 'dept-peds',
    patientId: 'pat-a',
    patientName: 'R.S.',
    uhid: 'NEX-2026-1007',
    phone: '+91 93333 44556',
    date: TODAY,
    startTime: '14:30',
    endTime: '14:45',
    status: 'Confirmed',
    appointmentType: 'Online',
    bookingChannel: 'Online',
    checkedIn: false,
  },
  {
    id: 'apt-008',
    doctorId: 'doc-003',
    doctorName: 'Dr. Lakshmi Nair',
    departmentId: 'dept-peds',
    patientId: 'pat-b',
    patientName: 'K.R.',
    uhid: 'NEX-2026-1008',
    phone: '+91 94444 55667',
    date: TODAY,
    startTime: '09:15',
    endTime: '09:30',
    status: 'Confirmed',
    appointmentType: 'Follow-up',
    bookingChannel: 'Online',
    tokenNumber: 'PED-001',
    checkedIn: true,
    assignedRoom: 'Cabin P-07',
    onWaitingList: false,
  },
  {
    id: 'apt-009',
    doctorId: 'doc-003',
    doctorName: 'Dr. Lakshmi Nair',
    departmentId: 'dept-peds',
    patientId: 'pat-c',
    patientName: 'A.D.',
    uhid: 'NEX-2026-1009',
    phone: '+91 95555 66778',
    date: TODAY,
    startTime: '09:45',
    endTime: '10:00',
    status: 'Walk-in',
    appointmentType: 'Walk-In',
    bookingChannel: 'Walk-in',
    tokenNumber: 'PED-012',
    checkedIn: true,
    assignedRoom: 'Cabin P-07',
    onWaitingList: true,
  },
  {
    id: 'apt-010',
    doctorId: 'doc-001',
    doctorName: 'Dr. Priya Menon',
    departmentId: 'dept-cardio',
    patientId: 'pat-d',
    patientName: 'L.N.',
    uhid: 'NEX-2026-1010',
    phone: '+91 96666 77889',
    date: TODAY,
    startTime: '10:15',
    endTime: '10:30',
    status: 'No-Show',
    appointmentType: 'Online',
    bookingChannel: 'Online',
    checkedIn: false,
  },
];

function minutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString();
}

export function buildInitialQueue(appointments: Appointment[]): QueueEntry[] {
  const checkedIn = appointments.filter(
    (a) => a.checkedIn && a.tokenNumber && a.status !== 'Cancelled' && a.status !== 'No-Show',
  );

  const byDoctor = new Map<string, Appointment[]>();
  checkedIn.forEach((a) => {
    const list = byDoctor.get(a.doctorId) ?? [];
    list.push(a);
    byDoctor.set(a.doctorId, list);
  });

  const queue: QueueEntry[] = [];
  byDoctor.forEach((list) => {
    const sorted = [...list].sort((a, b) => {
      const ta = parseInt(a.tokenNumber!.split('-')[1] ?? '0', 10);
      const tb = parseInt(b.tokenNumber!.split('-')[1] ?? '0', 10);
      return ta - tb;
    });
    sorted.forEach((a, idx) => {
      const dept = SEED_DEPARTMENTS.find((d) => d.id === a.departmentId);
      const position = idx + 1;
      const checkedInAt = minutesAgo(position * 8);
      const waitDurationMinutes = computeLiveWaitMinutes(checkedInAt, position);
      const baseStatus =
        a.status === 'In-Consultation' ? ('In-Consultation' as const) : ('Waiting' as const);
      const entry: QueueEntry = {
        id: `q-${a.id}`,
        appointmentId: a.id,
        tokenNumber: a.tokenNumber!,
        patientName: a.patientName,
        uhid: a.uhid,
        doctorId: a.doctorId,
        doctorName: a.doctorName,
        departmentId: a.departmentId,
        assignedRoom: a.assignedRoom ?? dept?.roomLabel ?? '—',
        status: baseStatus,
        position,
        waitDurationMinutes,
        checkedInAt,
      };
      entry.status = deriveQueueStatus(entry);
      queue.push(entry);
    });
  });

  return queue;
}

export function nextTokenNumber(
  departmentId: string,
  doctorId: string,
  date: string,
  existing: Appointment[],
): string {
  const dept = SEED_DEPARTMENTS.find((d) => d.id === departmentId);
  const prefix = dept?.tokenPrefix ?? 'TKN';
  const tokens = existing
    .filter((a) => a.doctorId === doctorId && a.tokenNumber && a.date === date)
    .map((a) => parseInt(a.tokenNumber!.split('-')[1] ?? '0', 10));
  const max = tokens.length ? Math.max(...tokens) : 0;
  return formatDeptToken(prefix, max + 1);
}

export { TODAY as APPOINTMENT_TODAY };
