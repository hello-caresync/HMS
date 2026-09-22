import { formatHospitalNodeBadge } from '@/lib/utils/formatters';

type HospitalLike = {
  id: string;
  name?: string;
  hospital_code?: string;
  facility_code?: string;
};

type CredentialLike = {
  hospital_id: string;
  hospital_name?: string;
};

/** Resolve display label for tenant credential counters, e.g. HOSP-01 Bengaluru Care Center. */
export function formatTenantCredentialScopeLabel(hospital?: HospitalLike | null): string {
  if (!hospital) return 'this facility node';
  const badge = formatHospitalNodeBadge(hospital);
  const name = hospital.name?.trim();
  return name ? `${badge} ${name}` : badge;
}

/** Match credentials to a selected tenant by id, code, or facility name. */
export function credentialBelongsToTenant(
  credential: CredentialLike,
  hospital: HospitalLike,
): boolean {
  const credHospitalId = String(credential.hospital_id ?? '').trim();
  const selectedId = String(hospital.id ?? '').trim();

  if (credHospitalId && selectedId && credHospitalId === selectedId) {
    return true;
  }

  const codes = [
    hospital.hospital_code,
    hospital.facility_code,
    hospital.id,
  ]
    .map((value) => String(value ?? '').trim().toUpperCase())
    .filter(Boolean);

  const credCode = credHospitalId.toUpperCase();
  if (credCode && codes.includes(credCode)) {
    return true;
  }

  const credName = String(credential.hospital_name ?? '').trim().toLowerCase();
  const hospitalName = String(hospital.name ?? '').trim().toLowerCase();
  return Boolean(credName && hospitalName && credName === hospitalName);
}
