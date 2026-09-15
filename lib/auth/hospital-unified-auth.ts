import { createClient } from '@supabase/supabase-js';

import {
  authenticateHospitalUser,
  credentialRoleToStaffType,
  type HospitalAuthUser,
} from '@/lib/auth/hospitalAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export type UnifiedHospitalUser = {
  id: string;
  hospital_id: string;
  hospital_name: string;
  full_name: string;
  email: string;
  phone?: string;
  department: string;
  role: string;
  staff_type: string;
  passcode: string;
  portal_access: string;
  employee_id: string;
};

export type UnifiedHospitalAuthResult =
  | { ok: true; user: UnifiedHospitalUser }
  | { ok: false; error: string };

function mapAuthUser(user: HospitalAuthUser): UnifiedHospitalUser {
  return {
    id: user.id,
    hospital_id: user.hospital_id,
    hospital_name: user.hospital_name,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    department: user.department,
    role: user.role,
    staff_type: credentialRoleToStaffType(user.role),
    passcode: user.passcode,
    portal_access: user.portal_access,
    employee_id: user.employee_id,
  };
}

/** @deprecated Prefer authenticateHospitalUser from lib/auth/hospitalAuth */
export async function authenticateUnifiedHospitalLogin(
  identifier: string,
  passcode: string,
): Promise<UnifiedHospitalAuthResult> {
  if (!supabase) {
    return { ok: false, error: 'Authentication service unavailable.' };
  }

  const result = await authenticateHospitalUser(supabase, identifier, passcode);
  if (!result.ok) return result;
  return { ok: true, user: mapAuthUser(result.user) };
}
