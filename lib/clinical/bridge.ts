import { supabase } from '@/lib/supabaseClient';
import { PATIENT_APPOINTMENTS_UUID } from '@/lib/patient/constants';
import type {
  BookOpdInput,
  ClinicalAdviceMessage,
  ClinicalNote,
  OpdQueueItem,
  QueueStatus,
} from './types';

export const CLINICAL_STORAGE = {
  opdQueue: 'curasync_opd_queue',
  clinicalNotes: 'curasync_clinical_notes',
  issuedPrescriptions: 'curasync_issued_prescriptions',
  messages: 'curasync_messages',
  patientId: 'curasync_patient_id',
} as const;

export const DEFAULT_PATIENT_ID = PATIENT_APPOINTMENTS_UUID;

function isBrowser() {
  return typeof window !== 'undefined';
}

function formatError(err: unknown): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object') {
    const e = err as { message?: string; details?: string; code?: string };
    return [e.message, e.details, e.code].filter(Boolean).join(' · ') || 'Request failed';
  }
  return 'Request failed';
}

export function readJsonLocal<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJsonLocal<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function resolveActivePatientId(): string {
  if (!isBrowser()) return DEFAULT_PATIENT_ID;
  const stored = window.localStorage.getItem(CLINICAL_STORAGE.patientId);
  if (stored && /^[0-9a-f-]{36}$/i.test(stored)) return stored;
  return DEFAULT_PATIENT_ID;
}

export function ensurePatientIdPersisted(id: string = DEFAULT_PATIENT_ID): string {
  if (isBrowser()) {
    window.localStorage.setItem(CLINICAL_STORAGE.patientId, id);
  }
  return id;
}

function normalizeQueueRow(row: Record<string, unknown>): OpdQueueItem {
  const vitalsRaw = row.vitals;
  const vitals =
    vitalsRaw && typeof vitalsRaw === 'object'
      ? (vitalsRaw as OpdQueueItem['vitals'])
      : {
          bp: (row.vitals_bp as string) || '120/80',
          hr: (row.vitals_hr as string) || '72 bpm',
          spo2: (row.vitals_spo2 as string) || '98%',
        };

  let allergies: string[] = [];
  if (Array.isArray(row.allergies)) allergies = row.allergies as string[];
  else if (typeof row.allergies === 'string' && row.allergies.trim()) {
    allergies = row.allergies.split(',').map((s) => s.trim());
  }

  const statusRaw = String(row.status || 'SCHEDULED').toUpperCase();
  const status: QueueStatus =
    statusRaw === 'IN_PROGRESS' || statusRaw === 'CALLED'
      ? 'IN_PROGRESS'
      : statusRaw === 'COMPLETED'
        ? 'COMPLETED'
        : statusRaw === 'CANCELLED'
          ? 'CANCELLED'
          : 'SCHEDULED';

  return {
    id: String(row.id),
    token_number: String(row.token_number ?? ''),
    patient_id: String(row.patient_id || DEFAULT_PATIENT_ID),
    patient_name: String(row.patient_name || 'Patient'),
    doctor_id: String(row.doctor_id || row.doctor_employee_id || ''),
    doctor_name: String(row.doctor_name || ''),
    age: Number(row.age ?? row.patient_age ?? 0),
    gender: String(row.gender || row.patient_gender || 'Unknown'),
    blood_group: (row.blood_group as string) || null,
    diagnosis: (row.diagnosis as string) || null,
    vitals,
    allergies,
    priority: (String(row.priority || 'ROUTINE').toUpperCase() as OpdQueueItem['priority']) || 'ROUTINE',
    status,
    appointment_date: row.appointment_date as string | undefined,
    slot_time: (row.slot_time as string) || null,
    department: (row.department as string) || null,
    hospital_name: (row.hospital_name as string) || 'Regal Hospital',
    created_at: row.created_at as string | undefined,
  };
}

