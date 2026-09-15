import type { SupabaseClient } from '@supabase/supabase-js';

import { REGAL_FACILITY_CODE, REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';
import { resolveHospitalUuid } from '@/lib/hospital/resolve-hospital-context';

export type RadiologyOrderRow = {
  id: string;
  appointment_id?: string;
  patient_id: string;
  patient_name?: string;
  doctor_name?: string;
  study_name: string;
  modality?: string;
  status: string;
  report_summary?: string;
  ordered_at?: string;
  completed_at?: string;
};

export type CreateRadiologyOrderInput = {
  appointmentId?: string;
  patientId: string;
  patientName?: string;
  patientUhid?: string;
  doctorId?: string;
  doctorName?: string;
  studyName: string;
  modality?: string;
  fee?: number;
};

async function createRadiologyBillingInvoice(
  supabase: SupabaseClient,
  input: CreateRadiologyOrderInput & { hospitalId: string | null; studyName: string },
): Promise<string | null> {
  const amount = Math.max(200, Number(input.fee ?? 1200));
  const invoiceNumber = `RAD-${Date.now()}`;
  const payload: Record<string, unknown> = {
    hospital_id: input.hospitalId,
    hospital_code: REGAL_HOSPITAL_CODE,
    patient_uhid: input.patientUhid ?? input.patientId,
    patient_id: input.patientId,
    patient_name: input.patientName ?? 'Patient',
    appointment_id: input.appointmentId ?? null,
    doctor_id: input.doctorId ?? null,
    doctor_name: input.doctorName ?? null,
    service_type: 'radiology',
    invoice_number: invoiceNumber,
    consultation_fee: 0,
    medicine_fee: 0,
    total_payable: amount,
    total_amount: amount,
    payment_status: 'unpaid',
    prescribed_items: [{ item: input.studyName, amount, category: 'other' }],
  };

  const { data, error } = await supabase.from('billing_invoices').insert(payload).select('id').single();
  if (error) return null;
  return String((data as Record<string, unknown>).id ?? '');
}

export async function createRadiologyOrder(
  supabase: SupabaseClient,
  input: CreateRadiologyOrderInput,
): Promise<{ ok: boolean; order?: RadiologyOrderRow; error?: string }> {
  const studyName = input.studyName.trim();
  if (!studyName) return { ok: false, error: 'Study name is required' };

  const hospitalId = await resolveHospitalUuid(supabase);
  const billingInvoiceId = await createRadiologyBillingInvoice(supabase, {
    ...input,
    hospitalId,
    studyName,
  });

  const payload: Record<string, unknown> = {
    hospital_id: hospitalId,
    hospital_code: REGAL_HOSPITAL_CODE,
    facility_code: REGAL_FACILITY_CODE,
    appointment_id: input.appointmentId ?? null,
    patient_id: input.patientId,
    patient_name: input.patientName ?? null,
    patient_uhid: input.patientUhid ?? input.patientId,
    doctor_id: input.doctorId ?? null,
    doctor_name: input.doctorName ?? null,
    study_name: studyName,
    modality: input.modality ?? 'X-RAY',
    status: 'ordered',
    billing_invoice_id: billingInvoiceId,
    ordered_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('radiology_orders').insert(payload).select('*').single();
  if (error) return { ok: false, error: error.message };
  const row = data as Record<string, unknown>;
  return {
    ok: true,
    order: {
      id: String(row.id ?? ''),
      appointment_id: row.appointment_id ? String(row.appointment_id) : undefined,
      patient_id: String(row.patient_id ?? ''),
      patient_name: row.patient_name ? String(row.patient_name) : undefined,
      doctor_name: row.doctor_name ? String(row.doctor_name) : undefined,
      study_name: String(row.study_name ?? studyName),
      modality: row.modality ? String(row.modality) : undefined,
      status: String(row.status ?? 'ordered'),
    },
  };
}

export async function fulfillRadiologyOrder(
  supabase: SupabaseClient,
  orderId: string,
  reportSummary: string,
): Promise<{ ok: boolean; error?: string }> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('radiology_orders')
    .update({
      status: 'completed',
      report_summary: reportSummary,
      completed_at: now,
      updated_at: now,
    })
    .eq('id', orderId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function loadPatientRadiologyOrders(
  supabase: SupabaseClient,
  patientId: string,
): Promise<RadiologyOrderRow[]> {
  const { data } = await supabase
    .from('radiology_orders')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(20);

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id ?? ''),
      appointment_id: r.appointment_id ? String(r.appointment_id) : undefined,
      patient_id: String(r.patient_id ?? ''),
      patient_name: r.patient_name ? String(r.patient_name) : undefined,
      doctor_name: r.doctor_name ? String(r.doctor_name) : undefined,
      study_name: String(r.study_name ?? 'Imaging study'),
      modality: r.modality ? String(r.modality) : undefined,
      status: String(r.status ?? 'ordered'),
      report_summary: r.report_summary ? String(r.report_summary) : undefined,
      ordered_at: r.ordered_at ? String(r.ordered_at) : undefined,
      completed_at: r.completed_at ? String(r.completed_at) : undefined,
    };
  });
}

export function subscribeRadiologyOrders(
  supabase: SupabaseClient,
  patientId: string,
  onChange: () => void,
): () => void {
  const channel = supabase
    .channel(`radiology-orders-${patientId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'radiology_orders',
        filter: `patient_id=eq.${patientId}`,
      },
      () => onChange(),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
