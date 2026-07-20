import type {
  AiProcurementStatus,
  ApprovalStageName,
  DeliveryStatus,
  PaymentDueStatus,
  PrLifecycleStatus,
  RequestPriority,
  RfqStatus,
  StageSignOff,
  StockAvailability,
  TenderStatus,
  ThreeWayMatchStatus,
} from '../procurementNav.types';
import { advancePrLifecycle } from '../procurementNav.types';

export type PurchaseRequest = {
  id: string;
  prNumber: string;
  department: string;
  items: string;
  priority: RequestPriority;
  requiredDate: string;
  stockAvailability: StockAvailability;
  estimatedValue: number;
  budgetLine: string;
  status: PrLifecycleStatus;
  approvals: Record<ApprovalStageName, StageSignOff>;
  requestedBy: string;
  requestedAt: string;
  overBudget: boolean;
};

export type ActivePo = {
  id: string;
  poNumber: string;
  prReference: string;
  vendor: string;
  value: number;
  deliveryStatus: DeliveryStatus;
  expectedDelivery: string;
  paymentStatus: PaymentDueStatus;
};

export type VendorProfile = {
  id: string;
  vendorName: string;
  category: string;
  rating: number;
  activeContracts: number;
  catalogueItems: number;
  rateContractExpiry: string;
  amcContract?: string;
  documentVerified: boolean;
};

export type QuotationComparison = {
  id: string;
  rfqNumber: string;
  itemDescription: string;
  vendorA: string;
  priceA: number;
  deliveryDaysA: number;
  vendorB: string;
  priceB: number;
  deliveryDaysB: number;
  vendorC: string;
  priceC: number;
  deliveryDaysC: number;
  recommended: string;
  rfqStatus: RfqStatus;
};

export type TenderRecord = {
  id: string;
  tenderId: string;
  title: string;
  capitalBudget: number;
  bidsReceived: number;
  status: TenderStatus;
  closingDate: string;
  leadingVendor: string;
};

export type ThreeWayMatchRecord = {
  id: string;
  poNumber: string;
  grnNumber: string;
  invoiceNumber: string;
  vendor: string;
  poAmount: number;
  grnAmount: number;
  invoiceAmount: number;
  variance: number;
  matchStatus: ThreeWayMatchStatus;
};

export type PurchaseReturnNote = {
  id: string;
  prnNumber: string;
  poReference: string;
  vendor: string;
  reason: string;
  creditNoteValue: number;
  status: 'Pending Credit' | 'Credit Issued';
};

export type AiProcurementInsight = {
  id: string;
  insightType: 'Demand Forecast' | 'Vendor Recommendation' | 'Stock Optimization';
  title: string;
  detail: string;
  suggestedAction: string;
  estimatedImpact: string;
  confidence: number;
  status: AiProcurementStatus;
};

export const PROCUREMENT_CENSUS = {
  totalPurchaseValue: 124800000,
  monthlySpending: 8420000,
  pendingRequests: 18,
  pendingApprovals: 11,
  activePos: 34,
  pendingDeliveries: 9,
  delayedDeliveries: 4,
  vendorPaymentsDue: 2860000,
  budgetUtilizationPct: 78,
  budgetAllocated: 16000000,
  budgetConsumed: 12480000,
};

