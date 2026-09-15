import { isHospitalUuid } from '@/lib/hospital/resolve-hospital-context';

export type ResolvedDoctorBookingIdentity = {
  doctorUuid: string | null;
  doctorCode: string;
  doctorName: string;
  department: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function normalizeCode(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

/** Resolves UUID + staff code for appointment inserts so doctor queue filters match. */
export function resolveDoctorBookingIdentity(
  input: Record<string, unknown>,
): ResolvedDoctorBookingIdentity {
  const row = asRecord(input);
  const doctorName = String(
    row.full_name ?? row.doctor_name ?? row.name ?? row.doctorName ?? 'Consultant Physician',
  ).trim();
  const department = String(row.department ?? row.specialization ?? 'General Medicine').trim();

  const uuidCandidates = [row.doctor_uuid, row.id, row.doctor_id]
    .map((value) => String(value ?? '').trim())
    .filter((value) => isHospitalUuid(value));

  const codeCandidates = [
    row.doctor_code,
    row.employee_id,
    row.doctor_employee_id,
    row.registration_number,
    row.staff_id_code,
    row.doctor_id,
    row.id,
  ]
    .map(normalizeCode)
    .filter(Boolean)
    .filter((value) => !isHospitalUuid(value));

  return {
    doctorUuid: uuidCandidates[0] ?? null,
    doctorCode: codeCandidates[0] ?? '',
    doctorName,
    department,
  };
}
