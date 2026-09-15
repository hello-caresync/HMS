import type { SupabaseClient } from '@supabase/supabase-js';

import {
  createPendingConsultationInvoice,
  formatPrescribedItems,
  type InvoiceMedicineLine,
  type PrescribedItem,
} from '@/lib/billing/post-consultation-invoice';
import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';

export type ConsultationHandoffPatient = {
  id?: string;
  patient_id?: string | null;
  appointment_id?: string | null;
  patient_name?: string;
  name?: string;
  uhid?: string | null;
  patient_uhid?: string | null;
  token_number?: string | number | null;
  hospital_id?: string;
  department?: string;
  appointment_type?: string;
  source?: string;
  booking_source?: string;
  _source_table?: string;
};

export type ConsultationHandoffSession = {
  doctorId?: string;
  employeeId?: string;
  doctorName?: string;
  fullName?: string;
  department?: string;
  consultationFee?: number;
  hospitalCode?: string;
};

export type ConsultationHandoffResult = {
  ok: boolean;
  invoiceId?: string;
  consultationFee: number;
  error?: string;
};

export type ConsultationHandoffOptions = {
  consultationFee?: number;
  medicines?: InvoiceMedicineLine[];
  prescribedItems?: PrescribedItem[];
  diagnosis?: string;
  clinicalNotes?: string;
  doctorInstructions?: string;
};

function missingColumn(message: string | null | undefined): string | null {
  const text = String(message ?? '');
  return (
    text.match(/Could not find the '([^']+)' column/i)?.[1] ??
    text.match(/column (?:[\w]+\.)?([a-zA-Z0-9_]+) does not exist/i)?.[1] ??
    null
  );
}

async function insertWithColumnRetry(
  supabase: SupabaseClient,
  table: string,
  payload: Record<string, unknown>,
): Promise<{ data: Record<string, unknown> | null; errorMessage: string | null }> {
  const row: Record<string, unknown> = { ...payload };
  let { data, error } = await supabase.from(table).insert([row]).select('*').maybeSingle();
  let attempts = 0;

  while (error && attempts < 10) {
    const column = missingColumn(error.message);
    if (column && column in row) {
      delete row[column];
    } else {
      break;
    }
    attempts += 1;
    const retry = await supabase.from(table).insert([row]).select('*').maybeSingle();
    data = retry.data;
    error = retry.error;
  }

  if (error) return { data: null, errorMessage: error.message };
  return { data: (data as Record<string, unknown> | null) ?? row, errorMessage: null };
}

async function markEncounterBillingPending(
  supabase: SupabaseClient,
  appointmentId: string,
  sourceTable?: string,
  clinical?: {
    diagnosis?: string;
    clinicalNotes?: string;
    doctorInstructions?: string;
    prescribedItems?: PrescribedItem[];
  },
): Promise<void> {
  const now = new Date().toISOString();
  const tables = Array.from(
    new Set(
      [sourceTable, 'appointments', 'patient_appointments', 'hospital_opd_queue'].filter(Boolean),
    ),
  ) as string[];

  const clinicalPatch: Record<string, unknown> = {};
  if (clinical?.diagnosis?.trim()) {
    clinicalPatch.diagnosis = clinical.diagnosis.trim();
  }
  if (clinical?.clinicalNotes?.trim()) {
    clinicalPatch.clinical_notes = clinical.clinicalNotes.trim();
  }
  if (clinical?.doctorInstructions?.trim()) {
    clinicalPatch.instructions = clinical.doctorInstructions.trim();
    clinicalPatch.doctor_instructions = clinical.doctorInstructions.trim();
  }
  if (clinical?.prescribedItems?.length) {
    clinicalPatch.prescriptions = clinical.prescribedItems;
    clinicalPatch.prescribed_items = clinical.prescribedItems;
  }

  const patches: Record<string, unknown>[] = [
    {
      status: 'billing_pending',
      stage: 'billing',
      queue_status: 'BILLING_PENDING',
      billing_status: 'pending_payment',
      consultation_completed_at: now,
      completed_at: now,
      updated_at: now,
      ...clinicalPatch,
    },
    { status: 'billing_pending', queue_status: 'BILLING_PENDING', updated_at: now, ...clinicalPatch },
    { status: 'billing_pending' },
  ];

  await Promise.allSettled(
    tables.flatMap((table) =>
      ['id', 'appointment_id'].flatMap((column) =>
        patches.map(async (patch) => {
          await supabase.from(table).update(patch).eq(column, appointmentId);
        }),
      ),
    ),
  );
}

export function isBillingHandoffStatus(status?: string | null): boolean {
  const value = String(status ?? '').toLowerCase();
  return /billing|complete|done|paid|cancel|closed/.test(value);
}