export const INITIAL_PURCHASE_REQUESTS: PurchaseRequest[] = [
  {
    id: 'pr1',
    prNumber: 'PR-2026-5501',
    department: 'ICU',
    items: 'Norepinephrine 4mg/4mL × 200 amp · IV Extension Sets × 500',
    priority: 'Emergency',
    requiredDate: '2026-07-19',
    stockAvailability: 'Out of Stock',
    estimatedValue: 485000,
    budgetLine: 'ICU Consumables FY26',
    status: 'Pending Approval',
    approvals: { 'Department Head': 'Approved', 'Inventory Manager': 'Pending', Finance: 'Pending', Admin: 'Pending' },
    requestedBy: 'ICU Incharge Dr. Joseph',
    requestedAt: '2026-07-18T08:00:00',
    overBudget: false,
  },
  {
    id: 'pr2',
    prNumber: 'PR-2026-5505',
    department: 'OT',
    items: 'Surgical Gloves Size 7 × 2000 · Ethicon Suture Kit × 150',
    priority: 'Critical',
    requiredDate: '2026-07-22',
    stockAvailability: 'Low Stock',
    estimatedValue: 312000,
    budgetLine: 'OT Surgical Supplies',
    status: 'Approved',
    approvals: { 'Department Head': 'Approved', 'Inventory Manager': 'Approved', Finance: 'Approved', Admin: 'Approved' },
    requestedBy: 'OT Store Manager Anita R.',
    requestedAt: '2026-07-18T09:30:00',
    overBudget: false,
  },
  {
    id: 'pr3',
    prNumber: 'PR-2026-5510',
    department: 'Pharmacy',
    items: 'Azithromycin 500mg × 5000 · Insulin Glargine × 50 pens',
    priority: 'Critical',
    requiredDate: '2026-07-20',
    stockAvailability: 'Out of Stock',
    estimatedValue: 428000,
    budgetLine: 'Pharmacy Formulary',
    status: 'Sent to Vendor',
    approvals: { 'Department Head': 'Approved', 'Inventory Manager': 'Approved', Finance: 'Approved', Admin: 'Approved' },
    requestedBy: 'Chief Pharm. Joseph M.',
    requestedAt: '2026-07-18T10:15:00',
    overBudget: true,
  },
  {
    id: 'pr4',
    prNumber: 'PR-2026-5512',
    department: 'Emergency',
    items: 'Crash Cart Refill Bundle · Adrenaline · Atropine · Amiodarone',
    priority: 'Emergency',
    requiredDate: '2026-07-18',
    stockAvailability: 'Low Stock',
    estimatedValue: 562000,
    budgetLine: 'ER Emergency Kits',
    status: 'PO Generated',
    approvals: { 'Department Head': 'Approved', 'Inventory Manager': 'Approved', Finance: 'Approved', Admin: 'Approved' },
    requestedBy: 'ER Incharge Dr. B. Joseph',
    requestedAt: '2026-07-18T07:00:00',
    overBudget: false,
  },
  {
    id: 'pr5',
    prNumber: 'PR-2026-5515',
    department: 'Laboratory',
    items: 'CBC Reagent Kit × 12 · Troponin-I Reagent × 8 · QC Controls',
    priority: 'Normal',
    requiredDate: '2026-07-28',
    stockAvailability: 'In Stock',
    estimatedValue: 186000,
    budgetLine: 'Lab Reagents FY26',
    status: 'Draft',
    approvals: { 'Department Head': 'Pending', 'Inventory Manager': 'Pending', Finance: 'Pending', Admin: 'Pending' },
    requestedBy: 'Lab Manager Lakshmi N.',
    requestedAt: '2026-07-18T11:00:00',
    overBudget: false,
  },
  {
    id: 'pr6',
    prNumber: 'PR-2026-5498',
    department: 'Radiology',
    items: 'Iohexol 350 mgI/mL × 48 vials · Gadoterate × 20 syringes',
    priority: 'Normal',
    requiredDate: '2026-07-25',
    stockAvailability: 'In Stock',
    estimatedValue: 298000,
    budgetLine: 'Radiology Contrast Media',
    status: 'Completed',
    approvals: { 'Department Head': 'Approved', 'Inventory Manager': 'Approved', Finance: 'Approved', Admin: 'Approved' },
    requestedBy: 'Radiology Store Ravi K.',
    requestedAt: '2026-07-15T14:00:00',
    overBudget: false,
  },
];

export const MOCK_ACTIVE_POS: ActivePo[] = [
  { id: 'apo1', poNumber: 'PO-2026-7788', prReference: 'PR-2026-5501', vendor: 'MedSupply India Pvt Ltd', value: 485000, deliveryStatus: 'Delayed', expectedDelivery: '2026-07-19', paymentStatus: 'Due' },
  { id: 'apo2', poNumber: 'PO-2026-7792', prReference: 'PR-2026-5505', vendor: 'Apollo Pharma Distribution', value: 312000, deliveryStatus: 'On Track', expectedDelivery: '2026-07-22', paymentStatus: 'Partial' },
  { id: 'apo3', poNumber: 'PO-2026-7795', prReference: 'PR-2026-5510', vendor: 'Cipla Healthcare Logistics', value: 428000, deliveryStatus: 'Pending', expectedDelivery: '2026-07-20', paymentStatus: 'Due' },
  { id: 'apo4', poNumber: 'PO-2026-7798', prReference: 'PR-2026-5512', vendor: 'Sun Pharma Wholesale', value: 562000, deliveryStatus: 'On Track', expectedDelivery: '2026-07-18', paymentStatus: 'Paid' },
];

