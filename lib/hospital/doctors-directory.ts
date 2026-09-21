import type { SupabaseClient } from '@supabase/supabase-js';

import { resolveDoctorRegistrationEmail } from '@/lib/hospital/doctors';
import { serializePostgrestError } from '@/lib/hospital/governance-vault-loader';
import { REGAL_HOSPITAL_CODE, REGAL_HOSPITAL_NAME } from '@/lib/regal/constants';
import { isHospitalCode, isHospitalUuid, resolveHospitalUuid } from '@/lib/hospital/resolve-hospital-context';

export type BookableDoctorDraft = {
  staff_id_code: string;
  full_name: string;
  email?: string;
  phone?: string;
  department: string;
  specialization?: string;
  specialty?: string;
  qualification?: string;
  medical_license?: string;
  consultation_fee: number;
  hospital_name?: string;
};

/** Ensure patient-facing doctor labels include the Dr. prefix. */
export function formatDoctorDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  if (/^dr\.?\s/i.test(trimmed)) return trimmed;
  return `Dr. ${trimmed}`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuidValue(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

/** Strip PK/FK UUID fields — custom codes belong in doctor_code / employee_id only. */
function sanitizeDoctorWritePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const next = { ...payload };
  delete next.id;
  if (typeof next.doctor_id === 'string' && !isUuidValue(next.doctor_id)) {
    delete next.doctor_id;
  }
  return next;
}

async function resolveDoctorHospitalKeys(
  supabase: SupabaseClient,
  hospitalId: string,
): Promise<{ uuid: string | null; code: string }> {
  if (isHospitalUuid(hospitalId)) {
    return { uuid: hospitalId.trim(), code: REGAL_HOSPITAL_CODE };
  }

  if (isHospitalCode(hospitalId)) {
    const uuid = await resolveHospitalUuid(supabase, hospitalId);
    return { uuid, code: String(hospitalId).trim() || REGAL_HOSPITAL_CODE };
  }

  const uuid = await resolveHospitalUuid(supabase, hospitalId);
  return { uuid, code: REGAL_HOSPITAL_CODE };
}

function doctorDirectoryPayload(
  keys: { uuid: string | null; code: string },
  draft: BookableDoctorDraft,
): Record<string, unknown> {
  const doctorCode = draft.staff_id_code.trim();
  const fullName = formatDoctorDisplayName(draft.full_name);
  const department = draft.department.trim() || 'General Medicine';
  const specialization =
    draft.specialization?.trim() || department || 'Consultant Physician';
  const fee = Math.max(0, Number(draft.consultation_fee) || 500);
  const email = resolveDoctorRegistrationEmail({
    email: draft.email,
    full_name: fullName,
    staff_id_code: doctorCode,
  });
  const medicalLicense =
    draft.medical_license?.trim() || doctorCode || `MCI-${doctorCode.replace(/[^A-Z0-9]/gi, '') || 'REGAL'}`;

  const payload: Record<string, unknown> = {
    hospital_id: keys.uuid ?? keys.code,
    hospital_code: keys.code,
    hospital_name: draft.hospital_name?.trim() || REGAL_HOSPITAL_NAME,
    doctor_code: doctorCode,
    registration_number: doctorCode,
    full_name: fullName,
    doctor_name: fullName,
    name: fullName,
    email,
    phone: draft.phone?.trim() || null,
    department,
    specialization,
    specialty: draft.specialty?.trim() || specialization,
    qualification: draft.qualification?.trim() || 'MBBS, MD',
    medical_license: medicalLicense,
    consultation_fee: fee,
    fee,
    is_available: true,
    is_active: true,
    status: 'active',
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    available_time_slots: ['09:00 AM - 01:00 PM', '04:00 PM - 07:00 PM'],
    updated_at: new Date().toISOString(),
  };

  // Legacy schemas store doctor_id as UUID — only write RH-D codes to doctor_code.
  if (doctorCode && isUuidValue(doctorCode)) {
    payload.doctor_id = doctorCode;
  }

  return payload;
}

async function findExistingDoctorRow(
  supabase: SupabaseClient,
  draft: BookableDoctorDraft,
): Promise<Record<string, unknown> | null> {
  const email = draft.email?.trim().toLowerCase();
  const doctorCode = draft.staff_id_code.trim();

  if (email) {
    try {
      const byEmail = await supabase.from('doctors').select('*').eq('email', email).maybeSingle();
      if (byEmail.error) {
        console.warn(
          'Doctor directory lookup by email failed:',
          serializePostgrestError(byEmail.error).summary,
        );
      } else if (byEmail.data) {
        return asRecord(byEmail.data);
      }
    } catch (err: unknown) {
      console.warn('Doctor directory lookup by email failed:', serializePostgrestError(err).summary);
    }
  }

  if (doctorCode) {
    const codeFilters = [`doctor_code.eq.${doctorCode}`, `registration_number.eq.${doctorCode}`];
    if (isUuidValue(doctorCode)) {
      codeFilters.unshift(`doctor_id.eq.${doctorCode}`);
    }

    try {
      const byCode = await supabase
        .from('doctors')
        .select('*')
        .or(codeFilters.join(','))
        .maybeSingle();
      if (byCode.error) {
        console.warn(
          'Doctor directory lookup by code failed:',
          serializePostgrestError(byCode.error).summary,
        );
      } else if (byCode.data) {
        return asRecord(byCode.data);
      }
    } catch (err: unknown) {
      console.warn('Doctor directory lookup by code failed:', serializePostgrestError(err).summary);
    }
  }

  return null;
}