/** Dual-write booking into opd_queue (+ local cache) for the selected clinician. */
export async function enqueuePatientForDoctor(input: BookOpdInput): Promise<OpdQueueItem> {
  const token = String(input.tokenNumber);
  const doctorUuid = input.doctorId;
  const localId = `opq_${Date.now()}`;
  const row: OpdQueueItem = {
    id: localId,
    token_number: token,
    patient_id: input.patientId,
    patient_name: input.patientName,
    doctor_id: doctorUuid,
    doctor_name: input.doctorName,
    age: input.age ?? 32,
    gender: input.gender ?? 'Female',
    blood_group: input.bloodGroup ?? 'O+',
    diagnosis: null,
    vitals: { bp: '120/80', hr: '72 bpm', spo2: '98%' },
    allergies: input.allergies ?? [],
    priority: input.priority ?? 'ROUTINE',
    status: 'SCHEDULED',
    appointment_date: input.appointmentDate,
    slot_time: input.slotTime,
    department: input.department,
    hospital_name: input.hospitalName,
    created_at: new Date().toISOString(),
  };

  const local = readJsonLocal<OpdQueueItem[]>(CLINICAL_STORAGE.opdQueue, []);
  writeJsonLocal(CLINICAL_STORAGE.opdQueue, [row, ...local]);

  if (input.appointmentId) {
    return row;
  }

  const syncCanonicalOpd = async (source: OpdQueueItem, uuid: string) => {
    try {
      let appointmentId = input.appointmentId;

      if (!appointmentId) {
        const { data: appt } = await supabase
          .from('appointments')
          .insert({
            patient_id: source.patient_id,
            doctor_id: uuid,
            department: source.department,
            reason_for_visit: input.reasonForVisit || 'OPD consultation',
            appointment_date: source.appointment_date,
            appointment_time: source.slot_time,
            status: 'WAITING',
          })
          .select('appointment_id')
          .maybeSingle();
        appointmentId = appt?.appointment_id ? String(appt.appointment_id) : undefined;
      }

      await supabase.from('opd_tokens').insert({
        appointment_id: appointmentId,
        token_number: source.token_number,
        patient_id: source.patient_id,
        doctor_id: uuid,
        sequence_number: Number(source.token_number) || 1,
        status: 'ISSUED',
        estimated_wait_minutes: 15,
      });
    } catch (canonicalErr) {
      console.warn('Canonical OPD sync notice:', formatError(canonicalErr));
    }
  };

  try {
    const { data, error } = await supabase
      .from('opd_queue')
      .insert({
        token_number: row.token_number,
        patient_id: row.patient_id,
        patient_name: row.patient_name,
        doctor_id: doctorUuid,
        doctor_name: row.doctor_name,
        age: row.age,
        gender: row.gender,
        blood_group: row.blood_group,
        vitals: row.vitals,
        allergies: row.allergies,
        priority: row.priority,
        status: 'SCHEDULED',
        appointment_date: row.appointment_date,
        slot_time: row.slot_time,
        department: row.department,
        hospital_name: row.hospital_name,
      })
      .select('*')
      .maybeSingle();

    if (error) {
      console.warn('opd_queue sync notice:', formatError(error));
      await syncCanonicalOpd(row, doctorUuid);
    } else if (data) {
      const normalized = normalizeQueueRow(data as Record<string, unknown>);
      writeJsonLocal(
        CLINICAL_STORAGE.opdQueue,
        [normalized, ...local.filter((x) => x.id !== localId)],
      );
      await syncCanonicalOpd(normalized, doctorUuid);
      return normalized;
    }
  } catch (err) {
    console.warn('opd_queue sync notice:', formatError(err));
    await syncCanonicalOpd(row, doctorUuid);
  }

  return row;
}

/** Doctor deck: only tokens for the logged-in clinician (RH-Dxx). */
export async function fetchDoctorOpdQueue(doctorId: string): Promise<OpdQueueItem[]> {
  const localAll = readJsonLocal<OpdQueueItem[]>(CLINICAL_STORAGE.opdQueue, []);
  let list = localAll.filter((q) => q.doctor_id === doctorId);

  try {
    const { data, error } = await supabase
      .from('opd_queue')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const remote = data.map((row: Record<string, unknown>) => normalizeQueueRow(row));
      const map = new Map<string, OpdQueueItem>();
      for (const item of [...list, ...remote]) map.set(item.id, item);
      list = Array.from(map.values()).sort((a, b) =>
        String(a.created_at || '').localeCompare(String(b.created_at || '')),
      );
      // Merge into local cache (keep other doctors' rows)
      const others = localAll.filter((q) => q.doctor_id !== doctorId);
      writeJsonLocal(CLINICAL_STORAGE.opdQueue, [...others, ...list]);
    }
  } catch (err) {
    console.warn('Doctor queue fetch notice:', formatError(err));
  }

  return list;
}

export async function updateOpdQueueStatus(
  id: string,
  doctorId: string,
  status: QueueStatus,
): Promise<void> {
  const localAll = readJsonLocal<OpdQueueItem[]>(CLINICAL_STORAGE.opdQueue, []);
  const next = localAll.map((item) => {
    if (item.id === id) return { ...item, status };
    if (
      status === 'IN_PROGRESS' &&
      item.doctor_id === doctorId &&
      item.id !== id &&
      item.status === 'IN_PROGRESS'
    ) {
      return { ...item, status: 'COMPLETED' as const };
    }
    return item;
  });
  writeJsonLocal(CLINICAL_STORAGE.opdQueue, next);

  try {
    const { error } = await supabase.from('opd_queue').update({ status }).eq('id', id);
    if (error) console.warn('Queue status sync notice:', formatError(error));

    if (status === 'IN_PROGRESS') {
      await supabase
        .from('opd_queue')
        .update({ status: 'COMPLETED' })
        .eq('doctor_id', doctorId)
        .eq('status', 'IN_PROGRESS')
        .neq('id', id);
    }
  } catch (err) {
    console.warn('Queue status sync notice:', formatError(err));
  }
}

