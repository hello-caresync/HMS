import type { SupabaseClient } from '@supabase/supabase-js';

import {
  HOSPITAL_STAFF_CREDENTIALS_TABLE,
  HOSPITAL_USER_CREDENTIALS_TABLE,
} from '@/lib/auth/hospitalAuth';
import { hospitalDirectoryFilterIds } from '@/lib/hospital/hospital-node';
import { isHospitalUuid } from '@/lib/hospital/resolve-hospital-context';
import { purgeHospitalStaffMember } from '@/lib/super-admin/teardown';
import { isUuidValue } from '@/lib/utils/formatters';

import type { HospitalStaffMember } from './staff-directory';

function memberLooksLikeDoctor(
  member: Pick<HospitalStaffMember, 'role' | 'department' | 'staff_id_code' | 'raw_role'>,
): boolean {
  const role = String(member.raw_role ?? member.role ?? '')
    .trim()
    .toLowerCase();
  const department = String(member.department ?? '').trim().toLowerCase();
  const staffCode = String(member.staff_id_code ?? '').trim().toUpperCase();

  return (
    member.role === 'doctor' ||
    role.includes('doctor') ||
    role.includes('clinician') ||
    department.includes('medicine') ||
    staffCode.startsWith('RH-D')
  );
}

export type PermanentDeleteTarget = Pick<
  HospitalStaffMember,
  'id' | 'staff_record_id' | 'staff_id_code' | 'email' | 'full_name' | 'role' | 'department' | 'raw_role' | 'credential_id'
>;

function isOptionalSchemaError(message: string): boolean {
  return /relation .* does not exist|schema cache|column .* does not exist|invalid input syntax for type uuid|42703|42P01|22P02|PGRST204/i.test(
    message,
  );
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean)));
}

function buildOrEqualsFilter(field: string, values: string[]): string | null {
  const parts = uniqueStrings(values).map((value) => `${field}.eq.${value}`);
  return parts.length ? parts.join(',') : null;
}

async function optionalDelete(
  supabase: SupabaseClient,
  table: string,
  applyFilter: (
    query: ReturnType<ReturnType<SupabaseClient['from']>['delete']>,
  ) => ReturnType<ReturnType<SupabaseClient['from']>['delete']>,
): Promise<void> {
  try {
    const { error } = await applyFilter(supabase.from(table).delete());
    if (error && !isOptionalSchemaError(error.message)) {
      console.warn(`${table} cleanup note:`, error.message);
    }
  } catch (err) {
    console.warn(`${table} cleanup note:`, err);
  }
}

async function resolveDoctorKeys(
  supabase: SupabaseClient,
  staffRecordId: string,
  staffCode: string,
  email: string,
): Promise<string[]> {
  const keys = uniqueStrings([staffRecordId, staffCode]);

  const doctorLookupFilters: string[] = [];
  if (email) doctorLookupFilters.push(`email.eq.${email}`);
  if (staffCode) {
    doctorLookupFilters.push(`doctor_code.eq.${staffCode}`);
    doctorLookupFilters.push(`registration_number.eq.${staffCode}`);
    doctorLookupFilters.push(`doctor_id.eq.${staffCode}`);
  }
  if (staffRecordId && isUuidValue(staffRecordId)) {
    doctorLookupFilters.push(`id.eq.${staffRecordId}`);
  }

  if (doctorLookupFilters.length === 0) {
    return keys;
  }

  const { data, error } = await supabase
    .from('doctors')
    .select('id, doctor_id, doctor_code, registration_number')
    .or(Array.from(new Set(doctorLookupFilters)).join(','));

  if (error) {
    if (!isOptionalSchemaError(error.message)) {
      console.warn('doctors lookup note:', error.message);
    }
    return keys;
  }

  for (const row of data ?? []) {
    const record = row as Record<string, unknown>;
    keys.push(
      String(record.doctor_id ?? ''),
      String(record.doctor_code ?? ''),
      String(record.registration_number ?? ''),
      String(record.id ?? ''),
    );
  }

  return uniqueStrings(keys);
}

