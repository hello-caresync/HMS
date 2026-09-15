import type { SupabaseClient } from '@supabase/supabase-js';

import { dispatchEcosystemNotification, emitEcosystemSystemEvent } from '@/lib/ecosystem/messaging-service';
import { formatINR } from '@/lib/utils/currency';

import type { InvoiceBreakdown } from '@/lib/billing/invoice-breakdown';

export function normalizeBookingSource(source?: string | null): string {
  return String(source ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

/** Patient booked via mobile app — eligible for in-app bill receipt. */
export function isPatientAppBooking(source?: string | null): boolean {
  const normalized = normalizeBookingSource(source);
  return normalized === 'APP' || normalized === 'PATIENT_APP' || normalized === 'ONLINE';
}

/** Walk-in desk registration — skip external patient-app push. */
export function isWalkInBooking(source?: string | null): boolean {
  const normalized = normalizeBookingSource(source);
  return (
    normalized === 'WALK_IN' ||
    normalized === 'WALKIN' ||
    normalized === 'HOSPITAL_WALKIN' ||
    normalized === 'WALK_IN_DESK'
  );
}

export type PaidBillDispatchInput = {
  invoiceId: string;
  patientId?: string | null;
  patientName: string;
  uhid?: string;
  bookingSource?: string | null;
  paymentMethod: string;
  breakdown: InvoiceBreakdown;
  doctorName?: string;
};

/** Route paid invoice to patient app only for APP bookings. */
export async function dispatchPaidBillToPatientApp(
  supabase: SupabaseClient,
  input: PaidBillDispatchInput,
): Promise<{ dispatched: boolean; reason?: string }> {
  if (isWalkInBooking(input.bookingSource)) {
    return { dispatched: false, reason: 'walk_in_skip' };
  }
  if (!isPatientAppBooking(input.bookingSource)) {
    return { dispatched: false, reason: 'not_app_booking' };
  }

  const recipientId = input.patientId || input.uhid || null;
  const amountLabel = formatINR(input.breakdown.totalAmount);
  const gstLabel = input.breakdown.gstAmount > 0 ? ` (incl. GST ${formatINR(input.breakdown.gstAmount)})` : '';

  await dispatchEcosystemNotification(supabase, {
    recipient_type: 'patient',
    recipient_id: recipientId,
    recipient_name: input.patientName,
    title: 'Consultation Bill Settled',
    message: `Invoice ${input.invoiceId.slice(0, 8)} · ${amountLabel}${gstLabel} paid via ${input.paymentMethod.toUpperCase()}. View receipt in My Bills.`,
    category: 'billing',
    priority: 'high',
    sender_role: 'hospital_admin',
    target_app: 'Patients App',
  });

  await emitEcosystemSystemEvent(supabase, {
    event_type: 'PATIENT_BILL_DISPATCHED',
    source_app: 'hospital',
    severity: 'info',
    target_roles: ['patient'],
    payload: {
      invoice_id: input.invoiceId,
      patient_id: recipientId,
      patient_name: input.patientName,
      uhid: input.uhid,
      total_amount: input.breakdown.totalAmount,
      consultation_fee: input.breakdown.consultationFee,
      medicines_total: input.breakdown.medicinesTotal,
      gst_amount: input.breakdown.gstAmount,
      payment_method: input.paymentMethod,
      booking_source: normalizeBookingSource(input.bookingSource),
    },
  });

  return { dispatched: true };
}