export async function handoffConsultationToHospitalBilling(
  supabase: SupabaseClient,
  patient: ConsultationHandoffPatient,
  session?: ConsultationHandoffSession | null,
  options?: ConsultationHandoffOptions,
): Promise<ConsultationHandoffResult> {
  const patientId = String(patient.patient_id || patient.uhid || patient.id || '').trim();
  const appointmentId = String(patient.appointment_id || patient.id || '').trim();
  const patientName = String(patient.patient_name || patient.name || 'Patient').trim() || 'Patient';
  const consultationFee = Math.max(
    0,
    Number(options?.consultationFee ?? session?.consultationFee ?? 500) || 500,
  );
  const doctorId = session?.doctorId || session?.employeeId || 'RH-D01';
  const doctorName = session?.doctorName || session?.fullName || 'Consulting Physician';
  const hospitalId = patient.hospital_id || session?.hospitalCode || HOSPITAL_TENANT_ID;
  const department = session?.department || patient.department || 'General Medicine';
  const timestamp = new Date().toISOString();
  const medicines = options?.medicines ?? [];
  const prescribedItems = formatPrescribedItems(medicines, options?.prescribedItems);

  if (!patientId && !appointmentId) {
    return { ok: false, consultationFee, error: 'Invalid patient record identifier.' };
  }

  const billingInvoice = await createPendingConsultationInvoice(supabase, {
    appointmentId: appointmentId || null,
    hospitalId,
    uhid: String(patient.uhid || patient.patient_uhid || patientId),
    patient_uhid: String(patient.patient_uhid || patient.uhid || patientId),
    patientId: patientId || appointmentId,
    patientName,
    doctorId,
    doctorName,
    department,
    bookingSource: patient.booking_source,
    source: patient.source,
    appointmentType: patient.appointment_type,
    tokenNumber: patient.token_number,
    consultationFee,
    medicines,
    prescribedItems,
  });

  if (!billingInvoice.ok) {
    return { ok: false, consultationFee, error: billingInvoice.error || 'Billing handoff failed.' };
  }

  if (appointmentId) {
    await markEncounterBillingPending(supabase, appointmentId, patient._source_table, {
      diagnosis: options?.diagnosis,
      clinicalNotes: options?.clinicalNotes,
      doctorInstructions: options?.doctorInstructions,
      prescribedItems,
    });
  }

  const invoiceId = billingInvoice.invoice?.id;

  const legacyPayload: Record<string, unknown> = {
    hospital_id: hospitalId,
    patient_id: patientId || appointmentId,
    patient_name: patientName,
    uhid: patient.uhid || patient.patient_uhid || patientId,
    patient_uhid: patient.uhid || patient.patient_uhid || patientId,
    token_number: patient.token_number ?? null,
    appointment_id: appointmentId || null,
    doctor_id: doctorId,
    doctor_name: doctorName,
    department,
    service_name: 'OPD Consultation Fee',
    consultation_fee: consultationFee,
    total_amount: billingInvoice.invoice?.total_payable ?? consultationFee,
    payment_status: 'pending',
    status: 'pending',
    created_at: timestamp,
  };

  const hospitalInvoice = await insertWithColumnRetry(supabase, 'hospital_invoices', legacyPayload);
  if (hospitalInvoice.errorMessage) {
    console.warn('Failed writing to hospital_invoices, trying opd_charges fallback:', hospitalInvoice.errorMessage);
    await insertWithColumnRetry(supabase, 'opd_charges', {
      ...legacyPayload,
      amount: consultationFee,
    });
  }

  await insertWithColumnRetry(supabase, 'system_notifications', {
    recipient_role: 'billing',
    recipient_type: 'hospital',
    title: 'New OPD Invoice Ready',
    message: `Consultation finalized for ${patientName} by ${doctorName}. Consultation fee ₹${consultationFee} — enter pharmacy charges at billing counter.`,
    type: 'billing',
    category: 'Billing',
    entity_id: invoiceId || appointmentId || null,
    hospital_id: hospitalId,
    read: false,
    is_read: false,
    created_at: timestamp,
  });

  await insertWithColumnRetry(supabase, 'system_notifications', {
    recipient_type: 'patient',
    recipient_id: String(patient.uhid || patient.patient_uhid || patientId || patientName),
    recipient_name: patientName,
    title: 'Consultation complete — invoice ready',
    message: `Your visit with ${doctorName} is complete. Consultation fee ₹${consultationFee}. Pay consultation + dispensed medicines at the hospital billing desk.`,
    category: 'Billing',
    hospital_id: hospitalId,
    is_read: false,
    created_at: timestamp,
  });

  return { ok: true, invoiceId, consultationFee };
}
