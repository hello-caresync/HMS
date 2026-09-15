import { resolveAppointmentRowDate, todayIsoDate, tomorrowIsoDate } from '@/lib/scheduling/queue-date-filter';

let audioContext: AudioContext | null = null;
let chimeAudio: HTMLAudioElement | null = null;

export function unlockOpdAudio(): void {
  if (typeof window === 'undefined') return;

  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    if (audioContext.state === 'suspended') {
      void audioContext.resume();
    }
  } catch {
    /* ignore */
  }

  if (!chimeAudio) {
    chimeAudio = new Audio('/sounds/chime.mp3');
    chimeAudio.preload = 'auto';
  }
}

function playSyntheticChime(frequency: number, durationMs = 420): void {
  if (typeof window === 'undefined') return;

  try {
    unlockOpdAudio();
    const ctx = audioContext ?? new AudioContext();
    audioContext = ctx;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    /* ignore autoplay restrictions */
  }
}

async function playMp3Chime(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    unlockOpdAudio();
    if (!chimeAudio) {
      chimeAudio = new Audio('/sounds/chime.mp3');
      chimeAudio.preload = 'auto';
    }
    chimeAudio.currentTime = 0;
    chimeAudio.volume = 0.45;
    await chimeAudio.play();
    return true;
  } catch {
    return false;
  }
}

/** Audible alert for doctor workstation when a patient enters their queue. */
export async function playDoctorOpdChime(): Promise<void> {
  const played = await playMp3Chime();
  if (!played) playSyntheticChime(880);
}

/** Softer desk chime for hospital reception counters. */
export async function playReceptionDeskChime(): Promise<void> {
  const played = await playMp3Chime();
  if (!played) playSyntheticChime(660, 320);
}

export function formatDoctorArrivalToast(record: Record<string, unknown>): string {
  const patientName = String(record.patient_name ?? record.name ?? 'Patient');
  const token = String(record.token_number ?? record.token_label ?? 'OPD');
  return `New Patient Arrived: ${patientName} (${token})`;
}

export function formatReceptionBookingBanner(record: Record<string, unknown>): string {
  const patientName = String(record.patient_name ?? record.name ?? 'Patient');
  const doctorName = String(record.doctor_name ?? 'Doctor');
  const department = String(record.department ?? 'OPD');
  const slot = String(
    record.appointment_time ?? record.slot_time ?? record.time_slot ?? '—',
  );
  return `New Booking: ${patientName} → ${doctorName} (${department}) - Slot: ${slot}`;
}

/** Human label for advance-booking toasts (Tomorrow vs explicit date). */
export function resolveAdvanceBookingDateLabel(record: Record<string, unknown>): string {
  const apptDate = resolveAppointmentRowDate(record);
  if (!apptDate) return 'Upcoming';
  if (apptDate === tomorrowIsoDate()) return 'Tomorrow';
  const parsed = new Date(`${apptDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return apptDate;
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function isAdvanceBookingRecord(record: Record<string, unknown>): boolean {
  const apptDate = resolveAppointmentRowDate(record);
  if (!apptDate) return false;
  return apptDate > todayIsoDate();
}

export function formatAdvanceBookingToast(record: Record<string, unknown>): string {
  const patientName = String(record.patient_name ?? record.name ?? 'Patient');
  const doctorName = String(record.doctor_name ?? 'Doctor');
  const slot = String(
    record.appointment_time ?? record.slot_time ?? record.time_slot ?? '—',
  );
  const dateLabel = resolveAdvanceBookingDateLabel(record);
  return `Advance Booking Received: ${patientName} for ${doctorName} (${dateLabel} at ${slot})`;
}

/** Reception desk toast for any new booking (today or advance). */
export function formatReceptionLiveBookingToast(record: Record<string, unknown>): string {
  const patientName = String(record.patient_name ?? record.name ?? 'Patient');
  const doctorName = String(record.doctor_name ?? 'Doctor');
  const apptDate = resolveAppointmentRowDate(record);
  const slot = String(record.appointment_time ?? record.slot_time ?? record.time_slot ?? '—');
  return `New Booking Received: ${patientName} with ${doctorName} for ${apptDate || 'Upcoming'} at ${slot}`;
}

export function isBillingPendingEncounterStatus(status: unknown): boolean {
  const value = String(status ?? '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');
  return value === 'billing-pending' || value === 'billing';
}

export function formatBillingReadyToast(record: Record<string, unknown>): string {
  const patientName = String(record.patient_name ?? record.name ?? 'Patient');
  const token = String(record.token_number ?? record.token_label ?? record.token ?? 'T-01');
  const tokenLabel = token.startsWith('#') || token.startsWith('T-') ? token : `#${token}`;
  return `Consultation complete for ${patientName} (${tokenLabel}) — Ready for bill settlement & receipt generation!`;
}

/** Urgent checkout chime when a visit moves to billing_pending. */
export async function playBillingCheckoutChime(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    unlockOpdAudio();
    const billingAudio = new Audio('/sounds/billing-alert.mp3');
    billingAudio.preload = 'auto';
    billingAudio.volume = 0.55;
    billingAudio.currentTime = 0;
    await billingAudio.play();
    return;
  } catch {
    /* fall through to synthetic tone */
  }
  playSyntheticChime(988, 520);
  window.setTimeout(() => playSyntheticChime(1174, 380), 180);
}
