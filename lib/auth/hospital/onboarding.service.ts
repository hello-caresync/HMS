import { supabase } from '@/lib/supabaseClient';

import {
  type IssuedCredential,
  type OnboardingMemberDraft,
  assignedAppForRole,
} from './member-types';
import { generateSecurePassword, hashPassword } from './password-utils';
import { setStoredActiveHospitalId } from '@/lib/hospital/hospital-members.service';

export type HospitalDetailsInput = {
  hospitalName: string;
  registrationNumber: string;
  taxGstinId: string;
  officialEmail: string;
  phone: string;
  emergencyHelpline: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  totalBeds: number;
  icuBeds: number;
  opdRooms: number;
  otSuites: number;
};

export type OnboardingSaveResult =
  | {
      ok: true;
      hospitalId: string;
      credentials: IssuedCredential[];
      membersSaved: number;
      doctorsSaved: number;
    }
  | { ok: false; error: string };

const MEMBER_INSERT_BATCH_SIZE = 10;
const DEPARTMENT_INSERT_BATCH_SIZE = 10;

const PLACEHOLDER_URL_FRAGMENTS = ['placeholder.supabase.co', 'placeholder-project.supabase.co'];
const PLACEHOLDER_KEY_FRAGMENTS = ['placeholder-key', 'placeholder'];

const SUPABASE_NOT_CONFIGURED_MSG =
  'Supabase is not connected. Set valid NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the dev server.';

/** Returns true when Supabase env vars look production-ready */
export function isSupabaseEnvValid(): boolean {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

  if (!url || !key) return false;
  if (!url.startsWith('http')) return false;
  if (PLACEHOLDER_URL_FRAGMENTS.some((fragment) => url.includes(fragment))) return false;
  if (
    PLACEHOLDER_KEY_FRAGMENTS.some(
      (fragment) => key === fragment || key.toLowerCase().includes(fragment),
    )
  ) {
    return false;
  }

  return true;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** Format Supabase / network errors for toast display */
export function formatOnboardingError(context: string, err: unknown): string {
  const isFetchFailure =
    (err instanceof TypeError && err.message.toLowerCase().includes('failed to fetch')) ||
    (typeof err === 'object' &&
      err !== null &&
      'message' in err &&
      String((err as { message: string }).message)
        .toLowerCase()
        .includes('failed to fetch'));

  if (isFetchFailure) {
    return `[${context}] Network request failed (Failed to fetch). Verify NEXT_PUBLIC_SUPABASE_URL, your internet connection, and that Supabase is reachable.`;
  }

  if (err && typeof err === 'object') {
    const row = err as { message?: string; details?: string; hint?: string; code?: string };
    const parts = [row.message, row.details, row.hint, row.code].filter(Boolean);
    if (parts.length > 0) {
      return `[${context}] ${parts.join(' · ')}`;
    }
  }

  if (err instanceof Error) {
    return `[${context}] ${err.message}`;
  }

  return `[${context}] ${String(err)}`;
}

async function probeSupabaseReachable(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { error } = await supabase.from('hospitals').select('id').limit(1);
    if (error) {
      return { ok: false, error: formatOnboardingError('hospitals (connectivity probe)', error) };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatOnboardingError('hospitals (connectivity probe)', err) };
  }
}

async function createOrUpdateHospital(
  hospital: HospitalDetailsInput,
  existingHospitalId?: string | null,
): Promise<{ id: string } | { error: string }> {
  const payload = {
    hospital_name: hospital.hospitalName.trim(),
    registration_number: hospital.registrationNumber.trim(),
    tax_gstin_id: hospital.taxGstinId.trim() || null,
    official_email: hospital.officialEmail.trim().toLowerCase(),
    phone: hospital.phone.trim(),
    emergency_helpline: hospital.emergencyHelpline.trim() || null,
    address: hospital.address.trim(),
    city: hospital.city.trim(),
    state: hospital.state.trim(),
    pincode: hospital.pincode.trim(),
    total_beds: hospital.totalBeds,
    icu_beds: hospital.icuBeds,
    opd_rooms: hospital.opdRooms,
    ot_suites: hospital.otSuites,
    onboarding_completed: true,
    updated_at: new Date().toISOString(),
  };

  try {
    if (existingHospitalId && !existingHospitalId.startsWith('local-')) {
      const { data, error } = await supabase
        .from('hospitals')
        .update(payload)
        .eq('id', existingHospitalId)
        .select('id')
        .single();

      if (error) {
        return { error: formatOnboardingError('hospitals (update)', error) };
      }
      if (!data) {
        return { error: '[hospitals (update)] No row returned after update.' };
      }
      return { id: data.id as string };
    }

    const { data, error } = await supabase.from('hospitals').insert(payload).select('id').single();

    if (error) {
      return { error: formatOnboardingError('hospitals (insert)', error) };
    }
    if (!data) {
      return { error: '[hospitals (insert)] No row returned after insert.' };
    }

    return { id: data.id as string };
  } catch (err) {
    return { error: formatOnboardingError('hospitals', err) };
  }
}

