import type { SupabaseClient } from '@supabase/supabase-js';

import {
  HOSPITAL_USER_CREDENTIALS_TABLE,
  mapCredentialRow,
  type HospitalUserCredential,
} from '@/lib/auth/hospitalAuth';
import { isUuidValue } from '@/lib/hospital/doctors-directory';
import {
  buildHospitalDirectoryOrFilter,
  hospitalDirectoryFilterIds,
} from '@/lib/hospital/hospital-node';
import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';
import { isHospitalUuid, resolveHospitalUuid } from '@/lib/hospital/resolve-hospital-context';

export type GovernancePersonnelClassification =
  | 'Doctor'
  | 'Nursing'
  | 'Administration'
  | 'Ops & Triage';

export type GovernanceVaultTab =
  | 'All Entities'
  | 'Doctors'
  | 'Nursing'
  | 'Billing & Ops'
  | 'Vendors & Suppliers';

export const GOVERNANCE_VAULT_TABS: GovernanceVaultTab[] = [
  'All Entities',
  'Doctors',
  'Nursing',
  'Billing & Ops',
  'Vendors & Suppliers',
];

export type GovernanceSearchableEntity = {
  name?: string | null;
  code?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  departmentOrCategory?: string | null;
  roleOrType?: string | null;
  classification?: string | null;
  rawRole?: string | null;
  isVendor?: boolean;
};

