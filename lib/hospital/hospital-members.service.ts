import { supabase } from '@/lib/supabaseClient';

import type { OnboardingMemberDraft, IssuedCredential } from '@/lib/auth/hospital/member-types';
import {
  mapRegalDoctorsToMemberDrafts,
  REGAL_DEPARTMENTS,
  REGAL_DOCTOR_COUNT,
} from '@/lib/hospital/regal-doctors-roster';

export const ACTIVE_HOSPITAL_STORAGE_KEY = 'nexora_active_hospital_id';
/** Legacy alias — dashboards may read either key */
export const ACTIVE_HOSPITAL_LEGACY_KEY = 'active_hospital_id';
export const ONBOARDING_LOCAL_STORAGE_KEY = 'nexora_onboarding_local_backup';

export type LocalOnboardingBackup = {
  hospitalId: string;
  hospital: Record<string, unknown>;
  departmentNames: string[];
  members: OnboardingMemberDraft[];
  credentials: IssuedCredential[];
  savedAt: string;
  mode: 'local';
};

export function readLocalOnboardingBackup(): LocalOnboardingBackup | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ONBOARDING_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalOnboardingBackup;
  } catch {
    return null;
  }
}

/** Inline Regal Hospital doctor roster — 41 consultants (seed fallback) */
export const REGAL_HOSPITAL_DOCTORS: OnboardingMemberDraft[] =
  mapRegalDoctorsToMemberDrafts();

export type HospitalMemberRow = {
  id: string;
  hospital_id: string | null;
  department_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  employee_id: string;
  role: string;
  status: string;
  medical_license_number: string | null;
  specialization: string | null;
  qualification: string | null;
  experience_years: number | null;
  consultation_fee: number | null;
  opd_room_number: string | null;
  departments?: { name: string } | { name: string }[] | null;
};

export type HospitalDoctorOption = {
  id: string;
  employeeId: string;
  fullName: string;
  department: string;
  specialization: string | null;
  consultationFee: number | null;
  opdRoomNumber: string | null;
  hospitalId: string | null;
};

export type FetchMembersResult = {
  members: OnboardingMemberDraft[];
  hospitalId: string | null;
  source: 'database' | 'seed';
};

function resolveDepartmentName(
  departments: HospitalMemberRow['departments'],
  fallback = 'General',
): string {
  if (!departments) return fallback;
  if (Array.isArray(departments)) return departments[0]?.name ?? fallback;
  return departments.name ?? fallback;
}

export function mapDbMemberToDraft(row: HospitalMemberRow): OnboardingMemberDraft {
  return {
    key: row.id,
    dbId: row.id,
    hospitalId: row.hospital_id ?? undefined,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone ?? '',
    employeeId: row.employee_id,
    role: row.role as OnboardingMemberDraft['role'],
    departmentName: resolveDepartmentName(row.departments),
    medicalLicenseNumber: row.medical_license_number ?? undefined,
    specialization: row.specialization ?? undefined,
    qualification: row.qualification ?? undefined,
    experienceYears: row.experience_years ?? undefined,
    consultationFee: row.consultation_fee ?? undefined,
    opdRoomNumber: row.opd_room_number ?? undefined,
  };
}

export function mapDbMemberToDoctorOption(row: HospitalMemberRow): HospitalDoctorOption {
  return {
    id: row.id,
    employeeId: row.employee_id,
    fullName: `Dr. ${row.first_name} ${row.last_name}`.replace(/^Dr\.\s*Dr\./i, 'Dr.'),
    department: resolveDepartmentName(row.departments),
    specialization: row.specialization,
    consultationFee: row.consultation_fee,
    opdRoomNumber: row.opd_room_number,
    hospitalId: row.hospital_id,
  };
}

export function getStoredActiveHospitalId(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem(ACTIVE_HOSPITAL_STORAGE_KEY) ??
    localStorage.getItem(ACTIVE_HOSPITAL_LEGACY_KEY)
  );
}

export function setStoredActiveHospitalId(hospitalId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_HOSPITAL_STORAGE_KEY, hospitalId);
  localStorage.setItem(ACTIVE_HOSPITAL_LEGACY_KEY, hospitalId);
}

