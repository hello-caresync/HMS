import type {
  AiFinanceInsightStatus,
  ApInvoiceStatus,
  BillPaymentStatus,
  BillingQueueType,
  ClaimStage,
  FraudRiskLevel,
  PaymentMode,
} from '../billingNav.types';
import { advanceClaimFromDenial, advanceClaimStage } from '../billingNav.types';
import { formatINR } from '@/lib/utils/currency';

export type BillingQueueItem = {
  id: string;
  invoiceNumber: string;
  patientName: string;
  uhid: string;
  queueType: BillingQueueType;
  charges: string;
  grossAmount: number;
  discount: number;
  netAmount: number;
  paidAmount: number;
  status: BillPaymentStatus;
  insuranceLinked: boolean;
  identityVerified: boolean;
};

export type PaymentCollection = {
  id: string;
  receiptNumber: string;
  patientName: string;
  uhid: string;
  amount: number;
  mode: PaymentMode;
  partial: boolean;
  collectedAt: string;
  collectedBy: string;
};

export type InsuranceClaim = {
  id: string;
  claimNumber: string;
  patientName: string;
  uhid: string;
  insurer: string;
  policyRef: string;
  claimAmount: number;
  approvedAmount: number;
  stage: ClaimStage;
  denialReason?: string;
  submittedAt: string;
  identityVerified: boolean;
};

export type AccountsPayableLine = {
  id: string;
  vendor: string;
  invoiceRef: string;
  category: string;
  amount: number;
  status: ApInvoiceStatus;
  dueDate: string;
};

export type ExpenseLine = {
  id: string;
  category: string;
  description: string;
  amount: number;
  period: string;
  approved: boolean;
};

export type CorporateTieUp = {
  id: string;
  corporateName: string;
  creditLimit: number;
  utilized: number;
  activePatients: number;
  contractExpiry: string;
};

export type ArAgingBucket = {
  bucket: string;
  amount: number;
  invoiceCount: number;
  pct: number;
};

export type GlAccount = {
  id: string;
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Revenue' | 'Expense';
  balance: number;
};

export type JournalEntry = {
  id: string;
  entryId: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  posted: boolean;
};

export type GstItcRecord = {
  id: string;
  period: string;
  outputGst: number;
  inputItc: number;
  netPayable: number;
  filed: boolean;
};

export type AiFinanceInsight = {
  id: string;
  insightType: 'Revenue Forecast' | 'Fraud Detection' | 'Cost Optimization';
  title: string;
  detail: string;
  suggestedAction: string;
  impact?: string;
  riskLevel?: FraudRiskLevel;
  confidence: number;
  status: AiFinanceInsightStatus;
};

export type BillingPackage = {
  id: string;
  name: string;
  includes: string;
  price: number;
  savings: number;
};

export const FINANCE_CENSUS = {
  todayRevenue: 1842000,
  monthlyRevenue: 42800000,
  opdCollection: 620000,
  ipdCollection: 890000,
  emergencyCollection: 332000,
  pharmacyRevenue: 892000,
  labRevenue: 428000,
  radiologyRevenue: 356000,
  otRevenue: 512000,
  pendingPayments: 2860000,
  outstandingReceivables: 8420000,
};

export const INITIAL_BILLING_QUEUE: BillingQueueItem[] = [
  { id: 'bq1', invoiceNumber: 'INV-2026-44201', patientName: 'Rahul Sharma', uhid: 'NX-2026-000412', queueType: 'IPD', charges: 'Room Day 3 · Nursing · CBC · Amoxicillin', grossAmount: 28400, discount: 0, netAmount: 28400, paidAmount: 10000, status: 'Partial', insuranceLinked: true, identityVerified: true },
  { id: 'bq2', invoiceNumber: 'INV-2026-44208', patientName: 'Vikram Patel', uhid: 'NX-2026-000388', queueType: 'OPD', charges: 'Consultation · Lipid Profile · Pharmacy', grossAmount: 3200, discount: 200, netAmount: 3000, paidAmount: 3000, status: 'Paid', insuranceLinked: false, identityVerified: true },
  { id: 'bq3', invoiceNumber: 'INV-2026-44212', patientName: 'Meera Krishnan', uhid: 'NX-2026-000415', queueType: 'Emergency', charges: 'ER Triage · CT Chest · IV Fluids · ABG', grossAmount: 18600, discount: 0, netAmount: 18600, paidAmount: 0, status: 'Pending', insuranceLinked: true, identityVerified: true },
  { id: 'bq4', invoiceNumber: 'INV-2026-44215', patientName: 'Priya Patel', uhid: 'NX-2026-000413', queueType: 'OPD', charges: 'Surgery Consult · US Abdomen', grossAmount: 4500, discount: 0, netAmount: 4500, paidAmount: 0, status: 'Pending', insuranceLinked: false, identityVerified: true },
  { id: 'bq5', invoiceNumber: 'INV-2026-44198', patientName: 'Sanjay Rao', uhid: 'NX-2026-000365', queueType: 'IPD', charges: 'Room · OT Charges · Implant · Pharmacy', grossAmount: 285000, discount: 15000, netAmount: 270000, paidAmount: 270000, status: 'Paid', insuranceLinked: true, identityVerified: true },
  { id: 'bq6', invoiceNumber: 'INV-2026-44220', patientName: 'Arjun Das', uhid: 'NX-2026-000377', queueType: 'Emergency', charges: 'Code Blue · Ventilator · Labs STAT', grossAmount: 42000, discount: 0, netAmount: 42000, paidAmount: 20000, status: 'Disputed', insuranceLinked: false, identityVerified: true },
];

