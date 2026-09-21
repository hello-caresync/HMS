import type { SupabaseClient } from '@supabase/supabase-js';

import { createPendingConsultationInvoice } from '@/lib/billing/post-consultation-invoice';
import { computeMedicineQuantity } from '@/lib/doctor/medicine-quantity';
import { generatePostConsultationBill } from '@/lib/hospital/operations/consultation-billing-sync';
import { postConsultationPharmacyBridge } from '@/lib/hospital/records-pharmacy';

export type DispatchMedication = {
  name: string;
  dosage: string;
  timing: string;
  duration: string;
  qty?: number;
  price?: number;
};

export type DispatchPrescriptionInput = {
  appointmentId: string;
  sourceTable?: string;
  patientId?: string | null;
  patientName: string;
  uhid?: string | null;
  doctorId: string;
  doctorName: string;
  department?: string;
  diagnosis: string;
  clinicalNotes: string;
  doctorInstructions: string;
  medications: DispatchMedication[];
  vitals?: Record<string, unknown> | string | null;
  consultationFee?: number;
  hospitalId?: string;
  skipBilling?: boolean;
};

function missingColumnFromError(message: string | null | undefined): string | null {
  const text = String(message ?? '');
  const postgrest = text.match(/Could not find the '([^']+)' column/i);
  if (postgrest?.[1]) return postgrest[1];
  const postgres = text.match(/column (?:[\w]+\.)?([a-zA-Z0-9_]+) does not exist/i);
  return postgres?.[1] ?? null;
}

async function insertWithColumnRetry(
  supabase: SupabaseClient,
  table: string,
  payload: Record<string, unknown>,
): Promise<{ data: Record<string, unknown> | null; errorMessage: string | null }> {
  try {
    const row: Record<string, unknown> = { ...payload };
    let { data, error } = await supabase.from(table).insert([row]).select().maybeSingle();

    let attempts = 0;
    while (error && attempts < 10) {
      const column = missingColumnFromError(error.message);
      if (!column || !(column in row)) break;
      delete row[column];
      attempts += 1;
      const retry = await supabase.from(table).insert([row]).select().maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    if (error) return { data: null, errorMessage: error.message };
    return { data: (data as Record<string, unknown> | null) ?? row, errorMessage: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : `Failed to insert into ${table}`;
    return { data: null, errorMessage: message };
  }
}

function resolveMedicineQuantity(med: DispatchMedication): number {
  if (med.qty != null && med.qty > 0) return med.qty;
  return computeMedicineQuantity(med.dosage, med.duration);
}

function medicinePayload(medications: DispatchMedication[]): Record<string, unknown>[] {
  return medications.map((med) => {
    const quantity = resolveMedicineQuantity(med);
    return {
      drug: med.name,
      name: med.name,
      medicine_name: med.name,
      dose: med.dosage,
      dosage: med.dosage,
      frequency: med.timing || med.dosage,
      duration: med.duration,
      quantity,
      qty: quantity,
      instructions: med.timing || '',
    };
  });
}

async function completeAppointmentRows(
  supabase: SupabaseClient,
  appointmentId: string,
  sourceTable?: string,
): Promise<void> {
  try {
    const now = new Date().toISOString();
    const fullPatch = { status: 'billing_pending', queue_status: 'BILLING_PENDING', completed_at: now };
    const statusOnly = { status: 'billing_pending' };
    const tables = Array.from(
      new Set(
        [sourceTable, 'appointments', 'patient_appointments', 'hospital_opd_queue'].filter(Boolean),
      ),
    ) as string[];

    await Promise.allSettled(
      tables.flatMap((table) => [
        (async () => {
          const full = await supabase.from(table).update(fullPatch).eq('id', appointmentId);
          if (full.error) {
            await supabase.from(table).update(statusOnly).eq('id', appointmentId);
          }
        })(),
        (async () => {
          const full = await supabase.from(table).update(fullPatch).eq('appointment_id', appointmentId);
          if (full.error) {
            await supabase.from(table).update(statusOnly).eq('appointment_id', appointmentId);
          }
        })(),
      ]),
    );
  } catch (err: unknown) {
    console.error('Failed to mark appointment billing_pending:', err);
  }
}

async function notifyPatient(
  supabase: SupabaseClient,
  input: DispatchPrescriptionInput,
  prescriptionId?: string | null,
): Promise<void> {
  const recipientId = input.patientId || input.uhid || input.patientName;
  const title = 'New Digital Prescription Available';
  const diagnosisLabel = input.diagnosis.trim() || 'consultation';
  const message = `${input.doctorName} has finalized your consultation and issued your prescription for ${diagnosisLabel}.`;
  const now = new Date().toISOString();

  await insertWithColumnRetry(supabase, 'system_notifications', {
    recipient_id: recipientId,
    recipient_role: 'patient',
    recipient_type: 'patient',
    title,
    message,
    type: 'prescription',
    category: 'Clinical',
    entity_id: prescriptionId || null,
    read: false,
    is_read: false,
    created_at: now,
  });
}

const REGAL_HOSPITAL_BRANCH = 'Regal Hospital • Main Branch';

function parseVitals(raw?: Record<string, unknown> | string | null): Record<string, unknown> | string | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      return { summary: trimmed };
    }
  }
  return raw;
}