const DOCTOR_ROLE_TERMS = ['doctor', 'physician', 'surgeon', 'clinician', 'consultant'] as const;
const NURSING_ROLE_TERMS = ['nurse', 'nursing', 'head nurse', 'head_nurse'] as const;
const BILLING_OPS_ROLE_TERMS = [
  'admin',
  'billing',
  'operations',
  'reception',
  'receptionist',
  'triage',
  'staff',
  'ops',
] as const;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export function normalizeGovernanceLookup(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function roleBlob(entity: GovernanceSearchableEntity): string {
  return normalizeGovernanceLookup(
    [entity.rawRole, entity.roleOrType, entity.classification, entity.departmentOrCategory].join(' '),
  );
}

function includesAnyTerm(haystack: string, terms: readonly string[]): boolean {
  return terms.some((term) => haystack.includes(term));
}

/** Safe, case-insensitive search across all directory identifiers. */
export function matchesGovernanceVaultSearch(
  entity: GovernanceSearchableEntity,
  query: string,
): boolean {
  const q = normalizeGovernanceLookup(query);
  if (!q) return true;

  const fields = [
    entity.name,
    entity.code,
    entity.contactPerson,
    entity.email,
    entity.phone,
    entity.departmentOrCategory,
    entity.roleOrType,
    entity.classification,
    entity.rawRole,
  ];

  return fields.some((field) => normalizeGovernanceLookup(field).includes(q));
}

/** Multi-keyword tab routing for governance vault filter buttons. */
export function matchesGovernanceVaultTab(
  entity: GovernanceSearchableEntity,
  tab: GovernanceVaultTab,
): boolean {
  if (tab === 'All Entities') return true;

  if (tab === 'Vendors & Suppliers') {
    return (
      entity.isVendor === true ||
      normalizeGovernanceLookup(entity.classification).includes('vendor') ||
      normalizeGovernanceLookup(entity.roleOrType).includes('vendor')
    );
  }

  if (entity.isVendor) return false;

  const blob = roleBlob(entity);

  if (tab === 'Doctors') {
    return (
      entity.classification === 'Doctor' ||
      includesAnyTerm(blob, DOCTOR_ROLE_TERMS)
    );
  }

  if (tab === 'Nursing') {
    return (
      entity.classification === 'Nursing' ||
      includesAnyTerm(blob, NURSING_ROLE_TERMS)
    );
  }

  if (tab === 'Billing & Ops') {
    return (
      entity.classification === 'Ops & Triage' ||
      entity.classification === 'Administration' ||
      includesAnyTerm(blob, BILLING_OPS_ROLE_TERMS)
    );
  }

  return true;
}

export function filterGovernanceDirectory<T extends GovernanceSearchableEntity>(
  items: T[],
  tab: GovernanceVaultTab,
  searchQuery: string,
): T[] {
  return items.filter(
    (item) => matchesGovernanceVaultTab(item, tab) && matchesGovernanceVaultSearch(item, searchQuery),
  );
}

export type GovernanceRevokeTarget = {
  isVendor: boolean;
  id: string;
  credentialId?: string;
  staffRecordId?: string;
  email?: string;
  code?: string;
  rawRole?: string;
  classification?: string;
  name?: string;
};

function isDoctorTarget(target: GovernanceRevokeTarget): boolean {
  if (target.classification === 'Doctor') return true;
  const blob = normalizeGovernanceLookup([target.rawRole, target.classification].join(' '));
  return includesAnyTerm(blob, DOCTOR_ROLE_TERMS);
}

/** Delete credential, linked staff/doctor rows, or vendor supplier records. */
export async function revokeGovernanceEntity(
  supabase: SupabaseClient,
  target: GovernanceRevokeTarget,
): Promise<{ ok: boolean; error?: string }> {
  const email = target.email?.trim().toLowerCase();
  const employeeCode = target.code?.trim().toUpperCase();
  let lastError: string | null = null;

  if (target.isVendor) {
    if (target.credentialId && isUuidValue(target.credentialId)) {
      const { error } = await supabase
        .from(HOSPITAL_USER_CREDENTIALS_TABLE)
        .delete()
        .eq('id', target.credentialId);
      if (error) lastError = error.message;
    } else if (email) {
      const { error } = await supabase
        .from(HOSPITAL_USER_CREDENTIALS_TABLE)
        .delete()
        .eq('email', email);
      if (error) lastError = error.message;
    }

    if (target.id && isUuidValue(target.id)) {
      const { error } = await supabase.from('vendors').delete().eq('id', target.id);
      if (!error) return { ok: true };
      lastError = error.message;
    }

    if (email) {
      const { error } = await supabase.from('vendors').delete().eq('email', email);
      if (!error) return { ok: true };
      return { ok: false, error: error.message ?? lastError ?? 'Could not delete vendor record.' };
    }

    return { ok: false, error: lastError ?? 'Invalid vendor record identifier.' };
  }

  if (target.credentialId && isUuidValue(target.credentialId)) {
    const { error } = await supabase
      .from(HOSPITAL_USER_CREDENTIALS_TABLE)
      .delete()
      .eq('id', target.credentialId);
    if (error) lastError = error.message;
  } else if (email) {
    const { error } = await supabase.from(HOSPITAL_USER_CREDENTIALS_TABLE).delete().eq('email', email);
    if (error) lastError = error.message;
  }

  if (target.staffRecordId && isUuidValue(target.staffRecordId)) {
    const { error } = await supabase.from('hospital_staff').delete().eq('id', target.staffRecordId);
    if (error) lastError = error.message;
  } else if (email) {
    const { error } = await supabase.from('hospital_staff').delete().eq('email', email);
    if (error) lastError = error.message;
  } else if (employeeCode) {
    const { error } = await supabase.from('hospital_staff').delete().eq('staff_id_code', employeeCode);
    if (error) lastError = error.message;
  }

  if (isDoctorTarget(target)) {
    if (email) {
      const { error } = await supabase.from('doctors').delete().eq('email', email);
      if (error) lastError = error.message;
    }
    if (employeeCode) {
      const byCode = await supabase.from('doctors').delete().eq('doctor_code', employeeCode);
      if (byCode.error) lastError = byCode.error.message;
      const byReg = await supabase.from('doctors').delete().eq('registration_number', employeeCode);
      if (byReg.error && !byCode.error) lastError = byReg.error.message;
    }
  }

  if (lastError && !email && !target.credentialId && !target.staffRecordId && !employeeCode) {
    return { ok: false, error: lastError };
  }

  return { ok: true };
}

/** Case-insensitive role bucket for governance vault tabs and stat cards. */
export function classifyGovernancePersonnelRole(role?: string | null): GovernancePersonnelClassification {
  const normalized = String(role ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (
    normalized.includes('doc') ||
    normalized.includes('clinician') ||
    normalized === 'physician' ||
    normalized === 'surgeon' ||
    normalized === 'consultant'
  ) {
    return 'Doctor';
  }
  if (normalized.includes('nurs')) return 'Nursing';
  if (normalized.includes('admin')) return 'Administration';
  return 'Ops & Triage';
}

export function governanceRoleDisplayLabel(
  classification: GovernancePersonnelClassification,
  rawRole?: string | null,
): string {
  if (classification === 'Doctor') return 'Doctor';
  if (classification === 'Nursing') return 'Nurse';
  if (classification === 'Administration') return 'Admin';
  const normalized = String(rawRole ?? '').trim();
  if (/billing/i.test(normalized)) return 'Billing Desk';
  if (/reception/i.test(normalized)) return 'Receptionist';
  return 'Staff';
}

async function resolveGovernanceHospitalFilters(
  supabase: SupabaseClient,
  preferredHospitalId?: string,
): Promise<string[]> {
  const values = new Set(hospitalDirectoryFilterIds(preferredHospitalId));
  values.add('ROOT-HQ');

  const preferred = preferredHospitalId?.trim();
  const uuid = preferred && isHospitalUuid(preferred)
    ? preferred
    : await resolveHospitalUuid(supabase, preferred ?? HOSPITAL_TENANT_ID);

  if (uuid) values.add(uuid);

  return Array.from(values);
}

/** Fetch personnel credentials for the governance vault (includes inactive rows). */
export async function fetchGovernancePersonnelCredentials(
  supabase: SupabaseClient,
  hospitalId?: string,
): Promise<HospitalUserCredential[]> {
  const filters = await resolveGovernanceHospitalFilters(supabase, hospitalId);

  const scoped = await supabase
    .from(HOSPITAL_USER_CREDENTIALS_TABLE)
    .select('*')
    .or(buildHospitalDirectoryOrFilter(filters))
    .order('created_at', { ascending: false });

  let rows = scoped.data;
  if (scoped.error || !Array.isArray(rows) || rows.length === 0) {
    const fallback = await supabase
      .from(HOSPITAL_USER_CREDENTIALS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    rows = fallback.error ? null : fallback.data;
  }

  if (!Array.isArray(rows)) return [];

  const seen = new Set<string>();
  const next: HospitalUserCredential[] = [];
  for (const row of rows) {
    const credential = mapCredentialRow(asRecord(row));
    const key = credential.email || credential.id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    next.push(credential);
  }

  return next;
}

export type GovernanceDirectoryStats = {
  total: number;
  clinicians: number;
  triage: number;
  vendors: number;
  active: number;
};

export function computeGovernanceDirectoryStats(
  personnel: Array<{ classification: GovernancePersonnelClassification; isActive: boolean }>,
  vendorCount: number,
): GovernanceDirectoryStats {
  const clinicians = personnel.filter((row) => row.classification === 'Doctor').length;
  const triage = personnel.filter(
    (row) => row.classification === 'Nursing' || row.classification === 'Ops & Triage',
  ).length;

  return {
    total: personnel.length + vendorCount,
    clinicians,
    triage,
    vendors: vendorCount,
    active: personnel.filter((row) => row.isActive).length + vendorCount,
  };
}
