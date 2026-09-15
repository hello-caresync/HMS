import type { SupabaseClient } from '@supabase/supabase-js';

import { mapBillingInvoiceRow, type BillingInvoiceRow } from '@/lib/billing/post-consultation-invoice';
import { clearConsultationInvoice, type PaymentMethod } from '@/lib/billing/post-consultation-invoice';
import { dispatchPaidBillToPatientApp } from '@/lib/billing/patient-bill-dispatch';
import { computeInvoiceBreakdown } from '@/lib/billing/invoice-breakdown';
import { dispatchEcosystemNotification } from '@/lib/ecosystem/messaging-service';
import { isHospitalUuid } from '@/lib/hospital/resolve-hospital-context';

export type HospitalBillingInvoiceView = BillingInvoiceRow & {
  hospital_name?: string;
  hospital_address?: string;
};

export async function fetchHospitalBillingInvoices(
  supabase: SupabaseClient,
  hospitalId: string,
): Promise<HospitalBillingInvoiceView[]> {
  if (!isHospitalUuid(hospitalId)) return [];

  const { data, error } = await supabase
    .from('billing_invoices')
    .select('*')
    .eq('hospital_id', hospitalId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('fetchHospitalBillingInvoices:', error.message);
    return [];
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  let hospitalMeta: { name?: string; address?: string } = {};
  const { data: hospitalRow } = await supabase
    .from('hospitals')
    .select('name, address, city, facility_code')
    .eq('id', hospitalId)
    .maybeSingle();

  if (hospitalRow) {
    const h = hospitalRow as Record<string, unknown>;
    hospitalMeta = {
      name: String(h.name ?? ''),
      address: [h.address, h.city].filter(Boolean).join(', ') || undefined,
    };
  }

  return rows.map((row) => ({
    ...mapBillingInvoiceRow(row),
    hospital_name: hospitalMeta.name,
    hospital_address: hospitalMeta.address,
  }));
}

export function subscribeHospitalBillingInvoices(
  supabase: SupabaseClient,
  onChange: () => void,
): () => void {
  const channel = supabase
    .channel('hospital-billing-invoices-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'billing_invoices' },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function markBillingInvoicePaid(
  supabase: SupabaseClient,
  invoice: HospitalBillingInvoiceView,
  paymentMethod: PaymentMethod,
): Promise<{ ok: boolean; error?: string }> {
  const cleared = await clearConsultationInvoice(supabase, invoice.id, paymentMethod, {
    gstAmount: invoice.gst_amount,
    pharmacyAmount: invoice.medicine_fee ?? invoice.medicines_total ?? 0,
    totalAmount: invoice.total_payable,
  });

  if (!cleared.ok) return cleared;

  const breakdown = computeInvoiceBreakdown({
    consultationFee: invoice.consultation_fee,
    medicines: invoice.medicines,
  });

  await dispatchPaidBillToPatientApp(supabase, {
    invoiceId: invoice.invoice_number ?? invoice.id,
    patientId: invoice.uhid,
    patientName: invoice.patient_name,
    uhid: invoice.uhid,
    bookingSource: invoice.booking_source,
    paymentMethod,
    breakdown,
    doctorName: invoice.doctor_name,
  });

  await dispatchEcosystemNotification(
    supabase,
    {
      recipient_type: 'patient',
      recipient_id: invoice.uhid || invoice.patient_name,
      recipient_name: invoice.patient_name,
      title: 'Your consultation is complete — invoice available',
      message: `Payment received for ${invoice.invoice_number ?? 'your visit'}. Total ${invoice.total_payable} INR. View details in the patient portal.`,
      category: 'billing',
      priority: 'high',
      sender_role: 'hospital_admin',
      target_app: 'Patients App',
    },
    { hospitalId: invoice.hospital_id },
  );

  return { ok: true };
}