export async function dispatchDigitalPrescription(
  supabase: SupabaseClient,
  input: DispatchPrescriptionInput,
): Promise<{ ok: boolean; error?: string; prescriptionId?: string }> {
  try {
    const now = new Date().toISOString();
    const medicines = medicinePayload(input.medications);
    const diagnosis = input.diagnosis.trim() || input.clinicalNotes.trim() || 'General Consultation';
    const notes = input.clinicalNotes.trim();
    const advice = input.doctorInstructions.trim();
    const vitals = parseVitals(input.vitals);

    const patientKey = input.patientId || input.uhid || input.appointmentId || input.patientName;
    const prescriptionPayload: Record<string, unknown> = {
      appointment_id: input.appointmentId || null,
      patient_id: patientKey,
      encounter_id: input.appointmentId || null,
      patient_name: input.patientName,
      uhid: input.uhid || input.patientId || patientKey,
      doctor_id: input.doctorId,
      doctor_name: input.doctorName,
      department: input.department || null,
      hospital_name: REGAL_HOSPITAL_BRANCH,
      diagnosis,
      clinical_notes: notes,
      examination_findings: notes,
      medicines,
      medications: medicines,
      instructions: advice,
      dietary_instructions: advice,
      doctor_instructions: advice,
      vitals,
      status: 'active',
      issued_status: 'active',
      issued_at: now,
      dispatched_at: now,
      created_at: now,
    };

    const rx = await insertWithColumnRetry(supabase, 'prescriptions', prescriptionPayload);
    if (rx.errorMessage && /issued|check constraint|invalid input/i.test(rx.errorMessage)) {
      const issuedRetry = await insertWithColumnRetry(supabase, 'prescriptions', {
        ...prescriptionPayload,
        status: 'issued',
      });
      if (!issuedRetry.errorMessage) {
        Object.assign(rx, issuedRetry);
      }
    }
    if (rx.errorMessage) {
      return { ok: false, error: rx.errorMessage };
    }

    const prescriptionId = rx.data?.id ? String(rx.data.id) : undefined;

    const consultationWrite = await insertWithColumnRetry(supabase, 'consultations', {
      appointment_id: input.appointmentId || null,
      patient_id: patientKey,
      uhid: input.uhid || input.patientId || patientKey,
      encounter_id: input.appointmentId || null,
      patient_name: input.patientName,
      doctor_id: input.doctorId,
      doctor_name: input.doctorName,
      chief_complaint: diagnosis,
      diagnosis,
      clinical_notes: notes,
      doctor_notes: notes,
      clinical_examination: notes,
      instructions: advice,
      status: 'COMPLETED',
      created_at: now,
    });

    const medicalWrite = await insertWithColumnRetry(supabase, 'medical_records', {
        patient_id: patientKey,
        uhid: input.uhid || input.patientId || patientKey,
        doctor_id: input.doctorId,
        appointment_id: input.appointmentId || null,
        patient_name: input.patientName,
        record_type: 'digital_prescription',
        summary: [
          `Doctor: ${input.doctorName}`,
          `Hospital: ${REGAL_HOSPITAL_BRANCH}`,
          `Diagnosis: ${diagnosis}`,
          notes ? `Findings: ${notes}` : '',
          medicines.length
            ? `Medicines: ${medicines
                .map((item) => `${String(item.name)} ${String(item.dosage || '')}`.trim())
                .join(', ')}`
            : '',
          advice ? `Instructions: ${advice}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
        doctor_name: input.doctorName,
        created_at: now,
    });

    await insertWithColumnRetry(supabase, 'hospital_clinical_records', {
      hospital_id: input.hospitalId || 'HOSP-01',
      patient_id: patientKey,
      uhid: input.uhid || input.patientId || patientKey,
      appointment_id: input.appointmentId || null,
      patient_name: input.patientName,
      doctor_id: input.doctorId,
      doctor_name: input.doctorName,
      diagnosis,
      clinical_notes: notes,
      medications: medicines,
      record_type: 'consultation',
      created_at: now,
    });

    if (consultationWrite.errorMessage) {
      console.warn('Consultation record insert skipped:', consultationWrite.errorMessage);
    }
    if (medicalWrite.errorMessage) {
      console.warn('Medical record insert skipped:', medicalWrite.errorMessage);
    }

    await Promise.allSettled([
      notifyPatient(supabase, input, prescriptionId),
      input.appointmentId
        ? completeAppointmentRows(supabase, input.appointmentId, input.sourceTable)
        : Promise.resolve(),
      input.skipBilling
        ? Promise.resolve()
        : createPendingConsultationInvoice(supabase, {
            appointmentId: input.appointmentId || null,
            hospitalId: input.hospitalId,
            uhid: input.uhid || input.patientId || input.patientName,
            patientName: input.patientName,
            doctorId: input.doctorId,
            doctorName: input.doctorName,
            consultationFee: input.consultationFee ?? 500,
            medicines: input.medications.map((med) => ({
              name: med.name,
              qty: resolveMedicineQuantity(med),
              price: med.price ?? 0,
            })),
          }),
      input.skipBilling || !input.appointmentId
        ? Promise.resolve()
        : generatePostConsultationBill(supabase, {
            appointmentId: input.appointmentId,
            patientId: input.patientId || input.uhid || input.patientName,
            patientName: input.patientName,
            patientUhid: input.uhid || undefined,
            doctorId: input.doctorId,
            doctorName: input.doctorName,
            consultationFee: input.consultationFee ?? 500,
            prescriptions: input.medications.map((med) => ({ medicine_name: med.name })),
          }),
      postConsultationPharmacyBridge(supabase, {
        hospitalId: input.hospitalId,
        appointmentId: input.appointmentId,
        uhid: input.uhid || input.patientId || input.patientName,
        patientName: input.patientName,
        doctorId: input.doctorId,
        doctorName: input.doctorName,
        medicines: input.medications.map((med) => ({
          name: med.name,
          qty: resolveMedicineQuantity(med),
          dosage: med.dosage,
          frequency: med.timing,
        })),
      }),
    ]);

    return { ok: true, prescriptionId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to dispatch digital prescription';
    return { ok: false, error: message };
  }
}
