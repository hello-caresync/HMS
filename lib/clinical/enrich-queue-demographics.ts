import type { SupabaseClient } from '@supabase/supabase-js';

import { resolveRawGenderFromRow } from '@/lib/clinical/format-gender';

export type PatientDemographics = {
  gender?: string;
  age?: number | string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function calcAgeFromDob(dob?: unknown): number | undefined {
  if (!dob) return undefined;
  const born = new Date(String(dob));
  if (Number.isNaN(born.getTime())) return undefined;
  const age = Math.floor((Date.now() - born.getTime()) / (365.25 * 24 * 3600 * 1000));
  return age >= 0 ? age : undefined;
}

function mergeDemographics(
  map: Map<string, PatientDemographics>,
  key: string | null | undefined,
  row: Record<string, unknown>,
): void {
  const id = String(key ?? '').trim();
  if (!id) return;

  const existing = map.get(id) ?? {};
  const gender =
    existing.gender ??
    (row.gender ? String(row.gender).trim() : undefined) ??
    (row.patient_gender ? String(row.patient_gender).trim() : undefined) ??
    (row.sex ? String(row.sex).trim() : undefined);

  const ageRaw = existing.age ?? row.age ?? row.patient_age;
  const ageFromDob = calcAgeFromDob(row.date_of_birth ?? row.dob);
  const normalizedAgeRaw =
    typeof ageRaw === 'number' || typeof ageRaw === 'string' ? ageRaw : undefined;
  const age =
    normalizedAgeRaw != null && String(normalizedAgeRaw).trim() !== ''
      ? normalizedAgeRaw
      : ageFromDob;

  map.set(id, {
    gender: gender || existing.gender,
    age: age ?? existing.age,
  });
}

/** Batch-load gender/age from patients + patient_profiles for queue rows. */
export async function loadPatientDemographicsMap(
  supabase: SupabaseClient,
  patientIds: string[],
): Promise<Map<string, PatientDemographics>> {
  const map = new Map<string, PatientDemographics>();
  const ids = Array.from(new Set(patientIds.map((id) => String(id).trim()).filter(Boolean)));
  if (ids.length === 0) return map;

  const queries = await Promise.all([
    supabase
      .from('patients')
      .select('id, patient_id, gender, age, patient_age, date_of_birth, dob')
      .in('id', ids),
    supabase
      .from('patient_profiles')
      .select('id, patient_id, gender, date_of_birth, dob')
      .in('id', ids),
    supabase
      .from('patient_profiles')
      .select('id, patient_id, gender, date_of_birth, dob')
      .in('patient_id', ids),
  ]);

  for (const result of queries) {
    for (const row of (result.data ?? []) as Record<string, unknown>[]) {
      const record = asRecord(row);
      mergeDemographics(map, String(record.id ?? ''), record);
      mergeDemographics(map, String(record.patient_id ?? ''), record);
    }
  }

  return map;
}

export async function enrichRowsWithPatientDemographics<
  T extends { patient_id?: string | null; patientId?: string; gender?: string; age?: number | string },
>(supabase: SupabaseClient, rows: T[]): Promise<T[]> {
  const patientIds = rows
    .map((row) => String(row.patient_id ?? row.patientId ?? '').trim())
    .filter(Boolean);

  const demoMap = await loadPatientDemographicsMap(supabase, patientIds);

  return rows.map((row) => {
    const patientId = String(row.patient_id ?? row.patientId ?? '').trim();
    const demo = patientId ? demoMap.get(patientId) : undefined;
    const rowRecord = row as unknown as Record<string, unknown>;

    return {
      ...row,
      gender: row.gender ?? resolveRawGenderFromRow(rowRecord) ?? demo?.gender,
      age: row.age ?? demo?.age,
    };
  });
}
