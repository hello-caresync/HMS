import type { SupabaseClient } from '@supabase/supabase-js';

import { hospitalIdQueryValues } from '@/lib/hospital/hospital-node';
import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';

export const WARD_OPTIONS = [
  'General Ward Male',
  'General Ward Female',
  'Intensive Care Unit (ICU)',
  'High Dependency Unit (HDU)',
  'Private Deluxe Suite',
] as const;

export const BED_STATUS_OPTIONS = ['available', 'occupied', 'maintenance', 'reserved'] as const;

export const BED_TYPE_RATES = {
  General: 1200,
  ICU: 6500,
  HDU: 4000,
  Deluxe: 4500,
} as const;

export type BedType = keyof typeof BED_TYPE_RATES;
export type BedStatus = (typeof BED_STATUS_OPTIONS)[number];

export type HospitalBed = {
  id: string;
  hospital_id: string;
  ward_name: string;
  bed_number: string;
  bed_type: BedType;
  daily_rate: number;
  status: BedStatus;
  is_occupied: boolean;
  patient_name: string;
  patient_uhid: string;
  admitted_at: string | null;
};

export type NewBedDraft = {
  ward_name: string;
  bed_number: string;
  bed_type: BedType | string;
  daily_rate: number;
};

export type BedDetailsDraft = {
  ward_name: string;
  bed_number: string;
  bed_type: BedType | string;
  daily_rate: number;
};

export type AdmitPatientDraft = {
  patient_name: string;
  patient_uhid: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function missingColumn(message: string | null | undefined): string | null {
  const text = String(message ?? '');
  return (
    text.match(/Could not find the '([^']+)' column/i)?.[1] ??
    text.match(/column (?:[\w]+\.)?([a-zA-Z0-9_]+) does not exist/i)?.[1] ??
    null
  );
}

function isUuidColumnError(message?: string | null): boolean {
  return String(message ?? '')
    .toLowerCase()
    .includes('invalid input syntax for type uuid');
}

export function inferBedTypeFromWard(ward: string): BedType {
  const value = ward.toLowerCase();
  if (value.includes('icu') || value.includes('intensive')) return 'ICU';
  if (value.includes('hdu') || value.includes('high dependency')) return 'HDU';
  if (value.includes('deluxe') || value.includes('private') || value.includes('suite')) return 'Deluxe';
  return 'General';
}

