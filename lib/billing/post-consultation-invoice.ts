import type { SupabaseClient } from '@supabase/supabase-js';

import { MEDICINE_GST_RATE } from '@/lib/billing/invoice-breakdown';
import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';

export type InvoiceMedicineLine = {
  name: string;
  qty: number;
  price: number;
};

export type PrescribedItem = {
  drug: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity?: number;
};

export type PendingInvoiceInput = {
  appointmentId?: string | null;
  hospitalId?: string;
  uhid?: string;
  patient_uhid?: string;
  patientId?: string | null;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  department?: string;
  bookingSource?: string;
  source?: string;
  appointmentType?: string;
  tokenNumber?: string | number | null;
  consultationFee: number;
  medicines: InvoiceMedicineLine[];
  prescribedItems?: PrescribedItem[];
};

export type BillingInvoiceRow = {
  id: string;
  invoice_number?: string;
  appointment_id?: string;
  hospital_id: string;
  uhid: string;
  patient_uhid?: string;
  patient_name: string;
  doctor_id?: string;
  doctor_name?: string;
  department?: string;
  booking_source?: string;
  consultation_fee: number;
  medicine_fee?: number;
  gst_amount?: number;
  total_payable?: number;
  medicines: InvoiceMedicineLine[];
  medicines_total: number;
  total_amount: number;
  payment_status: string;
  payment_method?: string;
  prescribed_items?: PrescribedItem[];
  is_sent_to_app?: boolean;
  created_at: string;
  paid_at?: string;
};

function isUuid(value?: string | null): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value ?? ''));
}

function missingColumn(message: string | null | undefined): string | null {
  const text = String(message ?? '');
  return (
    text.match(/Could not find the '([^']+)' column/i)?.[1] ??
    text.match(/column (?:[\w]+\.)?([a-zA-Z0-9_]+) does not exist/i)?.[1] ??
    null
  );
}

export function nextInvoiceNumber(): string {
  return `INV-${Date.now().toString().slice(-8)}`;
}

export function resolvePatientUhid(input: {
  uhid?: string | null;
  patient_uhid?: string | null;
  patientId?: string | null;
}): string {
  const raw = String(input.patient_uhid ?? input.uhid ?? '').trim();
  if (raw) return raw;
  const patientId = String(input.patientId ?? '').trim();
  const suffix = patientId
    ? patientId.replace(/-/g, '').slice(0, 8).toUpperCase()
    : Date.now().toString().slice(-6);
  return `UHID-${suffix}`;
}

export function resolveBookingSource(input: {
  bookingSource?: string | null;
  source?: string | null;
  appointmentType?: string | null;
  tokenNumber?: string | number | null;
}): 'APP' | 'WALK-IN' {
  const normalized = String(input.bookingSource ?? input.source ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s_]+/g, '-');
  if (normalized.includes('WALK')) return 'WALK-IN';
  const appointmentType = String(input.appointmentType ?? '').toLowerCase();
  if (appointmentType.includes('walk')) return 'WALK-IN';
  const token = String(input.tokenNumber ?? '');
  if (/WLK|NX-WLK|NX-OPD/i.test(token)) return 'WALK-IN';
  return 'APP';
}

export function formatPrescribedItems(
  medicines: InvoiceMedicineLine[],
  prescribedItems?: PrescribedItem[],
): PrescribedItem[] {
  if (prescribedItems?.length) return prescribedItems;
  return medicines.map((med) => ({
    drug: med.name,
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    quantity: med.qty,
  }));
}

export function normalizeMedicineLines(raw: unknown): InvoiceMedicineLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((line) => {
      const item = line as Record<string, unknown>;
      return {
        name: String(item.name ?? item.medicine_name ?? item.drug ?? '').trim(),
        qty: Math.max(1, Number(item.qty ?? item.quantity ?? 1) || 1),
        price: Math.max(0, Number(item.price ?? item.unit_price ?? item.amount ?? 0) || 0),
      };
    })
    .filter((line) => line.name);
}

