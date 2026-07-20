export type VendorCoordinationWorkspaceTab = 'vrm' | 'supplier' | 'logistics';

export type VendorCoordinationModalType =
  | 'add-vendor'
  | 'process-approval'
  | 'open-chat'
  | 'issue-rfq'
  | 'dispatch-po'
  | 'track-shipment'
  | 'log-complaint'
  | null;

export const VENDOR_COORDINATION_WORKSPACE_TABS: { id: VendorCoordinationWorkspaceTab; label: string; description: string }[] = [
  { id: 'vrm', label: 'VRM Command Center & Onboarding', description: 'KPIs · registration pipeline · PO coordination · quick actions' },
  { id: 'supplier', label: 'Supplier Master, Catalogues & Routing', description: 'Profiles · catalogues · RFQ comparison · contract renewals' },
  { id: 'logistics', label: 'Logistics, Finance & AI Intelligence', description: 'Fulfillment tracking · invoices · returns · compliance · AI' },
];

export type OnboardingPhase =
  | 'Registration'
  | 'Document Verification'
  | 'Quality Team Review'
  | 'Activated';

export type SupplyCategory = 'Medicines' | 'Surgical Items' | 'Equipment' | 'Implants';

export type PoCoordinationStatus = 'Awaiting Response' | 'Confirmed' | 'Partially Confirmed' | 'Dispatched' | 'Delayed';

export type FulfillmentStage =
  | 'Order Confirmed'
  | 'Packed'
  | 'Dispatched'
  | 'In Transit'
  | 'Delivered';

export type InvoicePaymentStatus = 'Pending Match' | 'Approved' | 'Paid' | 'Overdue';

export type ComplaintStatus = 'Open' | 'Investigating' | 'Resolved';

export type LicenseComplianceStatus = 'Valid' | 'Expiring Soon' | 'Expired';

export type AiVendorInsightStatus = 'Pending Review' | 'Accepted' | 'Rejected';

export const ONBOARDING_FLOW: OnboardingPhase[] = [
  'Registration',
  'Document Verification',
  'Quality Team Review',
  'Activated',
];

export const FULFILLMENT_FLOW: FulfillmentStage[] = [
  'Order Confirmed',
  'Packed',
  'Dispatched',
  'In Transit',
  'Delivered',
];

export function advanceOnboardingPhase(current: OnboardingPhase): OnboardingPhase {
  if (current === 'Activated') return current;
  const idx = ONBOARDING_FLOW.indexOf(current);
  if (idx === -1 || idx === ONBOARDING_FLOW.length - 1) return current;
  return ONBOARDING_FLOW[idx + 1];
}

export function advanceFulfillmentStage(current: FulfillmentStage): FulfillmentStage {
  if (current === 'Delivered') return current;
  const idx = FULFILLMENT_FLOW.indexOf(current);
  if (idx === -1 || idx === FULFILLMENT_FLOW.length - 1) return current;
  return FULFILLMENT_FLOW[idx + 1];
}