export function defaultRateForBedType(bedType: BedType): number {
  return BED_TYPE_RATES[bedType];
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function normalizeBedType(raw?: string | null, ward?: string | null): BedType {
  const value = String(raw ?? '').trim();
  if (value in BED_TYPE_RATES) return value as BedType;
  return inferBedTypeFromWard(String(ward ?? value));
}

export function normalizeBedStatus(raw?: string | null, isOccupied?: unknown): BedStatus {
  const value = String(raw ?? '').trim().toLowerCase();
  if (value === 'reserved' || value.includes('reserv')) return 'reserved';
  if (value === 'maintenance' || value.includes('maint') || value.includes('block')) return 'maintenance';
  if (value === 'occupied' || value.includes('occup') || isOccupied === true) return 'occupied';
  return 'available';
}

export function mapHospitalBed(row: Record<string, unknown>, hospitalId = HOSPITAL_TENANT_ID): HospitalBed {
  const ward = String(row.ward_name ?? row.ward ?? '').trim();
  const bedType = normalizeBedType(String(row.bed_type ?? ''), ward);
  const status = normalizeBedStatus(String(row.status ?? ''), row.is_occupied);
  const patientName = String(row.patient_name ?? '').trim();
  const patientUhid = String(row.patient_uhid ?? row.patient_id ?? row.uhid ?? '').trim();
  const admittedRaw = row.admitted_at ?? row.admission_at ?? row.allocated_at ?? null;
  return {
    id: String(row.id ?? ''),
    hospital_id: String(row.hospital_id ?? hospitalId),
    ward_name: ward,
    bed_number: String(row.bed_number ?? '').trim(),
    bed_type: bedType,
    daily_rate: Number(row.daily_rate ?? row.rate ?? defaultRateForBedType(bedType)) || 0,
    status,
    is_occupied: status === 'occupied' || row.is_occupied === true,
    patient_name: patientName,
    patient_uhid: patientUhid,
    admitted_at: admittedRaw ? String(admittedRaw) : null,
  };
}

async function writeWithColumnRetry(
  supabase: SupabaseClient,
  mode: 'insert' | 'update',
  payload: Record<string, unknown>,
  options?: { bedId?: string; hospitalId?: string },
): Promise<{ data: Record<string, unknown> | null; errorMessage: string | null }> {
  const row = { ...payload };
  const run = async () => {
    if (mode === 'insert') {
      return supabase.from('hospital_beds').insert([row]).select('*').maybeSingle();
    }
    return supabase.from('hospital_beds').update(row).eq('id', options?.bedId ?? '').select('*').maybeSingle();
  };

  let { data, error } = await run();
  let attempts = 0;
  while (error && attempts < 14) {
    const column = missingColumn(error.message);
    if (!column || !(column in row)) break;
    delete row[column];
    attempts += 1;
    const retry = await run();
    data = retry.data;
    error = retry.error;
  }

  if (error) return { data: null, errorMessage: error.message };
  return { data: data ? asRecord(data) : row, errorMessage: null };
}

function newBedPayload(hospitalId: string, draft: NewBedDraft): Record<string, unknown> {
  const ward = draft.ward_name.trim();
  const bedType = normalizeBedType(draft.bed_type, ward);
  const dailyRate = Number(draft.daily_rate) || defaultRateForBedType(bedType);
  return {
    hospital_id: hospitalId,
    ward,
    ward_name: ward,
    bed_number: draft.bed_number.trim(),
    bed_type: bedType,
    daily_rate: dailyRate,
    rate: dailyRate,
    status: 'available',
    is_occupied: false,
    patient_name: null,
    patient_uhid: null,
    patient_id: null,
    admitted_at: null,
  };
}

export async function fetchHospitalBeds(
  supabase: SupabaseClient,
  hospitalId: string,
): Promise<HospitalBed[]> {
  const nodeId = hospitalId || HOSPITAL_TENANT_ID;
  const aliases = hospitalIdQueryValues(nodeId);
  const primary = await supabase.from('hospital_beds').select('*').eq('hospital_id', nodeId);
  let rows: Record<string, unknown>[] =
    !primary.error && Array.isArray(primary.data) ? (primary.data as Record<string, unknown>[]) : [];

  if (rows.length === 0) {
    const aliased = await supabase.from('hospital_beds').select('*').in('hospital_id', aliases);
    if (!aliased.error && Array.isArray(aliased.data)) {
      rows = aliased.data as Record<string, unknown>[];
    }
  }

  return (rows as Record<string, unknown>[])
    .map((row) => mapHospitalBed(asRecord(row), nodeId))
    .filter((bed) => bed.id)
    .sort((a, b) => {
      const ward = a.ward_name.localeCompare(b.ward_name);
      if (ward !== 0) return ward;
      return a.bed_number.localeCompare(b.bed_number, undefined, { numeric: true });
    });
}

export async function insertHospitalBed(
  supabase: SupabaseClient,
  hospitalId: string,
  draft: NewBedDraft,
): Promise<{ bed?: HospitalBed; error?: string }> {
  const ward = draft.ward_name.trim();
  const bedNumber = draft.bed_number.trim();
  if (!ward || !bedNumber) return { error: 'Ward and bed number are required' };

  const nodeId = hospitalId || HOSPITAL_TENANT_ID;
  const idsToTry = [nodeId, ...hospitalIdQueryValues(nodeId).filter((id) => id !== nodeId)];
  let lastError = 'Failed to add bed';

  for (const id of idsToTry) {
    const result = await writeWithColumnRetry(supabase, 'insert', newBedPayload(id, draft));
    if (!result.errorMessage) {
      return { bed: mapHospitalBed(result.data ?? newBedPayload(id, draft), id) };
    }
    lastError = result.errorMessage;
    if (!isUuidColumnError(result.errorMessage) && !/hospital_id/i.test(result.errorMessage)) {
      break;
    }
  }

  return { error: lastError };
}

export async function updateHospitalBedDetails(
  supabase: SupabaseClient,
  hospitalId: string,
  bedId: string,
  draft: BedDetailsDraft,
): Promise<{ bed?: HospitalBed; error?: string }> {
  const ward = draft.ward_name.trim();
  const bedNumber = draft.bed_number.trim();
  if (!ward || !bedNumber) return { error: 'Ward and bed number are required' };

  const bedType = normalizeBedType(draft.bed_type, ward);
  const dailyRate = Number(draft.daily_rate) || defaultRateForBedType(bedType);
  const result = await writeWithColumnRetry(
    supabase,
    'update',
    {
      ward,
      ward_name: ward,
      bed_number: bedNumber,
      bed_type: bedType,
      daily_rate: dailyRate,
      rate: dailyRate,
      updated_at: new Date().toISOString(),
    },
    { bedId, hospitalId },
  );

  if (result.errorMessage) return { error: result.errorMessage };
  return { bed: mapHospitalBed(result.data ?? {}, hospitalId) };
}

export async function updateHospitalBedStatus(
  supabase: SupabaseClient,
  hospitalId: string,
  bedId: string,
  newStatus: BedStatus,
): Promise<{ error?: string }> {
  const occupied = newStatus === 'occupied';
  const payload: Record<string, unknown> = {
    status: newStatus,
    is_occupied: occupied,
    updated_at: new Date().toISOString(),
  };
  if (!occupied) {
    payload.patient_name = null;
    payload.patient_uhid = null;
    payload.patient_id = null;
    payload.admitted_at = null;
  }

  const result = await writeWithColumnRetry(supabase, 'update', payload, { bedId, hospitalId });
  if (result.errorMessage) return { error: result.errorMessage };
  return {};
}

export async function admitPatientToBed(
  supabase: SupabaseClient,
  hospitalId: string,
  bedId: string,
  draft: AdmitPatientDraft,
): Promise<{ error?: string }> {
  const name = draft.patient_name.trim();
  const uhid = draft.patient_uhid.trim();
  if (!name || !uhid) return { error: 'Patient name and UHID are required' };

  const now = new Date().toISOString();
  const result = await writeWithColumnRetry(
    supabase,
    'update',
    {
      status: 'occupied',
      is_occupied: true,
      patient_name: name,
      patient_uhid: uhid,
      patient_id: uhid,
      admitted_at: now,
      updated_at: now,
    },
    { bedId, hospitalId },
  );
  if (result.errorMessage) return { error: result.errorMessage };
  return {};
}

export async function dischargePatientFromBed(
  supabase: SupabaseClient,
  hospitalId: string,
  bedId: string,
): Promise<{ error?: string }> {
  const result = await writeWithColumnRetry(
    supabase,
    'update',
    {
      status: 'available',
      is_occupied: false,
      patient_name: null,
      patient_uhid: null,
      patient_id: null,
      admitted_at: null,
      updated_at: new Date().toISOString(),
    },
    { bedId, hospitalId },
  );
  if (result.errorMessage) return { error: result.errorMessage };
  return {};
}

export async function deleteHospitalBed(
  supabase: SupabaseClient,
  hospitalId: string,
  bedId: string,
): Promise<{ error?: string }> {
  const scoped = await supabase
    .from('hospital_beds')
    .delete()
    .eq('id', bedId)
    .eq('hospital_id', hospitalId);
  if (!scoped.error) return {};

  const aliases = hospitalIdQueryValues(hospitalId);
  const fallback = await supabase.from('hospital_beds').delete().eq('id', bedId).in('hospital_id', aliases);
  if (fallback.error) return { error: fallback.error.message || scoped.error.message };
  return {};
}

export function formatAdmittedAt(iso: string | null): string {
  if (!iso) return 'Admission time not recorded';
  const stamp = new Date(iso);
  if (!Number.isFinite(stamp.getTime())) return iso;
  return stamp.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function bedStatusClass(status: BedStatus): string {
  if (status === 'occupied') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (status === 'maintenance') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'reserved') return 'bg-violet-50 text-violet-700 border-violet-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}
