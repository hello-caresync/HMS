/** Nexora Vendor App — enterprise SRM domain models (FHIR-adjacent procurement). */

export type VendorThemeMode = 'light' | 'dark';

export type VendorEmployeeRole =
  | 'ADMIN'
  | 'SALES_MANAGER'
  | 'DISPATCHER'
  | 'FINANCE_MANAGER'
  | 'LOGISTICS_STAFF'
  | 'FIELD_TECH'
  | 'COMPLIANCE_OFFICER';

export type ComplianceDocStatus = 'Verified' | 'Pending Review' | 'Expired' | 'Rejected';

export type POStatus =
  | 'New'
  | 'Accepted'
  | 'Rejected'
  | 'Processing'
  | 'Partial'
  | 'Dispatched'
  | 'In Transit'
  | 'Received'
  | 'Invoiced'
  | 'Paid';

export type POLifecycleStage =
  | 'Awarded'
  | 'Processing'
  | 'Dispatched'
  | 'Received'
  | 'Invoiced'
  | 'Paid';

export type RFQMatchTier = 'High Match' | 'Medium Match' | 'Low Match';

export type InvoiceStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Paid'
  | 'Overdue'
  | 'Rejected';

export type ContractStatus = 'Active' | 'Expiring' | 'Pending Renewal' | 'Expired' | 'Draft';

export type ServiceTicketPriority = 'Routine' | 'Urgent' | 'Emergency';

export type ServiceTicketStatus =
  | 'Open'
  | 'Assigned'
  | 'In Progress'
  | 'Awaiting Parts'
  | 'Resolved'
  | 'Closed';

export type ProductCategory = 'Medicines' | 'Equipment' | 'Surgical' | 'Laboratory' | 'Logistics';

export type NotificationChannel = 'in_app' | 'email' | 'sms';

export type WorkflowStage = 'RFQ' | 'Quote' | 'PO' | 'Dispatch' | 'Delivery' | 'Invoice' | 'Payment';

export interface VendorOrganization {
  id: string;
  legalName: string;
  tradeName: string;
  gstin: string;
  pan: string;
  vendorRating: number;
  scorecardGrade: 'A' | 'B' | 'C' | 'D';
  primaryCategory: ProductCategory;
  verifiedAt?: string;
}

export interface VendorBranch {
  id: string;
  orgId: string;
  name: string;
  city: string;
  isHeadOffice: boolean;
}

export interface VendorEmployee {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: VendorEmployeeRole;
  mfaEnabled: boolean;
  lastActiveAt: string;
}

export interface BankTaxProfile {
  orgId: string;
  accountNumberMasked: string;
  ifsc: string;
  gstRegistrationState: string;
  tdsApplicable: boolean;
}

export interface ComplianceDocument {
  id: string;
  orgId: string;
  name: string;
  type: 'Drug License' | 'GST' | 'ISO' | 'NABH' | 'Audit Report' | 'Other';
  status: ComplianceDocStatus;
  expiryDate?: string;
  verificationRef?: string;
}

export interface HospitalPartner {
  id: string;
  name: string;
  networkCode: string;
  city: string;
  activeContracts: number;
}

export interface RFQRecord {
  id: string;
  hospitalId: string;
  hospitalName: string;
  title: string;
  category: ProductCategory;
  dueDate: string;
  matchTier: RFQMatchTier;
  estimatedValue: string;
  status: 'Open' | 'Responded' | 'Closed';
}

export interface QuotationRevision {
  id: string;
  rfqId: string;
  version: number;
  submittedAt: string;
  totalAmount: number;
  status: 'Draft' | 'Submitted' | 'Under Negotiation' | 'Accepted' | 'Rejected';
}

export interface PurchaseOrder {
  id: string;
  hospitalId: string;
  hospitalName: string;
  poNumber: string;
  status: POStatus;
  lifecycleStage: POLifecycleStage;
  urgency: 'Normal' | 'Urgent' | 'Critical';
  issuedAt: string;
  expectedDelivery: string;
  lineItems: POLineItem[];
  totalAmount: number;
}

export interface POLineItem {
  sku: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  fulfilledQty: number;
  status: 'Pending' | 'Partial' | 'Fulfilled' | 'Backordered';
}

export interface Shipment {
  id: string;
  poId: string;
  trackingId: string;
  status: 'Created' | 'In Transit' | 'Delivered' | 'Partial Return';
  vehicleId?: string;
  driverName?: string;
  eta: string;
  podCaptured: boolean;
}

export interface VendorInvoice {
  id: string;
  poId: string;
  hospitalName: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  status: InvoiceStatus;
  dueDate: string;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  method: string;
  status: 'Initiated' | 'Processing' | 'Settled' | 'Failed';
  adviceRef?: string;
}

export interface ContractRecord {
  id: string;
  hospitalName: string;
  title: string;
  status: ContractStatus;
  slaOnTimePct: number;
  validFrom: string;
  validTo: string;
  digitalSignatureComplete: boolean;
}

export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  hsnCode: string;
  tierPricing: { tier: string; price: number }[];
  stockAvailable: number;
  certifications: string[];
  specsSummary: string;
}

export interface BatchLot {
  id: string;
  productId: string;
  batchNumber: string;
  expiryDate: string;
  warehouseId: string;
  quantityOnHand: number;
}

export interface WarehouseLocation {
  id: string;
  code: string;
  name: string;
  capacityPct: number;
  temperatureControlled: boolean;
}

export interface ServiceTicket {
  id: string;
  hospitalName: string;
  equipmentName: string;
  type: 'Installation' | 'PM' | 'Breakdown' | 'AMC';
  priority: ServiceTicketPriority;
  status: ServiceTicketStatus;
  assignedTechnician?: string;
  scheduledAt?: string;
}

export interface CommunicationThread {
  id: string;
  subject: string;
  channel: 'Procurement' | 'Pharmacy' | 'Inventory' | 'Biomedical';
  unreadCount: number;
  lastMessageAt: string;
}

export interface VendorNotification {
  id: string;
  title: string;
  body: string;
  actionable: boolean;
  href?: string;
  createdAt: string;
  read: boolean;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: 'Open' | 'In Progress' | 'Escalated' | 'Resolved';
  priority: ServiceTicketPriority;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  resource: string;
  timestamp: string;
  ipMasked: string;
}

export interface DemandForecastPoint {
  dayOffset: number;
  projectedUnits: number;
  confidence: number;
}

export interface VendorDashboardMetrics {
  pendingPOs: number;
  activeShipments: number;
  outstandingInvoices: number;
  upcomingPayments: number;
  expiringContracts: number;
  openServiceTickets: number;
  deliveryRatePct: number;
  revenueGrowthPct: number;
  complianceScore: number;
}

export interface EdiApiCredential {
  id: string;
  label: string;
  keyPrefix: string;
  scopes: string[];
  lastRotatedAt: string;
}
