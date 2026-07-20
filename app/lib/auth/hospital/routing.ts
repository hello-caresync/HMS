import { APP_ROUTES } from '../../routes';
import type { InternalStaffRole, HospitalStaffProfile } from './types';
import { resolvePermissionsForRole } from './permissions';
import { findStaffByCredential, findStaffByEmployeeId } from './staffDirectory';

export function resolvePostLoginRoute(role: InternalStaffRole): string {
  switch (role) {
    case 'hospital_admin':
    case 'it_admin':
      return APP_ROUTES.hospitalDashboard;
    case 'receptionist':
    case 'front_office':
      return APP_ROUTES.appointmentsHub;
    case 'nurse':
      return APP_ROUTES.ipdHub;
    case 'lab_tech':
      return APP_ROUTES.laboratoryHub;
    case 'radiology_tech':
      return APP_ROUTES.radiologyHub;
    case 'pharmacist':
      return APP_ROUTES.pharmacyHub;
    case 'cashier':
    case 'finance_team':
      return APP_ROUTES.billingHub;
    case 'store_manager':
    case 'purchase_officer':
      return APP_ROUTES.procurementHub;
    case 'hr_team':
      return APP_ROUTES.hrHub;
    default:
      return APP_ROUTES.hospitalDashboard;
  }
}

export function buildStaffSession(
  staff: {
    employeeId: string;
    email: string;
    displayName: string;
    role: InternalStaffRole;
    department: string;
    shiftLabel: string;
  },
  authMethod: HospitalStaffProfile['authMethod'],
): HospitalStaffProfile {
  const now = new Date().toISOString();
  return {
    userId: `USR-${staff.employeeId.replace(/-/g, '')}`,
    employeeId: staff.employeeId,
    email: staff.email,
    displayName: staff.displayName,
    role: staff.role,
    department: staff.department,
    shiftLabel: staff.shiftLabel,
    permissions: resolvePermissionsForRole(staff.role),
    authMethod,
    issuedAtUtc: now,
    lastActivityAtUtc: now,
    mfaPending: false,
  };
}

export function authenticateStaff(
  identifier: string,
  password: string,
): { ok: true; session: HospitalStaffProfile } | { ok: false; error: string } {
  if (!identifier.trim() || !password) {
    return { ok: false, error: 'Employee ID / email and password are required.' };
  }

  const staff = findStaffByCredential(identifier, password);
  if (!staff) {
    return { ok: false, error: 'Invalid credentials. Access denied.' };
  }

  return { ok: true, session: buildStaffSession(staff, 'password') };
}

export function authenticateBiometricBypass(
  employeeId: string = 'EMP-3012',
): { ok: true; session: HospitalStaffProfile } | { ok: false; error: string } {
  const staff = findStaffByEmployeeId(employeeId);
  if (!staff) {
    return { ok: false, error: 'Smart-card not recognized.' };
  }

  return { ok: true, session: buildStaffSession(staff, 'biometric') };
}
