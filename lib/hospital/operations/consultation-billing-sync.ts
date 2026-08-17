import type { SupabaseClient } from '@supabase/supabase-js';

import {
  dispatchEcosystemNotification,
  emitEcosystemSystemEvent,
} from '@/lib/ecosystem/messaging-service';
import {
  normalizeBillRow as normalizeBillShape,
  resolveBillsTable,
  toEnterpriseBillPayload,
} from '@/lib/hospital/operations/bills-table';
import { formatINR } from '@/lib/utils/currency';

/** Regal Hospital facility code — used for billing, inventory, and procurement filters. */
export const REGAL_FACILITY_CODE = 'RH-BLR-01';

/** Regal Hospital facility UUID shared across all ecosystem apps. */
export const REGAL_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

export type BillLineItem = {
  item: string;
  amount: number;
  category?: 'consultation' | 'pharmacy' | 'lab' | 'other';
};

export type ConsultationBill = {
  id: string;
  invoice_number: string;
  appointment_id?: string;
  patient_id: string;
  patient_name: string;
  patient_uhid?: string;
  doctor_id?: string;
  doctor_name?: string;
  total_amount: number;
  paid_amount: number;
  status: 'unpaid' | 'partial' | 'paid' | 'insurance_pending';
  lines: BillLineItem[];
  payment_mode?: string;
  payment_reference?: string;
  facility_code?: string;
  bill_type?: string;
  created_at: string;
  updated_at?: string;
};

export type GenerateBillInput = {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientUhid?: string;
  doctorId?: string;
  doctorName?: string;
  consultationFee?: number | string;
  prescriptions?: { medicine_name: string }[];
  labTests?: string[];
};

export type CollectPaymentInput = {
  billId: string;
  amount: number;
  paymentMode: string;
  paymentReference?: string;
  patientId?: string;
  patientName?: string;
  invoiceNumber?: string;
};

function nextInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  return `INV-${year}-${suffix}`;
}

function parseFee(raw: unknown, fallback = 800): number {
  if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
  const numeric = Number(String(raw ?? '').replace(/[^\d.]/g, ''));
  return Number.isNaN(numeric) || numeric <= 0 ? fallback : numeric;
}

function normalizePaymentStatus(
  paid: number,
  total: number,
  raw?: unknown,
): ConsultationBill['status'] {
  const label = String(raw ?? '').toLowerCase();
  if (label.includes('insurance')) return 'insurance_pending';
  if (paid >= total && total > 0) return 'paid';
  if (paid > 0) return 'partial';
  return 'unpaid';
}

function mapBillRow(row: Record<string, unknown>): ConsultationBill {
  const normalized = normalizeBillShape(row);
  const linesRaw = normalized.lines ?? normalized.line_items;
  const lines: BillLineItem[] = Array.isArray(linesRaw)
    ? linesRaw.map((line) => {
        const item = line as Record<string, unknown>;
        return {
          item: String(item.item ?? item.description ?? 'Charge'),
          amount: Number(item.amount ?? 0),
          category: item.category as BillLineItem['category'],
        };
      })
    : [];

  const total = Number(normalized.total_amount ?? normalized.amount ?? 0);
  const paid = Number(normalized.paid_amount ?? 0);

  return {
    id: String(normalized.id ?? ''),
    invoice_number: String(normalized.invoice_number ?? ''),
    appointment_id: normalized.appointment_id ? String(normalized.appointment_id) : undefined,
    patient_id: String(normalized.patient_id ?? ''),
    patient_name: String(normalized.patient_name ?? 'Patient'),
    patient_uhid: normalized.patient_uhid
      ? String(normalized.patient_uhid)
      : normalized.uhid
        ? String(normalized.uhid)
        : undefined,
    doctor_id: normalized.doctor_id ? String(normalized.doctor_id) : undefined,
    doctor_name: normalized.doctor_name ? String(normalized.doctor_name) : undefined,
    total_amount: total,
    paid_amount: paid,
    status: normalizePaymentStatus(paid, total, normalized.status ?? normalized.payment_status),
    lines,
    payment_mode: normalized.payment_mode ? String(normalized.payment_mode) : undefined,
    payment_reference: normalized.payment_reference ? String(normalized.payment_reference) : undefined,
    facility_code: normalized.facility_code ? String(normalized.facility_code) : REGAL_FACILITY_CODE,
    bill_type: normalized.bill_type ? String(normalized.bill_type) : undefined,
    created_at: String(normalized.created_at ?? new Date().toISOString()),
    updated_at: normalized.updated_at ? String(normalized.updated_at) : undefined,
  };
}

