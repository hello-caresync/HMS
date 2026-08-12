export const DOCTOR_STORAGE_KEYS = {
  appointments: 'curasync_appointments',
  patientProfile: 'curasync_patient_profile',
  familyMembers: 'curasync_family_members',
  messages: 'curasync_messages',
  legacyMessages: 'curasync_patient_messages',
  doctorSession: 'active_doctor_session',
  activeDoctor: 'curasync_active_doctor',
  rememberedDoctor: 'curasync_remembered_doctor',
  legacyDoctorSession: 'curasync_doctor_session',
  schedule: 'curasync_doctor_schedule',
  patientRecords: 'curasync_patient_records',
  opdQueue: 'curasync_opd_queue',
  clinicalNotes: 'curasync_clinical_notes',
} as const;

export function readJsonStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJsonStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}
