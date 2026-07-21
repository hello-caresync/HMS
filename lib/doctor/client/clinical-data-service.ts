import { getSupabaseBrowserClient } from '@/lib/supabase';
import {
  MOCK_ANALYTICS,
  MOCK_CALENDAR_EVENTS,
  MOCK_CHAT_CHANNELS,
  MOCK_CHAT_MESSAGES,
  MOCK_DRUG_CATALOG,
  MOCK_EMERGENCY_CASES,
  MOCK_IPD_CENSUS,
  MOCK_NOTIFICATIONS,
  MOCK_OPD_QUEUE,
  MOCK_PATIENTS,
  MOCK_TELEMEDICINE_SESSION,
  MOCK_AI_DIFFERENTIALS,
} from '@/lib/mock-data';

import type {
  EmergencyCaseDto,
  IpdAdmissionDto,
  NotificationDto,
  OpdQueueItem,
  PatientDto,
} from '@/lib/doctor/types/clinical-dto';

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string');
  }
  return [];
}

function mapSupabasePatient(row: Record<string, unknown>): PatientDto {
  return {
    id: String(row.id),
    mrn: String(row.mrn),
    fullName: String(row.full_name ?? row.fullName),
    age: Number(row.age),
    gender: String(row.gender),
    bloodGroup: String(row.blood_group ?? row.bloodGroup),
    allergies: parseStringArray(row.allergies_json ?? row.allergiesJson),
    chronicConditions: parseStringArray(row.chronic_conditions_json ?? row.chronicConditionsJson),
  };
}

function mockPatients(opts?: { search?: string; status?: 'OPD' | 'IPD' | 'EMERGENCY' }): PatientDto[] {
  let list = MOCK_PATIENTS.map((p) => ({
    id: p.id,
    mrn: p.mrn,
    fullName: p.fullName,
    age: p.age,
    gender: p.gender,
    bloodGroup: p.bloodGroup,
    allergies: p.allergies,
    chronicConditions: p.chronicConditions,
  }));

  if (opts?.status === 'OPD') {
    list = list.slice(0, 2);
  } else if (opts?.status === 'IPD') {
    list = list.filter((p) => MOCK_IPD_CENSUS.some((r) => r.patientId === p.id));
  } else if (opts?.status === 'EMERGENCY') {
    list = list.filter((p) => p.id === 'pat-3');
  }

  if (opts?.search?.trim()) {
    const q = opts.search.trim().toLowerCase();
    list = list.filter(
      (p) => p.fullName.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q),
    );
  }

  return list;
}

