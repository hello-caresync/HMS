/** Supabase UUID used in patient_appointments, emergency_dispatches, etc. */
export const PATIENT_APPOINTMENTS_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Resolve DB patient id — prefers session id when it looks like a UUID */
export function resolvePatientDbId(sessionPatientId?: string | null): string {
  if (sessionPatientId && /^[0-9a-f-]{36}$/i.test(sessionPatientId)) {
    return sessionPatientId;
  }
  return PATIENT_APPOINTMENTS_UUID;
}
