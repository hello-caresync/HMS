import type { SupabaseClient } from '@supabase/supabase-js';

import { doctorMatchesDepartment } from '@/lib/hospital/departments';
import {
  buildHospitalDirectoryOrFilter,
  hospitalDirectoryFilterIds,
} from '@/lib/hospital/hospital-node';
import { isHospitalUuid, resolveHospitalUuid } from '@/lib/hospital/resolve-hospital-context';
import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';

export const DOCTOR_BOOKING_SELECT =
  'doctor_id, doctor_code, employee_id, registration_number, id, full_name, name, doctor_name, department, specialization, specialty, qualification, room_number, consultation_fee, fee, is_active, is_available, status, hospital_id, hospital_code, experience';

export type BookableDoctorRecord = {
  doctor_id: string;
  /** Backward-compatible alias for dropdowns that still read `id`. */
  id: string;
  full_name: string;
  name: string;
  doctor_name: string;
  department: string;
  specialization: string;
  specialty: string;
  qualification: string;
  room_number?: string;
  consultation_fee: number;
  experience?: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function normalizeText(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeDoctorNameKey(value: unknown): string {
  return normalizeKey(String(value ?? '')).replace(/^dr\.?\s*/, '');
}

/** Legacy seed clinician — must never appear in patient-facing directories. */
export function isBlockedPhantomDoctor(row: Record<string, unknown>): boolean {
  const nameKey = normalizeDoctorNameKey(
    row.full_name ?? row.doctor_name ?? row.name ?? '',
  );
  if (nameKey === 'ramesh kumar' || nameKey.includes('ramesh kumar')) return true;

  const email = normalizeKey(String(row.email ?? ''));
  if (email === 'ramesh.kumar@regalhospital.com') return true;

  const codes = [row.doctor_code, row.registration_number, row.staff_id_code, row.doctor_id]
    .map((value) => normalizeKey(String(value ?? '')))
    .filter(Boolean);
  if (codes.some((code) => code === 'rh-d-gm01')) return true;

  return false;
}

export function filterBlockedPhantomDoctors<T extends BookableDoctorRecord>(doctors: T[]): T[] {
  return doctors.filter(
    (doctor) =>
      !isBlockedPhantomDoctor({
        full_name: doctor.full_name,
        doctor_name: doctor.doctor_name,
        name: doctor.name,
        doctor_code: doctor.doctor_id,
        registration_number: doctor.doctor_id,
      }),
  );
}

export function isDoctorRowActive(row: Record<string, unknown>): boolean {
  if (row.is_active === false) return false;
  const status = normalizeKey(String(row.status ?? ''));
  if (status === 'inactive') return false;
  return true;
}

export function resolveDoctorPrimaryId(row: Record<string, unknown>): string {
  const candidates = [
    row.doctor_id,
    row.doctor_code,
    row.employee_id,
    row.registration_number,
    row.staff_id_code,
    row.doctor_employee_id,
    row.id,
  ]
    .map((value) => normalizeText(value))
    .filter(Boolean);

  const staffCode = candidates.find((value) => /^RH-D\d+$/i.test(value));
  if (staffCode) return staffCode;

  const nonUuid = candidates.find(
    (value) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
  );
  return nonUuid || candidates[0] || '';
}

export function resolveDoctorDisplayName(row: Record<string, unknown>): string {
  return (
    normalizeText(row.full_name) ||
    normalizeText(row.doctor_name) ||
    normalizeText(row.name) ||
    'Consultant Physician'
  );
}

const DOCTOR_FEE_COLUMN_KEYS = [
  'consultation_fee',
  'fee',
  'consultationFee',
  'price',
  'charge',
  'amount',
] as const;

/** Read the first positive fee from known doctor row columns. */
export function resolveDoctorConsultationFee(
  row: Record<string, unknown>,
  fallback = 500,
): number {
  for (const key of DOCTOR_FEE_COLUMN_KEYS) {
    const raw = row[key];
    if (raw == null || raw === '') continue;
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return fallback;
}

/** Build a stable fallback email when provisioning doctors without portal login email. */
export function generateDoctorFallbackEmail(
  fullName: string,
  doctorCode?: string | null,
): string {
  const slug = fullName
    .replace(/^dr\.?\s+/i, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '');

  const codeSlug = normalizeText(doctorCode)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.');

  const local = slug || codeSlug || `doctor.${Date.now().toString().slice(-6)}`;
  return `${local}@regalhospital.com`;
}

export function resolveDoctorRegistrationEmail(input: {
  email?: string | null;
  full_name: string;
  staff_id_code?: string | null;
  doctor_code?: string | null;
}): string {
  const provided = normalizeText(input.email).toLowerCase();
  if (provided) return provided;
  return generateDoctorFallbackEmail(
    input.full_name,
    input.staff_id_code ?? input.doctor_code,
  );
}

export function mapBookableDoctorRecord(row: Record<string, unknown>): BookableDoctorRecord | null {
  if (!isDoctorRowActive(row)) return null;
  if (isBlockedPhantomDoctor(row)) return null;

  const name = resolveDoctorDisplayName(row);
  if (!name || /jhfk|khyu/i.test(name)) return null;

  const role = normalizeKey(String(row.role ?? row.staff_type ?? 'doctor'));
  if (row.role != null && role && role !== 'doctor') return null;

  const department =
    normalizeText(row.department) ||
    normalizeText(row.specialization) ||
    normalizeText(row.specialty) ||
    'General Medicine';
  const specialization =
    normalizeText(row.specialization) || normalizeText(row.specialty) || department;
  const specialty = normalizeText(row.specialty) || specialization;
  let doctorId = resolveDoctorPrimaryId(row);
  if (!doctorId) {
    doctorId = normalizeText(row.email);
  }
  if (!doctorId) return null;

  const registryUuid = [row.id, row.doctor_uuid, row.doctor_id]
    .map((value) => normalizeText(value))
    .find((value) => isHospitalUuid(value));

  return {
    doctor_id: doctorId,
    id: registryUuid || doctorId,
    full_name: name,
    name,
    doctor_name: normalizeText(row.doctor_name) || name,
    department,
    specialization,
    specialty,
    qualification: normalizeText(row.qualification) || 'MBBS, MD',
    room_number: normalizeText(row.room_number) || undefined,
    consultation_fee: resolveDoctorConsultationFee(row),
    experience: normalizeText(row.experience) || undefined,
  };
}

export function doctorRecordMatchesDepartment(
  doctor: Pick<BookableDoctorRecord, 'department' | 'specialization' | 'specialty'>,
  selectedDepartment: string,
): boolean {
  const selected = selectedDepartment.trim();
  if (!selected) return false;

  const fields = [doctor.department, doctor.specialization, doctor.specialty]
    .map((value) => String(value ?? '').trim())
    .filter((value) => value.length > 0);

  return fields.some((field) => doctorMatchesDepartment(field, selected));
}

export function filterDoctorsByDepartment<T extends Pick<BookableDoctorRecord, 'department' | 'specialization' | 'specialty'>>(
  doctors: T[],
  department: string,
): T[] {
  const selected = department.trim();
  if (!selected) return doctors;
  return doctors.filter((doctor) => doctorRecordMatchesDepartment(doctor, selected));
}

function doctorRowMatchesHospital(row: Record<string, unknown>, filterIds: string[]): boolean {
  const hospitalId = normalizeText(row.hospital_id) || normalizeText(row.hospital_code);
  if (!hospitalId) return true;
  const normalized = normalizeKey(hospitalId);
  return filterIds.some((id) => normalizeKey(id) === normalized);
}

async function buildDoctorHospitalFilterIds(
  supabase: SupabaseClient,
  hospitalId: string,
): Promise<string[]> {
  const trimmedHospitalId = normalizeText(hospitalId);
  const values = new Set<string>(
    hospitalDirectoryFilterIds(trimmedHospitalId || HOSPITAL_TENANT_ID),
  );

  if (isHospitalUuid(trimmedHospitalId)) {
    values.add(trimmedHospitalId);
  } else if (trimmedHospitalId) {
    values.add(trimmedHospitalId);
    const uuid = await resolveHospitalUuid(supabase, trimmedHospitalId);
    if (uuid) values.add(uuid);
  } else {
    const uuid = await resolveHospitalUuid(supabase, HOSPITAL_TENANT_ID);
    if (uuid) values.add(uuid);
  }

  return Array.from(values);
}

/** Fetch active bookable doctors from `public.doctors` with lenient hospital + status matching. */
export async function fetchBookableDoctors(
  supabase: SupabaseClient,
  hospitalId = HOSPITAL_TENANT_ID,
): Promise<BookableDoctorRecord[]> {
  const filterIds = await buildDoctorHospitalFilterIds(supabase, hospitalId);
  const orFilter = buildHospitalDirectoryOrFilter(filterIds);

  let result = await supabase
    .from('doctors')
    .select(DOCTOR_BOOKING_SELECT)
    .or(orFilter)
    .order('full_name', { ascending: true });

  if (result.error) {
    console.warn('Hospital doctor scoped query failed, retrying with select *:', result.error);
    result = await supabase.from('doctors').select('*').or(orFilter).order('full_name', { ascending: true });
  }

  if (result.error) {
    console.error('Hospital doctor fetch failed — returning empty list (no mock fallback):', result.error);
    return [];
  }

  const rawRows = Array.isArray(result.data) ? result.data.map(asRecord) : [];
  const activeRows = rawRows.filter(isDoctorRowActive);
  const sourceRows = activeRows.filter((row) => doctorRowMatchesHospital(row, filterIds));

  const seen = new Set<string>();
  const doctors: BookableDoctorRecord[] = [];

  for (const row of sourceRows) {
    const mapped = mapBookableDoctorRecord(row);
    if (!mapped) continue;
    const key = mapped.doctor_id || mapped.full_name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    doctors.push(mapped);
  }

  return filterBlockedPhantomDoctors(
    doctors.sort((a, b) => a.full_name.localeCompare(b.full_name)),
  );
}

export function formatDoctorOptionLabel(doctor: BookableDoctorRecord): string {
  return formatDoctorBookingOptionLabel(doctor);
}

/** Patient booking dropdown label: `Dr. Name - (₹1200)` */
export function formatDoctorBookingOptionLabel(doctor: BookableDoctorRecord): string {
  const name = doctor.full_name || doctor.doctor_name || doctor.name || 'Consultant Physician';
  const fee = resolveDoctorConsultationFee({ consultation_fee: doctor.consultation_fee });
  return `${name} - (₹${fee.toLocaleString('en-IN')})`;
}
