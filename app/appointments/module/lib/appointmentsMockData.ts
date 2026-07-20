import type { AppointmentStatus, BookingVariant, QueuePriority } from '../appointmentsNav.types';

export type QueueEntry = {
  id: string;
  token: string;
  uhid: string;
  patientName: string;
  doctorName: string;
  department: string;
  room: string;
  scheduledTime: string;
  checkInAt?: string;
  status: AppointmentStatus;
  priority: QueuePriority;
  tokenGenerated: boolean;
  delayMinutes: number;
  bookingType: BookingVariant | 'Online';
};

export type WaitingRoomEntry = {
  id: string;
  patientName: string;
  token: string;
  waitingArea: string;
  seatsOccupied: number;
  seatsTotal: number;
  avgWaitMinutes: number;
};

export type OnlineRequest = {
  id: string;
  patientName: string;
  uhid: string;
  doctorName: string;
  department: string;
  requestedSlot: string;
  submittedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
};

export type CalendarSlot = {
  id: string;
  time: string;
  doctorName: string;
  department: string;
  room: string;
  patientName?: string;
  slotType: 'consultation' | 'break' | 'leave' | 'available';
  durationMin: number;
};

export type CancellationRecord = {
  id: string;
  patientName: string;
  doctorName: string;
  originalSlot: string;
  reason: string;
  refundStatus: 'Processed' | 'Pending' | 'Not Applicable';
  suggestedReschedule?: string;
};

export type CommReminderLog = {
  id: string;
  channel: 'SMS' | 'WhatsApp' | 'Email';
  patientName: string;
  subject: string;
  sentAt: string;
  deliveryStatus: 'Delivered' | 'Failed' | 'Queued';
};

export type ReferralRecord = {
  id: string;
  patientName: string;
  fromDept: string;
  toDept: string;
  referredTo: string;
  status: 'Pending' | 'Accepted' | 'Completed';
  documentStatus: 'Uploaded' | 'Awaiting';
};

export const APPOINTMENT_CENSUS = {
  todayTotal: 186,
  upcoming: 42,
  waiting: 28,
  completed: 98,
  cancelled: 11,
  noShow: 7,
  walkIns: 34,
  avgWaitMinutes: 22,
};

export const MOCK_QUEUE: QueueEntry[] = [
  {
    id: 'Q-8841',
    token: 'OPD-C-014',
    uhid: 'NX-2026-000412',
    patientName: 'Rahul Sharma',
    doctorName: 'Dr. Anita Roy',
    department: 'Cardiology',
    room: 'Consultation Room C-04',
    scheduledTime: '09:30',
    checkInAt: '09:18',
    status: 'In Consultation',
    priority: 'VIP',
    tokenGenerated: true,
    delayMinutes: 0,
    bookingType: 'follow-up',
  },
  {
    id: 'Q-8842',
    token: 'OPD-P-022',
    uhid: 'NX-2026-000413',
    patientName: 'Priya Patel',
    doctorName: 'Dr. Meera Iyer',
    department: 'Pulmonology',
    room: 'Consultation Room P-02',
    scheduledTime: '10:00',
    checkInAt: '09:52',
    status: 'Waiting',
    priority: 'General',
    tokenGenerated: true,
    delayMinutes: 12,
    bookingType: 'Online',
  },
  {
    id: 'Q-8843',
    token: 'OPD-E-003',
    uhid: 'NX-2026-000415',
    patientName: 'Meera Krishnan',
    doctorName: 'Dr. B. Joseph',
    department: 'Emergency Medicine',
    room: 'ER Fast-Track Bay 3',
    scheduledTime: '10:15',
    checkInAt: '10:08',
    status: 'Waiting',
    priority: 'Emergency',
    tokenGenerated: true,
    delayMinutes: 0,
    bookingType: 'emergency',
  },
  {
    id: 'Q-8844',
    token: 'OPD-G-031',
    uhid: 'NX-2026-000421',
    patientName: 'Ananya Desai',
    doctorName: 'Dr. Rajesh Kumar',
    department: 'General Medicine',
    room: 'Consultation Room G-01',
    scheduledTime: '10:30',
    status: 'Scheduled',
    priority: 'General',
    tokenGenerated: false,
    delayMinutes: 0,
    bookingType: 'walk-in',
  },
  {
    id: 'Q-8839',
    token: 'OPD-C-011',
    uhid: 'NX-2026-000419',
    patientName: 'Somnath Reddy',
    doctorName: 'Dr. Anita Roy',
    department: 'Cardiology',
    room: 'Consultation Room C-04',
    scheduledTime: '08:45',
    checkInAt: '08:40',
    status: 'Completed',
    priority: 'General',
    tokenGenerated: true,
    delayMinutes: 0,
    bookingType: 'referral',
  },
];

