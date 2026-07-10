export type AppointmentStatus = 'Confirmed' | 'In-Consultation' | 'Walk-in' | 'Cancelled' | 'No-Show';

export type AppointmentType = 'Online' | 'Walk-In' | 'Follow-up';

export type BookingChannel = 'Online' | 'Walk-in';

export type QueueStatus = 'Waiting' | 'In-Consultation' | 'Delayed' | 'Completed' | 'Skipped';

export type SlotState = 'available' | 'booked' | 'blocked';

export type NotificationChannel = 'SMS' | 'WhatsApp' | 'Email';

export type DeliveryStatus = 'Delivered' | 'Pending' | 'Failed';

export interface Department {
  id: string;
  name: string;
  tokenPrefix: string;
  roomLabel: string;
  maxQueueCapacity: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  departmentId: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  patientId: string;
  patientName: string;
  uhid: string;
  phone: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  appointmentType: AppointmentType;
  bookingChannel: BookingChannel;
  tokenNumber?: string;
  checkedIn: boolean;
  onWaitingList?: boolean;
  assignedRoom?: string;
  notes?: string;
}

export interface QueueEntry {
  id: string;
  appointmentId: string;
  tokenNumber: string;
  patientName: string;
  uhid: string;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  assignedRoom: string;
  status: QueueStatus;
  position: number;
  waitDurationMinutes: number;
  checkedInAt: string;
}

export interface BlockedSlot {
  doctorId: string;
  date: string;
  startTime: string;
  reason: string;
}

export interface CommunicationLog {
  id: string;
  channel: NotificationChannel;
  patientName: string;
  message: string;
  slotTime?: string;
  deliveryStatus: DeliveryStatus;
  timestamp: string;
}

export interface MockNotification {
  id: string;
  channel: NotificationChannel;
  message: string;
  timestamp: string;
}

export interface AppointmentAnalytics {
  totalBookings: number;
  averageWaitMinutes: number;
  noShowRatePercent: number;
}

export const STATUS_STYLES: Record<
  AppointmentStatus,
  { bg: string; border: string; text: string; dot: string }
> = {
  Confirmed: {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-800',
    dot: 'bg-sky-500',
  },
  'In-Consultation': {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-800',
    dot: 'bg-violet-500',
  },
  'Walk-in': {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
  },
  Cancelled: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-800 line-through',
    dot: 'bg-slate-400',
  },
  'No-Show': {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
  },
};

export const APPOINTMENT_TYPE_STYLES: Record<
  AppointmentType,
  { bg: string; text: string }
> = {
  Online: { bg: 'bg-sky-100', text: 'text-sky-700' },
  'Walk-In': { bg: 'bg-amber-100', text: 'text-amber-800' },
  'Follow-up': { bg: 'bg-violet-100', text: 'text-violet-700' },
};

export const QUEUE_STATUS_STYLES: Record<
  QueueStatus,
  { bg: string; text: string; ring: string }
> = {
  Waiting: { bg: 'bg-amber-50', text: 'text-amber-800', ring: 'ring-amber-200' },
  'In-Consultation': { bg: 'bg-violet-50', text: 'text-violet-800', ring: 'ring-violet-200' },
  Delayed: { bg: 'bg-rose-50', text: 'text-rose-800', ring: 'ring-rose-200' },
  Completed: { bg: 'bg-emerald-50', text: 'text-emerald-800', ring: 'ring-emerald-200' },
  Skipped: { bg: 'bg-slate-50', text: 'text-slate-800', ring: 'ring-slate-200' },
};

export const SLOT_STATE_STYLES: Record<SlotState, { bg: string; border: string; label: string }> = {
  available: { bg: 'bg-white hover:bg-emerald-50/60', border: 'border-slate-200', label: 'Available' },
  booked: { bg: 'bg-sky-50/80', border: 'border-sky-300', label: 'Booked' },
  blocked: { bg: 'bg-slate-100/90', border: 'border-slate-300', label: 'Blocked' },
};

export const AVG_CONSULT_MINUTES = 12;
export const SLOT_INTERVAL_MINUTES = 15;
export const DELAYED_THRESHOLD_MINUTES = 20;

export function generateAppointmentId(): string {
  return `apt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

export function formatDeptToken(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(3, '0')}`;
}

export function estimateWaitMinutes(position: number): number {
  return Math.max(0, (position - 1) * AVG_CONSULT_MINUTES);
}

export function computeLiveWaitMinutes(checkedInAt: string, position: number): number {
  const base = estimateWaitMinutes(position);
  const elapsed = Math.floor((Date.now() - new Date(checkedInAt).getTime()) / 60_000);
  return Math.max(base, elapsed);
}

export function deriveQueueStatus(
  entry: Pick<QueueEntry, 'status' | 'waitDurationMinutes' | 'position'>,
): QueueStatus {
  if (entry.status === 'In-Consultation' || entry.status === 'Completed' || entry.status === 'Skipped') {
    return entry.status;
  }
  if (entry.waitDurationMinutes >= DELAYED_THRESHOLD_MINUTES && entry.position > 1) {
    return 'Delayed';
  }
  return entry.status === 'Delayed' ? 'Delayed' : 'Waiting';
}
