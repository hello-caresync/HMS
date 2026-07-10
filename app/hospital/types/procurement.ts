export type UserRole =
  | 'ADMIN'
  | 'PROCUREMENT_OFFICER'
  | 'FINANCE_TEAM'
  | 'STORE_MANAGER'
  | 'DEPARTMENT_STAFF';

export type HospitalActiveModule =
  | 'po_creation'
  | 'vendor_directory'
  | 'invoice_auditing'
  | 'stock_control'
  | 'goods_receiving'
  | 'admin_analytics'
  | 'access_control'
  | 'compliance_vault'
  | 'audit_trail'
  | 'live_messaging';

export type URGENCIES = 'Normal' | 'Urgent' | 'Critical';

export type POStatus =
  | 'Created'
  | 'Sent'
  | 'New'
  | 'Accepted'
  | 'Processing'
  | 'Packed'
  | 'Dispatched'
  | 'In Transit'
  | 'Delivered'
  | 'Closed'
  | 'Rejected';

export type InvoiceStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Paid'
  | 'Rejected';

export type MatchingStatus =
  | 'Pending'
  | '3-Way Verified'
  | 'Mismatch Flagged';

export type PaymentStatus =
  | 'Pending Processing'
  | 'Disbursed'
  | 'On Hold';

export interface HospitalUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId: string;
}

export interface VendorProfile {
  id: string;
  companyName: string;
  gstin: string;
  licenseNumber: string;
  category: ('Pharma' | 'Surgical' | 'Lab Kits')[];
  status: 'Active' | 'Suspended';
  outstandingDues: number;
  contactEmail: string;
  tradeAgreementExpiry: string;
}

export interface POItem {
  id: string;
  name: string;
  quantityRequested: number;
  quantityReceived?: number;
  unitPrice: number;
}

export interface PurchaseOrder {
  id: string;
  vendorId: string;
  vendorName: string;
  items: POItem[];
  deliveryLocation: string;
  urgency: URGENCIES;
  expectedDeliveryDate: string;
  status: POStatus;
  createdBy: string;
  dateCreated: string;
}

export interface VendorInvoice {
  id: string;
  poReferenceId: string;
  vendorId: string;
  vendorName: string;
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  matchingStatus: MatchingStatus;
  paymentStatus: PaymentStatus;
  dateCreated: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  actionDescription: string;
  metadataToken: string;
}

export interface StockItem {
  sku: string;
  name: string;
  department: string;
  currentLevel: number;
  reorderThreshold: number;
  unit: string;
  lastRestocked: string;
}

export interface DepartmentBudget {
  departmentId: string;
  departmentName: string;
  allocatedBudget: number;
  consumedBudget: number;
  monthlyBurnRate: number;
}

export interface ComplianceDocument {
  id: string;
  title: string;
  vendorId: string;
  vendorName: string;
  documentType: 'Trade Agreement' | 'GST Certificate' | 'Drug License' | 'SLA Contract';
  status: 'Active' | 'Expiring Soon' | 'Archived';
  expiryDate: string;
}

export interface ReturnRequest {
  id: string;
  poReferenceId: string;
  hospitalName: string;
  itemName: string;
  quantityToReturn: number;
  reason: string;
  status: 'Pending Pickup' | 'Received & Replaced' | 'Credit Note Issued';
}

export interface ChatMessage {
  id: string;
  sender: 'Vendor' | 'Hospital';
  text: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  severity: 'Info' | 'Warning' | 'Critical';
  timestamp: string;
  read: boolean;
}

export interface RolePermissions {
  canCreatePO: boolean;
  canApprovePayment: boolean;
  canManageVendors: boolean;
  canManageStock: boolean;
  canReceiveGoods: boolean;
  canViewAnalytics: boolean;
  canManageAccess: boolean;
  canViewCompliance: boolean;
  canSendMessages: boolean;
  isRequisitionOnly: boolean;
}

export function getRolePermissions(role: UserRole): RolePermissions {
  return {
    canCreatePO:
      role === 'ADMIN' ||
      role === 'PROCUREMENT_OFFICER' ||
      role === 'DEPARTMENT_STAFF',
    canApprovePayment: role === 'ADMIN' || role === 'FINANCE_TEAM',
    canManageVendors: role === 'ADMIN' || role === 'PROCUREMENT_OFFICER',
    canManageStock:
      role === 'ADMIN' ||
      role === 'STORE_MANAGER' ||
      role === 'PROCUREMENT_OFFICER',
    canReceiveGoods:
      role === 'ADMIN' ||
      role === 'STORE_MANAGER' ||
      role === 'PROCUREMENT_OFFICER',
    canViewAnalytics:
      role === 'ADMIN' ||
      role === 'FINANCE_TEAM' ||
      role === 'PROCUREMENT_OFFICER',
    canManageAccess: role === 'ADMIN',
    canViewCompliance: role !== 'DEPARTMENT_STAFF',
    canSendMessages: role !== 'DEPARTMENT_STAFF',
    isRequisitionOnly: role === 'DEPARTMENT_STAFF',
  };
}

export const SHARED_STORAGE_KEYS = {
  pos: 'curasync_shared_pos',
  invoices: 'curasync_shared_invoices',
  chats: 'curasync_shared_chats',
  returns: 'curasync_shared_returns',
  audits: 'curasync_shared_audits',
  inventory: 'curasync_shared_inventory',
} as const;
