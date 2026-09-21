import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

import { missingColumnFromPostgrestError } from '@/lib/hospital/appointments';
import type { FamilyMember } from '@/lib/patient/family-members';
import {
  clinicalRecordToPatientsRow,
  fetchPatientClinicalRecordByPhone,
  type PatientClinicalRecord,
} from '@/lib/patient/patients-record';
import { REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';

const PATIENT_UPSERT_MAX_RETRIES = 12;

export type PatientUpsertInput = PatientClinicalRecord & {
  familyMembers?: FamilyMember[];
};

export type HospitalPatientRow = {
  id: string;
  uhid: string;
  full_name: string;
  phone: string;
  hospital_id: string;
  age?: number | null;
  gender?: string | null;
  blood_group?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
  family_members?: unknown;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
};

/** Maps PostgREST schema-cache errors to patient-safe copy (no raw column names). */
export function sanitizePatientDbError(message: string | null | undefined): string {
  const text = String(message ?? '').trim();
  if (!text) return 'Could not save patient profile. Please try again.';

  if (missingColumnFromPostgrestError(text) || /schema cache/i.test(text)) {
    return 'Hospital records are syncing. Your profile details were saved locally — please try again in a moment.';
  }

  if (/duplicate key|unique constraint/i.test(text)) {
    return 'This phone number is already registered. Contact reception if you need help linking your account.';
  }

  return text;
}

function hospitalUhidPrefix(hospitalId: string): string {
  return `${hospitalId.replace(/\s/g, '')}-P-`;
}

export function isHospitalScopedUhid(uhid: string, hospitalId: string): boolean {
  const value = uhid.trim();
  if (!value) return false;
  return value.startsWith(hospitalUhidPrefix(hospitalId));
}

/** Atomically mint sequential UHID via Postgres RPC (falls back for dev without migration). */
export async function mintHospitalScopedUhid(
  supabase: SupabaseClient,
  hospitalId: string = REGAL_HOSPITAL_CODE,
): Promise<string> {
  const { data, error } = await supabase.rpc('generate_hospital_uhid', {
    p_hospital_id: hospitalId,
  });

  if (!error && data) {
    return String(data).trim();
  }

  const prefix = hospitalId.replace(/\s/g, '');
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  return `${prefix}-P-${suffix}`;
}

export async function resolvePatientUhidForSave(
  supabase: SupabaseClient,
  input: {
    hospitalId?: string;
    phone: string;
    sessionUhid?: string | null;
    portalUhid?: string | null;
    authUhid?: string | null;
  },
): Promise<string> {
  const hospitalId = input.hospitalId || REGAL_HOSPITAL_CODE;
  const candidates = [input.sessionUhid, input.portalUhid, input.authUhid]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);

  for (const candidate of candidates) {
    if (isHospitalScopedUhid(candidate, hospitalId)) {
      return candidate;
    }
  }

  try {
    const existingRow = await fetchPatientClinicalRecordByPhone(supabase, input.phone);
    const existingUhid = existingRow?.uhid ? String(existingRow.uhid).trim() : '';
    if (existingUhid) {
      return existingUhid;
    }
  } catch {
    /* mint below */
  }

  return mintHospitalScopedUhid(supabase, hospitalId);
}

export function familyMembersToJson(familyMembers: FamilyMember[] = []): Record<string, unknown>[] {
  return familyMembers.map((member) => ({
    id: member.id,
    fullName: member.fullName,
    full_name: member.fullName,
    relationship: member.relationship,
    relation: member.relationship,
    age: member.age,
    gender: member.gender,
    bloodGroup: member.bloodGroup,
    blood_group: member.bloodGroup,
  }));
}

export function buildPatientUpsertPayload(
  record: PatientUpsertInput,
  uhid: string,
  hospitalId: string = REGAL_HOSPITAL_CODE,
): Record<string, unknown> {
  return {
    ...clinicalRecordToPatientsRow(record),
    uhid,
    hospital_id: hospitalId,
    patient_id: record.patient_id.trim() || null,
    family_members: familyMembersToJson(record.familyMembers),
    updated_at: new Date().toISOString(),
  };
}

async function upsertPatientRowResilient(
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
): Promise<{ data: HospitalPatientRow | null; error: PostgrestError | null }> {
  let current: Record<string, unknown> = { ...payload };

  for (let attempt = 0; attempt < PATIENT_UPSERT_MAX_RETRIES; attempt += 1) {
    const { data, error } = await supabase
      .from('patients')
      .upsert(current, { onConflict: 'phone' })
      .select('*')
      .maybeSingle();

    if (!error) {
      return { data: (data as HospitalPatientRow | null) ?? null, error: null };
    }

    const missingColumn = missingColumnFromPostgrestError(error.message);
    if (missingColumn && Object.prototype.hasOwnProperty.call(current, missingColumn)) {
      const { [missingColumn]: _removed, ...next } = current;
      current = next;
      continue;
    }

    return { data: null, error };
  }

  return {
    data: null,
    error: {
      message: 'Patient profile upsert exceeded schema retry limit.',
      details: '',
      hint: '',
      code: 'PGRST000',
    } as PostgrestError,
  };
}

export async function upsertPatientProfileRecord(
  supabase: SupabaseClient,
  record: PatientUpsertInput,
  uhid: string,
  hospitalId: string = REGAL_HOSPITAL_CODE,
): Promise<HospitalPatientRow> {
  const payload = buildPatientUpsertPayload(record, uhid, hospitalId);

  const { data, error } = await upsertPatientRowResilient(supabase, payload);

  if (error) {
    throw new Error(sanitizePatientDbError(error.message));
  }

  if (data) {
    return data as HospitalPatientRow;
  }

  const { data: fallback, error: readError } = await supabase
    .from('patients')
    .select('*')
    .eq('hospital_id', hospitalId)
    .eq('phone', String(payload.phone ?? ''))
    .maybeSingle();

  if (readError || !fallback) {
    throw new Error(
      sanitizePatientDbError(readError?.message || 'Patient saved but could not be reloaded.'),
    );
  }

  return fallback as HospitalPatientRow;
}

export async function fetchHospitalPatientDirectory(
  supabase: SupabaseClient,
  hospitalId: string = REGAL_HOSPITAL_CODE,
  limit = 200,
): Promise<HospitalPatientRow[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('hospital_id', hospitalId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('fetchHospitalPatientDirectory:', error.message);
    return [];
  }

  return (data ?? []) as HospitalPatientRow[];
}
