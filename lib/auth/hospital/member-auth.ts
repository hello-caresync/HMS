import { supabase } from '@/lib/supabaseClient';

import { buildStaffSession } from '@/app/lib/auth/hospital/routing';
import type { InternalStaffRole } from '@/app/lib/auth/hospital/types';
import {
  assignedAppForRole,
  portalRoleAllowsMember,
  type HospitalMemberRecord,
  type HospitalMemberRole,
  type LoginPortalRole,
} from './member-types';
import { verifyPassword } from './password-utils';
import { saveDevSession, type DevDoctorSession } from '@/lib/doctor/auth/dev-auth';

export type MemberAuthSuccess = {
  ok: true;
  member: HospitalMemberRecord;
  departmentName: string;
  hospitalName: string;
  assignedApp: 'Doctor App' | 'Hospital App';
  staffSession: ReturnType<typeof buildStaffSession>;
  doctorSession?: DevDoctorSession;
};

export type MemberAuthFailure = {
  ok: false;
  code: 'invalid_credentials' | 'suspended' | 'inactive' | 'role_mismatch' | 'no_hospital' | 'db_error';
  error: string;
};

function mapMemberRoleToInternal(role: HospitalMemberRole): InternalStaffRole {
  switch (role) {
    case 'Admin':
      return 'hospital_admin';
    case 'Nurse':
      return 'nurse';
    case 'Receptionist':
      return 'receptionist';
    case 'Billing':
      return 'cashier';
    case 'Pharmacist':
      return 'pharmacist';
    case 'Doctor':
    default:
      return 'hospital_admin';
  }
}

export function resolveMemberPostLoginRoute(role: HospitalMemberRole): string {
  if (role === 'Doctor') return '/doctor/dashboard';
  return '/dashboard';
}

async function fetchMemberRow(identifier: string): Promise<{
  member: HospitalMemberRecord;
  departmentName: string;
  hospitalName: string;
  onboardingCompleted: boolean;
} | null> {
  const trimmed = identifier.trim();
  const normalizedEmail = trimmed.toLowerCase();

  const query = supabase
    .from('hospital_members')
    .select(
      `
      *,
      departments ( name ),
      hospitals ( hospital_name, onboarding_completed )
    `,
    );

  const { data, error } = await (normalizedEmail.includes('@')
    ? query.eq('email', normalizedEmail)
    : query.eq('employee_id', trimmed)
  ).maybeSingle();

  if (error || !data) return null;

  const row = data as HospitalMemberRecord & {
    departments: { name: string } | null;
    hospitals: { hospital_name: string; onboarding_completed: boolean } | null;
  };

  return {
    member: row,
    departmentName: row.departments?.name ?? 'General',
    hospitalName: row.hospitals?.hospital_name ?? 'Nexora Hospital',
    onboardingCompleted: row.hospitals?.onboarding_completed ?? false,
  };
}

export async function authenticateHospitalMember(
  identifier: string,
  password: string,
  portalRole: LoginPortalRole,
): Promise<MemberAuthSuccess | MemberAuthFailure> {
  if (!identifier.trim() || !password) {
    return {
      ok: false,
      code: 'invalid_credentials',
      error: 'Employee ID / email and password are required.',
    };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      ok: false,
      code: 'db_error',
      error: 'Supabase is not configured. Contact IT administration.',
    };
  }

  let fetched: Awaited<ReturnType<typeof fetchMemberRow>>;
  try {
    fetched = await fetchMemberRow(identifier);
  } catch {
    return {
      ok: false,
      code: 'db_error',
      error: 'Unable to reach authentication service. Try again shortly.',
    };
  }

  if (!fetched) {
    return {
      ok: false,
      code: 'invalid_credentials',
      error: 'Invalid credentials. Access denied.',
    };
  }

  const { member, departmentName, hospitalName, onboardingCompleted } = fetched;

  if (!onboardingCompleted) {
    return {
      ok: false,
      code: 'no_hospital',
      error: 'Hospital setup is incomplete. Ask your administrator to finish onboarding.',
    };
  }

  if (member.status === 'Suspended') {
    return {
      ok: false,
      code: 'suspended',
      error: 'Your account is suspended. Contact hospital administration.',
    };
  }

  if (member.status !== 'Active') {
    return {
      ok: false,
      code: 'inactive',
      error: 'Your account is inactive. Contact hospital administration.',
    };
  }

  const passwordValid = await verifyPassword(password, member.password_hash);
  if (!passwordValid) {
    return {
      ok: false,
      code: 'invalid_credentials',
      error: 'Invalid credentials. Access denied.',
    };
  }

  if (!portalRoleAllowsMember(portalRole, member.role)) {
    return {
      ok: false,
      code: 'role_mismatch',
      error: `This account is registered as ${member.role}. Select the correct role portal.`,
    };
  }

  const displayName = `${member.first_name} ${member.last_name}`.trim();
  const internalRole = mapMemberRoleToInternal(member.role);

  const staffSession = buildStaffSession(
    {
      employeeId: member.employee_id,
      email: member.email,
      displayName,
      role: internalRole,
      department: departmentName,
      shiftLabel: member.role === 'Doctor' ? 'Doctor Console' : 'Hospital Operations',
    },
    'password',
  );

  let doctorSession: DevDoctorSession | undefined;
  if (member.role === 'Doctor') {
    doctorSession = {
      doctorId: member.id,
      userId: member.id,
      hospitalId: member.hospital_id,
      email: member.email,
      fullName: displayName,
      specialization: member.specialization ?? 'General Medicine',
      role: 'CONSULTANT',
      licenseNumber: member.medical_license_number ?? 'PENDING',
      rememberMe: true,
      signedInAt: new Date().toISOString(),
    };
    saveDevSession(doctorSession);
  }

  return {
    ok: true,
    member,
    departmentName,
    hospitalName,
    assignedApp: assignedAppForRole(member.role),
    staffSession,
    doctorSession,
  };
}
