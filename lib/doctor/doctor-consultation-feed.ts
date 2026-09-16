import type { SupabaseClient } from '@supabase/supabase-js';

import { fetchDoctorConsultationHistory } from '@/lib/db/consultations';
import { buildDoctorQueueOrFilter, isQueueDoneStatus } from '@/lib/doctor/command-center/supabase-service';
import { appointmentBelongsToDoctor, type DoctorSession } from '@/lib/doctor/session';
import { REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';

export type ConsultationPrescriptionLine = {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity?: number;
};

export type DoctorConsultationFeedItem = {
  id: string;
  appointment_id?: string;
  patient_name: string;
  token_number?: string | number | null;
  status: string;
  updated_at: string;
  created_at: string;
  completed_at?: string;
  diagnosis?: string;
  chief_complaint?: string;
  clinical_notes?: string;
  doctor_instructions?: string;
  vitals_summary?: string;
  age?: number | string;
  gender?: string;
  prescriptions: ConsultationPrescriptionLine[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function todayIsoDate(): string {
  return new Date().toISOString().split('T')[0];
}

function isTodayRow(row: Record<string, unknown>): boolean {
  const today = todayIsoDate();
  const appointmentDate = String(row.appointment_date ?? '').slice(0, 10);
  if (appointmentDate) return appointmentDate === today;
  const createdAt = String(row.created_at ?? row.updated_at ?? '').slice(0, 10);
  return createdAt === today;
}

function formatVitals(raw: unknown): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw.trim();
  const parsed = asRecord(raw);
  const parts = [
    parsed.bp ? `BP ${String(parsed.bp)}` : '',
    parsed.pulse ? `HR ${String(parsed.pulse)}` : '',
    parsed.temp ? `Temp ${String(parsed.temp)}` : '',
    parsed.spo2 ? `SpO2 ${String(parsed.spo2)}` : '',
    parsed.weight ? `Wt ${String(parsed.weight)}` : '',
  ].filter(Boolean);
  return parts.join(' · ');
}

function parsePrescriptions(raw: unknown): ConsultationPrescriptionLine[] {
  if (!Array.isArray(raw)) return [];
  const lines: ConsultationPrescriptionLine[] = [];
  for (const item of raw) {
    const row = asRecord(item);
    const name = String(row.name ?? row.drug ?? row.medicine_name ?? '').trim();
    if (!name) continue;
    lines.push({
      name,
      dosage: String(row.dosage ?? row.dose ?? '').trim() || undefined,
      frequency: String(row.frequency ?? row.timing ?? '').trim() || undefined,
      duration: String(row.duration ?? '').trim() || undefined,
      quantity: Math.max(1, Number(row.quantity ?? row.qty ?? 1) || 1),
    });
  }
  return lines;
}

function mapFeedItem(
  apt: Record<string, unknown>,
  clinical?: Record<string, unknown>,
): DoctorConsultationFeedItem {
  const aptId = String(apt.id ?? apt.appointment_id ?? '');
  const prescriptions = parsePrescriptions(
    clinical?.medications ?? clinical?.medicines ?? apt.medications ?? apt.medicines,
  );

  return {
    id: aptId,
    appointment_id: aptId || undefined,
    patient_name: String(apt.patient_name ?? apt.name ?? 'Patient'),
    token_number: (apt.token_number ?? apt.token ?? apt.uhid) as string | number | null | undefined,
    status: String(apt.queue_status ?? apt.status ?? 'billing_pending'),
    updated_at: String(
      apt.updated_at ?? apt.completed_at ?? apt.created_at ?? new Date().toISOString(),
    ),
    created_at: String(apt.created_at ?? new Date().toISOString()),
    completed_at: apt.completed_at ? String(apt.completed_at) : undefined,
    diagnosis:
      String(clinical?.diagnosis ?? apt.diagnosis ?? apt.chief_complaint ?? '').trim() || undefined,
    chief_complaint:
      String(apt.chief_complaint ?? apt.reason_for_visit ?? clinical?.chief_complaint ?? '').trim() ||
      undefined,
    clinical_notes:
      String(clinical?.clinical_notes ?? apt.clinical_notes ?? apt.examination_findings ?? '').trim() ||
      undefined,
    doctor_instructions:
      String(
        clinical?.instructions ??
          clinical?.doctor_instructions ??
          apt.doctor_instructions ??
          apt.dietary_instructions ??
          '',
      ).trim() || undefined,
    vitals_summary: String(apt.vitals_summary ?? '').trim() || formatVitals(apt.vitals ?? apt.intake_vitals),
    age: (apt.age ?? apt.patient_age) as number | string | undefined,
    gender: apt.gender ? String(apt.gender) : undefined,
    prescriptions,
  };
}

export async function fetchDoctorConsultationFeed(
  supabase: SupabaseClient,
  session: DoctorSession,
): Promise<DoctorConsultationFeedItem[]> {
  const orFilter = buildDoctorQueueOrFilter(session);
  if (!orFilter) return [];

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .or(orFilter)
    .order('updated_at', { ascending: false })
    .limit(80);

  if (error) {
    console.error('fetchDoctorConsultationFeed:', error.message);
    return [];
  }

  const todayDoneRows = (data ?? [])
    .map((row) => asRecord(row))
    .filter(
      (row) =>
        isTodayRow(row) &&
        isQueueDoneStatus(row.queue_status ?? row.status) &&
        appointmentBelongsToDoctor(row, session),
    );

  const appointmentIds = todayDoneRows
    .map((row) => String(row.id ?? row.appointment_id ?? ''))
    .filter(Boolean);

  const clinicalByAppointment = new Map<string, Record<string, unknown>>();
  if (appointmentIds.length > 0) {
    const { data: clinicalRows } = await supabase
      .from('hospital_clinical_records')
      .select('*')
      .in('appointment_id', appointmentIds)
      .order('created_at', { ascending: false });

    for (const row of clinicalRows ?? []) {
      const record = asRecord(row);
      const key = String(record.appointment_id ?? '');
      if (key && !clinicalByAppointment.has(key)) {
        clinicalByAppointment.set(key, record);
      }
    }
  }

  const appointmentFeed = todayDoneRows
    .map((row) => {
      const aptId = String(row.id ?? row.appointment_id ?? '');
      return mapFeedItem(row, clinicalByAppointment.get(aptId));
    });

  const doctorKey = String(
    session.doctorId || session.doctorUuid || session.employeeId || '',
  ).trim();
  const ledgerRows = doctorKey
    ? await fetchDoctorConsultationHistory(supabase, doctorKey, REGAL_HOSPITAL_CODE, 80)
    : [];

  const ledgerFeed: DoctorConsultationFeedItem[] = ledgerRows.map((row) => ({
    id: row.id,
    appointment_id: row.appointment_id ?? undefined,
    patient_name: row.patient_name,
    token_number: row.uhid,
    status: row.status,
    updated_at: row.updated_at,
    created_at: row.created_at,
    diagnosis: row.diagnosis ?? undefined,
    chief_complaint: row.symptoms ?? undefined,
    clinical_notes: undefined,
    doctor_instructions: undefined,
    vitals_summary: formatVitals(row.vitals),
    prescriptions: parsePrescriptions(row.medicines),
  }));

  const merged = new Map<string, DoctorConsultationFeedItem>();
  for (const item of [...appointmentFeed, ...ledgerFeed]) {
    const key = item.appointment_id || item.id;
    if (!merged.has(key)) merged.set(key, item);
  }

  return [...merged.values()].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}

export function buildOptimisticFeedItem(input: {
  appointmentId: string;
  patientName: string;
  tokenNumber?: string | number | null;
  status?: string;
  diagnosis: string;
  clinicalNotes: string;
  doctorInstructions: string;
  vitalsSummary?: string;
  age?: number | string;
  gender?: string;
  prescriptions: ConsultationPrescriptionLine[];
}): DoctorConsultationFeedItem {
  const now = new Date().toISOString();
  return {
    id: input.appointmentId,
    appointment_id: input.appointmentId,
    patient_name: input.patientName,
    token_number: input.tokenNumber,
    status: input.status ?? 'billing_pending',
    updated_at: now,
    created_at: now,
    completed_at: now,
    diagnosis: input.diagnosis,
    clinical_notes: input.clinicalNotes,
    doctor_instructions: input.doctorInstructions,
    vitals_summary: input.vitalsSummary,
    age: input.age,
    gender: input.gender,
    prescriptions: input.prescriptions,
  };
}
