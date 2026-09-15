import type { SupabaseClient } from '@supabase/supabase-js';

import { REGAL_FACILITY_CODE, REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';
import { resolveHospitalUuid } from '@/lib/hospital/resolve-hospital-context';

export type LabOrderRow = {
  id: string;
  appointment_id?: string;
  patient_id: string;
  patient_name?: string;
  doctor_name?: string;
  test_name: string;
  status: string;
  result_summary?: string;
  ordered_at?: string;
  resulted_at?: string;
  billing_invoice_id?: string;
};

export type CreateLabOrderInput = {
  appointmentId?: string;
  patientId: string;
  patientName?: string;
  patientUhid?: string;
  doctorId?: string;
  doctorName?: string;
  testName: string;
  fee?: number;
};

async function createLabBillingInvoice(
  supabase: SupabaseClient,
  input: CreateLabOrderInput & { hospitalId: string | null; testName: string },
): Promise<string | null> {
  const amount = Math.max(100, Number(input.fee ?? 350));
  const invoiceNumber = `LAB-${Date.now()}`;
  const payload: Record<string, unknown> = {
    hospital_id: input.hospitalId,
    hospital_code: REGAL_HOSPITAL_CODE,
    patient_uhid: input.patientUhid ?? input.patientId,
    patient_id: input.patientId,
    patient_name: input.patientName ?? 'Patient',
    appointment_id: input.appointmentId ?? null,
    doctor_id: input.doctorId ?? null,
    doctor_name: input.doctorName ?? null,
    service_type: 'lab',
    invoice_number: invoiceNumber,
    consultation_fee: 0,
    medicine_fee: 0,
    total_payable: amount,
    total_amount: amount,
    payment_status: 'unpaid',
    prescribed_items: [{ item: input.testName, amount, category: 'lab' }],
  };

  const { data, error } = await supabase.from('billing_invoices').insert(payload).select('id').single();
  if (error) return null;
  return String((data as Record<string, unknown>).id ?? '');
}

export async function createLabOrder(
  supabase: SupabaseClient,
  input: CreateLabOrderInput,
): Promise<{ ok: boolean; order?: LabOrderRow; error?: string }> {
  const testName = input.testName.trim();
  if (!testName) return { ok: false, error: 'Test name is required' };

  const hospitalId = await resolveHospitalUuid(supabase);
  const billingInvoiceId = await createLabBillingInvoice(supabase, {
    ...input,
    hospitalId,
    testName,
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
    test_name: testName,
    status: 'ordered',
    billing_invoice_id: billingInvoiceId,
    ordered_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('lab_orders').insert(payload).select('*').single();
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
      test_name: String(row.test_name ?? testName),
      status: String(row.status ?? 'ordered'),
      billing_invoice_id: row.billing_invoice_id ? String(row.billing_invoice_id) : undefined,
    },
  };
}

export async function fulfillLabOrder(
  supabase: SupabaseClient,
  orderId: string,
  resultSummary: string,
): Promise<{ ok: boolean; error?: string }> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('lab_orders')
    .update({
      status: 'completed',
      result_summary: resultSummary,
      resulted_at: now,
      updated_at: now,
    })
    .eq('id', orderId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function loadPatientLabOrders(
  supabase: SupabaseClient,
  patientId: string,
): Promise<LabOrderRow[]> {
  const { data } = await supabase
    .from('lab_orders')
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
      test_name: String(r.test_name ?? 'Lab test'),
      status: String(r.status ?? 'ordered'),
      result_summary: r.result_summary ? String(r.result_summary) : undefined,
      ordered_at: r.ordered_at ? String(r.ordered_at) : undefined,
      resulted_at: r.resulted_at ? String(r.resulted_at) : undefined,
    };
  });
}

export function subscribeLabOrders(
  supabase: SupabaseClient,
  patientId: string,
  onChange: () => void,
): () => void {
  const channel = supabase
    .channel(`lab-orders-${patientId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'lab_orders', filter: `patient_id=eq.${patientId}` },
      () => onChange(),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
