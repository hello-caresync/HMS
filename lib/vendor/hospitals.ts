import type { SupabaseClient } from '@supabase/supabase-js';

import { REGAL_FACILITY_CODE, REGAL_HOSPITAL_CODE, REGAL_HOSPITAL_NAME } from '@/lib/regal/constants';
import type { HospitalPartner } from '@/lib/vendor/types/domain';

/** Consolidated view across all partner hospitals. */
export const ALL_HOSPITALS_CODE = 'NX-ALL';

export const DEFAULT_HOSPITAL_CODE = REGAL_FACILITY_CODE;

export const REGAL_HOSPITAL_PARTNER: HospitalPartner = {
  id: REGAL_FACILITY_CODE,
  name: REGAL_HOSPITAL_NAME,
  networkCode: REGAL_FACILITY_CODE,
  city: 'Bengaluru',
  activeContracts: 0,
};

/** Static fallback while Supabase partner hospitals load. */
export const VENDOR_HOSPITALS: HospitalPartner[] = [
  {
    id: ALL_HOSPITALS_CODE,
    name: 'All Hospitals (Consolidated)',
    networkCode: ALL_HOSPITALS_CODE,
    city: 'Multi-site',
    activeContracts: 0,
  },
  REGAL_HOSPITAL_PARTNER,
];

function mapHospitalRow(row: Record<string, unknown>): HospitalPartner | null {
  const name = String(row.name ?? row.hospital_name ?? '').trim();
  if (!name) return null;

  const networkCode = String(
    row.hospital_code ?? row.facility_code ?? row.code ?? REGAL_HOSPITAL_CODE,
  ).trim();
  const id = String(row.id ?? networkCode).trim();

  return {
    id: networkCode || id,
    name,
    networkCode: networkCode || REGAL_FACILITY_CODE,
    city: String(row.city ?? 'Bengaluru').trim() || 'Bengaluru',
    activeContracts: Number(row.active_contracts ?? 0) || 0,
  };
}

/** Load verified partner hospitals from Supabase; fall back to Regal only. */
export async function fetchVendorPartnerHospitals(
  supabase: SupabaseClient,
): Promise<HospitalPartner[]> {
  const { data, error } = await supabase
    .from('hospitals')
    .select('id, name, hospital_code, facility_code, city')
    .order('name', { ascending: true });

  if (error || !Array.isArray(data) || data.length === 0) {
    return VENDOR_HOSPITALS;
  }

  const partners = data
    .map((row) => mapHospitalRow(row as Record<string, unknown>))
    .filter((row): row is HospitalPartner => Boolean(row));

  const deduped = new Map<string, HospitalPartner>();
  for (const partner of partners) {
    deduped.set(partner.networkCode, partner);
  }

  if (!deduped.has(REGAL_FACILITY_CODE) && !deduped.has(REGAL_HOSPITAL_CODE)) {
    deduped.set(REGAL_FACILITY_CODE, REGAL_HOSPITAL_PARTNER);
  }

  return [
    {
      id: ALL_HOSPITALS_CODE,
      name: 'All Hospitals (Consolidated)',
      networkCode: ALL_HOSPITALS_CODE,
      city: 'Multi-site',
      activeContracts: 0,
    },
    ...Array.from(deduped.values()),
  ];
}

export function resolveActiveHospitalId(
  candidate: string | undefined,
  hospitals: HospitalPartner[],
): string {
  const trimmed = String(candidate ?? '').trim();
  if (trimmed && hospitals.some((hospital) => hospital.id === trimmed)) {
    return trimmed;
  }

  return (
    hospitals.find((hospital) => hospital.networkCode === REGAL_FACILITY_CODE)?.id ??
    hospitals.find((hospital) => hospital.id !== ALL_HOSPITALS_CODE)?.id ??
    REGAL_FACILITY_CODE
  );
}

export function resolveHospitalCode(row: Record<string, unknown>): string {
  const code = row.hospital_code ?? row.facility_code;
  return code ? String(code) : DEFAULT_HOSPITAL_CODE;
}

export function matchesHospitalFilter(
  rowCode: string | undefined | null,
  filterCode: string,
): boolean {
  if (filterCode === ALL_HOSPITALS_CODE) return true;
  return (rowCode ?? DEFAULT_HOSPITAL_CODE) === filterCode;
}

export function hospitalNameForCode(code: string, hospitals = VENDOR_HOSPITALS): string {
  return hospitals.find((h) => h.networkCode === code || h.id === code)?.name ?? REGAL_HOSPITAL_NAME;
}
