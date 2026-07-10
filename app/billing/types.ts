import type { GstPercentage } from '../master-data/types';

/** Who bears financial responsibility for the encounter */
export type BillingType = 'Self' | 'Insurance' | 'Corporate';

/** Supported checkout rails at the payment terminal */
export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Corporate' | 'Insurance';

/** Lifecycle of a patient invoice in the billing ledger */
export type InvoiceStatus =
  | 'Draft'
  | 'Pending Payment'
  | 'Partially Paid'
  | 'Settled'
  | 'Claim Pending';

/** Payment capture state machine for audit trails */
export type TransactionStatus =
  | 'Initiated'
  | 'Authorized'
  | 'Captured'
  | 'Failed'
  | 'Refunded';

export interface InvoiceLineItem {
  id: string;
  description: string;
  department: string;
  basePrice: number;
  gstPercent: GstPercentage;
  quantity: number;
}

export interface ComputedLineItem extends InvoiceLineItem {
  taxAmount: number;
  netTotal: number;
}

export interface InvoiceTotals {
  subtotal: number;
  totalTax: number;
  discount: number;
  grandTotal: number;
}

export interface SplitPaymentLine {
  method: PaymentMethod;
  amount: number;
}

export interface PaymentAttempt {
  id: string;
  splitEnabled: boolean;
  splits: SplitPaymentLine[];
  primaryMethod: PaymentMethod;
  tpaPreAuthorized: boolean;
  tpaReference?: string;
  status: TransactionStatus;
  capturedAt?: string;
}

export interface PatientInvoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  uhid: string;
  billingType: BillingType;
  lineItems: InvoiceLineItem[];
  discount: number;
  status: InvoiceStatus;
  payment?: PaymentAttempt;
  createdAt: string;
  settledAt?: string;
}

export interface DoctorRevenueRow {
  doctorName: string;
  department: string;
  consultations: number;
  revenue: number;
}

export interface DepartmentRevenueRow {
  department: string;
  itemCount: number;
  revenue: number;
  gstCollected: number;
}

export interface FinancialMetrics {
  todaysCollection: number;
  pendingBills: number;
  pendingBillCount: number;
  claimsAwaitingSettlement: number;
  claimsCount: number;
  totalGstCollected: number;
}

export const BILLING_TYPES: BillingType[] = ['Self', 'Insurance', 'Corporate'];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'UPI',
  'Card',
  'Corporate',
  'Insurance',
];

export const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  Draft: 'bg-slate-100 text-slate-900 ring-slate-200',
  'Pending Payment': 'bg-amber-100 text-amber-900 ring-amber-200',
  'Partially Paid': 'bg-sky-100 text-sky-900 ring-sky-200',
  Settled: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
  'Claim Pending': 'bg-violet-100 text-violet-900 ring-violet-200',
};

export function generateInvoiceId(): string {
  return `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

export function generateInvoiceNumber(): string {
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `NEX-INV-2026-${seq}`;
}

export function generatePaymentId(): string {
  return `pay-${Date.now().toString(36)}`;
}

export function generateLineItemId(): string {
  return `bli-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 4)}`;
}
