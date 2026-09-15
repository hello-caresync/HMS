import type { PrescribedItem } from '@/lib/billing/post-consultation-invoice';

export type PrintableInvoice = {
  id: string;
  invoice_number?: string;
  uhid?: string;
  patient_uhid?: string;
  patient_name: string;
  doctor_name?: string;
  department?: string;
  token_number?: string | number | null;
  consultation_fee?: number;
  pharmacy_amount?: number;
  total_payable?: number;
  total_amount?: number;
  medicines?: Array<{ name: string; qty: number; price: number }>;
  prescribed_items?: PrescribedItem[];
  amount: number;
  payment_method?: string;
  paid_at?: string;
  created_at?: string;
};

export function formatReceiptInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatReceiptToken(token?: string | number | null, uhid?: string): string {
  if (token != null && String(token).trim()) {
    const value = String(token).replace(/^#/, '');
    return value.startsWith('T-') || value.startsWith('NX-') ? value : `T-${value}`;
  }
  return uhid ? String(uhid) : 'T-01';
}

export function formatReceiptDoctorLabel(invoice: Pick<PrintableInvoice, 'doctor_name' | 'department'>): string {
  const doctor = invoice.doctor_name || 'Consulting Physician';
  const department = invoice.department?.trim();
  return department ? `${doctor} (${department})` : doctor;
}

export function buildOfficialInvoiceNumber(token?: string | number | null): string {
  const tokenLabel = formatReceiptToken(token).replace(/^#/, '');
  return `INV-${tokenLabel}-${Date.now().toString().slice(-4)}`;
}

export function buildSettledReceipt(input: {
  invoiceId: string;
  patientName: string;
  token: string;
  doctorName: string;
  department?: string;
  consultationFee: number;
  pharmacyAmount: number;
  totalAmount: number;
  prescribedItems?: PrescribedItem[];
  paymentMethod: string;
}): PrintableInvoice {
  return {
    id: input.invoiceId,
    invoice_number: buildOfficialInvoiceNumber(input.token),
    uhid: input.token,
    patient_name: input.patientName,
    doctor_name: input.doctorName,
    department: input.department,
    token_number: input.token,
    consultation_fee: input.consultationFee,
    pharmacy_amount: input.pharmacyAmount,
    amount: input.totalAmount,
    payment_method: input.paymentMethod,
    paid_at: new Date().toISOString(),
    prescribed_items: input.prescribedItems,
  };
}

export function resolveReceiptTotals(invoice: PrintableInvoice): {
  consultation: number;
  pharmacyAmount: number;
  totalPaid: number;
} {
  const consultation = Number(invoice.consultation_fee ?? 0);
  const pharmacyAmount = Number(
    invoice.pharmacy_amount ??
      invoice.medicines?.reduce((sum, line) => sum + line.qty * line.price, 0) ??
      0,
  );
  const totalPaid = Number(
    invoice.amount ?? invoice.total_payable ?? invoice.total_amount ?? consultation + pharmacyAmount,
  );
  return { consultation, pharmacyAmount, totalPaid };
}