export const MOCK_WAITING_ROOMS: WaitingRoomEntry[] = [
  { id: 'wr1', patientName: 'Block C — Cardiology', token: '—', waitingArea: 'OPD Block C Lounge', seatsOccupied: 14, seatsTotal: 24, avgWaitMinutes: 18 },
  { id: 'wr2', patientName: 'Block P — Pulmonology', token: '—', waitingArea: 'OPD Block P Waiting', seatsOccupied: 8, seatsTotal: 16, avgWaitMinutes: 24 },
  { id: 'wr3', patientName: 'ER Fast-Track', token: '—', waitingArea: 'Emergency Waiting Zone', seatsOccupied: 6, seatsTotal: 10, avgWaitMinutes: 8 },
];

export const MOCK_ONLINE_REQUESTS: OnlineRequest[] = [
  { id: 'OR-901', patientName: 'Vikram Patel', uhid: 'NX-2026-000388', doctorName: 'Dr. Anita Roy', department: 'Cardiology', requestedSlot: '2026-07-18 11:00', submittedAt: '2026-07-17 08:12', status: 'Pending' },
  { id: 'OR-902', patientName: 'Lakshmi Nair', uhid: 'NX-2026-000402', doctorName: 'Dr. Meera Iyer', department: 'Pulmonology', requestedSlot: '2026-07-18 14:30', submittedAt: '2026-07-17 07:45', status: 'Pending' },
  { id: 'OR-898', patientName: 'Arjun Das', uhid: 'NX-2026-000377', doctorName: 'Dr. Rajesh Kumar', department: 'General Medicine', requestedSlot: '2026-07-17 16:00', submittedAt: '2026-07-16 19:20', status: 'Approved' },
  { id: 'OR-895', patientName: 'Sanjay Rao', uhid: 'NX-2026-000365', doctorName: 'Dr. Kapoor', department: 'Orthopedics', requestedSlot: '2026-07-17 09:00', submittedAt: '2026-07-16 14:00', status: 'Rejected' },
];

export const MOCK_DOCTORS = [
  { id: 'd1', name: 'Dr. Anita Roy', department: 'Cardiology', room: 'C-04', hours: '09:00–13:00', slotsAvailable: 6 },
  { id: 'd2', name: 'Dr. Meera Iyer', department: 'Pulmonology', room: 'P-02', hours: '10:00–16:00', slotsAvailable: 4 },
  { id: 'd3', name: 'Dr. Rajesh Kumar', department: 'General Medicine', room: 'G-01', hours: '08:00–14:00', slotsAvailable: 8 },
  { id: 'd4', name: 'Dr. B. Joseph', department: 'Emergency Medicine', room: 'ER-3', hours: '24x7', slotsAvailable: 12 },
];

export const MOCK_CALENDAR_SLOTS: CalendarSlot[] = [
  { id: 's1', time: '09:00', doctorName: 'Dr. Anita Roy', department: 'Cardiology', room: 'C-04', patientName: 'Somnath Reddy', slotType: 'consultation', durationMin: 20 },
  { id: 's2', time: '09:30', doctorName: 'Dr. Anita Roy', department: 'Cardiology', room: 'C-04', patientName: 'Rahul Sharma', slotType: 'consultation', durationMin: 20 },
  { id: 's3', time: '10:00', doctorName: 'Dr. Anita Roy', department: 'Cardiology', room: 'C-04', slotType: 'break', durationMin: 15 },
  { id: 's4', time: '10:15', doctorName: 'Dr. Meera Iyer', department: 'Pulmonology', room: 'P-02', patientName: 'Priya Patel', slotType: 'consultation', durationMin: 15 },
  { id: 's5', time: '10:30', doctorName: 'Dr. Rajesh Kumar', department: 'General Medicine', room: 'G-01', slotType: 'available', durationMin: 15 },
  { id: 's6', time: '11:00', doctorName: 'Dr. Rajesh Kumar', department: 'General Medicine', room: 'G-01', patientName: 'Ananya Desai', slotType: 'consultation', durationMin: 15 },
  { id: 's7', time: '13:00', doctorName: 'Dr. Anita Roy', department: 'Cardiology', room: 'C-04', slotType: 'leave', durationMin: 60 },
];

