import { supabase } from '@/lib/supabase';

import type { DoctorSession } from './session';

export type HospitalDoctorRow = {
  doctor_id: string;
  doctor_name: string;
  email: string | null;
  department: string | null;
  specialization: string | null;
  passcode: string;
  portal_route?: string | null;
  hospital_code?: string | null;
  is_active?: boolean | null;
};

export type DoctorAuthResult =
  | { ok: true; doctor: HospitalDoctorRow; session: DoctorSession }
  | { ok: false; error: string };

function buildSession(doctor: HospitalDoctorRow): DoctorSession {
  return {
    doctorId: doctor.doctor_id,
    doctorName: doctor.doctor_name,
    department: doctor.department ?? undefined,
    specialization: doctor.specialization ?? 'Consultant Specialist',
    email: doctor.email ?? undefined,
    hospitalCode: doctor.hospital_code ?? 'RH-BLR-01',
    portalRoute: doctor.portal_route ?? '/doctor/dashboard',
    loggedInAt: new Date().toISOString(),
  };
}

/** Resolve clinician by official email or RH-D## doctor ID. */
export async function lookupHospitalDoctor(
  identifier: string,
): Promise<{ doctor: HospitalDoctorRow | null; error: string | null }> {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return { doctor: null, error: 'Identifier required.' };
  }

  const emailCandidate = trimmed.toLowerCase();
  const idCandidate = trimmed.toUpperCase();

  const { data: byEmail, error: emailError } = await supabase
    .from('hospital_doctors')
    .select('*')
    .ilike('email', emailCandidate)
    .maybeSingle();

  if (byEmail) {
    return { doctor: byEmail as HospitalDoctorRow, error: null };
  }

  const { data: byId, error: idError } = await supabase
    .from('hospital_doctors')
    .select('*')
    .ilike('doctor_id', idCandidate)
    .maybeSingle();

  if (byId) {
    return { doctor: byId as HospitalDoctorRow, error: null };
  }

  const message = emailError?.message || idError?.message || null;
  return { doctor: null, error: message };
}

async function lookupDoctorFromStaffCredentials(
  identifier: string,
  passcode: string,
): Promise<DoctorAuthResult> {
  const cleanEmail = identifier.trim().toLowerCase();
  const cleanId = identifier.trim();

  const { data: byEmail } = await supabase
    .from('hospital_staff_credentials')
    .select('*')
    .eq('staff_type', 'Doctor')
    .eq('email', cleanEmail)
    .maybeSingle();

  const { data: byId } = byEmail
    ? { data: byEmail }
    : await supabase
        .from('hospital_staff_credentials')
        .select('*')
        .eq('staff_type', 'Doctor')
        .eq('id', cleanId)
        .maybeSingle();

  const data = byEmail ?? byId;

  if (!data) {
    return { ok: false, error: 'Clinician ID or Email not found in hospital registry.' };
  }

  const row = data as Record<string, unknown>;
  const stored = String(row.temporary_passcode ?? row.passcode ?? '');
  const name = String(row.full_name ?? 'Clinician');

  if (stored !== passcode) {
    return { ok: false, error: `Invalid passcode for ${name}. Access denied.` };
  }

  const doctor: HospitalDoctorRow = {
    doctor_id: String(row.id ?? cleanId),
    doctor_name: name,
    email: String(row.email ?? cleanEmail),
    department: String(row.department ?? 'Clinical'),
    specialization: String(row.department ?? 'Consultant Specialist'),
    passcode: stored,
    portal_route: '/doctor/dashboard',
    hospital_code: String(row.hospital_id ?? 'RH-BLR-01'),
    is_active: String(row.status ?? 'Active') !== 'Restricted',
  };

  return { ok: true, doctor, session: buildSession(doctor) };
}

export async function authenticateHospitalDoctor(
  identifier: string,
  passcode: string,
): Promise<DoctorAuthResult> {
  const cleanPass = passcode.trim();
  if (!cleanPass) {
    return { ok: false, error: 'Security passcode is required.' };
  }

  const { doctor, error } = await lookupHospitalDoctor(identifier);

  if (error && !doctor) {
    console.warn('hospital_doctors lookup:', error);
  }

  if (!doctor) {
    return lookupDoctorFromStaffCredentials(identifier, cleanPass);
  }

  if (doctor.passcode !== cleanPass) {
    const staffFallback = await lookupDoctorFromStaffCredentials(identifier, cleanPass);
    if (staffFallback.ok) return staffFallback;
    return {
      ok: false,
      error: `Invalid passcode for ${doctor.doctor_name}. Access denied.`,
    };
  }

  return { ok: true, doctor, session: buildSession(doctor) };
}
