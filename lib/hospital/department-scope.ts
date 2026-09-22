import type { StaffPortalSession } from '@/lib/auth/ecosystem-sessions';
import { canManageStaffCredentials, isHospitalCredentialAdmin } from '@/lib/auth/hospital-rbac';

/** Tenant + department context injected at hospital login. */
export type DeskScopeContext = {
  id: string;
  hospitalId: string;
  staffType: string;
  department: string;
  staffIdCode: string;
  email: string;
};

export function normalizeDepartmentName(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[\s_-]+/g, ' ');
}

export function departmentsMatch(
  recordDepartment: string | null | undefined,
  userDepartment: string,
): boolean {
  const record = normalizeDepartmentName(recordDepartment);
  const user = normalizeDepartmentName(userDepartment);
  if (!record || !user) return false;
  if (record === user) return true;
  return record.includes(user) || user.includes(record);
}

/** Hospital-wide desk visibility — Admin / Super Admin only (not generic "admin" substring). */
export function isPlatformDeskAdmin(staffType: string | null | undefined): boolean {
  return isHospitalCredentialAdmin(staffType);
}

export function isDeskWideHospitalAdmin(
  session?: { staff_type?: string | null; role?: string | null } | null,
): boolean {
  return canManageStaffCredentials(session);
}

export function buildDeskScopeFromSession(session: StaffPortalSession | null): DeskScopeContext | null {
  if (!session?.hospital_id || !session.email) return null;
  return {
    id: session.id,
    hospitalId: session.hospital_id,
    staffType: session.staff_type,
    department: session.department || '',
    staffIdCode: session.staff_id_code || '',
    email: session.email,
  };
}

export function canViewBillingModule(scope: DeskScopeContext | null): boolean {
  if (!scope) return false;
  if (isPlatformDeskAdmin(scope.staffType)) return true;
  const dept = normalizeDepartmentName(scope.department);
  return (
    dept.includes('billing') ||
    dept.includes('administration') ||
    dept.includes('finance') ||
    dept.includes('accounts')
  );
}

export function canViewSupplyModule(scope: DeskScopeContext | null): boolean {
  if (!scope) return false;
  if (isPlatformDeskAdmin(scope.staffType)) return true;
  const dept = normalizeDepartmentName(scope.department);
  return (
    dept.includes('procurement') ||
    dept.includes('supplies') ||
    dept.includes('supply') ||
    dept.includes('vendor') ||
    dept.includes('administration')
  );
}

export function canViewIpdModule(scope: DeskScopeContext | null): boolean {
  if (!scope) return false;
  if (isPlatformDeskAdmin(scope.staffType)) return true;
  const dept = normalizeDepartmentName(scope.department);
  return (
    dept.includes('nursing') ||
    dept.includes('inpatient') ||
    dept.includes('admission') ||
    dept.includes('administration') ||
    dept.includes('ipd')
  );
}

export function canViewEmergencyModule(scope: DeskScopeContext | null): boolean {
  if (!scope) return false;
  if (isPlatformDeskAdmin(scope.staffType)) return true;
  const dept = normalizeDepartmentName(scope.department);
  return (
    dept.includes('emergency') ||
    dept.includes('medicine') ||
    dept.includes('administration') ||
    dept.includes('nursing')
  );
}

export function rowMatchesDepartmentScope(
  row: Record<string, unknown>,
  scope: DeskScopeContext,
): boolean {
  if (isPlatformDeskAdmin(scope.staffType)) return true;
  const dept =
    row.department ??
    row.dept ??
    row.clinical_department ??
    row.assigned_department ??
    row.created_by_department;
  return departmentsMatch(String(dept ?? ''), scope.department);
}

export function filterRowsByDepartmentScope<T extends Record<string, unknown>>(
  rows: T[],
  scope: DeskScopeContext | null,
): T[] {
  if (!scope || isPlatformDeskAdmin(scope.staffType)) return rows;
  return rows.filter((row) => rowMatchesDepartmentScope(row, scope));
}

export function filterByDepartmentField<T>(
  rows: T[],
  scope: DeskScopeContext | null,
  readDepartment: (row: T) => string | null | undefined,
): T[] {
  if (!scope || isPlatformDeskAdmin(scope.staffType)) return rows;
  return rows.filter((row) => departmentsMatch(readDepartment(row), scope.department));
}