export const MOCK_PAYMENTS: PaymentCollection[] = [
  { id: 'pc1', receiptNumber: 'RCP-2026-88101', patientName: 'Vikram Patel', uhid: 'NX-2026-000388', amount: 3000, mode: 'UPI', partial: false, collectedAt: '2026-07-18 10:30', collectedBy: 'Cashier Anita R.' },
  { id: 'pc2', receiptNumber: 'RCP-2026-88105', patientName: 'Rahul Sharma', uhid: 'NX-2026-000412', amount: 10000, mode: 'Card', partial: true, collectedAt: '2026-07-18 11:15', collectedBy: 'Cashier Joseph M.' },
  { id: 'pc3', receiptNumber: 'RCP-2026-88108', patientName: 'Deepak Menon', uhid: 'NX-2026-000390', amount: 8500, mode: 'Cash', partial: false, collectedAt: '2026-07-18 09:45', collectedBy: 'Cashier Lakshmi N.' },
  { id: 'pc4', receiptNumber: 'RCP-2026-88112', patientName: 'Kavitha Nair', uhid: 'NX-2026-000401', amount: 15000, mode: 'Corporate Credit', partial: true, collectedAt: '2026-07-18 11:50', collectedBy: 'Cashier Anita R.' },
];

export const INITIAL_INSURANCE_CLAIMS: InsuranceClaim[] = [
  { id: 'ic1', claimNumber: 'CLM-2026-5501', patientName: 'Rahul Sharma', uhid: 'NX-2026-000412', insurer: 'Star Health Insurance', policyRef: '[Financial Identification Document Masked for Security]', claimAmount: 28400, approvedAmount: 24000, stage: 'Under Review', submittedAt: '2026-07-18', identityVerified: true },
  { id: 'ic2', claimNumber: 'CLM-2026-5498', patientName: 'Sanjay Rao', uhid: 'NX-2026-000365', insurer: 'ICICI Lombard', policyRef: '[Financial Identification Document Masked for Security]', claimAmount: 270000, approvedAmount: 255000, stage: 'Settlement', submittedAt: '2026-07-15', identityVerified: true },
  { id: 'ic3', claimNumber: 'CLM-2026-5505', patientName: 'Meera Krishnan', uhid: 'NX-2026-000415', insurer: 'Max Bupa', policyRef: '[Financial Identification Document Masked for Security]', claimAmount: 18600, approvedAmount: 0, stage: 'Denial Management', denialReason: 'Pre-auth not obtained for CT — code mismatch', submittedAt: '2026-07-18', identityVerified: true },
  { id: 'ic4', claimNumber: 'CLM-2026-5508', patientName: 'Meera Krishnan', uhid: 'NX-2026-000415', insurer: 'Max Bupa', policyRef: '[Financial Identification Document Masked for Security]', claimAmount: 18600, approvedAmount: 0, stage: 'Pre-Authorization', submittedAt: '2026-07-18', identityVerified: true },
  { id: 'ic5', claimNumber: 'CLM-2026-5492', patientName: 'Vikram Patel', uhid: 'NX-2026-000388', insurer: 'HDFC ERGO', policyRef: '[Financial Identification Document Masked for Security]', claimAmount: 12000, approvedAmount: 10500, stage: 'Claim Submission', submittedAt: '2026-07-17', identityVerified: true },
];