export function mapBillingInvoiceRow(row: Record<string, unknown>): BillingInvoiceRow {
  const medicines = normalizeMedicineLines(row.medicines ?? row.prescribed_items);
  const medicinesTotal = Number(
    row.medicine_fee ?? row.medicines_total ?? medicines.reduce((sum, line) => sum + line.qty * line.price, 0),
  );
  const patientUhid = String(row.patient_uhid ?? row.uhid ?? '');
  const totalPayable = Number(
    row.total_payable ?? row.total_amount ?? Number(row.consultation_fee ?? 0) + medicinesTotal,
  );

  return {
    id: String(row.id ?? ''),
    invoice_number: row.invoice_number ? String(row.invoice_number) : undefined,
    appointment_id: row.appointment_id ? String(row.appointment_id) : undefined,
    hospital_id: String(row.hospital_id ?? HOSPITAL_TENANT_ID),
    uhid: patientUhid,
    patient_uhid: patientUhid,
    patient_name: String(row.patient_name ?? 'Patient'),
    doctor_id: row.doctor_id ? String(row.doctor_id) : undefined,
    doctor_name: row.doctor_name ? String(row.doctor_name) : undefined,
    department: row.department ? String(row.department) : undefined,
    booking_source: row.booking_source ? String(row.booking_source) : undefined,
    consultation_fee: Number(row.consultation_fee ?? 0),
    medicine_fee: medicinesTotal,
    gst_amount: Number(row.gst_amount ?? 0),
    total_payable: totalPayable,
    medicines,
    medicines_total: medicinesTotal,
    total_amount: totalPayable,
    payment_status: String(row.payment_status ?? row.status ?? 'unpaid'),
    payment_method: row.payment_method ? String(row.payment_method) : undefined,
    prescribed_items: Array.isArray(row.prescribed_items)
      ? (row.prescribed_items as PrescribedItem[])
      : undefined,
    is_sent_to_app: Boolean(row.is_sent_to_app),
    created_at: String(row.created_at ?? ''),
    paid_at: row.paid_at ? String(row.paid_at) : undefined,
  };
}

async function markAppointmentBillingPending(
  supabase: SupabaseClient,
  appointmentId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const patch = {
    status: 'billing_pending',
    stage: 'billing',
    billing_status: 'pending_payment',
    completed_at: now,
    updated_at: now,
  };
  await supabase.from('appointments').update(patch).eq('id', appointmentId);
}

export async function createPendingConsultationInvoice(
  supabase: SupabaseClient,
  input: PendingInvoiceInput,
): Promise<{ ok: boolean; invoice?: BillingInvoiceRow; error?: string; skipped?: boolean }> {
  const medicines = normalizeMedicineLines(input.medicines);
  const prescribedItems = formatPrescribedItems(medicines, input.prescribedItems);
  const medicineFee = medicines.reduce((sum, line) => sum + line.qty * line.price, 0);
  const consultationFee = Math.max(0, Number(input.consultationFee) || 500);
  const gstAmount = medicineFee > 0 ? Math.round(medicineFee * MEDICINE_GST_RATE) : 0;
  const totalPayable = consultationFee + medicineFee + gstAmount;
  const appointmentId = isUuid(input.appointmentId) ? String(input.appointmentId) : null;
  const patientUhid = resolvePatientUhid({
    uhid: input.uhid,
    patient_uhid: input.patient_uhid,
    patientId: input.patientId,
  });
  const bookingSource = resolveBookingSource({
    bookingSource: input.bookingSource,
    source: input.source,
    appointmentType: input.appointmentType,
    tokenNumber: input.tokenNumber,
  });
  const now = new Date().toISOString();

  if (appointmentId) {
    const existing = await supabase
      .from('billing_invoices')
      .select('*')
      .eq('appointment_id', appointmentId)
      .maybeSingle();
    if (existing.data) {
      return { ok: true, skipped: true, invoice: mapBillingInvoiceRow(existing.data as Record<string, unknown>) };
    }
  }

  const payload: Record<string, unknown> = {
    invoice_number: nextInvoiceNumber(),
    hospital_id: input.hospitalId || HOSPITAL_TENANT_ID,
    patient_uhid: patientUhid,
    uhid: patientUhid,
    patient_name: input.patientName,
    doctor_id: input.doctorId || null,
    doctor_name: input.doctorName || null,
    department: input.department || 'General Medicine',
    booking_source: bookingSource,
    consultation_fee: consultationFee,
    medicine_fee: medicineFee,
    gst_amount: gstAmount,
    discount_amount: 0,
    total_payable: totalPayable,
    total_amount: totalPayable,
    medicines,
    medicines_total: medicineFee,
    payment_method: null,
    payment_status: 'unpaid',
    prescribed_items: prescribedItems,
    is_sent_to_app: bookingSource === 'APP',
    created_at: now,
    updated_at: now,
  };
  if (appointmentId) payload.appointment_id = appointmentId;

  let { data, error } = await supabase.from('billing_invoices').insert([payload]).select('*').maybeSingle();
  let attempts = 0;
  while (error && attempts < 12) {
    const column = missingColumn(error.message);
    if (column && column in payload) {
      delete payload[column];
    } else if (/uuid|foreign key|appointments/i.test(error.message) && payload.appointment_id) {
      delete payload.appointment_id;
    } else {
      break;
    }
    attempts += 1;
    const retry = await supabase.from('billing_invoices').insert([payload]).select('*').maybeSingle();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error('Error creating record in billing_invoices:', error.message);
    return { ok: false, error: error.message };
  }

  if (appointmentId) {
    await markAppointmentBillingPending(supabase, appointmentId);
  }

  return {
    ok: true,
    invoice: data ? mapBillingInvoiceRow(data as Record<string, unknown>) : undefined,
  };
}

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'insurance';

