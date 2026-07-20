import type {
  AiVendorInsightStatus,
  ComplaintStatus,
  FulfillmentStage,
  InvoicePaymentStatus,
  LicenseComplianceStatus,
  OnboardingPhase,
  PoCoordinationStatus,
  SupplyCategory,
} from '../vendorCoordinationNav.types';
import { advanceFulfillmentStage, advanceOnboardingPhase } from '../vendorCoordinationNav.types';

export type VendorOnboardingRequest = {
  id: string;
  requestId: string;
  vendorName: string;
  category: SupplyCategory;
  contactPerson: string;
  submittedAt: string;
  phase: OnboardingPhase;
  documentsVerified: boolean;
  qualityReview: 'Pending' | 'Passed' | 'Failed';
  performanceScore?: number;
};

export type PoCoordinationRecord = {
  id: string;
  poNumber: string;
  vendorName: string;
  items: string;
  quantity: string;
  status: PoCoordinationStatus;
  responseTimeHrs: number;
  lastUpdate: string;
  fulfillmentStage: FulfillmentStage;
};

export type VendorProfile = {
  id: string;
  vendorName: string;
  category: SupplyCategory;
  rating: number;
  performanceScore: number;
  activePos: number;
  contractExpiry: string;
  moqPolicy: string;
  catalogueItems: number;
  alternativeProducts: number;
  documentsVerified: boolean;
};

export type CatalogueItem = {
  id: string;
  vendorName: string;
  productName: string;
  category: SupplyCategory;
  moq: number;
  unit: string;
  rateContractPrice: number;
  alternative?: string;
};

export type QuotationRoute = {
  id: string;
  rfqNumber: string;
  itemDescription: string;
  vendorA: string;
  priceA: number;
  deliveryA: number;
  qualityA: number;
  vendorB: string;
  priceB: number;
  deliveryB: number;
  qualityB: number;
  recommended: string;
};

export type ContractRenewalAlert = {
  id: string;
  vendorName: string;
  contractType: string;
  expiryDate: string;
  daysRemaining: number;
  annualValue: number;
};

export type DeliveryTrackingRecord = {
  id: string;
  poNumber: string;
  vendorName: string;
  stage: FulfillmentStage;
  trackingRef: string;
  expectedDelivery: string;
  invoiceNumber: string;
  invoiceAmount: number;
  paymentStatus: InvoicePaymentStatus;
};

export type ReturnReplacementNote = {
  id: string;
  rrnNumber: string;
  poReference: string;
  vendorName: string;
  reason: string;
  creditValue: number;
  status: 'Pending' | 'Credit Issued' | 'Replacement Dispatched';
};

export type LicenseComplianceLog = {
  id: string;
  vendorName: string;
  licenseType: string;
  expiryDate: string;
  status: LicenseComplianceStatus;
  lastAudit: string;
};

export type AiVendorInsight = {
  id: string;
  insightType: 'Smart Recommendation' | 'Cost Optimization' | 'Risk Prediction';
  title: string;
  detail: string;
  suggestedAction: string;
  estimatedSavings?: string;
  riskLevel?: 'Low' | 'Medium' | 'High';
  confidence: number;
  status: AiVendorInsightStatus;
};

export type VendorComplaint = {
  id: string;
  complaintId: string;
  vendorName: string;
  category: string;
  description: string;
  status: ComplaintStatus;
  loggedAt: string;
};

export const VRM_CENSUS = {
  totalActiveVendors: 86,
  newRequests: 7,
  pendingApprovals: 5,
  activePos: 34,
  pendingVendorResponses: 12,
  delayedDeliveries: 6,
  pendingInvoicesPayments: 18,
  vendorComplaints: 3,
  averagePerformanceScore: 4.3,
};