export async function fetchLatestHospitalId(): Promise<string | null> {
  const stored = getStoredActiveHospitalId();
  if (stored) return stored;

  const { data } = await supabase
    .from('hospitals')
    .select('id')
    .eq('onboarding_completed', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

type MemberQueryOptions = {
  hospitalId?: string | null;
  role?: string;
};

async function queryHospitalMembers(
  options: MemberQueryOptions = {},
): Promise<HospitalMemberRow[]> {
  let query = supabase
    .from('hospital_members')
    .select(
      `
      *,
      departments ( name )
    `,
    )
    .eq('status', 'Active')
    .order('last_name', { ascending: true });

  if (options.role) {
    query = query.eq('role', options.role);
  }

  const hospitalId = options.hospitalId ?? (await fetchLatestHospitalId());

  if (hospitalId) {
    query = query.eq('hospital_id', hospitalId);
  }

  const { data, error } = await query;

  if (error) {
    console.warn('[hospital_members] fetch failed:', error.message);
    return [];
  }

  const rows = (data ?? []) as HospitalMemberRow[];

  if (rows.length === 0 && hospitalId) {
    const { data: fallback } = await supabase
      .from('hospital_members')
      .select(`*, departments ( name )`)
      .eq('status', 'Active')
      .eq('role', options.role ?? 'Doctor')
      .order('last_name', { ascending: true });

    return (fallback ?? []) as HospitalMemberRow[];
  }

  return rows;
}

/** Load members for onboarding — DB first, local backup, then Regal seed fallback */
export async function fetchMembersForOnboarding(
  hospitalId?: string | null,
): Promise<FetchMembersResult> {
  try {
    const { data, error } = await supabase
      .from('hospital_members')
      .select(
        `
      *,
      departments ( name )
    `,
      )
      .eq('status', 'Active')
      .order('last_name', { ascending: true });

    if (error) {
      console.warn('[hospital_members] onboarding fetch failed:', error.message);
    }

    let rows = (data ?? []) as HospitalMemberRow[];

    const resolvedHospitalId =
      hospitalId ?? rows.find((r) => r.hospital_id)?.hospital_id ?? (await fetchLatestHospitalId());

    if (resolvedHospitalId) {
      const scoped = rows.filter((r) => r.hospital_id === resolvedHospitalId);
      if (scoped.length > 0) rows = scoped;
    }

    if (rows.length > 0) {
      return {
        members: rows.map(mapDbMemberToDraft),
        hospitalId: rows[0]?.hospital_id ?? resolvedHospitalId,
        source: 'database',
      };
    }
  } catch (err) {
    console.warn('[hospital_members] onboarding fetch error:', err);
  }

  const localBackup = readLocalOnboardingBackup();
  if (localBackup?.members?.length) {
    return {
      members: localBackup.members,
      hospitalId: localBackup.hospitalId,
      source: 'seed',
    };
  }

  return {
    members: REGAL_HOSPITAL_DOCTORS.map((m) => ({ ...m, key: m.key || crypto.randomUUID() })),
    hospitalId: hospitalId ?? null,
    source: 'seed',
  };
}

/** Doctors for hospital dashboard dropdowns */
export async function fetchHospitalDoctors(
  hospitalId?: string | null,
): Promise<HospitalDoctorOption[]> {
  const rows = await queryHospitalMembers({ hospitalId, role: 'Doctor' });

  if (rows.length > 0) {
    return rows.map(mapDbMemberToDoctorOption);
  }

  return REGAL_HOSPITAL_DOCTORS.map((d) => ({
    id: d.key,
    employeeId: d.employeeId,
    fullName: `Dr. ${d.firstName} ${d.lastName}`,
    department: d.departmentName,
    specialization: d.specialization ?? null,
    consultationFee: d.consultationFee ?? null,
    opdRoomNumber: d.opdRoomNumber ?? null,
    hospitalId: null,
  }));
}

export async function fetchHospitalRecord(hospitalId: string) {
  const { data } = await supabase.from('hospitals').select('*').eq('id', hospitalId).maybeSingle();
  return data;
}

export function mapHospitalRowToInput(row: Record<string, unknown>): HospitalDetailsInput {
  return {
    hospitalName: String(row.hospital_name ?? ''),
    registrationNumber: String(row.registration_number ?? ''),
    taxGstinId: String(row.tax_gstin_id ?? ''),
    officialEmail: String(row.official_email ?? ''),
    phone: String(row.phone ?? ''),
    emergencyHelpline: String(row.emergency_helpline ?? ''),
    address: String(row.address ?? ''),
    city: String(row.city ?? ''),
    state: String(row.state ?? ''),
    pincode: String(row.pincode ?? ''),
    totalBeds: Number(row.total_beds ?? 100),
    icuBeds: Number(row.icu_beds ?? 20),
    opdRooms: Number(row.opd_rooms ?? 12),
    otSuites: Number(row.ot_suites ?? 4),
  };
}

export { REGAL_DEPARTMENTS, REGAL_DOCTOR_COUNT };