export async function clearConsultationInvoice(
  supabase: SupabaseClient,
  invoiceId: string,
  paymentMethod: PaymentMethod,
  options?: { gstAmount?: number; totalAmount?: number; pharmacyAmount?: number },
): Promise<{ ok: boolean; error?: string }> {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    payment_status: 'paid',
    payment_method: paymentMethod,
    paid_at: now,
    updated_at: now,
  };
  if (options?.gstAmount != null) patch.gst_amount = options.gstAmount;
  if (options?.pharmacyAmount != null) {
    patch.medicine_fee = options.pharmacyAmount;
    patch.medicines_total = options.pharmacyAmount;
  }
  if (options?.totalAmount != null) {
    patch.total_amount = options.totalAmount;
    patch.total_payable = options.totalAmount;
  }

  let { error } = await supabase.from('billing_invoices').update(patch).eq('id', invoiceId);
  let attempts = 0;
  while (error && attempts < 6) {
    const column = missingColumn(error.message);
    if (column && column in patch) {
      delete patch[column];
    } else {
      break;
    }
    attempts += 1;
    const retry = await supabase.from('billing_invoices').update(patch).eq('id', invoiceId);
    error = retry.error;
  }

  if (error) return { ok: false, error: error.message };

  const { data } = await supabase.from('billing_invoices').select('appointment_id').eq('id', invoiceId).maybeSingle();
  const appointmentId = data && (data as { appointment_id?: string }).appointment_id;
  if (appointmentId) {
    const { markAppointmentSettled } = await import('@/lib/hospital/appointment-settlement');
    await markAppointmentSettled(supabase, String(appointmentId), {
      pharmacyAmount: Math.max(0, Number(options?.pharmacyAmount) || 0),
      grandTotal: Math.max(0, Number(options?.totalAmount) || 0),
      paymentMethod,
    });
  }

  return { ok: true };
}

export async function completeConsultationWithInvoice(
  supabase: SupabaseClient,
  input: PendingInvoiceInput & { appointmentId: string },
): Promise<{ ok: boolean; invoice?: BillingInvoiceRow; totalAmount: number; error?: string }> {
  const medicines = normalizeMedicineLines(input.medicines);
  const medicinesTotal = medicines.reduce((sum, line) => sum + line.qty * line.price, 0);
  const consultationFee = Math.max(0, Number(input.consultationFee) || 500);
  const gstAmount = Math.round(medicinesTotal * MEDICINE_GST_RATE);
  const totalAmount = consultationFee + medicinesTotal + gstAmount;

  const created = await createPendingConsultationInvoice(supabase, {
    ...input,
    medicines,
    consultationFee,
  });

  if (!created.ok) {
    return { ok: false, totalAmount, error: created.error || 'Failed to write invoice' };
  }

  return { ok: true, invoice: created.invoice, totalAmount };
}