export const INITIAL_ONBOARDING_REQUESTS: VendorOnboardingRequest[] = [
  { id: 'vo1', requestId: 'VON-2026-881', vendorName: 'BioMed Solutions India', category: 'Equipment', contactPerson: 'Rajesh Mehta', submittedAt: '2026-07-18T09:00:00', phase: 'Quality Team Review', documentsVerified: true, qualityReview: 'Pending' },
  { id: 'vo2', requestId: 'VON-2026-885', vendorName: 'SterileCare Surgical Supplies', category: 'Surgical Items', contactPerson: 'Anita Roy', submittedAt: '2026-07-17T14:30:00', phase: 'Document Verification', documentsVerified: false, qualityReview: 'Pending' },
  { id: 'vo3', requestId: 'VON-2026-878', vendorName: 'PharmaLink Distribution', category: 'Medicines', contactPerson: 'Joseph Kumar', submittedAt: '2026-07-16T11:00:00', phase: 'Registration', documentsVerified: false, qualityReview: 'Pending' },
  { id: 'vo4', requestId: 'VON-2026-872', vendorName: 'OrthoImplant Technologies', category: 'Implants', contactPerson: 'Neha Gupta', submittedAt: '2026-07-15T08:00:00', phase: 'Activated', documentsVerified: true, qualityReview: 'Passed', performanceScore: 4.7 },
  { id: 'vo5', requestId: 'VON-2026-890', vendorName: 'Global MedEquip Pvt Ltd', category: 'Equipment', contactPerson: 'Ravi Shankar', submittedAt: '2026-07-18T10:45:00', phase: 'Document Verification', documentsVerified: true, qualityReview: 'Pending' },
];

export const INITIAL_PO_COORDINATION: PoCoordinationRecord[] = [
  { id: 'pc1', poNumber: 'PO-2026-7788', vendorName: 'MedSupply India Pvt Ltd', items: 'Norepinephrine 4mg/4mL × 200', quantity: '200 amp', status: 'Delayed', responseTimeHrs: 28, lastUpdate: '2026-07-18 11:30', fulfillmentStage: 'In Transit' },
  { id: 'pc2', poNumber: 'PO-2026-7792', vendorName: 'Apollo Pharma Distribution', items: 'Surgical Gloves Size 7 × 2000', quantity: '2000 pairs', status: 'Confirmed', responseTimeHrs: 4, lastUpdate: '2026-07-18 10:15', fulfillmentStage: 'Packed' },
  { id: 'pc3', poNumber: 'PO-2026-7795', vendorName: 'Cipla Healthcare Logistics', items: 'Azithromycin 500mg × 5000', quantity: '5000 tabs', status: 'Awaiting Response', responseTimeHrs: 36, lastUpdate: '2026-07-17 18:00', fulfillmentStage: 'Order Confirmed' },
  { id: 'pc4', poNumber: 'PO-2026-7798', vendorName: 'Sun Pharma Wholesale', items: 'ER Crash Cart Bundle', quantity: '1 kit', status: 'Dispatched', responseTimeHrs: 2, lastUpdate: '2026-07-18 08:00', fulfillmentStage: 'Dispatched' },
  { id: 'pc5', poNumber: 'PO-2026-7801', vendorName: 'Stryker India Medical', items: 'Hip Implant Titanium Stem × 4', quantity: '4 units', status: 'Partially Confirmed', responseTimeHrs: 12, lastUpdate: '2026-07-18 09:45', fulfillmentStage: 'Order Confirmed' },
];

export const MOCK_VENDOR_PROFILES: VendorProfile[] = [
  { id: 'vp1', vendorName: 'MedSupply India Pvt Ltd', category: 'Medicines', rating: 4.6, performanceScore: 4.5, activePos: 8, contractExpiry: '2027-03-31', moqPolicy: 'Min order ₹25,000', catalogueItems: 842, alternativeProducts: 124, documentsVerified: true },
  { id: 'vp2', vendorName: 'Apollo Pharma Distribution', category: 'Medicines', rating: 4.2, performanceScore: 4.1, activePos: 5, contractExpiry: '2026-12-31', moqPolicy: 'Min order ₹15,000', catalogueItems: 1240, alternativeProducts: 86, documentsVerified: true },
  { id: 'vp3', vendorName: 'Stryker India Medical', category: 'Implants', rating: 4.8, performanceScore: 4.7, activePos: 3, contractExpiry: '2028-01-15', moqPolicy: 'Lot-based MOQ', catalogueItems: 186, alternativeProducts: 42, documentsVerified: true },
  { id: 'vp4', vendorName: 'Cipla Healthcare Logistics', category: 'Medicines', rating: 4.7, performanceScore: 4.6, activePos: 4, contractExpiry: '2027-06-30', moqPolicy: 'Min order ₹50,000', catalogueItems: 620, alternativeProducts: 58, documentsVerified: true },
  { id: 'vp5', vendorName: 'Getinge India (CSSD)', category: 'Equipment', rating: 4.4, performanceScore: 4.3, activePos: 2, contractExpiry: '2026-08-15', moqPolicy: 'AMC contract', catalogueItems: 48, alternativeProducts: 12, documentsVerified: true },
];