async function loadPatientsFromSupabase(opts?: {
  search?: string;
  status?: 'OPD' | 'IPD' | 'EMERGENCY';
}): Promise<PatientDto[] | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  let query = supabase.from('patients').select('*').order('full_name', { ascending: true }).limit(100);

  if (opts?.search?.trim()) {
    const q = opts.search.trim();
    query = query.or(`mrn.ilike.%${q}%,full_name.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error || !data?.length) return null;

  return data.map((row) => mapSupabasePatient(row as Record<string, unknown>));
}

export async function fetchOpdQueue(): Promise<{ queue: OpdQueueItem[] }> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const { data, error } = await supabase
      .from('appointments')
      .select('id, patient_id, scheduled_at, status, appointment_type, patients(full_name)')
      .gte('scheduled_at', start.toISOString())
      .lt('scheduled_at', end.toISOString())
      .order('scheduled_at', { ascending: true });

    if (!error && data?.length) {
      return {
        queue: data.map((a, index) => {
          const patient = a.patients as { full_name?: string } | null;
          return {
            id: String(a.id),
            token: `OPD-${100 + index}`,
            patientId: String(a.patient_id),
            patientName: patient?.full_name ?? 'Patient',
            chiefComplaint: 'Scheduled consultation',
            priority: a.appointment_type === 'FOLLOWUP' ? 'Follow-up' : 'Routine',
            waitMinutes: Math.max(
              0,
              Math.floor((Date.now() - new Date(String(a.scheduled_at)).getTime()) / 60000),
            ),
          };
        }),
      };
    }
  }

  return { queue: MOCK_OPD_QUEUE };
}

export async function fetchPatients(opts?: {
  search?: string;
  status?: 'OPD' | 'IPD' | 'EMERGENCY';
}): Promise<{ patients: PatientDto[] }> {
  const fromDb = await loadPatientsFromSupabase(opts);
  return { patients: fromDb ?? mockPatients(opts) };
}

export async function fetchIpdAdmissions(): Promise<{ admissions: IpdAdmissionDto[] }> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('ipd_admissions')
      .select('*, patients(*)')
      .eq('status', 'ADMITTED')
      .order('admission_date', { ascending: false });

    if (!error && data?.length) {
      return {
        admissions: data.map((a) => {
          const patientRow = a.patients as Record<string, unknown> | null;
          const patient = patientRow ? mapSupabasePatient(patientRow) : mockPatients()[0];
          return {
            id: String(a.id),
            ward: String(a.ward_name ?? a.wardName ?? 'Ward'),
            bed: String(a.bed_number ?? a.bedNumber ?? '—'),
            losDays: 1,
            dailyProgressNotesJson: a.daily_progress_notes_json ?? a.dailyProgressNotesJson,
            patient,
          };
        }),
      };
    }
  }

  return {
    admissions: MOCK_IPD_CENSUS.map((row) => {
      const patient =
        mockPatients().find((p) => p.id === row.patientId) ?? mockPatients()[0];
      return {
        id: row.id,
        ward: row.ward,
        bed: row.bed,
        losDays: row.losDays,
        dailyProgressNotesJson: row.soapHistory,
        patient,
      };
    }),
  };
}

export async function fetchEmergencyCases(): Promise<{ cases: EmergencyCaseDto[] }> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('emergency_alerts')
      .select('*, patients(full_name, mrn)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data?.length) {
      return {
        cases: data.map((a) => {
          const patient = a.patients as { full_name?: string; mrn?: string } | null;
          return {
            id: String(a.id),
            patientId: a.patient_id ? String(a.patient_id) : null,
            esiLevel: Number(a.esi_level ?? a.esiLevel ?? 3),
            patientName: patient?.full_name ?? String(a.title),
            mrn: patient?.mrn ?? '—',
            presentation: String(a.body),
            bay: String(a.bay ?? 'ER'),
            statOrdersPending: Number(a.esi_level ?? 3) <= 2 ? 2 : 0,
            vitals: { bp: '—', hr: '—', gcs: '15' },
            acknowledged: Boolean(a.acknowledged),
          };
        }),
      };
    }
  }

  return {
    cases: MOCK_EMERGENCY_CASES.map((c) => ({
      id: c.id,
      patientId: c.mrn.includes('NX') ? 'pat-3' : undefined,
      esiLevel: c.esiLevel,
      patientName: c.patientName,
      mrn: c.mrn,
      presentation: c.presentation,
      bay: c.bay,
      statOrdersPending: c.statOrdersPending,
      vitals: c.vitals,
      acknowledged: false,
    })),
  };
}

export async function fetchNotificationsFeed(): Promise<{ notifications: NotificationDto[] }> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('emergency_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (!error && data?.length) {
      return {
        notifications: data.map((a) => ({
          id: String(a.id),
          category: 'EMERGENCY' as const,
          title: String(a.title),
          body: String(a.body),
          at: String(a.created_at ?? new Date().toISOString()),
          patientId: a.patient_id ? String(a.patient_id) : undefined,
          acknowledged: Boolean(a.acknowledged),
        })),
      };
    }
  }

  return { notifications: MOCK_NOTIFICATIONS };
}

export async function fetchFormulary() {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { data, error } = await supabase.from('formulary_drugs').select('*').order('brand');
    if (!error && data?.length) {
      return {
        drugs: data.map((d) => ({
          id: String(d.id),
          brand: String(d.brand),
          generic: String(d.generic),
          route: String(d.route),
          interactsWith: parseStringArray(d.interacts_with ?? d.interactsWith),
          allergyConflict: parseStringArray(d.allergy_conflict ?? d.allergyConflict),
        })),
      };
    }
  }

  return {
    drugs: MOCK_DRUG_CATALOG.map((d) => ({
      id: d.id,
      brand: d.brand,
      generic: d.generic,
      route: d.route,
      interactsWith: d.interactsWith ?? [],
      allergyConflict: d.allergyConflict ?? [],
    })),
  };
}

export async function fetchClinicalMessages(channelId: string) {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { data: messages, error } = await supabase
      .from('clinical_messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (!error && messages) {
      return {
        channels: MOCK_CHAT_CHANNELS,
        messages: messages.map((m) => ({
          id: String(m.id),
          channelId: String(m.channel_id ?? m.channelId),
          sender: String(m.sender),
          body: String(m.body),
          at: new Date(String(m.created_at)).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          stat: Boolean(m.stat),
        })),
      };
    }
  }

  return {
    channels: MOCK_CHAT_CHANNELS,
    messages: MOCK_CHAT_MESSAGES.filter((m) => m.channelId === channelId),
  };
}

export async function fetchCalendarEvents() {
  return { events: MOCK_CALENDAR_EVENTS };
}

export async function fetchAnalytics() {
  return { analytics: MOCK_ANALYTICS };
}

export async function fetchTelemedicineSession() {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data, error } = await supabase
      .from('appointments')
      .select('id, patients(*), telemedicine_sessions(*)')
      .eq('appointment_type', 'TELEMEDICINE')
      .gte('scheduled_at', start.toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const row = data as Record<string, unknown>;
      const patientRow = row.patients as Record<string, unknown> | Record<string, unknown>[] | null;
      const patientRecord = Array.isArray(patientRow) ? patientRow[0] : patientRow;
      const sessions = row.telemedicine_sessions as
        | { room_id?: string; chat_transcript_json?: unknown }[]
        | null;
      const session = Array.isArray(sessions) ? sessions[0] : null;
      if (patientRecord) {
        return {
          session: {
            appointmentId: String(row.id),
            roomId: session?.room_id ?? 'TELE-ROOM',
            patient: mapSupabasePatient(patientRecord),
            transcript: Array.isArray(session?.chat_transcript_json)
              ? (session.chat_transcript_json as { from: string; text: string }[])
              : [],
          },
        };
      }
    }
  }

  return {
    session: {
      appointmentId: MOCK_TELEMEDICINE_SESSION.appointmentId,
      roomId: MOCK_TELEMEDICINE_SESSION.roomId,
      patient: {
        id: MOCK_TELEMEDICINE_SESSION.patient.id,
        mrn: MOCK_TELEMEDICINE_SESSION.patient.mrn,
        fullName: MOCK_TELEMEDICINE_SESSION.patient.fullName,
        age: MOCK_TELEMEDICINE_SESSION.patient.age,
        gender: MOCK_TELEMEDICINE_SESSION.patient.gender,
        bloodGroup: MOCK_TELEMEDICINE_SESSION.patient.bloodGroup,
        allergies: MOCK_TELEMEDICINE_SESSION.patient.allergies,
        chronicConditions: MOCK_TELEMEDICINE_SESSION.patient.chronicConditions,
      },
      transcript: MOCK_TELEMEDICINE_SESSION.transcript,
    },
  };
}

export async function fetchPatientLabOrders(patientId: string) {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('lab_orders')
      .select('*')
      .eq('patient_id', patientId)
      .order('id', { ascending: false })
      .limit(50);
    if (!error && data) {
      return { orders: data };
    }
  }
  return { orders: [] as unknown[] };
}

export async function fetchEmrTimeline(patientId: string) {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('encounters')
      .select('id, patient_id, chief_complaint, hpi')
      .eq('patient_id', patientId)
      .order('id', { ascending: false })
      .limit(30);

    if (!error && data?.length) {
      return {
        events: data.map((e) => ({
          id: String(e.id),
          at: new Date().toISOString(),
          category: 'Encounter',
          title: String(e.chief_complaint ?? 'Clinical encounter'),
          summary: String(e.hpi ?? '').slice(0, 120),
        })),
      };
    }
  }

  return {
    events: [
      {
        id: 'enc-mock-1',
        at: new Date().toISOString(),
        category: 'Encounter',
        title: 'Follow-up visit',
        summary: 'Stable on current regimen · labs reviewed',
      },
    ],
  };
}

export async function runAiDifferential(body: {
  complaint?: string;
  vitals?: string;
  patientId?: string;
  allergies?: string[];
}) {
  const boosted = MOCK_AI_DIFFERENTIALS.map((d, i) => ({
    ...d,
    confidence: Math.min(
      0.95,
      d.confidence + (body.complaint?.includes('chest') ? 0.05 : 0) - i * 0.02,
    ),
  }));
  return { success: true, results: boosted };
}

async function insertSupabaseRow(table: string, row: Record<string, unknown>): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;
  const { error } = await supabase.from(table).insert(row);
  return !error;
}

export async function saveConsultation(body: Record<string, unknown>) {
  const ok = await insertSupabaseRow('encounters', {
    patient_id: body.patientId,
    doctor_id: process.env.NEXT_PUBLIC_DEFAULT_DOCTOR_ID ?? null,
    chief_complaint: body.chiefComplaint ?? '',
    hpi: body.hpi ?? '',
    diagnosis_icd10_json: body.diagnosisIcd10 ?? [],
    physical_exam_json: body.physicalExam ?? {},
    soap_notes_json: body.soapNotes ?? {},
    status: 'COMPLETED',
  });
  if (ok) {
    return { encounter: { id: `enc-${Date.now()}` } };
  }
  return { encounter: { id: `enc-mock-${Date.now()}` } };
}

export async function sendPrescription(_body: Record<string, unknown>) {
  return { message: 'Prescription dispatched to Pharmacy (client)' };
}

export async function saveSoapNote(_body: { admissionId: string; soap: Record<string, string> }) {
  return { message: 'SOAP Note saved!' };
}

export async function emergencyAction(_body: Record<string, unknown>) {
  return { success: true };
}

export async function acknowledgeNotification(id: string) {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    await supabase.from('emergency_alerts').update({ acknowledged: true }).eq('id', id);
  }
  return { success: true, id, acknowledged: true };
}

export async function generateDocument(body: Record<string, unknown>) {
  const patientName = String(body.patientName ?? 'Patient');
  const previewHtml = `<h1>${String(body.documentType ?? 'Document')}</h1><p>${patientName}</p>`;
  return { previewHtml, id: `doc-${Date.now()}` };
}

export async function sendClinicalMessage(body: { channelId: string; body: string; stat?: boolean }) {
  const ok = await insertSupabaseRow('clinical_messages', {
    channel_id: body.channelId,
    sender: 'You',
    body: body.body,
    stat: !!body.stat,
  });
  return { success: true, persisted: ok };
}

export async function createStatLabOrder(_body: Record<string, unknown>) {
  return { success: true };
}

export async function updateIpdAdmission(body: {
  admissionId: string;
  status?: string;
  wardName?: string;
  bedNumber?: string;
}) {
  const supabase = getSupabaseBrowserClient();
  if (supabase && body.admissionId) {
    await supabase
      .from('ipd_admissions')
      .update({
        ...(body.status ? { status: body.status } : {}),
        ...(body.wardName ? { ward_name: body.wardName } : {}),
        ...(body.bedNumber ? { bed_number: body.bedNumber } : {}),
      })
      .eq('id', body.admissionId);
  }
  return { success: true };
}