function buildLineItems(input: GenerateBillInput): BillLineItem[] {
  const lines: BillLineItem[] = [];
  const consultFee = parseFee(input.consultationFee);
  const doctorLabel = input.doctorName ? `Consultation · ${input.doctorName}` : 'OPD Consultation';

  lines.push({ item: doctorLabel, amount: consultFee, category: 'consultation' });

  const rxCount = (input.prescriptions ?? []).filter((p) => p.medicine_name.trim()).length;
  if (rxCount > 0) {
    const pharmacyTotal = rxCount * 150;
    lines.push({
      item: `Pharmacy Rx (${rxCount} item${rxCount === 1 ? '' : 's'})`,
      amount: pharmacyTotal,
      category: 'pharmacy',
    });
  }

  const labCount = (input.labTests ?? []).length;
  if (labCount > 0) {
    const labTotal = labCount * 600;
    lines.push({
      item: `Lab · ${input.labTests!.join(', ')}`,
      amount: labTotal,
      category: 'lab',
    });
  }

  return lines;
}

async function billExistsForAppointment(
  supabase: SupabaseClient,
  appointmentId: string,
): Promise<boolean> {
  if (!appointmentId) return false;
  const table = await resolveBillsTable(supabase);
  const { data } = await supabase.from(table).select('id').eq('appointment_id', appointmentId).limit(1);
  return Boolean(data?.length);
}

async function dispatchBillGeneratedNotifications(
  supabase: SupabaseClient,
  bill: ConsultationBill,
): Promise<void> {
  const amountLabel = formatINR(bill.total_amount);

  await dispatchEcosystemNotification(supabase, {
    recipient_type: 'patient',
    recipient_id: bill.patient_id,
    recipient_name: bill.patient_name,
    title: 'Post-Consultation Bill Ready',
    message: `Invoice ${bill.invoice_number} · ${amountLabel} · Proceed to Regal Hospital cashier for settlement.`,
    category: 'billing',
    priority: 'high',
    sender_role: 'doctor_app',
    target_app: 'Patients App',
  });

  await dispatchEcosystemNotification(supabase, {
    recipient_type: 'all',
    recipient_id: null,
    recipient_name: 'Cashier Desk',
    title: 'New OPD Bill · Cashier Action',
    message: `${bill.patient_name} · ${bill.invoice_number} · ${amountLabel} · Payment pending at Billing Desk.`,
    category: 'billing',
    priority: 'high',
    sender_role: 'doctor_app',
    target_app: 'Hospital App',
  });

  await emitEcosystemSystemEvent(supabase, {
    event_type: 'BILL_GENERATED',
    source_app: 'doctor',
    severity: 'info',
    target_roles: ['hospital', 'patient', 'doctor'],
    payload: {
      bill_id: bill.id,
      invoice_number: bill.invoice_number,
      appointment_id: bill.appointment_id,
      patient_id: bill.patient_id,
      patient_name: bill.patient_name,
      total_amount: bill.total_amount,
      facility: REGAL_FACILITY_CODE,
      message: `Bill generated · ${bill.patient_name} · ${amountLabel}`,
    },
  });
}

