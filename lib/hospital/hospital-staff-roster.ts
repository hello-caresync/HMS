import type { SupabaseClient } from '@supabase/supabase-js';

import {
  directoryDoctorId,
  HOSPITAL_DOCTORS,
  normalizeClinicianName,
} from '@/lib/constants/hospitalData';
import {
  fetchBookableDoctors,
  resolveDoctorConsultationFee,
  type BookableDoctorRecord,
} from '@/lib/hospital/doctors';
import { fetchBookableDoctorsFromTable } from '@/lib/hospital/doctors-directory';
import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';
import { readActiveHospitalUuid } from '@/lib/hospital/resolve-hospital-context';
import { isHospitalUuid, resolveHospitalUuid } from '@/lib/hospital/resolve-hospital-context';
import { isDemoMode } from '@/lib/shared/demo-mode';

export type DoctorStaffRecord = BookableDoctorRecord;

export type HospitalStaffRoleCount = {
  accounts: number;
  doctors: number;
  staff: number;
  admins: number;
};

export const FALLBACK_HOSPITAL_DOCTORS: DoctorStaffRecord[] = HOSPITAL_DOCTORS.map((doctor) => {
  const doctorId = directoryDoctorId(doctor.name);
  return {
    doctor_id: doctorId,
    id: doctorId,
    full_name: doctor.name,
    name: doctor.name,
    doctor_name: doctor.name,
    department: doctor.department,
    specialization: doctor.department,
    specialty: doctor.department,
    qualification: doctor.qualification,
    consultation_fee: doctor.fee,
    experience: doctor.experience,
  };
});

export function mergeLiveDoctorsWithDirectory(liveDoctors: DoctorStaffRecord[]): DoctorStaffRecord[] {
  if (!isDemoMode()) {
    return liveDoctors.sort((a, b) => a.full_name.localeCompare(b.full_name));
  }

  const liveByName = new Map<string, DoctorStaffRecord>();
  for (const doctor of liveDoctors) {
    const key = normalizeClinicianName(doctor.full_name);
    if (key && !liveByName.has(key)) liveByName.set(key, doctor);
  }

  const merged: DoctorStaffRecord[] = HOSPITAL_DOCTORS.map((directory) => {
    const key = normalizeClinicianName(directory.name);
    const live = liveByName.get(key);
    if (live) {
      liveByName.delete(key);
      return {
        ...live,
        full_name: directory.name,
        department: directory.department,
        qualification: live.qualification || directory.qualification,
        consultation_fee: live.consultation_fee || directory.fee,
        experience: directory.experience,
      };
    }
    const doctorId = directoryDoctorId(directory.name);
    return {
      doctor_id: doctorId,
      id: doctorId,
      full_name: directory.name,
      name: directory.name,
      doctor_name: directory.name,
      department: directory.department,
      specialization: directory.department,
      specialty: directory.department,
      qualification: directory.qualification,
      consultation_fee: directory.fee,
      experience: directory.experience,
    };
  });

  for (const extra of liveByName.values()) {
    merged.push(extra);
  }

  return merged.sort((a, b) => a.full_name.localeCompare(b.full_name));
}

function isPlaceholderClinician(name: string, department: string): boolean {
  const n = name.toLowerCase();
  const d = department.toLowerCase();
  return n.includes('jhfk') || d.includes('khyu');
}

export function mapDoctorStaffRecord(row: Record<string, unknown>): DoctorStaffRecord {
  const mapped = mapFlexibleDoctorRecord(row);
  if (mapped) return mapped;

  const doctorId = resolveDoctorRecordId(row);
  const name = String(row.full_name ?? row.doctor_name ?? row.name ?? '').trim() || 'Consultant Physician';
  const department = String(row.department ?? row.specialization ?? row.specialty ?? 'General Medicine');
  return {
    doctor_id: doctorId,
    id: doctorId,
    full_name: name,
    name,
    doctor_name: String(row.doctor_name ?? name),
    department,
    specialization: String(row.specialization ?? row.specialty ?? department),
    specialty: String(row.specialty ?? row.specialization ?? department),
    qualification: String(row.qualification ?? 'MBBS, MD'),
    consultation_fee: resolveDoctorConsultationFee(row),
  };
}

function resolveDoctorRecordId(row: Record<string, unknown>): string {
  const candidates = [
    row.staff_id_code,
    row.doctor_employee_id,
    row.employee_id,
    row.doctor_code,
    row.registration_number,
    row.doctor_id,
    row.id,
  ]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);

  const staffCode = candidates.find((value) => /^RH-D\d+$/i.test(value));
  if (staffCode) return staffCode;

  const nonUuid = candidates.find(
    (value) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
  );
  return nonUuid || candidates[0] || '';
}