export const MOCK_CANCELLATIONS: CancellationRecord[] = [
  { id: 'CAN-441', patientName: 'Karan Malhotra', doctorName: 'Dr. Anita Roy', originalSlot: '2026-07-17 11:00', reason: 'Patient travel conflict', refundStatus: 'Processed', suggestedReschedule: '2026-07-19 10:30' },
  { id: 'CAN-438', patientName: 'Deepa Singh', doctorName: 'Dr. Meera Iyer', originalSlot: '2026-07-16 15:00', reason: 'Doctor emergency leave', refundStatus: 'Pending', suggestedReschedule: '2026-07-18 14:00' },
  { id: 'CAN-435', patientName: 'Ravi Menon', doctorName: 'Dr. Rajesh Kumar', originalSlot: '2026-07-15 09:30', reason: 'No-show — auto-cancelled', refundStatus: 'Not Applicable' },
];

export const MOCK_REMINDER_LOGS: CommReminderLog[] = [
  { id: 'r1', channel: 'SMS', patientName: 'Rahul Sharma', subject: 'Appointment reminder — Cardiology 09:30 today', sentAt: '2026-07-17T07:00:00', deliveryStatus: 'Delivered' },
  { id: 'r2', channel: 'WhatsApp', patientName: 'Priya Patel', subject: 'Queue update — estimated wait 15 min', sentAt: '2026-07-17T09:55:00', deliveryStatus: 'Delivered' },
  { id: 'r3', channel: 'Email', patientName: 'Vikram Patel', subject: 'Online booking request received — pending approval', sentAt: '2026-07-17T08:15:00', deliveryStatus: 'Delivered' },
  { id: 'r4', channel: 'SMS', patientName: 'Karan Malhotra', subject: 'Cancellation confirmation — refund initiated', sentAt: '2026-07-17T06:30:00', deliveryStatus: 'Queued' },
];

export const MOCK_REFERRALS: ReferralRecord[] = [
  { id: 'REF-221', patientName: 'Rahul Sharma', fromDept: 'General Medicine', toDept: 'Cardiology', referredTo: 'Dr. Anita Roy', status: 'Accepted', documentStatus: 'Uploaded' },
  { id: 'REF-218', patientName: 'Somnath Reddy', fromDept: 'Orthopedics', toDept: 'Physiotherapy', referredTo: 'Dr. Nair', status: 'Pending', documentStatus: 'Awaiting' },
  { id: 'REF-215', patientName: 'Meera Krishnan', fromDept: 'Emergency', toDept: 'Cardiology', referredTo: 'Dr. Anita Roy', status: 'Completed', documentStatus: 'Uploaded' },
];

export const DOCTOR_UTILIZATION = [
  { doctor: 'Dr. Anita Roy', utilization: 92, appointments: 24 },
  { doctor: 'Dr. Meera Iyer', utilization: 78, appointments: 18 },
  { doctor: 'Dr. Rajesh Kumar', utilization: 85, appointments: 22 },
  { doctor: 'Dr. B. Joseph', utilization: 68, appointments: 14 },
];

export const PEAK_HOUR_DATA = [
  { hour: '08', volume: 12 },
  { hour: '09', volume: 28 },
  { hour: '10', volume: 34 },
  { hour: '11', volume: 26 },
  { hour: '12', volume: 18 },
  { hour: '14', volume: 22 },
  { hour: '15', volume: 20 },
  { hour: '16', volume: 14 },
];

export const CONSULTATION_TIMELINE = [
  { label: 'Mon', avgMinutes: 18 },
  { label: 'Tue', avgMinutes: 21 },
  { label: 'Wed', avgMinutes: 19 },
  { label: 'Thu', avgMinutes: 22 },
  { label: 'Fri', avgMinutes: 24 },
  { label: 'Sat', avgMinutes: 16 },
  { label: 'Sun', avgMinutes: 14 },
];

export function formatTimeShort(isoOrTime: string): string {
  if (isoOrTime.includes('T')) {
    return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(isoOrTime));
  }
  return isoOrTime;
}
