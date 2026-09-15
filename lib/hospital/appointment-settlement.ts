import type { SupabaseClient } from '@supabase/supabase-js';

import type { PaymentMethod } from '@/lib/billing/post-consultation-invoice';

function missingColumn(message: string | null | undefined): string | null {
  const text = String(message ?? '');
  return (
    text.match(/Could not find the '([^']+)' column/i)?.[1] ??
    text.match(/column (?:[\w]+\.)?([a-zA-Z0-9_]+) does not exist/i)?.[1] ??
    null
  );
}

/** Mark an appointment visit as fully settled after billing counter payment. */
export async function markAppointmentSettled(
  supabase: SupabaseClient,
  appointmentId: string,
  input: {
    pharmacyAmount: number;
    grandTotal: number;
    paymentMethod: PaymentMethod;
  },
): Promise<void> {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: 'COMPLETED',
    queue_status: 'COMPLETED',
    billing_status: 'paid',
    pharmacy_amount: input.pharmacyAmount,
    total_amount_paid: input.grandTotal,
    payment_status: 'PAID',
    billed_at: now,
    paid_at: now,
    payment_method: input.paymentMethod,
    updated_at: now,
  };

  let { error } = await supabase.from('appointments').update(patch).eq('id', appointmentId);
  let attempts = 0;
  while (error && attempts < 10) {
    const column = missingColumn(error.message);
    if (column && column in patch) {
      delete patch[column];
    } else {
      break;
    }
    attempts += 1;
    const retry = await supabase.from('appointments').update(patch).eq('id', appointmentId);
    error = retry.error;
  }
}
