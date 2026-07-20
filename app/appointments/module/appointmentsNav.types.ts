export type AppointmentsWorkspaceTab = 'operations' | 'scheduling' | 'lifecycle';

export type AppointmentModalType =
  | 'book'
  | 'check-in'
  | 'generate-token'
  | 'print-slip'
  | 'doctor-schedule'
  | null;

export type BookingVariant = 'walk-in' | 'follow-up' | 'referral' | 'emergency' | 'teleconsult';

export type CalendarView = 'daily' | 'weekly' | 'monthly';

export const APPOINTMENTS_WORKSPACE_TABS: {
  id: AppointmentsWorkspaceTab;
  label: string;
  description: string;
}[] = [
  { id: 'operations', label: 'Dashboard & Live Queue', description: 'Census · queue · waiting room · quick actions' },
  { id: 'scheduling', label: 'Scheduling & Calendar', description: 'Booking engine · online requests · master calendar' },
  { id: 'lifecycle', label: 'Lifecycle & Outcomes', description: 'Reschedule · communications · analytics' },
];

export type QueuePriority = 'General' | 'VIP' | 'Emergency';

export type AppointmentStatus =
  | 'Scheduled'
  | 'Waiting'
  | 'In Consultation'
  | 'Completed'
  | 'Cancelled'
  | 'No-Show';
