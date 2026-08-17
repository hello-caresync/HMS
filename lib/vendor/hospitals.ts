import type { HospitalPartner } from '@/lib/vendor/types/domain';

/** Consolidated view across all partner hospitals. */
export const ALL_HOSPITALS_CODE = 'NX-ALL';

export const DEFAULT_HOSPITAL_CODE = 'RH-BLR-01';

export const VENDOR_HOSPITALS: HospitalPartner[] = [
  {
    id: ALL_HOSPITALS_CODE,
    name: 'All Hospitals (Consolidated)',
    networkCode: ALL_HOSPITALS_CODE,
    city: 'Multi-site',
    activeContracts: 0,
  },
  {
    id: 'RH-BLR-01',
    name: 'Regal Hospital',
    networkCode: 'RH-BLR-01',
    city: 'Bengaluru',
    activeContracts: 4,
  },
  {
    id: 'NX-CITY',
    name: 'Nexora City Hospital',
    networkCode: 'NX-CITY',
    city: 'Mumbai',
    activeContracts: 3,
  },
  {
    id: 'NX-HEART',
    name: 'Nexora Heart Institute',
    networkCode: 'NX-HEART',
    city: 'Hyderabad',
    activeContracts: 2,
  },
  {
    id: 'NX-DIAG',
    name: 'Nexora Diagnostics Network',
    networkCode: 'NX-DIAG',
    city: 'Chennai',
    activeContracts: 5,
  },
];

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

export function hospitalNameForCode(code: string): string {
  return VENDOR_HOSPITALS.find((h) => h.networkCode === code)?.name ?? 'Regal Hospital';
}
