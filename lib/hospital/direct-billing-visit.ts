import type { SupabaseClient } from '@supabase/supabase-js';

import { computeCheckoutTotal } from '@/lib/billing/invoice-breakdown';
import { dispatchPaidBillToPatientApp } from '@/lib/billing/patient-bill-dispatch';
import {
  clearConsultationInvoice,
  createPendingConsultationInvoice,
  type PaymentMethod,
  type PrescribedItem,
} from '@/lib/billing/post-consultation-invoice';
import type { BookableDoctorRecord } from '@/lib/hospital/doctors';
import { markAppointmentSettled } from '@/lib/hospital/appointment-settlement';
import { buildSettledReceipt, type PrintableInvoice } from '@/lib/hospital/invoice-receipt';

export type DirectBillingSeed = {
  token?: string;
  invoiceId?: string;
  appointmentId?: string;
};

export type DirectBillingVisitContext = {
  isLinked: boolean;
  appointmentId?: string;
  invoiceId?: string;
  patientName: string;
  token: string;
  doctorName: string;
  department?: string;
  consultationFee: number;
  prescribedItems?: PrescribedItem[];
  bookingSource?: string;
  patientId?: string;
  status?: string;
};

type InvoiceLike = {
  id: string;
  status: string;
  patient_name: string;
  uhid?: string;
  token_number?: string | number | null;
  doctor_name?: string;
  department?: string;
  consultation_fee?: number;
  appointment_id?: string;
  prescribed_items?: PrescribedItem[];
  booking_source?: string;
  patient_id?: string;
  invoice_number?: string;
};

type QueueLike = {
  id: string;
  token_number?: string;
  token?: string;
  uhid?: string;
  patient_name: string;
  doctor_name?: string;
  department?: string;
  status?: string;
  source?: string;
};

function normalizeToken(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/^#/, '')
    .toUpperCase();
}

function tokensMatch(left: unknown, right: string): boolean {
  const a = normalizeToken(left);
  const b = normalizeToken(right);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function missingColumn(message: string | null | undefined): string | null {
  const text = String(message ?? '');
  return (
    text.match(/Could not find the '([^']+)' column/i)?.[1] ??
    text.match(/column (?:[\w]+\.)?([a-zA-Z0-9_]+) does not exist/i)?.[1] ??
    null
  );
}

function resolveDoctorFee(doctorName: string | undefined, doctors: BookableDoctorRecord[]): number | null {
  const target = String(doctorName ?? '').trim().toLowerCase();
  if (!target) return null;
  const match = doctors.find((doc) => {
    const names = [doc.full_name, doc.doctor_name, doc.name].map((n) => String(n ?? '').toLowerCase());
    return names.some((name) => name && (name.includes(target) || target.includes(name)));
  });
  return match?.consultation_fee ?? null;
}

export function resolveDirectBillingVisit(input: {
  token?: string;
  invoiceId?: string;
  appointmentId?: string;
  queue: QueueLike[];
  invoices: InvoiceLike[];
  doctors?: BookableDoctorRecord[];
}): DirectBillingVisitContext | null {
  const searchToken = normalizeToken(input.token);
  const queueRow = input.queue.find(
    (row) =>
      (input.appointmentId && row.id === input.appointmentId) ||
      (searchToken &&
        (tokensMatch(row.token_number, searchToken) ||
          tokensMatch(row.token, searchToken) ||
          tokensMatch(row.uhid, searchToken))),
  );

  const invoice = input.invoices.find(
    (inv) =>
      (input.invoiceId && inv.id === input.invoiceId) ||
      (/pending|unpaid|unbilled/i.test(inv.status) &&
        ((input.appointmentId && inv.appointment_id === input.appointmentId) ||
          (searchToken &&
            (tokensMatch(inv.uhid, searchToken) || tokensMatch(inv.token_number, searchToken))) ||
          (queueRow &&
            ((inv.appointment_id && inv.appointment_id === queueRow.id) ||
              inv.patient_name.trim().toLowerCase() === queueRow.patient_name.trim().toLowerCase())))),
  );

  if (!queueRow && !invoice && !searchToken) return null;

  const doctorName = invoice?.doctor_name || queueRow?.doctor_name || 'Duty doctor';
  const doctorFee = resolveDoctorFee(doctorName, input.doctors ?? []);
  const consultationFee = Number(
    invoice?.consultation_fee ?? doctorFee ?? 500,
  );

  const token =
    searchToken ||
    normalizeToken(invoice?.token_number ?? invoice?.uhid ?? queueRow?.token_number ?? queueRow?.uhid);

  return {
    isLinked: Boolean(queueRow || invoice),
    appointmentId: invoice?.appointment_id || queueRow?.id || input.appointmentId,
    invoiceId: invoice?.id || input.invoiceId,
    patientName: invoice?.patient_name || queueRow?.patient_name || '',
    token: token ? (token.startsWith('NX-') ? token : token) : '',
    doctorName,
    department: invoice?.department || queueRow?.department,
    consultationFee: Math.max(0, consultationFee),
    prescribedItems: invoice?.prescribed_items,
    bookingSource: invoice?.booking_source || queueRow?.source,
    patientId: invoice?.patient_id,
    status: queueRow?.status,
  };
}

