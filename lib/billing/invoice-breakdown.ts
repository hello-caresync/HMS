import type { InvoiceMedicineLine } from '@/lib/billing/post-consultation-invoice';

/** GST rate applied to pharmacy line items (consultation fee is exempt). */
export const MEDICINE_GST_RATE = 0.05;

export type InvoiceBreakdown = {
  consultationFee: number;
  medicinesTotal: number;
  gstAmount: number;
  subtotal: number;
  totalAmount: number;
  medicines: InvoiceMedicineLine[];
};

export function computeInvoiceBreakdown(input: {
  consultationFee: number;
  medicines?: InvoiceMedicineLine[];
}): InvoiceBreakdown {
  const medicines = input.medicines ?? [];
  const consultationFee = Math.max(0, Number(input.consultationFee) || 0);
  const medicinesTotal = medicines.reduce((sum, line) => sum + line.qty * line.price, 0);
  const gstAmount = Math.round(medicinesTotal * MEDICINE_GST_RATE);
  const subtotal = consultationFee + medicinesTotal;
  const totalAmount = subtotal + gstAmount;

  return {
    consultationFee,
    medicinesTotal,
    gstAmount,
    subtotal,
    totalAmount,
    medicines,
  };
}

/** Counter checkout: consultation fee + pharmacy lump sum (no per-line doctor pricing). */
export function computeCheckoutTotal(input: {
  consultationFee: number;
  pharmacyAmount?: number;
}): InvoiceBreakdown {
  const consultationFee = Math.max(0, Number(input.consultationFee) || 0);
  const pharmacyAmount = Math.max(0, Number(input.pharmacyAmount) || 0);
  const totalAmount = consultationFee + pharmacyAmount;

  return {
    consultationFee,
    medicinesTotal: pharmacyAmount,
    gstAmount: 0,
    subtotal: totalAmount,
    totalAmount,
    medicines: [],
  };
}

export function isConsultationBillingEligible(status?: string | null): boolean {
  const value = String(status ?? '').toLowerCase();
  return /billing_pending|billing|completed|complete|done/.test(value) && !/paid|cancel|closed/.test(value);
}
