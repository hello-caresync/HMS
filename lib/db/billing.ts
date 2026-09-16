import type { SupabaseClient } from '@supabase/supabase-js';

import {
  mapBillingInvoiceRow,
  nextInvoiceNumber,
  type BillingInvoiceRow,
} from '@/lib/billing/post-consultation-invoice';
import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';

export type WalkInBillingInput = {
  appointmentId: string;
  hospitalId?: string;
  patientUhid: string;
  patientName: string;
  doctorId?: string | null;
  doctorName?: string | null;
  department: string;
  consultationFee?: number | null;
  tokenNumber?: string | null;
};

function missingColumn(message: string | null | undefined): string | null {
  const text = String(message ?? '');
  return (
    text.match(/Could not find the '([^']+)' column/i)?.[1] ??
    text.match(/column (?:[\w]+\.)?([a-zA-Z0-9_]+) does not exist/i)?.[1] ??
    null
  );
}

function isUuid(value?: string | null): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value ?? ''));
}

async function insertWithColumnRetry(
  supabase: SupabaseClient,
  table: string,
  payload: Record<string, unknown>,
): Promise<{ data: Record<string, unknown> | null; errorMessage: string | null }> {
  const row: Record<string, unknown> = { ...payload };
  let { data, error } = await supabase.from(table).insert([row]).select('*').maybeSingle();
  let attempts = 0;

  while (error && attempts < 12) {
    const column = missingColumn(error.message);
    if (column && column in row) {
      delete row[column];
    } else if (/uuid|foreign key|appointments/i.test(error.message) && row.appointment_id) {
      delete row.appointment_id;
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

async function markAppointmentPendingCheckout(
  supabase: SupabaseClient,
  appointmentId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const patch = {
    billing_status: 'pending_checkout',
    updated_at: now,
  };
  await supabase.from('appointments').update(patch).eq('id', appointmentId);
  await supabase.from('appointments').update(patch).eq('appointment_id', appointmentId);
}

/**
 * Persists a walk-in OPD token to the billing queue so the Billing tab survives refresh.
 * Writes to billing_invoices (primary checkout ledger) and hospital_invoices (legacy desk view).
 */
export async function createWalkInBillingRecord(
  supabase: SupabaseClient,
  input: WalkInBillingInput,
): Promise<{ ok: boolean; invoice?: BillingInvoiceRow; error?: string; skipped?: boolean }> {
  const hospitalId = input.hospitalId || HOSPITAL_TENANT_ID;
  const consultationFee = Math.max(0, Number(input.consultationFee) || 500);
  const appointmentId = String(input.appointmentId ?? '').trim();
  const patientUhid = String(input.patientUhid ?? input.tokenNumber ?? '').trim();
  const now = new Date().toISOString();

  if (!patientUhid || !input.patientName.trim()) {
    return { ok: false, error: 'Patient identity is required for billing.' };
  }

  if (isUuid(appointmentId)) {
    const existing = await supabase
      .from('billing_invoices')
      .select('*')
      .eq('appointment_id', appointmentId)
      .maybeSingle();
    if (existing.data) {
      return {
        ok: true,
        skipped: true,
        invoice: mapBillingInvoiceRow(existing.data as Record<string, unknown>),
      };
    }
  }

  const billingPayload: Record<string, unknown> = {
    invoice_number: nextInvoiceNumber(),
    hospital_id: hospitalId,
    patient_uhid: patientUhid,
    uhid: patientUhid,
    patient_name: input.patientName.trim(),
    doctor_id: input.doctorId || null,
    doctor_name: input.doctorName || null,
    department: input.department || 'General Medicine',
    booking_source: 'WALK-IN',
    consultation_fee: consultationFee,
    medicine_fee: 0,
    gst_amount: 0,
    discount_amount: 0,
    total_payable: consultationFee,
    total_amount: consultationFee,
    medicines: [],
    medicines_total: 0,
    payment_method: null,
    payment_status: 'unpaid',
    prescribed_items: [],
    is_sent_to_app: false,
    created_at: now,
    updated_at: now,
  };
  if (isUuid(appointmentId)) {
    billingPayload.appointment_id = appointmentId;
  }

  const billingInsert = await insertWithColumnRetry(supabase, 'billing_invoices', billingPayload);
  if (billingInsert.errorMessage) {
    console.error('Failed to persist walk-in billing_invoices row:', billingInsert.errorMessage);
    return { ok: false, error: billingInsert.errorMessage };
  }

  const legacyPayload: Record<string, unknown> = {
    hospital_id: hospitalId,
    patient_uhid: patientUhid,
    patient_name: input.patientName.trim(),
    doctor_name: input.doctorName || 'Consulting Physician',
    department: input.department || 'General Medicine',
    service_type: 'OPD Consultation',
    amount: consultationFee,
    payment_status: 'PENDING',
    status: 'PENDING',
    appointment_date: now.split('T')[0],
    created_at: now,
    updated_at: now,
  };
  if (isUuid(appointmentId)) {
    legacyPayload.appointment_id = appointmentId;
  }
  if (input.tokenNumber) {
    legacyPayload.token_number = input.tokenNumber;
  }

  const legacyInsert = await insertWithColumnRetry(supabase, 'hospital_invoices', legacyPayload);
  if (legacyInsert.errorMessage) {
    console.warn('Walk-in hospital_invoices write skipped:', legacyInsert.errorMessage);
  }

  if (isUuid(appointmentId)) {
    await markAppointmentPendingCheckout(supabase, appointmentId);
  }

  return {
    ok: true,
    invoice: billingInsert.data
      ? mapBillingInvoiceRow(billingInsert.data)
      : undefined,
  };
}

export async function fetchHospitalBillingQueue(
  supabase: SupabaseClient,
  hospitalId: string,
): Promise<BillingInvoiceRow[]> {
  const { data, error } = await supabase
    .from('billing_invoices')
    .select('*')
    .eq('hospital_id', hospitalId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('fetchHospitalBillingQueue:', error.message);
    return [];
  }

  return (data || []).map((row) => mapBillingInvoiceRow(row as Record<string, unknown>));
}