async function dispatchPaymentCollectedNotifications(
  supabase: SupabaseClient,
  bill: ConsultationBill,
  amount: number,
  paymentMode: string,
): Promise<void> {
  const amountLabel = formatINR(amount);
  const balance = Math.max(bill.total_amount - bill.paid_amount, 0);
  const settled = bill.status === 'paid';

  await dispatchEcosystemNotification(supabase, {
    recipient_type: 'patient',
    recipient_id: bill.patient_id,
    recipient_name: bill.patient_name,
    title: settled ? 'Payment Confirmed' : 'Part Payment Received',
    message: settled
      ? `${bill.invoice_number} settled · ${formatINR(bill.paid_amount)} received via ${paymentMode}.`
      : `${amountLabel} received for ${bill.invoice_number} · ${formatINR(balance)} outstanding.`,
    category: 'billing',
    priority: 'normal',
    sender_role: 'hospital_admin',
    target_app: 'Patients App',
  });

  await dispatchEcosystemNotification(supabase, {
    recipient_type: 'all',
    recipient_id: null,
    recipient_name: 'Billing Desk',
    title: 'Payment Collected',
    message: `${bill.patient_name} · ${bill.invoice_number} · ${amountLabel} via ${paymentMode}`,
    category: 'billing',
    priority: 'normal',
    sender_role: 'hospital_admin',
    target_app: 'Hospital App',
  });

  await emitEcosystemSystemEvent(supabase, {
    event_type: 'PAYMENT_COLLECTED',
    source_app: 'hospital',
    severity: 'info',
    target_roles: ['hospital', 'patient', 'doctor'],
    payload: {
      bill_id: bill.id,
      invoice_number: bill.invoice_number,
      patient_id: bill.patient_id,
      patient_name: bill.patient_name,
      amount,
      payment_mode: paymentMode,
      status: bill.status,
      balance,
      facility: REGAL_FACILITY_CODE,
      message: `Payment collected · ${bill.patient_name} · ${amountLabel}`,
    },
  });
}

/** Auto-generate consolidated OPD invoice when doctor signs off consultation. */
export async function generatePostConsultationBill(
  supabase: SupabaseClient,
  input: GenerateBillInput,
): Promise<{ ok: boolean; error?: string; bill?: ConsultationBill; skipped?: boolean }> {
  if (!input.appointmentId || !input.patientId) {
    return { ok: false, error: 'appointmentId and patientId are required' };
  }

  if (await billExistsForAppointment(supabase, input.appointmentId)) {
    const table = await resolveBillsTable(supabase);
    const { data } = await supabase
      .from(table)
      .select('*')
      .eq('appointment_id', input.appointmentId)
      .maybeSingle();
    if (data) {
      return { ok: true, bill: mapBillRow(data as Record<string, unknown>), skipped: true };
    }
    return { ok: true, skipped: true };
  }

  const lines = buildLineItems(input);
  const totalAmount = lines.reduce((sum, line) => sum + line.amount, 0);
  const now = new Date().toISOString();
  const invoiceNumber = nextInvoiceNumber();

  const payload: Record<string, unknown> = {
    id: crypto.randomUUID(),
    invoice_number: invoiceNumber,
    appointment_id: input.appointmentId,
    patient_id: input.patientId,
    patient_name: input.patientName,
    patient_uhid: input.patientUhid ?? null,
    doctor_id: input.doctorId ?? null,
    doctor_name: input.doctorName ?? null,
    hospital_id: REGAL_HOSPITAL_ID,
    facility_code: REGAL_FACILITY_CODE,
    bill_type: 'opd_consultation',
    department: 'OPD',
    amount: totalAmount,
    total_amount: totalAmount,
    paid_amount: 0,
    status: 'unpaid',
    payment_status: 'Unpaid',
    line_items: lines,
    lines,
    module_id: REGAL_FACILITY_CODE,
    created_at: now,
    updated_at: now,
  };

  const table = await resolveBillsTable(supabase);
  const insertPayload =
    table === 'bills' ? toEnterpriseBillPayload(payload) : payload;

  const { data, error } = await supabase.from(table).insert(insertPayload).select('*').single();
  if (error) return { ok: false, error: error.message };

  const bill = mapBillRow((data ?? payload) as Record<string, unknown>);
  await dispatchBillGeneratedNotifications(supabase, bill);
  return { ok: true, bill };
}

