import { readHospitalAppSession } from '@/lib/auth/ecosystem-sessions';
import { parseActiveSession, CURASYNC_ACTIVE_SESSION_KEY } from '@/lib/auth/active-session';
import { isHospitalAdminRole } from '@/lib/auth/hospital-admin-auth';

const ADMIN_STAFF_TYPES = new Set(['Admin', 'SuperAdmin', 'Super Admin', 'Hospital Admin']);

/** Roles allowed to access staff credential provisioning consoles. */
export function isStaffCredentialsAdmin(staffType?: string | null, role?: string | null): boolean {
  if (staffType && ADMIN_STAFF_TYPES.has(staffType.trim())) return true;
  return isHospitalAdminRole(role) || isHospitalAdminRole(staffType);
}

export function readStaffCredentialsAccess(): {
  allowed: boolean;
  staffType: string;
  hospitalId: string;
  fullName: string;
  email: string;
} {
  if (typeof window === 'undefined') {
    return { allowed: false, staffType: '', hospitalId: '', fullName: '', email: '' };
  }

  const session = readHospitalAppSession();
  const active = parseActiveSession(localStorage.getItem(CURASYNC_ACTIVE_SESSION_KEY));
  const staffType = session?.staff_type || active?.staff_type || '';
  const role =
    (session as { role?: string } | null)?.role ||
    (active as { role?: string } | null)?.role ||
    staffType;

  return {
    allowed: isStaffCredentialsAdmin(staffType, role),
    staffType,
    hospitalId: session?.hospital_id || active?.hospital_id || 'HOSP-01',
    fullName: session?.full_name || active?.full_name || '',
    email: session?.email || active?.email || '',
  };
}
