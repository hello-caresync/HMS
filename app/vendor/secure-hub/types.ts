export type VendorUserRole = 'ADMIN' | 'SALES_MANAGER' | 'BILLING_STAFF' | 'LOGISTICS_STAFF';

export type POExtendedStatus = 'New' | 'Accepted' | 'Processing' | 'Packed' | 'Dispatched' | 'In Transit' | 'Delivered' | 'Rejected';

export type HubActiveModule =
  | 'po_inbox'
  | 'logistics'
  | 'billing'
  | 'catalog'
  | 'documents'
  | 'communication'
  | 'returns'
  | 'analytics';

export type POInboxFilter = 'ALL' | 'New' | 'Accepted';
export interface VendorPOItem {
  name: string;
  quantityRequested: number;
  quantityDelivered?: number;
  unitPrice: number;
}

export interface EnterprisePO {
  id: string;
  hospitalName: string;
  items: VendorPOItem[];
  deliveryLocation: string;
  urgency: 'Normal' | 'Urgent' | 'Critical';
  expectedDeliveryDate: string;
  status: POExtendedStatus;
  dateReceived: string;
  courierTrackingId?: string;
  receiverName?: string;
  creditTermsDays: number;
}

export interface GeneratedInvoice {
  id: string;
  poReferenceId: string;
  hospitalName: string;
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Paid';
  dateCreated: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  hsnCode: string;
  stockAvailable: number;
  expiryBatch?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'Vendor' | 'Hospital';
  text: string;
  timestamp: string;
}

export interface ComplianceDoc {
  id: string;
  name: string;
  type: string;
  status: 'Verified' | 'Pending Review' | 'Expired';
  expiryDate?: string;
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