/** Upsert a clinician into `public.doctors` so patient booking can discover them immediately. */
export async function upsertBookableDoctor(
  supabase: SupabaseClient,
  hospitalId: string,
  draft: BookableDoctorDraft,
): Promise<{ ok: boolean; error?: string }> {
  if (!draft.full_name.trim()) return { ok: false, error: 'Doctor name is required' };
  if (!draft.staff_id_code.trim()) return { ok: false, error: 'Doctor staff ID is required' };

  const keys = await resolveDoctorHospitalKeys(supabase, hospitalId);
  const payload = sanitizeDoctorWritePayload(
    doctorDirectoryPayload(keys, {
      ...draft,
      email: resolveDoctorRegistrationEmail({
        email: draft.email,
        full_name: draft.full_name,
        staff_id_code: draft.staff_id_code,
      }),
    }),
  );

  if (!String(payload.email ?? '').trim()) {
    return { ok: false, error: 'Doctor email is required' };
  }
  const existing = await findExistingDoctorRow(supabase, draft);

  const updateExisting = async (row: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> => {
    try {
      const rowId = row.id ? String(row.id) : '';
      if (rowId && isUuidValue(rowId)) {
        const { error } = await supabase.from('doctors').update(payload).eq('id', rowId);
        if (!error) return { ok: true };
        return { ok: false, error: serializePostgrestError(error).summary };
      }

      const email = draft.email?.trim().toLowerCase();
      if (email) {
        const { error } = await supabase.from('doctors').update(payload).eq('email', email);
        if (!error) return { ok: true };
        return { ok: false, error: serializePostgrestError(error).summary };
      }

      return { ok: false, error: 'Could not locate doctor row for update.' };
    } catch (err: unknown) {
      return { ok: false, error: serializePostgrestError(err).summary };
    }
  };

  try {
    if (existing) {
      const updated = await updateExisting(existing);
      if (updated.ok) return { ok: true };
      return updated;
    }

    const { error } = await supabase.from('doctors').insert([payload]);
    if (error) {
      const errorMessage = serializePostgrestError(error).summary;
      if (/duplicate|unique|already exists/i.test(errorMessage)) {
        const retryExisting = await findExistingDoctorRow(supabase, draft);
        if (retryExisting) {
          const retried = await updateExisting(retryExisting);
          if (retried.ok) return { ok: true };
          return retried;
        }
      }
      return { ok: false, error: errorMessage };
    }

    return { ok: true };
  } catch (err: unknown) {
    const errorMessage = serializePostgrestError(err).summary;
    console.warn('Doctor directory upsert failed:', errorMessage);
    return { ok: false, error: errorMessage };
  }
}

export async function hospitalDoctorFilterValues(
  supabase: SupabaseClient,
  hospitalId: string,
): Promise<string[]> {
  const keys = await resolveDoctorHospitalKeys(supabase, hospitalId);
  const values = new Set<string>();
  if (keys.uuid) values.add(keys.uuid);
  if (keys.code) values.add(keys.code);
  return Array.from(values);
}

/** Fetch active bookable doctors from `public.doctors` for a hospital node. */
export async function fetchBookableDoctorsFromTable(
  supabase: SupabaseClient,
  hospitalId: string,
): Promise<Record<string, unknown>[]> {
  try {
    const { fetchBookableDoctors } = await import('@/lib/hospital/doctors');
    const doctors = await fetchBookableDoctors(supabase, hospitalId);
    return doctors.map((doctor) => ({
      doctor_id: doctor.doctor_id,
      id: doctor.doctor_id,
      doctor_code: doctor.doctor_id,
      full_name: doctor.full_name,
      doctor_name: doctor.doctor_name,
      name: doctor.name,
      department: doctor.department,
      specialization: doctor.specialization,
      specialty: doctor.specialty,
      qualification: doctor.qualification,
      room_number: doctor.room_number,
      consultation_fee: doctor.consultation_fee,
      fee: doctor.consultation_fee,
      is_active: true,
      is_available: true,
      status: 'active',
    }));
  } catch (err: unknown) {
    const errorMessage = serializePostgrestError(err).summary;
    console.warn('Hospital doctor directory fetch failed — returning empty list:', errorMessage);
    return [];
  }
}
