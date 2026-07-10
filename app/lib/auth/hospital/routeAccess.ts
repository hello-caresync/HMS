import { APP_ROUTES } from '../../routes';
import type { InternalStaffRole, StaffPermission } from './types';
import { hasAnyPermission, hasPermission } from './permissions';

/** Route → minimum permission required (undefined = any authenticated staff) */
export const ROUTE_PERMISSION_REQUIREMENTS: Partial<Record<string, StaffPermission>> = {
  [APP_ROUTES.dashboard]: 'reports_view',
  [APP_ROUTES.appointments]: 'appointments_manage',
  [APP_ROUTES.patientRegistration]: 'patients_register',
  [APP_ROUTES.ipd]: 'bed_matrix',
  [APP_ROUTES.consultation]: 'consultation_read',
  [APP_ROUTES.laboratory]: 'lab_orders',
  [APP_ROUTES.radiology]: 'radiology_orders',
  [APP_ROUTES.pharmacy]: 'pharmacy_dispense',
  [APP_ROUTES.billing]: 'billing_read',
  [APP_ROUTES.payments]: 'payments_collect',
  [APP_ROUTES.procurement]: 'procurement_manage',
  [APP_ROUTES.vendorHub]: 'vendor_hub',
  [APP_ROUTES.inventory]: 'inventory_read',
  [APP_ROUTES.hr]: 'hr_manage',
  [APP_ROUTES.reports]: 'reports_view',
  [APP_ROUTES.settings]: 'settings_manage',
  [APP_ROUTES.masterData]: 'settings_manage',
};

/** Roles that may access a route when no explicit permission is mapped */
export const ROLE_ROUTE_ALLOWLIST: Partial<Record<string, InternalStaffRole[]>> = {
  [APP_ROUTES.dashboard]: ['hospital_admin', 'finance_team', 'it_admin'],
};

export function canAccessRoute(
  permissions: StaffPermission[],
  pathname: string,
  role?: InternalStaffRole,
): boolean {
  if (hasPermission(permissions, '*')) return true;

  const allowlistEntry = Object.entries(ROLE_ROUTE_ALLOWLIST).find(
    ([route]) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (allowlistEntry && role) {
    const [, roles] = allowlistEntry;
    if (roles?.includes(role)) return true;
  }

  const matchedEntry = Object.entries(ROUTE_PERMISSION_REQUIREMENTS).find(
    ([route]) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (matchedEntry) {
    const [, required] = matchedEntry;
    return required ? hasPermission(permissions, required) : true;
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    return permissions.length > 0;
  }

  return true;
}

export function resolveAccessibleModules(permissions: StaffPermission[]): string[] {
  return Object.entries(ROUTE_PERMISSION_REQUIREMENTS)
    .filter(([, perm]) => perm && hasPermission(permissions, perm))
    .map(([route]) => route);
}

export function canPerformAction(
  permissions: StaffPermission[],
  actions: StaffPermission[],
): boolean {
  return hasAnyPermission(permissions, actions);
}