/** Hospital cashier settlement with dual patient + desk notifications. */
export async function collectConsultationBillPayment(
  supabase: SupabaseClient,
  input: CollectPaymentInput,
): Promise<{ ok: boolean; error?: string; bill?: ConsultationBill }> {
  const amount = Math.max(Number(input.amount) || 0, 0);
  if (amount <= 0) return { ok: false, error: 'Payment amount must be greater than zero' };

  const table = await resolveBillsTable(supabase);
  const { data: existing, error: loadError } = await supabase
    .from(table)
    .select('*')
    .eq('id', input.billId)
    .maybeSingle();

  if (loadError) return { ok: false, error: loadError.message };
  if (!existing) return { ok: false, error: 'Invoice not found' };

  const current = mapBillRow(existing as Record<string, unknown>);
  const paid = current.paid_amount + amount;
  const total = current.total_amount;
  const status = normalizePaymentStatus(paid, total);
  const paymentStatus = status === 'paid' ? 'Paid' : status === 'partial' ? 'Partial' : 'Unpaid';
  const now = new Date().toISOString();

  const updatePayload =
    table === 'bills'
      ? {
          paid_amount: paid,
          status,
          payment_method: input.paymentMode,
          payment_reference: input.paymentReference?.trim() || null,
          balance_amount: Math.max(total - paid, 0),
          updated_at: now,
          settled_at: status === 'paid' ? now : null,
        }
      : {
          paid_amount: paid,
          status,
          payment_status: paymentStatus,
          payment_mode: input.paymentMode,
          payment_reference: input.paymentReference?.trim() || null,
          updated_at: now,
        };

  const { data, error } = await supabase
    .from(table)
    .update(updatePayload)
    .eq('id', input.billId)
    .select('*')
    .single();

  if (error) return { ok: false, error: error.message };

  const bill = mapBillRow((data ?? { ...existing, paid_amount: paid, status }) as Record<string, unknown>);
  await dispatchPaymentCollectedNotifications(supabase, bill, amount, input.paymentMode);
  return { ok: true, bill };
}

export async function loadHospitalBillsLive(
  supabase: SupabaseClient,
  limit = 100,
): Promise<ConsultationBill[]> {
  const table = await resolveBillsTable(supabase);

  const primary = await supabase
    .from(table)
    .select('*')
    .eq('facility_code', REGAL_FACILITY_CODE)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!primary.error && primary.data?.length) {
    return primary.data.map((row) => mapBillRow(row as Record<string, unknown>));
  }

  const fallback = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(limit);

  if (fallback.error || !fallback.data?.length) return [];
  return fallback.data.map((row) => mapBillRow(row as Record<string, unknown>));
}

export async function loadPatientBillsLive(
  supabase: SupabaseClient,
  patientId: string,
  limit = 20,
): Promise<ConsultationBill[]> {
  if (!patientId) return [];

  const table = await resolveBillsTable(supabase);
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .or(`patient_id.eq.${patientId},patient_uhid.eq.${patientId}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data?.length) return [];
  return data.map((row) => mapBillRow(row as Record<string, unknown>));
}

export function subscribeConsultationBilling(
  supabase: SupabaseClient,
  onChange: () => void,
): () => void {
  const channel = supabase
    .channel('public:consultation-billing')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'billing_invoices' }, () =>
      onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function consultationBillToHospitalRow(bill: ConsultationBill): Record<string, unknown> {
  return {
    id: bill.id,
    invoice_number: bill.invoice_number,
    patient_uhid: bill.patient_uhid,
    patient_name: bill.patient_name,
    patient_id: bill.patient_id,
    total_amount: bill.total_amount,
    paid_amount: bill.paid_amount,
    status: bill.status,
    lines: bill.lines,
    appointment_id: bill.appointment_id,
    payment_mode: bill.payment_mode,
    payment_reference: bill.payment_reference,
    created_at: bill.created_at,
  };
}
