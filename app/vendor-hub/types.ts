export type VendorHubTab = 'tracking' | 'scorecard' | 'payments';

export type DeliveryStatus =
  | 'PO Dispatched'
  | 'In-Transit'
  | 'At Loading Dock'
  | 'Delivered'
  | 'Return Initiated';

export type PaymentStage =
  | 'Awaiting Finance Release'
  | 'Processing Gateway'
  | 'Settled';

export type ComplianceStatus = 'Compliant' | 'Active' | 'Expired' | 'Pending Review';

export interface TrackedPO {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  itemSummary: string;
  deliveryStatus: DeliveryStatus;
  transitProgress: number;
  lastUpdated: string;
  eta?: string;
}

export interface VendorPerformanceRow {
  vendorId: string;
  vendorName: string;
  fulfillmentRatePct: number;
  avgLeadTimeDays: number;
  costVariancePct: number;
}

export interface ComplianceDocument {
  label: string;
  referenceId: string;
  expiryDate?: string;
  status: ComplianceStatus;
}

export interface VendorComplianceRecord {
  vendorId: string;
  vendorName: string;
  medicalLicense: ComplianceDocument;
  drugDistributionCert: ComplianceDocument;
  taxStatus: ComplianceDocument;
}

export interface PaymentLedgerRow {
  id: string;
  vendorId: string;
  invoiceNumber: string;
  poNumber: string;
  billAmount: number;
  threeWayMatchVerified: boolean;
  paymentStage: PaymentStage;
  updatedAt: string;
}

export const DELIVERY_STATUS_STYLES: Record<DeliveryStatus, string> = {
  'PO Dispatched': 'bg-sky-100 text-sky-900 ring-sky-200',
  'In-Transit': 'bg-violet-100 text-violet-900 ring-violet-200',
  'At Loading Dock': 'bg-amber-100 text-amber-900 ring-amber-200',
  Delivered: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
  'Return Initiated': 'bg-rose-100 text-rose-900 ring-rose-200',
};

export const PAYMENT_STAGE_STYLES: Record<PaymentStage, string> = {
  'Awaiting Finance Release': 'bg-amber-100 text-amber-900 ring-amber-200',
  'Processing Gateway': 'bg-sky-100 text-sky-900 ring-sky-200',
  Settled: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
};

export const COMPLIANCE_STYLES: Record<ComplianceStatus, string> = {
  Compliant: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  Active: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  Expired: 'bg-rose-100 text-rose-800 ring-rose-200',
  'Pending Review': 'bg-amber-100 text-amber-800 ring-amber-200',
};

export function transitProgressForStatus(status: DeliveryStatus, progress: number): number {
  if (status === 'In-Transit') return Math.min(95, Math.max(5, progress));
  if (status === 'PO Dispatched') return 15;
  if (status === 'At Loading Dock') return 88;
  if (status === 'Delivered') return 100;
  if (status === 'Return Initiated') return 40;
  return progress;
}