export type DispatchPrescriptionInput = {
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department?: string;
  queueId?: string;
  diagnosisDisease: string;
  prescription: string;
  clinicalAdvice: string;
};

/** Insert clinical_notes + mirror local Rx cache + optional advice message. */
export async function dispatchPrescriptionAndAdvice(
  input: DispatchPrescriptionInput,
): Promise<{ note: ClinicalNote; adviceMessage: ClinicalAdviceMessage | null }> {
  const createdAt = new Date().toISOString();
  const note: ClinicalNote = {
    id: `note_${Date.now()}`,
    patient_id: input.patientId,
    doctor_id: input.doctorId,
    doctor_name: input.doctorName,
    diagnosis_disease: input.diagnosisDisease,
    prescription: input.prescription,
    clinical_advice: input.clinicalAdvice,
    queue_id: input.queueId || null,
    department: input.department || null,
    created_at: createdAt,
  };

  const notes = readJsonLocal<ClinicalNote[]>(CLINICAL_STORAGE.clinicalNotes, []);
  writeJsonLocal(CLINICAL_STORAGE.clinicalNotes, [note, ...notes]);

  // Mirror shape used by Patient Prescriptions UI
  const issued = readJsonLocal<Record<string, unknown>[]>(CLINICAL_STORAGE.issuedPrescriptions, []);
  writeJsonLocal(CLINICAL_STORAGE.issuedPrescriptions, [
    {
      id: note.id,
      patient_id: note.patient_id,
      doctor_name: note.doctor_name,
      doctor_id: note.doctor_id,
      department: note.department || 'OPD',
      medication_name: note.prescription.split('\n')[0] || 'e-Prescription',
      dosage: note.diagnosis_disease || 'As directed',
      instructions: note.prescription,
      clinical_advice: note.clinical_advice,
      diagnosis_disease: note.diagnosis_disease,
      duration: 'As advised',
      date_prescribed: new Date(createdAt).toLocaleDateString(),
      created_at: createdAt,
    },
    ...issued,
  ]);

  try {
    const { data, error } = await supabase
      .from('clinical_notes')
      .insert({
        patient_id: note.patient_id,
        doctor_id: note.doctor_id,
        doctor_name: note.doctor_name,
        diagnosis_disease: note.diagnosis_disease,
        prescription: note.prescription,
        clinical_advice: note.clinical_advice,
        queue_id: note.queue_id,
        department: note.department,
      })
      .select('*')
      .maybeSingle();

    if (error) console.warn('clinical_notes sync notice:', formatError(error));
    else if (data?.id) note.id = String(data.id);
  } catch (err) {
    console.warn('clinical_notes sync notice:', formatError(err));
  }

  let adviceMessage: ClinicalAdviceMessage | null = null;
  if (input.clinicalAdvice.trim()) {
    adviceMessage = {
      id: `msg_${Date.now()}`,
      patient_id: input.patientId,
      patient_name: input.patientName,
      doctor_id: input.doctorId,
      doctor_name: input.doctorName,
      message: `Clinical advice: ${input.clinicalAdvice.trim()}`,
      priority: 'high',
      sender_type: 'doctor',
      created_at: createdAt,
    };

    const msgs = readJsonLocal<ClinicalAdviceMessage[]>(CLINICAL_STORAGE.messages, []);
    writeJsonLocal(CLINICAL_STORAGE.messages, [adviceMessage, ...msgs]);

    try {
      const { error } = await supabase.from('patient_messages').insert({
        patient_id: adviceMessage.patient_id,
        patient_name: adviceMessage.patient_name,
        doctor_id: adviceMessage.doctor_id,
        doctor_employee_id: adviceMessage.doctor_id,
        doctor_name: adviceMessage.doctor_name,
        message: adviceMessage.message,
        priority: adviceMessage.priority,
        sender_type: 'doctor',
      });
      if (error) console.warn('patient_messages sync notice:', formatError(error));
    } catch (err) {
      console.warn('patient_messages sync notice:', formatError(err));
    }
  }

  return { note, adviceMessage };
}

export async function fetchPatientClinicalNotes(patientId: string): Promise<ClinicalNote[]> {
  const local = readJsonLocal<ClinicalNote[]>(CLINICAL_STORAGE.clinicalNotes, []).filter(
    (n) => n.patient_id === patientId,
  );

  try {
    const { data, error } = await supabase
      .from('clinical_notes')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const remote = data as ClinicalNote[];
      const map = new Map<string, ClinicalNote>();
      for (const item of [...local, ...remote]) map.set(item.id, item);
      const merged = Array.from(map.values()).sort((a, b) =>
        String(b.created_at || '').localeCompare(String(a.created_at || '')),
      );
      writeJsonLocal(CLINICAL_STORAGE.clinicalNotes, merged);
      return merged;
    }
  } catch (err) {
    console.warn('Patient clinical_notes fetch notice:', formatError(err));
  }

  return local;
}

export { formatError };