export const MOCK_CATALOGUE: CatalogueItem[] = [
  { id: 'cat1', vendorName: 'MedSupply India', productName: 'Norepinephrine 4mg/4mL Ampoule', category: 'Medicines', moq: 100, unit: 'amp', rateContractPrice: 185, alternative: 'Apollo Pharma — Levophed equiv.' },
  { id: 'cat2', vendorName: 'Apollo Pharma', productName: 'Surgical Gloves Size 7 (Latex-free)', category: 'Surgical Items', moq: 500, unit: 'pairs', rateContractPrice: 42 },
  { id: 'cat3', vendorName: 'Stryker India', productName: 'Hip Implant — Titanium Stem 52mm', category: 'Implants', moq: 2, unit: 'units', rateContractPrice: 185000, alternative: 'Zimmer Biomet — Trilogy stem' },
  { id: 'cat4', vendorName: 'Cipla Healthcare', productName: 'Iohexol 350 mgI/mL 50mL Vial', category: 'Medicines', moq: 24, unit: 'vials', rateContractPrice: 820 },
];

export const MOCK_QUOTATION_ROUTES: QuotationRoute[] = [
  { id: 'qr1', rfqNumber: 'RFQ-2026-881', itemDescription: 'Norepinephrine 4mg/4mL × 200 ampoules', vendorA: 'MedSupply India', priceA: 37000, deliveryA: 2, qualityA: 4.6, vendorB: 'Apollo Pharma', priceB: 39200, deliveryB: 3, qualityB: 4.2, recommended: 'MedSupply India' },
  { id: 'qr2', rfqNumber: 'RFQ-2026-890', itemDescription: 'CSSD Autoclave — 600L Capacity', vendorA: 'Getinge India', priceA: 4200000, deliveryA: 60, qualityA: 4.8, vendorB: 'Steris India', priceB: 3950000, deliveryB: 90, qualityB: 4.5, recommended: 'Getinge India' },
];

export const MOCK_CONTRACT_ALERTS: ContractRenewalAlert[] = [
  { id: 'ca1', vendorName: 'Getinge India (CSSD)', contractType: 'AMC + Supply', expiryDate: '2026-08-15', daysRemaining: 28, annualValue: 2400000 },
  { id: 'ca2', vendorName: 'Apollo Pharma Distribution', contractType: 'Rate Contract — Pharma', expiryDate: '2026-12-31', daysRemaining: 166, annualValue: 8600000 },
  { id: 'ca3', vendorName: 'Sun Pharma Wholesale', contractType: 'Annual Supply Agreement', expiryDate: '2026-09-30', daysRemaining: 74, annualValue: 5200000 },
];

export const INITIAL_DELIVERY_TRACKING: DeliveryTrackingRecord[] = [
  { id: 'dt1', poNumber: 'PO-2026-7798', vendorName: 'Sun Pharma Wholesale', stage: 'Dispatched', trackingRef: 'TRK-SPW-8841', expectedDelivery: '2026-07-18', invoiceNumber: 'INV-SPW-8841', invoiceAmount: 562000, paymentStatus: 'Paid' },
  { id: 'dt2', poNumber: 'PO-2026-7792', vendorName: 'Apollo Pharma Distribution', stage: 'In Transit', trackingRef: 'TRK-APD-7720', expectedDelivery: '2026-07-19', invoiceNumber: 'INV-APD-7720', invoiceAmount: 309000, paymentStatus: 'Pending Match' },
  { id: 'dt3', poNumber: 'PO-2026-7788', vendorName: 'MedSupply India Pvt Ltd', stage: 'In Transit', trackingRef: 'TRK-MSI-6633', expectedDelivery: '2026-07-17', invoiceNumber: 'INV-MSI-6633', invoiceAmount: 485000, paymentStatus: 'Overdue' },
  { id: 'dt4', poNumber: 'PO-2026-7801', vendorName: 'Stryker India Medical', stage: 'Order Confirmed', trackingRef: '—', expectedDelivery: '2026-07-25', invoiceNumber: '—', invoiceAmount: 740000, paymentStatus: 'Pending Match' },
];