async function deleteClinicalRowsForDoctor(
  supabase: SupabaseClient,
  doctorKeys: string[],
  fullName: string,
): Promise<void> {
  const doctorIdFilter = buildOrEqualsFilter('doctor_id', doctorKeys);
  if (doctorIdFilter) {
    await optionalDelete(supabase, 'clinical_notes', (query) => query.or(doctorIdFilter));
  }

  if (fullName) {
    await optionalDelete(supabase, 'clinical_notes', (query) => query.eq('doctor_name', fullName));
  }

  await optionalDelete(supabase, 'prescriptions', (query) => {
    if (doctorIdFilter) return query.or(doctorIdFilter);
    return query.eq('doctor_name', fullName || '___none___');
  });

  await optionalDelete(supabase, 'hospital_prescriptions', (query) => {
    if (doctorIdFilter) return query.or(doctorIdFilter);
    return query.eq('doctor_name', fullName || '___none___');
  });

  await optionalDelete(supabase, 'pharmacy_prescriptions', (query) => {
    if (doctorIdFilter) return query.or(doctorIdFilter);
    return query.eq('doctor_name', fullName || '___none___');
  });
}

async function deleteOperationalRowsForDoctor(
  supabase: SupabaseClient,
  doctorKeys: string[],
  staffCode: string,
  fullName: string,
): Promise<void> {
  const doctorIdFilter = buildOrEqualsFilter('doctor_id', doctorKeys);
  const appointmentFilterParts = [...doctorKeys.map((key) => `doctor_id.eq.${key}`)];
  if (staffCode) {
    appointmentFilterParts.push(`doctor_code.eq.${staffCode}`);
    appointmentFilterParts.push(`doctor_employee_id.eq.${staffCode}`);
  }
  const appointmentFilter =
    appointmentFilterParts.length > 0 ? appointmentFilterParts.join(',') : null;

  if (appointmentFilter) {
    const { data: appointmentRows, error: appointmentLookupError } = await supabase
      .from('appointments')
      .select('id')
      .or(appointmentFilter);

    if (appointmentLookupError && !isOptionalSchemaError(appointmentLookupError.message)) {
      console.warn('appointments lookup note:', appointmentLookupError.message);
    } else {
      const appointmentIds = uniqueStrings(
        (appointmentRows ?? []).map((row) => String((row as { id?: string }).id ?? '')),
      ).filter(isUuidValue);

      if (appointmentIds.length > 0) {
        await optionalDelete(supabase, 'medical_records', (query) =>
          query.in('appointment_id', appointmentIds),
        );
      }
    }
  }

  if (doctorIdFilter) {
    await optionalDelete(supabase, 'medical_records', (query) => query.or(doctorIdFilter));
  }

  await deleteClinicalRowsForDoctor(supabase, doctorKeys, fullName);

  for (const table of ['doctor_time_slots', 'doctor_schedules', 'lab_orders', 'radiology_orders'] as const) {
    if (doctorIdFilter) {
      await optionalDelete(supabase, table, (query) => query.or(doctorIdFilter));
    }
    if (fullName) {
      await optionalDelete(supabase, table, (query) => query.eq('doctor_name', fullName));
    }
  }

  if (appointmentFilter) {
    await optionalDelete(supabase, 'appointments', (query) => query.or(appointmentFilter));
  }

  if (doctorIdFilter) {
    await optionalDelete(supabase, 'opd_queue', (query) => query.or(doctorIdFilter));
  }
  if (fullName) {
    await optionalDelete(supabase, 'opd_queue', (query) => query.eq('doctor_name', fullName));
    await optionalDelete(supabase, 'hospital_opd_queue', (query) => query.eq('doctor_name', fullName));
  }

  await optionalDelete(supabase, 'consultations', (query) => {
    if (doctorIdFilter) return query.or(doctorIdFilter);
    return query.eq('doctor_name', fullName || '___none___');
  });

  await optionalDelete(supabase, 'patient_consultations', (query) => {
    if (doctorIdFilter) return query.or(doctorIdFilter);
    return query.eq('doctor_name', fullName || '___none___');
  });
}

async function deleteCredentialShadows(
  supabase: SupabaseClient,
  credentialId: string,
  staffCode: string,
  email: string,
): Promise<void> {
  if (credentialId && isUuidValue(credentialId)) {
    await optionalDelete(supabase, HOSPITAL_USER_CREDENTIALS_TABLE, (query) =>
      query.eq('id', credentialId),
    );
  }

  if (email) {
    await optionalDelete(supabase, HOSPITAL_USER_CREDENTIALS_TABLE, (query) => query.eq('email', email));
    await optionalDelete(supabase, HOSPITAL_STAFF_CREDENTIALS_TABLE, (query) => query.eq('email', email));
  }

  if (staffCode) {
    await optionalDelete(supabase, HOSPITAL_USER_CREDENTIALS_TABLE, (query) =>
      query.eq('employee_id', staffCode),
    );
  }
}

