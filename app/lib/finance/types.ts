/** Phase 5 — Finance workflow types (Modules 14–16) */

export type ExpenseCategory =
  | 'Consultation Fees'
  | 'Lab Tests'
  | 'Radiology Scans'
  | 'Ward Tariffs'
  | 'Pharmacy Consumables';

export interface BillingLineItem {
  id: string;
  category: ExpenseCategory;
  description: string;
  quantity: number;
  unitRate: number;
}

export interface GstBreakdown {
  taxableBase: number;
  cgstRate: number;
  sgstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  totalGst: number;
}

export interface BillingInvoiceSummary {
  subtotal: number;
  authorizedDiscount: number;
  gst: GstBreakdown;
  grandTotal: number;
}

export interface PatientBillingDraft {
  invoiceId: string;
  invoiceNumber: string;
  patientName: string;
  patientUhid: string;
  lineItems: BillingLineItem[];
  authorizedDiscount: number;
  dispatchedToCashier: boolean;
}

export interface SplitPaymentAllocation {
  cash: number;
  card: number;
  upi: number;
  insuranceCover: number;
}

export type PaymentLogStatus = 'Completed' | 'Pending' | 'Failed' | 'Refunded';

export interface PaymentHistoryLog {
  transactionToken: string;
  invoiceRef: string;
  patientName: string;
  totalAmount: number;
  methodsSummary: string;
  status: PaymentLogStatus;
  processedAt: string;
}

export interface PendingCashierInvoice {
  invoiceRef: string;
  patientName: string;
  patientUhid: string;
  grandTotal: number;
  lineCount: number;
  receivedAt: string;
}

export type PreAuthStatus =
  | 'Awaiting Documents'
  | 'Submitted to TPA'
  | 'Approved/Authorized'
  | 'Rejected';

export interface PreAuthorizationRequest {
  requestId: string;
  patientName: string;
  patientUhid: string;
  policyNumber: string;
  tpaCompany: string;
  procedureSummary: string;
  estimatedAmount: number;
  coPayAmount: number;
  status: PreAuthStatus;
  submittedAt: string;
}

export interface CorporateClaimDraft {
  policyNumber: string;
  tpaCompany: string;
  coPayAmount: number;
  documentLabel: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Consultation Fees',
  'Lab Tests',
  'Radiology Scans',
  'Ward Tariffs',
  'Pharmacy Consumables',
];

export const PRE_AUTH_STATUS_STYLES: Record<PreAuthStatus, string> = {
  'Awaiting Documents': 'bg-amber-100 text-amber-950 border border-amber-400 font-bold',
  'Submitted to TPA': 'bg-sky-100 text-sky-950 border border-sky-400 font-bold',
  'Approved/Authorized': 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold',
  Rejected: 'bg-rose-100 text-rose-950 border border-rose-400 font-bold',
};

export const PAYMENT_LOG_STATUS_STYLES: Record<PaymentLogStatus, string> = {
  Completed: 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold',
  Pending: 'bg-amber-100 text-amber-950 border border-amber-400 font-bold',
  Failed: 'bg-rose-100 text-rose-950 border border-rose-400 font-bold',
  Refunded: 'bg-slate-100 text-slate-950 border border-slate-400 font-bold',
};

export const CATEGORY_STYLES: Record<ExpenseCategory, string> = {
  'Consultation Fees': 'bg-indigo-100 text-indigo-950 border border-indigo-400 font-bold',
  'Lab Tests': 'bg-violet-100 text-violet-950 border border-violet-400 font-bold',
  'Radiology Scans': 'bg-sky-100 text-sky-950 border border-sky-400 font-bold',
  'Ward Tariffs': 'bg-amber-100 text-amber-950 border border-amber-400 font-bold',
  'Pharmacy Consumables': 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold',
};