export function mapFlexibleDoctorRecord(row: Record<string, unknown>): DoctorStaffRecord | null {
  const name = String(row.doctor_name ?? row.full_name ?? row.name ?? '').trim();
  const department =
    String(row.department ?? row.specialization ?? row.specialty ?? 'General OPD').trim() || 'General OPD';
  const role = String(row.role ?? row.staff_type ?? 'doctor').trim().toLowerCase();
  const isActive = row.is_active !== false && String(row.status ?? '').trim().toLowerCase() !== 'inactive';

  if (!name) return null;
  if (row.role != null && role && role !== 'doctor') return null;
  if (!isActive) return null;
  if (isPlaceholderClinician(name, department)) return null;

  const doctorId = resolveDoctorRecordId(row);
  const specialization = String(row.specialization ?? row.specialty ?? department).trim() || department;
  return {
    doctor_id: doctorId,
    id: doctorId,
    full_name: name,
    name,
    doctor_name: String(row.doctor_name ?? name),
    department,
    specialization,
    specialty: String(row.specialty ?? specialization).trim() || specialization,
    qualification: String(row.qualification ?? 'MBBS, MD'),
    room_number: row.room_number ? String(row.room_number) : undefined,
    consultation_fee: resolveDoctorConsultationFee(row),
    experience: row.experience ? String(row.experience) : undefined,
  };
}

export function formatConsultationFee(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

async function fetchDoctorSourceRows(
  supabase: SupabaseClient,
  table: string,
  hospitalId: string,
): Promise<Record<string, unknown>[]> {
  const scoped = await supabase.from(table).select('*').eq('hospital_id', hospitalId);
  if (!scoped.error && Array.isArray(scoped.data)) return scoped.data as Record<string, unknown>[];

  const unscoped = await supabase.from(table).select('*');
  if (unscoped.error || !Array.isArray(unscoped.data)) return [];
  return unscoped.data as Record<string, unknown>[];
}

export async function fetchActiveHospitalDoctors(
  supabase: SupabaseClient | null,
  hospitalId = readActiveHospitalUuid() ?? '',
): Promise<DoctorStaffRecord[]> {
  if (!supabase) {
    return isDemoMode() ? mergeLiveDoctorsWithDirectory([]) : [];
  }

  const trimmedHospitalId = String(hospitalId ?? '').trim();
  const resolvedHospitalId = isHospitalUuid(trimmedHospitalId)
    ? trimmedHospitalId
    : await resolveHospitalUuid(supabase, trimmedHospitalId);

  const doctorFetchId =
    trimmedHospitalId || resolvedHospitalId || readActiveHospitalUuid() || HOSPITAL_TENANT_ID;
  const doctorTableRows = await fetchBookableDoctorsFromTable(supabase, doctorFetchId);

  const staffHospitalId = resolvedHospitalId || trimmedHospitalId;
  const staffRows = staffHospitalId
    ? await fetchDoctorSourceRows(supabase, 'hospital_staff', staffHospitalId)
    : [];
  const rows = [...doctorTableRows, ...staffRows];

  const seen = new Set<string>();
  const next: DoctorStaffRecord[] = [];
  for (const row of rows) {
    const mapped = mapFlexibleDoctorRecord(row);
    if (!mapped) continue;
    const key = mapped.id || mapped.full_name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(mapped);
  }

  return mergeLiveDoctorsWithDirectory(next);
}

/** Patient booking: live doctors from `public.doctors` only — no hardcoded roster merge. */
export async function fetchPatientBookableDoctors(
  supabase: SupabaseClient | null,
  hospitalId = readActiveHospitalUuid() ?? HOSPITAL_TENANT_ID,
): Promise<DoctorStaffRecord[]> {
  if (!supabase) return [];
  const scopedHospitalId = String(hospitalId || HOSPITAL_TENANT_ID).trim() || HOSPITAL_TENANT_ID;
  return fetchBookableDoctors(supabase, scopedHospitalId);
}

export async function fetchHospitalStaffCounts(
  supabase: SupabaseClient,
  hospitalId = readActiveHospitalUuid() ?? '',
): Promise<HospitalStaffRoleCount> {
  if (!isHospitalUuid(hospitalId)) {
    return { accounts: 0, doctors: 0, staff: 0, admins: 0 };
  }
  const { data, error } = await supabase
    .from('hospital_staff')
    .select('role')
    .eq('hospital_id', hospitalId)
    .eq('is_active', true);

  if (error || !Array.isArray(data)) {
    return { accounts: 0, doctors: 0, staff: 0, admins: 0 };
  }

  const roles = data.map((row) => String((row as { role?: string }).role ?? '').toLowerCase());
  const doctors = roles.filter((role) => role === 'doctor').length;
  const staff = roles.filter((role) => role === 'staff').length;
  const admins = roles.filter((role) => role === 'admin').length;
  return {
    accounts: data.length,
    doctors,
    staff,
    admins,
  };
}
