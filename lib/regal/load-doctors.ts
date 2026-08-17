import type { SupabaseClient } from '@supabase/supabase-js';

export type RegalDoctorProfile = {
  id: string;
  name: string;
  email: string;
  department: string;
  room: string;
  fee: number;
  is_on_duty?: boolean;
};

/** Load the 41-clinician roster from doctor_profiles (live Supabase). */
export async function loadRegalDoctorProfiles(
  client: SupabaseClient,
): Promise<RegalDoctorProfile[]> {
  try {
    const { data, error } = await client
      .from('doctor_profiles')
      .select('id, name, email, department, room, fee, is_on_duty')
      .order('id', { ascending: true });

    if (error || !data?.length) return [];
    return data.map((row) => ({
      id: String(row.id ?? ''),
      name: String(row.name ?? ''),
      email: String(row.email ?? ''),
      department: String(row.department ?? ''),
      room: String(row.room ?? ''),
      fee: Number(row.fee ?? 0),
      is_on_duty: row.is_on_duty ?? true,
    }));
  } catch {
    return [];
  }
}