export const MOCK_VENDORS: VendorProfile[] = [
  { id: 'v1', vendorName: 'MedSupply India Pvt Ltd', category: 'Critical Care & IV', rating: 4.6, activeContracts: 3, catalogueItems: 842, rateContractExpiry: '2027-03-31', amcContract: 'Annual Supply FY26-27', documentVerified: true },
  { id: 'v2', vendorName: 'Apollo Pharma Distribution', category: 'Pharmaceuticals', rating: 4.2, activeContracts: 2, catalogueItems: 1240, rateContractExpiry: '2026-12-31', documentVerified: true },
  { id: 'v3', vendorName: 'Cipla Healthcare Logistics', category: 'Specialty Pharma & Contrast', rating: 4.8, activeContracts: 1, catalogueItems: 620, rateContractExpiry: '2027-06-30', amcContract: 'Contrast Media AMC', documentVerified: true },
  { id: 'v4', vendorName: 'Sun Pharma Wholesale', category: 'General Pharma', rating: 3.9, activeContracts: 4, catalogueItems: 2100, rateContractExpiry: '2026-09-30', documentVerified: true },
  { id: 'v5', vendorName: 'Stryker India Medical', category: 'Surgical Implants & OT', rating: 4.7, activeContracts: 2, catalogueItems: 186, rateContractExpiry: '2028-01-15', amcContract: 'OT Equipment AMC', documentVerified: true },
];

export const MOCK_QUOTATIONS: QuotationComparison[] = [
  { id: 'qc1', rfqNumber: 'RFQ-2026-881', itemDescription: 'Norepinephrine 4mg/4mL × 200 ampoules', vendorA: 'MedSupply India', priceA: 485000, deliveryDaysA: 2, vendorB: 'Apollo Pharma', priceB: 512000, deliveryDaysB: 3, vendorC: 'Sun Pharma', priceC: 498000, deliveryDaysC: 4, recommended: 'MedSupply India', rfqStatus: 'Evaluating' },
  { id: 'qc2', rfqNumber: 'RFQ-2026-885', itemDescription: 'Hamilton C6 Ventilator — Capital', vendorA: 'Hamilton Medical India', priceA: 4200000, deliveryDaysA: 45, vendorB: 'Drager India', priceB: 3950000, deliveryDaysB: 60, vendorC: 'Philips Healthcare', priceC: 4500000, deliveryDaysC: 30, recommended: 'Drager India', rfqStatus: 'Open' },
  { id: 'qc3', rfqNumber: 'RFQ-2026-878', itemDescription: 'Surgical Gloves Size 7 × 2000 pairs', vendorA: 'MedSupply India', priceA: 98000, deliveryDaysA: 5, vendorB: 'Apollo Pharma', priceB: 105000, deliveryDaysB: 3, vendorC: 'Local MedEquip', priceC: 92000, deliveryDaysC: 7, recommended: 'Apollo Pharma', rfqStatus: 'Awarded' },
];

export const MOCK_TENDERS: TenderRecord[] = [
  { id: 't1', tenderId: 'TND-2026-042', title: 'MRI Suite 2 — 1.5T Scanner Replacement', capitalBudget: 85000000, bidsReceived: 4, status: 'Evaluation', closingDate: '2026-07-25', leadingVendor: 'Philips Healthcare' },
  { id: 't2', tenderId: 'TND-2026-038', title: 'Central Sterile Supply Department — Autoclave Bank', capitalBudget: 12000000, bidsReceived: 6, status: 'Awarded', closingDate: '2026-07-10', leadingVendor: 'Getinge India' },
  { id: 't3', tenderId: 'TND-2026-045', title: 'Hospital-wide PPE Annual Rate Contract', capitalBudget: 4500000, bidsReceived: 8, status: 'Published', closingDate: '2026-08-05', leadingVendor: '—' },
];

