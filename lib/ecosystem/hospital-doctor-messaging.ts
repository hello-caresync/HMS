/**
 * Hospital Operations Hub ⇄ Doctor Command Center messaging protocol.
 * Both apps read/write channel_messages with these constants and matchers.
 */

export const HOSPITAL_DOCTOR_CHANNEL_TYPES = ['doctor'] as const;
/** Legacy rows written before strict routing — read-only compatibility */
export const LEGACY_HOSPITAL_DOCTOR_CHANNEL_TYPES = ['hospital_desk'] as const;

export const HOSPITAL_ADMIN_ID = 'RH-ADMIN';
export const HOSPITAL_ADMIN_SENDER_NAME = 'Regal Hospital Operations Desk';

export type HospitalDoctorChannelType = (typeof HOSPITAL_DOCTOR_CHANNEL_TYPES)[number];

export function isHospitalDoctorChannelType(raw: string): boolean {
  const value = raw.toLowerCase();
  return (
    HOSPITAL_DOCTOR_CHANNEL_TYPES.includes(value as HospitalDoctorChannelType) ||
    LEGACY_HOSPITAL_DOCTOR_CHANNEL_TYPES.includes(value as 'hospital_desk')
  );
}

export function isHospitalAdminRole(role: string): boolean {
  const value = role.trim().toLowerCase();
  return value === 'hospital' || value === 'hospital_admin';
}

export function isDoctorRole(role: string): boolean {
  return role.trim().toLowerCase() === 'doctor';
}

/** True when message belongs to a specific doctor's hospital desk thread (RH-Dxx). */
export function matchesHospitalDoctorThread(
  row: {
    channel_type?: string | null;
    sender_role?: string | null;
    sender_id?: string | null;
    recipient_id?: string | null;
  },
  doctorEmployeeId: string,
): boolean {
  const channel = String(row.channel_type ?? '').toLowerCase();
  if (!isHospitalDoctorChannelType(channel)) return false;

  const doctorId = doctorEmployeeId.toLowerCase();
  const adminId = HOSPITAL_ADMIN_ID.toLowerCase();
  const recipient = String(row.recipient_id ?? '').toLowerCase();
  const sender = String(row.sender_id ?? '').toLowerCase();

  if (recipient === doctorId) return true;
  if (sender === doctorId && recipient === adminId) return true;
  if (isHospitalAdminRole(String(row.sender_role ?? '')) && recipient === doctorId) return true;
  if (isDoctorRole(String(row.sender_role ?? '')) && recipient === adminId && sender === doctorId) {
    return true;
  }

  return false;
}

/** Payload when Hospital Operations Desk sends to a doctor. */
export function buildHospitalToDoctorPayload(input: {
  doctorId: string;
  message: string;
  hospitalId?: string;
}): Record<string, unknown> {
  const trimmed = input.message.trim();
  return {
    hospital_id: input.hospitalId ?? '11111111-1111-1111-1111-111111111111',
    facility_code: 'RH-BLR-01',
    hospital_code: 'RH-BLR-01',
    channel_type: 'doctor',
    sender_role: 'hospital',
    sender_id: HOSPITAL_ADMIN_ID,
    sender_name: HOSPITAL_ADMIN_SENDER_NAME,
    recipient_type: 'doctor',
    recipient_id: input.doctorId,
    message: trimmed,
    message_text: trimmed,
    priority: 'normal',
    is_read: false,
    created_at: new Date().toISOString(),
  };
}

/** Payload when a doctor replies to Hospital Operations Desk. */
export function buildDoctorToHospitalPayload(input: {
  doctorId: string;
  doctorName: string;
  message: string;
  hospitalId?: string;
}): Record<string, unknown> {
  const trimmed = input.message.trim();
  return {
    hospital_id: input.hospitalId ?? '11111111-1111-1111-1111-111111111111',
    facility_code: 'RH-BLR-01',
    hospital_code: 'RH-BLR-01',
    channel_type: 'doctor',
    sender_role: 'doctor',
    sender_id: input.doctorId,
    sender_name: input.doctorName,
    recipient_type: 'hospital',
    recipient_id: HOSPITAL_ADMIN_ID,
    message: trimmed,
    message_text: trimmed,
    priority: 'normal',
    is_read: false,
    created_at: new Date().toISOString(),
  };
}