export const MOCK_AP_LINES: AccountsPayableLine[] = [
  { id: 'ap1', vendor: 'MedSupply India Pvt Ltd', invoiceRef: 'INV-MSI-8841', category: 'Consumables', amount: 485000, status: 'Approved', dueDate: '2026-07-25' },
  { id: 'ap2', vendor: 'Apollo Pharma Distribution', invoiceRef: 'INV-APD-7720', category: 'Pharmacy Stock', amount: 309000, status: 'Pending Match', dueDate: '2026-07-22' },
  { id: 'ap3', vendor: 'Facility Management Co.', invoiceRef: 'INV-FMC-6633', category: 'Rent & Utilities', amount: 420000, status: 'Paid', dueDate: '2026-07-15' },
  { id: 'ap4', vendor: 'Payroll — July 2026', invoiceRef: 'PAY-JUL-2026', category: 'Staff Salary', amount: 4200000, status: 'Approved', dueDate: '2026-07-31' },
];

export const MOCK_EXPENSES: ExpenseLine[] = [
  { id: 'ex1', category: 'Staff Salary', description: 'July 2026 — Clinical & Admin payroll', amount: 4200000, period: 'Jul 2026', approved: true },
  { id: 'ex2', category: 'Rent', description: 'Hospital premises — Block A & B', amount: 850000, period: 'Jul 2026', approved: true },
  { id: 'ex3', category: 'Consumables', description: 'OT & ICU consumables replenishment', amount: 620000, period: 'Jul 2026', approved: false },
  { id: 'ex4', category: 'Utilities', description: 'Electricity · Water · HVAC', amount: 280000, period: 'Jul 2026', approved: true },
];

export const MOCK_CORPORATE: CorporateTieUp[] = [
  { id: 'ct1', corporateName: 'TCS Corporate Health Plan', creditLimit: 5000000, utilized: 1280000, activePatients: 12, contractExpiry: '2027-03-31' },
  { id: 'ct2', corporateName: 'Infosys Employee Wellness', creditLimit: 3000000, utilized: 420000, activePatients: 5, contractExpiry: '2026-12-31' },
  { id: 'ct3', corporateName: 'Wipro Group Mediclaim', creditLimit: 2500000, utilized: 890000, activePatients: 8, contractExpiry: '2027-06-30' },
];

export const AR_AGING: ArAgingBucket[] = [
  { bucket: '0-30 Days', amount: 4200000, invoiceCount: 142, pct: 50 },
  { bucket: '31-60 Days', amount: 2520000, invoiceCount: 68, pct: 30 },
  { bucket: '61-90 Days', amount: 1260000, invoiceCount: 34, pct: 15 },
  { bucket: '90+ Days', amount: 440000, invoiceCount: 18, pct: 5 },
];

export const MOCK_GL_ACCOUNTS: GlAccount[] = [
  { id: 'gl1', code: '1001', name: 'Cash & Bank', type: 'Asset', balance: 8420000 },
  { id: 'gl2', code: '1100', name: 'Accounts Receivable', type: 'Asset', balance: 8420000 },
  { id: 'gl3', code: '2001', name: 'Accounts Payable', type: 'Liability', balance: 5860000 },
  { id: 'gl4', code: '4001', name: 'Patient Services Revenue', type: 'Revenue', balance: 42800000 },
  { id: 'gl5', code: '5001', name: 'Salaries & Wages', type: 'Expense', balance: 4200000 },
  { id: 'gl6', code: '2100', name: 'GST Output Tax Payable', type: 'Liability', balance: 420000 },
];

export const MOCK_JOURNAL_ENTRIES: JournalEntry[] = [
  { id: 'je1', entryId: 'JE-2026-881', date: '2026-07-18', description: 'Daily OPD/IPD revenue accrual', debit: 1842000, credit: 1842000, posted: true },
  { id: 'je2', entryId: 'JE-2026-878', date: '2026-07-17', description: 'Insurance claim settlement — Sanjay Rao', debit: 255000, credit: 255000, posted: true },
  { id: 'je3', entryId: 'JE-2026-875', date: '2026-07-16', description: 'Vendor payment — Facility Management', debit: 420000, credit: 420000, posted: true },
];