async function syncDepartments(
  hospitalId: string,
  departmentNames: string[],
): Promise<Map<string, string> | { error: string }> {
  const activeDepartments = [...new Set(departmentNames.filter(Boolean))];

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('departments')
      .select('id, name')
      .eq('hospital_id', hospitalId);

    if (fetchError) {
      return { error: formatOnboardingError('departments (fetch)', fetchError) };
    }

    const departmentIdByName = new Map(
      ((existing ?? []) as { id: string; name: string }[]).map((d) => [d.name, d.id]),
    );

    const toInsert = activeDepartments
      .filter((name) => !departmentIdByName.has(name))
      .map((name) => ({
        hospital_id: hospitalId,
        name: name.trim(),
        is_active: true,
      }));

    const batches = chunkArray(toInsert, DEPARTMENT_INSERT_BATCH_SIZE);

    for (const [index, batch] of batches.entries()) {
      if (batch.length === 0) continue;

      try {
        const { data: inserted, error } = await supabase
          .from('departments')
          .insert(batch)
          .select('id, name');

        if (error) {
          return {
            error: formatOnboardingError(
              `departments (insert batch ${index + 1}/${batches.length})`,
              error,
            ),
          };
        }

        for (const row of (inserted ?? []) as { id: string; name: string }[]) {
          departmentIdByName.set(row.name, row.id);
        }
      } catch (err) {
        return {
          error: formatOnboardingError(
            `departments (insert batch ${index + 1}/${batches.length})`,
            err,
          ),
        };
      }
    }

    return departmentIdByName;
  } catch (err) {
    return { error: formatOnboardingError('departments', err) };
  }
}

async function insertMemberBatches(
  inserts: Record<string, unknown>[],
): Promise<{ ok: true } | { error: string }> {
  const batches = chunkArray(inserts, MEMBER_INSERT_BATCH_SIZE);

  for (const [index, batch] of batches.entries()) {
    if (batch.length === 0) continue;

    try {
      const { error } = await supabase.from('hospital_members').insert(batch);

      if (error) {
        return {
          error: formatOnboardingError(
            `hospital_members (insert batch ${index + 1}/${batches.length}, ${batch.length} rows)`,
            error,
          ),
        };
      }
    } catch (err) {
      return {
        error: formatOnboardingError(
          `hospital_members (insert batch ${index + 1}/${batches.length}, ${batch.length} rows)`,
          err,
        ),
      };
    }
  }

  return { ok: true };
}

async function updateMembers(
  updates: { id: string; payload: Record<string, unknown> }[],
): Promise<{ ok: true } | { error: string }> {
  for (const { id, payload } of updates) {
    try {
      const { error } = await supabase.from('hospital_members').update(payload).eq('id', id);

      if (error) {
        return { error: formatOnboardingError(`hospital_members (update ${id})`, error) };
      }
    } catch (err) {
      return { error: formatOnboardingError(`hospital_members (update ${id})`, err) };
    }
  }

  return { ok: true };
}

