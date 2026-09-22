import { formatHospitalTenantBadge } from '@/lib/super-admin/hospital-tenants';

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

function normalizeCode(value?: string | null): string {
  return String(value ?? '').trim().toUpperCase();
}

/** Resolve display label for tenant credential counters, e.g. HOSP-01 Regal Hospital. */
export function formatTenantCredentialScopeLabel(hospital?: HospitalLike | null): string {
  if (!hospital) return 'this facility node';
  const badge = hospital.hospital_code
    ? formatHospitalTenantBadge({ hospital_code: hospital.hospital_code })
    : normalizeCode(hospital.id);
  const name = hospital.name?.trim();
  return name ? `${badge} ${name}` : badge;
}

/** Match credentials to a selected tenant by hospital_code, id, or facility name. */
export function credentialBelongsToTenant(
  credential: CredentialLike,
  hospital: HospitalLike,
): boolean {
  const credCode = normalizeCode(credential.hospital_id);
  const tenantCode = normalizeCode(hospital.hospital_code);

  if (credCode && tenantCode && credCode === tenantCode) {
    return true;
  }

  const credHospitalId = String(credential.hospital_id ?? '').trim();
  const selectedId = String(hospital.id ?? '').trim();

  if (credHospitalId && selectedId && credHospitalId === selectedId) {
    return true;
  }

  const aliasCodes = [
    hospital.hospital_code,
    hospital.facility_code,
    hospital.id,
  ]
    .map(normalizeCode)
    .filter(Boolean);

  if (credCode && aliasCodes.includes(credCode)) {
    return true;
  }

  const credName = String(credential.hospital_name ?? '').trim().toLowerCase();
  const hospitalName = String(hospital.name ?? '').trim().toLowerCase();
  return Boolean(credName && hospitalName && credName === hospitalName);
}
