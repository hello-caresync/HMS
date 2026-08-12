import { getDoctorSession, type DoctorSession } from '@/lib/doctor/session';
import { supabase } from '@/lib/supabaseClient';
import { resolveDoctorIdFromDb } from './supabase-service';

export type DoctorContext = {
  /** UUID primary key for `doctors.doctor_id` and FK columns */
  doctorUuid: string;
  /** Human-readable clinician code e.g. RH-D02 */
  employeeId: string;
  fullName: string;
  department: string;
  email?: string;
  isNotificationsEnabled: boolean;
};

const UUID_MAP_KEY = 'curasync_doctor_uuid_map';

/** Deterministic dev UUID from employee code when DB row missing */
export function employeeIdToDoctorUuid(employeeId: string): string {
  const cached = readUuidMap()[employeeId];
  if (cached) return cached;
  const hex = employeeId.replace(/\W/g, '').toLowerCase().padEnd(12, '0').slice(0, 12);
  const uuid = `d0000000-0000-4000-8000-${hex.padEnd(12, '0')}`.slice(0, 36);
  writeUuidMap({ ...readUuidMap(), [employeeId]: uuid });
  return uuid;
}

export async function ensureDoctorUuid(
  employeeId: string,
  fullName: string,
  department: string,
): Promise<string> {
  const fromDb = await resolveDoctorIdFromDb(employeeId, fullName);
  if (fromDb) {
    writeUuidMap({ ...readUuidMap(), [employeeId]: fromDb });
    return fromDb;
  }

  const cached = readUuidMap()[employeeId];
  if (cached) return cached;

  let doctorUuid = employeeIdToDoctorUuid(employeeId);

  try {
    const { data } = await supabase
      .from('doctors')
      .select('doctor_id')
      .or(`registration_number.eq.${employeeId},full_name.ilike.%${fullName}%`)
      .limit(1)
      .maybeSingle();

    if (data?.doctor_id) {
      doctorUuid = String(data.doctor_id);
    } else {
      await supabase.from('doctors').upsert(
        {
          doctor_id: doctorUuid,
          doctor_code: employeeId,
          full_name: fullName,
          department,
          registration_number: employeeId,
          is_notifications_enabled: true,
        },
        { onConflict: 'doctor_id' },
      );
    }
  } catch {
    /* offline */
  }

  writeUuidMap({ ...readUuidMap(), [employeeId]: doctorUuid });
  return doctorUuid;
}

function readUuidMap(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(UUID_MAP_KEY) || '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function writeUuidMap(map: Record<string, string>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(UUID_MAP_KEY, JSON.stringify(map));
}

/** Resolve session clinician → Supabase `doctor_id` UUID */
export async function resolveDoctorContext(
  session: DoctorSession = getDoctorSession(),
): Promise<DoctorContext> {
  const employeeId = session.employeeId;
  const fullName = session.fullName || session.doctor_name;

  let doctorUuid: string | null = null;

  try {
    doctorUuid = await resolveDoctorIdFromDb(employeeId, fullName, session.email);
  } catch {
    /* fall through */
  }

  if (!doctorUuid) {
    const cached = readUuidMap()[employeeId];
    doctorUuid = cached ?? employeeIdToDoctorUuid(employeeId);

    try {
      const { data: inserted } = await supabase
        .from('doctors')
        .upsert(
          {
            doctor_id: doctorUuid,
            doctor_code: employeeId,
            full_name: fullName,
            email: session.email || `${employeeId.toLowerCase()}@regal.local`,
            specialization: session.specialization || session.department,
            department: session.department,
            registration_number: employeeId,
            is_notifications_enabled: true,
          },
          { onConflict: 'doctor_id' },
        )
        .select('doctor_id')
        .maybeSingle();
      if (inserted?.doctor_id) doctorUuid = String(inserted.doctor_id);
    } catch {
      /* offline */
    }
  }

  writeUuidMap({ ...readUuidMap(), [employeeId]: doctorUuid });

  return {
    doctorUuid,
    employeeId,
    fullName,
    department: session.department,
    email: session.email,
    isNotificationsEnabled: true,
  };
}

export async function setDoctorAvailability(
  doctorUuid: string,
  enabled: boolean,
): Promise<void> {
  try {
    await supabase
      .from('doctors')
      .update({ is_notifications_enabled: enabled })
      .eq('doctor_id', doctorUuid);
  } catch {
    /* local toggle still works in UI */
  }
}
