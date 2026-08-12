/** Canonical lowercase lifecycle statuses (Doctor ↔ Patient sync). */
export type ClinicalAppointmentStatus =
  | 'requested'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

const STATUS_ALIASES: Record<string, ClinicalAppointmentStatus> = {
  requested: 'requested',
  waiting: 'requested',
  scheduled: 'requested',
  confirmed: 'confirmed',
  in_progress: 'in_progress',
  inprogress: 'in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  no_show: 'cancelled',
};

export function normalizeAppointmentStatus(raw?: string | null): ClinicalAppointmentStatus {
  const key = String(raw ?? 'requested')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
  return STATUS_ALIASES[key] ?? 'requested';
}

export function appointmentStatusLabel(status: ClinicalAppointmentStatus): string {
  switch (status) {
    case 'confirmed':
      return '🟢 confirmed';
    case 'requested':
      return '🟡 requested';
    case 'in_progress':
      return '🔵 in_progress';
    case 'completed':
      return '✅ completed';
    case 'cancelled':
      return '⛔ cancelled';
    default:
      return status;
  }
}

export function appointmentStatusBadgeClass(status: ClinicalAppointmentStatus): string {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-800';
    case 'requested':
      return 'bg-amber-100 text-amber-800';
    case 'in_progress':
      return 'bg-sky-100 text-sky-800';
    case 'completed':
      return 'bg-teal-100 text-teal-800';
    case 'cancelled':
      return 'bg-rose-100 text-rose-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export function formatDoctorDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'your doctor';
  if (/^dr\.?\s/i.test(trimmed)) return trimmed;
  return `Dr. ${trimmed.replace(/^dr\.?\s*/i, '')}`;
}

export function patientStatusBanner(
  status: ClinicalAppointmentStatus,
  doctorName: string,
): string | null {
  const doctor = formatDoctorDisplayName(doctorName);
  switch (status) {
    case 'confirmed':
      return `✅ Appointment confirmed by ${doctor}`;
    case 'in_progress':
      return `🟢 ${doctor} has started your consultation`;
    case 'completed':
      return '✅ Consultation completed. Prescription ready in inbox';
    default:
      return null;
  }
}