async function deleteDoctorRegistryRows(
  supabase: SupabaseClient,
  staffRecordId: string,
  staffCode: string,
  email: string,
): Promise<void> {
  const doctorFilters: string[] = [];
  if (staffRecordId && isHospitalUuid(staffRecordId)) {
    doctorFilters.push(`id.eq.${staffRecordId}`);
  }
  if (staffCode) {
    doctorFilters.push(`doctor_code.eq.${staffCode}`);
    doctorFilters.push(`registration_number.eq.${staffCode}`);
    doctorFilters.push(`doctor_id.eq.${staffCode}`);
  }
  if (email) {
    doctorFilters.push(`email.eq.${email}`);
  }

  if (doctorFilters.length === 0) return;

  await optionalDelete(supabase, 'doctors', (query) => query.or(doctorFilters.join(',')));
}

async function deleteHospitalStaffRow(
  supabase: SupabaseClient,
  hospitalId: string,
  staffRecordId: string,
  staffCode: string,
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  const staffFilters: string[] = [];
  if (staffRecordId) staffFilters.push(`id.eq.${staffRecordId}`);
  if (staffCode) staffFilters.push(`staff_id_code.eq.${staffCode}`);
  if (email) staffFilters.push(`email.eq.${email}`);

  if (staffFilters.length === 0) {
    return { ok: false, error: 'No linked hospital_staff record identifier.' };
  }

  const filterIds = hospitalDirectoryFilterIds(hospitalId);
  let staffDeleteQuery = supabase.from('hospital_staff').delete().or(staffFilters.join(','));
  if (filterIds.length > 0) {
    staffDeleteQuery = staffDeleteQuery.in('hospital_id', filterIds);
  }

  const { error: staffError } = await staffDeleteQuery;
  if (staffError) {
    console.error('Error hard deleting from hospital_staff:', staffError);
    return { ok: false, error: staffError.message };
  }

  return { ok: true };
}

/**
 * Permanently purge a staff/doctor credential and all linked operational rows.
 * Cleans child clinical/OPD tables first, then doctors + credential shadows, then hospital_staff.
 */
export async function permanentlyDeleteStaffCredential(
  supabase: SupabaseClient,
  hospitalId: string,
  member: PermanentDeleteTarget,
): Promise<{ ok: boolean; error?: string }> {
  const staffRecordId = String(member.staff_record_id ?? member.id ?? '').trim();
  const staffCode = String(member.staff_id_code ?? '').trim();
  const email = String(member.email ?? '').trim().toLowerCase();
  const fullName = String(member.full_name ?? '').trim();
  const credentialId = String(member.credential_id ?? '').trim();
  const isDoctor = memberLooksLikeDoctor(member);

  if (!staffRecordId && !staffCode && !email && !credentialId) {
    return { ok: false, error: 'No identifiers available for permanent deletion.' };
  }

  if (isDoctor) {
    const doctorKeys = await resolveDoctorKeys(supabase, staffRecordId, staffCode, email);
    await deleteOperationalRowsForDoctor(supabase, doctorKeys, staffCode, fullName);
  }

  if (staffRecordId && isUuidValue(staffRecordId)) {
    const rpcResult = await purgeHospitalStaffMember(supabase, staffRecordId);
    if (rpcResult.ok) {
      await deleteCredentialShadows(supabase, credentialId, staffCode, email);
      return { ok: true };
    }
    console.warn('purge_hospital_staff_member RPC note:', rpcResult.error);
  }

  await deleteCredentialShadows(supabase, credentialId, staffCode, email);

  if (isDoctor) {
    await deleteDoctorRegistryRows(supabase, staffRecordId, staffCode, email);
  }

  const staffResult = await deleteHospitalStaffRow(
    supabase,
    hospitalId,
    staffRecordId,
    staffCode,
    email,
  );
  if (!staffResult.ok) {
    return staffResult;
  }

  if (isDoctor) {
    await deleteDoctorRegistryRows(supabase, staffRecordId, staffCode, email);
  }

  return { ok: true };
}