export async function lookupDirectBillingVisit(
  supabase: SupabaseClient,
  token: string,
  doctors: BookableDoctorRecord[] = [],
): Promise<DirectBillingVisitContext | null> {
  const normalized = normalizeToken(token);
  if (!normalized) return null;

  const tokenVariants = Array.from(
    new Set([normalized, `#${normalized}`, normalized.replace(/^NX-/, 'NX-')]),
  );

  let query = supabase.from('appointments').select('*').order('updated_at', { ascending: false }).limit(5);
  const orParts = tokenVariants.flatMap((variant) => [
    `token_number.eq.${variant}`,
    `uhid.eq.${variant}`,
    `token.eq.${variant}`,
  ]);
  query = query.or(orParts.join(','));

  const { data, error } = await query;
  if (error || !data?.length) return null;

  const row = data[0] as Record<string, unknown>;
  const doctorName = String(row.doctor_name ?? 'Duty doctor');
  const doctorFee = resolveDoctorFee(doctorName, doctors);

  return {
    isLinked: true,
    appointmentId: String(row.id ?? ''),
    patientName: String(row.patient_name ?? row.name ?? ''),
    token: normalizeToken(row.token_number ?? row.uhid ?? normalized),
    doctorName,
    department: row.department ? String(row.department) : undefined,
    consultationFee: Math.max(0, Number(row.consultation_fee ?? doctorFee ?? 500) || 500),
    status: String(row.status ?? ''),
    bookingSource: row.source ? String(row.source) : undefined,
    patientId: row.patient_id ? String(row.patient_id) : undefined,
  };
}

export async function settleDirectBillingVisit(
  supabase: SupabaseClient,
  input: {
    hospitalId: string;
    visit: DirectBillingVisitContext;
    pharmacyAmount: number;
    paymentMethod: PaymentMethod;
  },
): Promise<{ ok: boolean; error?: string; grandTotal?: number; receipt?: PrintableInvoice }> {
  const pharmacyAmount = Math.max(0, Number(input.pharmacyAmount) || 0);
  const breakdown = computeCheckoutTotal({
    consultationFee: input.visit.consultationFee,
    pharmacyAmount,
  });

  let invoiceId = input.visit.invoiceId;

  if (!invoiceId) {
    const created = await createPendingConsultationInvoice(supabase, {
      appointmentId: input.visit.appointmentId ?? null,
      hospitalId: input.hospitalId,
      uhid: input.visit.token || `UHID-${Date.now().toString().slice(-6)}`,
      patientName: input.visit.patientName,
      doctorName: input.visit.doctorName,
      department: input.visit.department,
      consultationFee: input.visit.consultationFee,
      medicines: pharmacyAmount > 0 ? [{ name: 'Pharmacy & Dispensed Medicines', qty: 1, price: pharmacyAmount }] : [],
      prescribedItems: input.visit.prescribedItems,
      bookingSource: input.visit.bookingSource,
    });
    if (!created.ok) {
      return { ok: false, error: created.error || 'Could not create billing invoice.' };
    }
    invoiceId = created.invoice?.id;
  }

  if (!invoiceId) {
    return { ok: false, error: 'No invoice available for settlement.' };
  }

  const cleared = await clearConsultationInvoice(supabase, invoiceId, input.paymentMethod, {
    gstAmount: 0,
    pharmacyAmount: breakdown.medicinesTotal,
    totalAmount: breakdown.totalAmount,
  });
  if (!cleared.ok) {
    return { ok: false, error: cleared.error || 'Payment settlement failed.' };
  }

  if (input.visit.appointmentId) {
    await markAppointmentSettled(supabase, input.visit.appointmentId, {
      pharmacyAmount: breakdown.medicinesTotal,
      grandTotal: breakdown.totalAmount,
      paymentMethod: input.paymentMethod,
    });
  }

  await dispatchPaidBillToPatientApp(supabase, {
    invoiceId,
    patientId: input.visit.patientId,
    patientName: input.visit.patientName,
    uhid: input.visit.token,
    bookingSource: input.visit.bookingSource,
    paymentMethod: input.paymentMethod,
    breakdown,
    doctorName: input.visit.doctorName,
  });

  const receipt = buildSettledReceipt({
    invoiceId,
    patientName: input.visit.patientName,
    token: input.visit.token,
    doctorName: input.visit.doctorName,
    department: input.visit.department,
    consultationFee: breakdown.consultationFee,
    pharmacyAmount: breakdown.medicinesTotal,
    totalAmount: breakdown.totalAmount,
    prescribedItems: input.visit.prescribedItems,
    paymentMethod: input.paymentMethod,
  });

  return { ok: true, grandTotal: breakdown.totalAmount, receipt };
}
