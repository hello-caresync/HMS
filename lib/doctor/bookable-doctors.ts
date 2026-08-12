import { supabase } from '@/lib/supabaseClient';
import { ensureDoctorUuid } from '@/lib/doctor/command-center/doctor-context';
import {
  REGAL_DOCTORS,
  REGAL_DOCTORS_BY_DEPARTMENT,
  type RegalDoctor,
} from '@/lib/doctor/regal-doctors';

/** Clinician roster entry with canonical Supabase `doctors.doctor_id` UUID for booking. */
export type BookableDoctor = RegalDoctor & {
  doctor_id: string;
};

const uuidByRegistration = new Map<string, string>();

/** Load Regal roster merged with `doctors.doctor_id` UUIDs (never book by name/code alone). */
export async function loadBookableDoctors(): Promise<BookableDoctor[]> {
  let dbRows: Array<{ doctor_id: string; registration_number?: string | null }> = [];

  try {
    const { data } = await supabase
      .from('doctors')
      .select('doctor_id, doctor_code, registration_number, full_name, department');
    if (data?.length) dbRows = data;
  } catch {
    /* offline — resolve per clinician below */
  }

  for (const row of dbRows) {
    if (row.registration_number && row.doctor_id) {
      uuidByRegistration.set(row.registration_number, String(row.doctor_id));
    }
  }

  const bookable: BookableDoctor[] = [];

  for (const doc of REGAL_DOCTORS) {
    let doctor_id = uuidByRegistration.get(doc.employeeId);

    if (!doctor_id) {
      doctor_id = await ensureDoctorUuid(doc.employeeId, doc.name, doc.department);
      uuidByRegistration.set(doc.employeeId, doctor_id);
    }

    bookable.push({ ...doc, doctor_id });
  }

  return bookable;
}

export function groupBookableDoctorsByDepartment(
  doctors: BookableDoctor[],
): Record<string, BookableDoctor[]> {
  return doctors.reduce<Record<string, BookableDoctor[]>>((acc, doc) => {
    (acc[doc.department] ??= []).push(doc);
    return acc;
  }, {});
}

export function getInitialBookableDirectory(): Record<string, BookableDoctor[]> {
  return REGAL_DOCTORS_BY_DEPARTMENT as unknown as Record<string, BookableDoctor[]>;
}

/** Fetch a single clinician by canonical Supabase `doctors.doctor_id` UUID. */
export async function fetchDoctorByUuid(doctorId: string): Promise<BookableDoctor | null> {
  if (!doctorId) return null;

  const bookable = await loadBookableDoctors();
  const fromRoster = bookable.find((d) => d.doctor_id === doctorId);
  if (fromRoster) return fromRoster;

  try {
    const { data: row } = await supabase
      .from('doctors')
      .select('doctor_id, doctor_code, registration_number, full_name, department, specialization')
      .eq('doctor_id', doctorId)
      .maybeSingle();

    if (!row?.doctor_id) return null;

    const code = row.registration_number ?? row.doctor_code ?? '';
    const rosterMatch = REGAL_DOCTORS.find((d) => d.employeeId === code);

    return {
      employeeId: code || 'DOC',
      name: row.full_name,
      department: row.department ?? rosterMatch?.department ?? 'General Medicine',
      specialization: row.specialization ?? rosterMatch?.specialization ?? 'Consultant',
      fee: rosterMatch?.fee ?? 600,
      slots: rosterMatch?.slots ?? ['09:00 AM', '11:00 AM', '02:00 PM', '04:30 PM'],
      doctor_id: String(row.doctor_id),
    };
  } catch {
    return null;
  }
}
