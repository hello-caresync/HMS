import type {
  BillingInvoiceSummary,
  BillingLineItem,
  GstBreakdown,
  PatientBillingDraft,
} from './types';

export const CGST_RATE = 9;
export const SGST_RATE = 9;

export function computeLineAmount(line: BillingLineItem): number {
  return Math.round(line.quantity * line.unitRate * 100) / 100;
}

export function computeBillingSummary(
  lineItems: BillingLineItem[],
  authorizedDiscount: number,
): BillingInvoiceSummary {
  const subtotal = lineItems.reduce((sum, line) => sum + computeLineAmount(line), 0);
  const safeDiscount = Math.max(0, Math.min(authorizedDiscount, subtotal));
  const taxableBase = Math.round((subtotal - safeDiscount) * 100) / 100;
  const cgstAmount = Math.round(taxableBase * (CGST_RATE / 100) * 100) / 100;
  const sgstAmount = Math.round(taxableBase * (SGST_RATE / 100) * 100) / 100;
  const gst: GstBreakdown = {
    taxableBase,
    cgstRate: CGST_RATE,
    sgstRate: SGST_RATE,
    cgstAmount,
    sgstAmount,
    totalGst: Math.round((cgstAmount + sgstAmount) * 100) / 100,
  };
  const grandTotal = Math.round((taxableBase + gst.totalGst) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    authorizedDiscount: safeDiscount,
    gst,
    grandTotal,
  };
}

export function generateInvoiceNumber(): string {
  return `NEX-INV-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
}

export function generateTransactionToken(): string {
  return `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function generatePreAuthId(): string {
  return `PA-${String(8800 + Math.floor(Math.random() * 200))}`;
}

export const SEED_BILLING_LINES: BillingLineItem[] = [
  { id: 'bl-1', category: 'Consultation Fees', description: 'Cardiology OPD · Dr. Priya Menon', quantity: 1, unitRate: 850 },
  { id: 'bl-2', category: 'Lab Tests', description: 'HbA1c + CBC Panel', quantity: 1, unitRate: 1280 },
  { id: 'bl-3', category: 'Radiology Scans', description: 'Chest X-Ray PA View', quantity: 1, unitRate: 650 },
  { id: 'bl-4', category: 'Ward Tariffs', description: 'General Ward · 2 nights @ ₹2,500', quantity: 2, unitRate: 2500 },
  { id: 'bl-5', category: 'Pharmacy Consumables', description: 'Discharge medications bundle', quantity: 1, unitRate: 1840 },
];

export const SEED_BILLING_DRAFT: PatientBillingDraft = {
  invoiceId: 'inv-draft-001',
  invoiceNumber: 'NEX-INV-2026-4821',
  patientName: 'Priya Nair',
  patientUhid: 'NX-2026-301882',
  lineItems: SEED_BILLING_LINES,
  authorizedDiscount: 500,
  dispatchedToCashier: false,
};

export const SEED_PAYMENT_HISTORY = [
  {
    transactionToken: 'TXN-MK4F2A-9X2B',
    invoiceRef: 'NEX-INV-2026-4790',
    patientName: 'Rajesh Kumar',
    totalAmount: 12450,
    methodsSummary: 'UPI ₹8,000 · Cash ₹4,450',
    status: 'Completed' as const,
    processedAt: '2026-07-10T08:42:00Z',
  },
  {
    transactionToken: 'TXN-MK4E8C-3K1P',
    invoiceRef: 'NEX-INV-2026-4782',
    patientName: 'Sunita Menon',
    totalAmount: 8920,
    methodsSummary: 'Card ₹5,000 · Insurance ₹3,920',
    status: 'Completed' as const,
    processedAt: '2026-07-10T08:15:00Z',
  },
  {
    transactionToken: 'TXN-MK4D2Z-7M4Q',
    invoiceRef: 'NEX-INV-2026-4775',
    patientName: 'Walk-in · OPD',
    totalAmount: 2100,
    methodsSummary: 'Cash ₹2,100',
    status: 'Pending' as const,
    processedAt: '2026-07-10T07:58:00Z',
  },
];

export const SEED_PRE_AUTH_REQUESTS = [
  {
    requestId: 'PA-8821',
    patientName: 'Vikram Patel',
    patientUhid: 'NX-2026-901234',
    policyNumber: 'STAR-HEALTH-4482910',
    tpaCompany: 'Star Health · Medi Assist',
    procedureSummary: 'Total Knee Replacement · IPD 5 days',
    estimatedAmount: 285000,
    coPayAmount: 28500,
    status: 'Approved/Authorized' as const,
    submittedAt: '2026-07-08T10:00:00Z',
  },
  {
    requestId: 'PA-8834',
    patientName: 'Lakshmi Iyer',
    patientUhid: 'NX-2026-774320',
    policyNumber: 'HDFC-ERG-9921044',
    tpaCompany: 'HDFC ERGO · Paramount TPA',
    procedureSummary: 'Pacemaker Implant · Cardiac Suite',
    estimatedAmount: 420000,
    coPayAmount: 42000,
    status: 'Submitted to TPA' as const,
    submittedAt: '2026-07-09T14:30:00Z',
  },
  {
    requestId: 'PA-8840',
    patientName: 'Arjun Das',
    patientUhid: 'NX-2026-558901',
    policyNumber: 'ICICI-LOM-3310098',
    tpaCompany: 'ICICI Lombard · Health India',
    procedureSummary: 'ACL Reconstruction · Orthopedics',
    estimatedAmount: 165000,
    coPayAmount: 16500,
    status: 'Awaiting Documents' as const,
    submittedAt: '2026-07-10T07:00:00Z',
  },
  {
    requestId: 'PA-8845',
    patientName: 'Unknown · TRI-2401',
    patientUhid: 'NX-2026-PENDING',
    policyNumber: 'GOVT-SCH-77201',
    tpaCompany: 'Government Scheme · ESIC',
    procedureSummary: 'Emergency CABG · Critical',
    estimatedAmount: 550000,
    coPayAmount: 0,
    status: 'Rejected' as const,
    submittedAt: '2026-07-10T09:05:00Z',
  },
];

export const TPA_COMPANY_OPTIONS = [
  'Star Health · Medi Assist',
  'HDFC ERGO · Paramount TPA',
  'ICICI Lombard · Health India',
  'Government Scheme · ESIC',
  'Self Pay · Cashless N/A',
];