export const MOCK_GST_ITC: GstItcRecord[] = [
  { id: 'gst1', period: 'Jul 2026', outputGst: 420000, inputItc: 186000, netPayable: 234000, filed: false },
  { id: 'gst2', period: 'Jun 2026', outputGst: 398000, inputItc: 172000, netPayable: 226000, filed: true },
];

export const INITIAL_AI_FINANCE: AiFinanceInsight[] = [
  { id: 'ai1', insightType: 'Revenue Forecast', title: 'August Revenue Projection', detail: 'OPD volume ↑ 12% · IPD census stable · monsoon ER uptick', suggestedAction: 'Increase ER billing staff shifts Fri-Sun', impact: 'Projected ₹4.6 Cr (+7.5%)', confidence: 88, status: 'Pending Review' },
  { id: 'ai2', insightType: 'Fraud Detection', title: 'Suspicious Refund Pattern — Cashier Shift B', detail: '3 refunds > ₹10K within 2hr window · same patient UHID cluster', suggestedAction: 'Flag for audit · suspend refund approval pending review', riskLevel: 'Suspicious', confidence: 92, status: 'Pending Review' },
  { id: 'ai3', insightType: 'Cost Optimization', title: 'OT Consumables Over-Billing', detail: 'Suture kit charges 18% above peer benchmark', suggestedAction: 'Review charge master OT-8841 · align to package rates', impact: 'Save ₹1.8L/month', confidence: 85, status: 'Accepted' },
  { id: 'ai4', insightType: 'Fraud Detection', title: 'Duplicate Invoice Attempt', detail: 'INV-44220 disputed — duplicate ER charges detected', suggestedAction: 'Hold settlement · reconcile with ER log', riskLevel: 'Review', confidence: 79, status: 'Pending Review' },
];

export const BILLING_PACKAGES: BillingPackage[] = [
  { id: 'pkg1', name: 'Executive Health Check — Premium', includes: 'CBC · LFT · Lipid · TMT · Chest X-Ray · Physician Review', price: 8500, savings: 2200 },
  { id: 'pkg2', name: 'Maternity Antenatal Package — Trimester 2', includes: '4 ANC visits · 2 USG · Lab panel · Pharmacy voucher', price: 24000, savings: 4800 },
  { id: 'pkg3', name: 'Cardiac Screening Package', includes: 'ECG · Echo · Troponin · Lipid · Cardiologist consult', price: 12000, savings: 3500 },
  { id: 'pkg4', name: 'IPD Daily Care Bundle', includes: 'Room · Nursing · Routine labs · Diet · Pharmacy cap', price: 8500, savings: 1200 },
];

export const REVENUE_TREND = [
  { day: 'Mon', opd: 580000, ipd: 820000, er: 280000 },
  { day: 'Tue', opd: 620000, ipd: 890000, er: 310000 },
  { day: 'Wed', opd: 640000, ipd: 910000, er: 290000 },
  { day: 'Thu', opd: 610000, ipd: 880000, er: 332000 },
  { day: 'Fri', opd: 680000, ipd: 950000, er: 380000 },
  { day: 'Sat', opd: 420000, ipd: 620000, er: 220000 },
  { day: 'Sun', opd: 380000, ipd: 540000, er: 180000 },
];

export const PL_SUMMARY = [
  { month: 'Apr', revenue: 38200000, expense: 29800000 },
  { month: 'May', revenue: 40100000, expense: 31200000 },
  { month: 'Jun', revenue: 41500000, expense: 32100000 },
  { month: 'Jul', revenue: 42800000, expense: 32800000 },
];

export const CASH_FLOW = [
  { month: 'Apr', operating: 8400000, investing: -1200000, financing: -800000 },
  { month: 'May', operating: 8900000, investing: -600000, financing: -800000 },
  { month: 'Jun', operating: 9400000, investing: -900000, financing: -800000 },
  { month: 'Jul', operating: 10000000, investing: -1100000, financing: -800000 },
];

export function searchBilling(query: string, items: BillingQueueItem[]): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  return items.filter(
    (b) =>
      b.patientName.toLowerCase().includes(q) ||
      b.uhid.toLowerCase().includes(q) ||
      b.invoiceNumber.toLowerCase().includes(q),
  ).length;
}

export { formatINR as formatInr } from '@/lib/utils/currency';

export function formatCr(amount: number): string {
  if (amount >= 10000000) return `${formatINR(amount / 10000000, { maximumFractionDigits: 2 })} Cr`;
  return formatINR(amount);
}

export { advanceClaimStage, advanceClaimFromDenial };