export const MOCK_THREE_WAY_MATCH: ThreeWayMatchRecord[] = [
  { id: 'tw1', poNumber: 'PO-2026-7798', grnNumber: 'GRN-2026-9901', invoiceNumber: 'INV-MSI-8841', vendor: 'Sun Pharma Wholesale', poAmount: 562000, grnAmount: 562000, invoiceAmount: 562000, variance: 0, matchStatus: 'Approved for Payment' },
  { id: 'tw2', poNumber: 'PO-2026-7792', grnNumber: 'GRN-2026-9904', invoiceNumber: 'INV-APD-7720', vendor: 'Apollo Pharma Distribution', poAmount: 312000, grnAmount: 309000, invoiceAmount: 312000, variance: 3000, matchStatus: 'Variance' },
  { id: 'tw3', poNumber: 'PO-2026-7795', grnNumber: '—', invoiceNumber: 'INV-CIP-6633', vendor: 'Cipla Healthcare Logistics', poAmount: 428000, grnAmount: 0, invoiceAmount: 428000, variance: 428000, matchStatus: 'Pending' },
  { id: 'tw4', poNumber: 'PO-2026-7788', grnNumber: 'GRN-2026-9895', invoiceNumber: 'INV-MSI-8840', vendor: 'MedSupply India Pvt Ltd', poAmount: 485000, grnAmount: 485000, invoiceAmount: 485000, variance: 0, matchStatus: 'Matched' },
];

export const MOCK_PURCHASE_RETURNS: PurchaseReturnNote[] = [
  { id: 'prn1', prnNumber: 'PRN-2026-441', poReference: 'PO-2026-7792', vendor: 'Apollo Pharma Distribution', reason: 'Damaged packaging — 20 glove pairs rejected at QC', creditNoteValue: 1050, status: 'Credit Issued' },
  { id: 'prn2', prnNumber: 'PRN-2026-438', poReference: 'PO-2026-7785', vendor: 'Sun Pharma Wholesale', reason: 'Batch RAN-3300-G — manufacturer recall', creditNoteValue: 42000, status: 'Pending Credit' },
];

export const INITIAL_AI_INSIGHTS: AiProcurementInsight[] = [
  { id: 'ai1', insightType: 'Demand Forecast', title: 'Monsoon Dengue Surge Kit', detail: 'Historical Jul-Aug pattern — NS1 kits, platelet support consumables', suggestedAction: 'Pre-order Dengue NS1 × 200 kits · IV fluids +15%', estimatedImpact: 'Prevent stockout during 28% case surge', confidence: 91, status: 'Pending Review' },
  { id: 'ai2', insightType: 'Vendor Recommendation', title: 'Delayed Delivery Risk — PO-7788', detail: 'MedSupply India OTD dropped to 82% over 30 days', suggestedAction: 'Split PO to Apollo Pharma for 40% backup quantity', estimatedImpact: 'Reduce ICU stockout risk by 65%', confidence: 86, status: 'Pending Review' },
  { id: 'ai3', insightType: 'Stock Optimization', title: 'N95 Mask Overstock', detail: '45-day supply vs optimal 21-day — consumption declining', suggestedAction: 'Defer PR-5518 · negotiate return with vendor', estimatedImpact: 'Free ₹1.2L budget for critical ICU reagents', confidence: 84, status: 'Accepted' },
  { id: 'ai4', insightType: 'Demand Forecast', title: 'Respiratory Season Antibiotics', detail: 'OPD respiratory volume ↑ 18% — Azithromycin out-of-stock', suggestedAction: 'Emergency PO via Cipla rate contract · 5000 tabs', estimatedImpact: 'Restore formulary availability within 48h', confidence: 94, status: 'Pending Review' },
];

export const SPENDING_TREND = [
  { week: 'W1', spend: 1820000, budget: 4000000 },
  { week: 'W2', spend: 2100000, budget: 4000000 },
  { week: 'W3', spend: 1950000, budget: 4000000 },
  { week: 'W4', spend: 2550000, budget: 4000000 },
];

export function searchProcurement(query: string, requests: PurchaseRequest[]): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  return requests.filter(
    (r) =>
      r.prNumber.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      r.items.toLowerCase().includes(q) ||
      r.budgetLine.toLowerCase().includes(q),
  ).length;
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export function formatCr(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  return formatInr(amount);
}

export { advancePrLifecycle };
