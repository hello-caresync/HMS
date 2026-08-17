import { supabase } from '@/lib/supabaseClient';
import type { RegalDoctor } from '@/lib/doctor/regal-doctors';

export const DEFAULT_DOCTOR_PASSWORD = 'RegalDoc@2026';

export type DoctorProfileRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  department: string;
  room: string;
  fee: number;
  is_on_duty?: boolean;
};

function mapProfile(row: Record<string, unknown>): DoctorProfileRow {
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? 'Doctor'),
    email: String(row.email ?? ''),
    password_hash: String(row.password_hash ?? ''),
    department: String(row.department ?? ''),
    room: String(row.room ?? ''),
    fee: Number(row.fee ?? 0),
    is_on_duty: row.is_on_duty != null ? Boolean(row.is_on_duty) : true,
  };
}

export function doctorProfileToRegalDoctor(profile: DoctorProfileRow): RegalDoctor {
  return {
    employeeId: profile.id,
    name: profile.name,
    department: profile.department,
    specialization: profile.department,
    fee: profile.fee,
    slots: ['09:00 AM', '11:00 AM', '02:00 PM', '04:30 PM'],
  };
}

/** Load all 41 clinicians from doctor_profiles for the login gateway. */
export async function loadDoctorProfiles(): Promise<DoctorProfileRow[]> {
  try {
    const { data, error } = await supabase
      .from('doctor_profiles')
      .select('id, name, email, password_hash, department, room, fee, is_on_duty')
      .order('id', { ascending: true });

    if (error || !data?.length) return [];
    return data.map((row) => mapProfile(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

/** Validate email + password against doctor_profiles (dev: plaintext password_hash). */
export async function authenticateDoctor(
  email: string,
  password: string,
): Promise<{ ok: boolean; profile?: DoctorProfileRow; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password.trim()) {
    return { ok: false, error: 'Email and password are required.' };
  }

  try {
    const { data, error } = await supabase
      .from('doctor_profiles')
      .select('id, name, email, password_hash, department, room, fee, is_on_duty')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: 'Clinician profile not found.' };

    const profile = mapProfile(data as Record<string, unknown>);
    if (profile.password_hash !== password) {
      return { ok: false, error: 'Invalid password. Use RegalDoc@2026 for test accounts.' };
    }
    if (profile.is_on_duty === false) {
      return { ok: false, error: 'This clinician profile is marked off duty.' };
    }

    return { ok: true, profile };
  } catch {
    return { ok: false, error: 'Could not reach doctor_profiles.' };
  }
}

export function formatDoctorLoginOption(profile: DoctorProfileRow): string {
  return `${profile.name} (${profile.id}) · ${profile.department}`;
}
