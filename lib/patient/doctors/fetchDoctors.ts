import type { EcosystemDoctor } from '@/lib/ecosystem/types';
import { SEED_DOCTORS } from '@/lib/ecosystem/seed';

export type SupabaseDoctorRow = {
  id: string;
  name: string;
  email: string;
  department: string;
  specialization: string | null;
  experience: string | null;
  languages: string[] | null;
  rating: number | null;
  review_count: number | null;
  available_today: boolean | null;
  consultation_fee: number | null;
  bio: string | null;
  photo_initials: string | null;
  room_number: string | null;
  token_prefix: string | null;
  avg_consult_minutes: number | null;
  branch_id: string | null;
  slots: string[] | null;
  is_active: boolean;
};

export function initialsFromName(name: string): string {
  return name
    .replace(/^Dr\.?\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function mapSupabaseDoctor(row: SupabaseDoctorRow): EcosystemDoctor {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    department: row.department,
    specialization: row.specialization ?? row.department,
    experience: row.experience ?? '—',
    languages: row.languages ?? ['English'],
    rating: Number(row.rating ?? 4.5),
    reviewCount: row.review_count ?? 0,
    availableToday: row.available_today ?? false,
    photoInitials: row.photo_initials ?? initialsFromName(row.name),
    bio: row.bio ?? '',
    consultationFee: Number(row.consultation_fee ?? 0),
    slots: row.slots ?? [],
    roomNumber: row.room_number ?? 'TBA',
    tokenPrefix: row.token_prefix ?? 'GEN',
    avgConsultMinutes: row.avg_consult_minutes ?? 12,
    branchId: row.branch_id ?? 'branch-main',
    historicalDelayMinutes: 8,
  };
}

export function filterDoctors(
  doctors: EcosystemDoctor[],
  searchQuery: string,
  selectedDepartment: string,
): EcosystemDoctor[] {
  const q = searchQuery.trim().toLowerCase();
  return doctors.filter((d) => {
    const matchDept =
      selectedDepartment === 'All departments' ||
      selectedDepartment === 'all' ||
      d.department === selectedDepartment;
    const matchSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.department.toLowerCase().includes(q) ||
      d.specialization.toLowerCase().includes(q);
    return matchDept && matchSearch;
  });
}

export function fallbackDoctorsFromSeed(): EcosystemDoctor[] {
  return SEED_DOCTORS.filter((d) => d.availableToday !== false);
}