/** Persist hospital onboarding exclusively to Supabase (no offline fallback). */
export async function saveOnboardingData(
  hospital: HospitalDetailsInput,
  departmentNames: string[],
  members: OnboardingMemberDraft[],
  existingHospitalId?: string | null,
): Promise<OnboardingSaveResult> {
  if (members.length === 0) {
    return { ok: false, error: 'Add at least one hospital member before issuing credentials.' };
  }

  const activeDepartments = departmentNames.filter(Boolean);
  if (activeDepartments.length === 0) {
    return { ok: false, error: 'Select at least one active department.' };
  }

  if (!isSupabaseEnvValid()) {
    console.error('[onboarding]', SUPABASE_NOT_CONFIGURED_MSG);
    return { ok: false, error: SUPABASE_NOT_CONFIGURED_MSG };
  }

  const probe = await probeSupabaseReachable();
  if (!probe.ok) {
    console.error('[onboarding] Supabase unreachable:', probe.error);
    return { ok: false, error: probe.error };
  }

  try {
    const hospitalResult = await createOrUpdateHospital(hospital, existingHospitalId);
    if ('error' in hospitalResult) {
      return { ok: false, error: hospitalResult.error };
    }

    const hospitalId = hospitalResult.id;
    setStoredActiveHospitalId(hospitalId);

    const deptResult = await syncDepartments(hospitalId, activeDepartments);
    if ('error' in deptResult) {
      if (!existingHospitalId) {
        try {
          await supabase.from('hospitals').delete().eq('id', hospitalId);
        } catch {
          /* best-effort rollback */
        }
      }
      return { ok: false, error: deptResult.error };
    }

    const departmentIdByName = deptResult;
    const credentials: IssuedCredential[] = [];
    const inserts: Record<string, unknown>[] = [];
    const updates: { id: string; payload: Record<string, unknown> }[] = [];

    for (const member of members) {
      const departmentId = departmentIdByName.get(member.departmentName) ?? null;
      const basePayload = {
        hospital_id: hospitalId,
        department_id: departmentId,
        first_name: member.firstName.trim(),
        last_name: member.lastName.trim(),
        email: member.email.trim().toLowerCase(),
        phone: member.phone.trim() || null,
        employee_id: member.employeeId.trim(),
        role: member.role,
        status: 'Active',
        medical_license_number:
          member.role === 'Doctor' ? member.medicalLicenseNumber?.trim() || null : null,
        specialization: member.role === 'Doctor' ? member.specialization?.trim() || null : null,
        qualification: member.role === 'Doctor' ? member.qualification?.trim() || null : null,
        experience_years: member.role === 'Doctor' ? member.experienceYears ?? null : null,
        consultation_fee: member.role === 'Doctor' ? member.consultationFee ?? null : null,
        opd_room_number: member.role === 'Doctor' ? member.opdRoomNumber?.trim() || null : null,
        updated_at: new Date().toISOString(),
      };

      if (member.dbId) {
        updates.push({ id: member.dbId, payload: basePayload });
        continue;
      }

      const tempPassword = generateSecurePassword();
      const passwordHash = await hashPassword(tempPassword);
      inserts.push({
        ...basePayload,
        password_hash: passwordHash,
        temp_password_issued_at: new Date().toISOString(),
      });

      credentials.push({
        employeeId: member.employeeId.trim(),
        email: member.email.trim().toLowerCase(),
        fullName: `${member.firstName.trim()} ${member.lastName.trim()}`,
        role: member.role,
        temporaryPassword: tempPassword,
        assignedApp: assignedAppForRole(member.role),
      });
    }

    const insertResult = await insertMemberBatches(inserts);
    if ('error' in insertResult) {
      if (!existingHospitalId) {
        try {
          await supabase.from('hospitals').delete().eq('id', hospitalId);
        } catch {
          /* best-effort rollback */
        }
      }
      return { ok: false, error: insertResult.error };
    }

    const updateResult = await updateMembers(updates);
    if ('error' in updateResult) {
      return { ok: false, error: updateResult.error };
    }

    const doctorsSaved = members.filter((m) => m.role === 'Doctor').length;

    return {
      ok: true,
      hospitalId,
      credentials,
      membersSaved: members.length,
      doctorsSaved,
    };
  } catch (err) {
    const message = formatOnboardingError('onboarding (unexpected)', err);
    console.error('[onboarding]', message);
    return { ok: false, error: message };
  }
}

/** @deprecated Use saveOnboardingData */
export const saveHospitalOnboarding = saveOnboardingData;

export function credentialsToCsv(credentials: IssuedCredential[]): string {
  const header = 'Employee ID,Email,Full Name,Role,Temporary Password,Assigned App';
  const rows = credentials.map(
    (c) =>
      `"${c.employeeId}","${c.email}","${c.fullName}","${c.role}","${c.temporaryPassword}","${c.assignedApp}"`,
  );
  return [header, ...rows].join('\n');
}

export function credentialsToPlainText(credentials: IssuedCredential[]): string {
  return credentials
    .map(
      (c) =>
        `${c.fullName} (${c.role})\n  Employee ID: ${c.employeeId}\n  Email: ${c.email}\n  Temp Password: ${c.temporaryPassword}\n  App: ${c.assignedApp}`,
    )
    .join('\n\n');
}