export const MOCK_RETURN_NOTES: ReturnReplacementNote[] = [
  { id: 'rr1', rrnNumber: 'RRN-2026-441', poReference: 'PO-2026-7792', vendorName: 'Apollo Pharma Distribution', reason: 'Damaged packaging — 20 glove pairs', creditValue: 840, status: 'Credit Issued' },
  { id: 'rr2', rrnNumber: 'RRN-2026-438', poReference: 'PO-2026-7785', vendorName: 'Sun Pharma Wholesale', reason: 'Batch recall — Ranitidine RAN-3300-G', creditValue: 42000, status: 'Replacement Dispatched' },
];

export const MOCK_LICENSE_LOGS: LicenseComplianceLog[] = [
  { id: 'lc1', vendorName: 'MedSupply India Pvt Ltd', licenseType: 'Drug Wholesale License (Form 20B/21B)', expiryDate: '2027-06-30', status: 'Valid', lastAudit: '2026-07-01' },
  { id: 'lc2', vendorName: 'Getinge India (CSSD)', licenseType: 'Medical Device Import License', expiryDate: '2026-08-20', status: 'Expiring Soon', lastAudit: '2026-06-15' },
  { id: 'lc3', vendorName: 'PharmaLink Distribution', licenseType: 'Drug License — Schedule X', expiryDate: '2026-07-10', status: 'Expired', lastAudit: '2026-05-20' },
  { id: 'lc4', vendorName: 'Stryker India Medical', licenseType: 'Implant Registration (CDSCO)', expiryDate: '2028-03-15', status: 'Valid', lastAudit: '2026-07-10' },
];

export const INITIAL_AI_VENDOR_INSIGHTS: AiVendorInsight[] = [
  { id: 'ai1', insightType: 'Cost Optimization', title: 'Volume Shift — Surgical Gloves', detail: 'Apollo Pharma offers 8% lower unit cost at comparable OTD', suggestedAction: 'Switch 20% volume to Apollo Pharma for Size 7 gloves', estimatedSavings: '₹2.5 Lakhs/year', confidence: 89, status: 'Pending Review' },
  { id: 'ai2', insightType: 'Risk Prediction', title: 'Single-Source Dependency — Norepinephrine', detail: '82% of vasopressor POs routed to MedSupply India', suggestedAction: 'Onboard backup vendor · split PO 60/40', riskLevel: 'High', confidence: 91, status: 'Pending Review' },
  { id: 'ai3', insightType: 'Smart Recommendation', title: 'Delayed Delivery Pattern — PO-7788', detail: 'MedSupply OTD dropped to 78% over 30 days', suggestedAction: 'Escalate to vendor account manager · activate penalty clause', riskLevel: 'Medium', confidence: 86, status: 'Accepted' },
  { id: 'ai4', insightType: 'Risk Prediction', title: 'License Expiry — PharmaLink', detail: 'Schedule X license expired — onboarding blocked', suggestedAction: 'Suspend PO routing · initiate compliance review', riskLevel: 'High', confidence: 98, status: 'Pending Review' },
];

export const MOCK_COMPLAINTS: VendorComplaint[] = [
  { id: 'vc1', complaintId: 'CMP-2026-112', vendorName: 'MedSupply India Pvt Ltd', category: 'Late Delivery', description: 'PO-7788 — 24hr SLA breached · ICU stockout risk', status: 'Investigating', loggedAt: '2026-07-18 10:00' },
  { id: 'vc2', complaintId: 'CMP-2026-108', vendorName: 'Apollo Pharma Distribution', category: 'Quality Issue', description: 'Damaged glove packaging on GRN-9904', status: 'Resolved', loggedAt: '2026-07-17 16:30' },
  { id: 'vc3', complaintId: 'CMP-2026-105', vendorName: 'Sun Pharma Wholesale', category: 'Invoice Discrepancy', description: 'Invoice amount mismatch vs PO — ₹3,000 variance', status: 'Open', loggedAt: '2026-07-16 09:15' },
];

export const OUTSTANDING_BALANCE_TREND = [
  { week: 'W1', outstanding: 3200000, paid: 2100000 },
  { week: 'W2', outstanding: 2860000, paid: 2450000 },
  { week: 'W3', outstanding: 3100000, paid: 1980000 },
  { week: 'W4', outstanding: 2680000, paid: 2720000 },
];

export function searchVendorCoordination(query: string, vendors: VendorOnboardingRequest[]): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  return vendors.filter(
    (v) =>
      v.vendorName.toLowerCase().includes(q) ||
      v.requestId.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      v.contactPerson.toLowerCase().includes(q),
  ).length;
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export { advanceOnboardingPhase, advanceFulfillmentStage };
