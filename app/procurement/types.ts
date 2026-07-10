export type ProcurementTab =
  | 'requests'
  | 'rfqs'
  | 'orders'
  | 'analytics';

export type RequestPriority = 'Routine' | 'Urgent';

export type RequestStatus = 'Pending' | 'Approved' | 'Converted';

export type RFQStatus = 'Open' | 'Bids Received' | 'Awarded' | 'Closed';

export type POStatus = 'Issued' | 'Partially Received' | 'Received' | 'Matched' | 'Mismatch';

export type MatchStatus = 'Matched' | 'Mismatch' | 'Pending';

export interface PurchaseRequest {
  id: string;
  itemName: string;
  requestingDepartment: string;
  quantity: number;
  unit: string;
  priority: RequestPriority;
  status: RequestStatus;
  requestedAt: string;
}

export interface VendorBid {
  vendorId: string;
  vendorName: string;
  unitPrice: number;
  shippingDays: number;
  gstPercent: number;
  totalBidAmount: number;
  rating: number;
}

export interface RFQ {
  id: string;
  rfqNumber: string;
  itemName: string;
  quantity: number;
  unit: string;
  department: string;
  status: RFQStatus;
  createdAt: string;
  bids: VendorBid[];
  acceptedVendorId?: string;
  purchaseOrderId?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  rfqId: string;
  vendorId: string;
  vendorName: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  gstPercent: number;
  totalAmount: number;
  status: POStatus;
  issuedAt: string;
  grnQuantity: number;
  invoiceQuantity: number;
  matchStatus: MatchStatus;
}

export interface VendorAnalyticsRow {
  vendorId: string;
  vendorName: string;
  totalPOs: number;
  onTimeDeliveryPct: number;
  avgRating: number;
  totalSpend: number;
  activeRFQs: number;
}

export const PRIORITY_STYLES: Record<RequestPriority, string> = {
  Routine: 'bg-slate-100 text-slate-900 ring-slate-200',
  Urgent: 'bg-rose-100 text-rose-900 ring-rose-200',
};

export const RFQ_STATUS_STYLES: Record<RFQStatus, string> = {
  Open: 'bg-sky-100 text-sky-900 ring-sky-200',
  'Bids Received': 'bg-violet-100 text-violet-900 ring-violet-200',
  Awarded: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
  Closed: 'bg-slate-100 text-slate-800 ring-slate-200',
};

export const PO_STATUS_STYLES: Record<POStatus, string> = {
  Issued: 'bg-sky-100 text-sky-900 ring-sky-200',
  'Partially Received': 'bg-amber-100 text-amber-900 ring-amber-200',
  Received: 'bg-indigo-100 text-indigo-900 ring-indigo-200',
  Matched: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
  Mismatch: 'bg-rose-100 text-rose-900 ring-rose-200',
};

export function generateRfqNumber(): string {
  return `RFQ-NEX-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function generatePoNumber(): string {
  return `PO-NEX-${Math.floor(10000 + Math.random() * 90000)}`;
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

export function computeThreeWayMatch(
  poQty: number,
  grnQty: number,
  invoiceQty: number,
): MatchStatus {
  if (poQty === grnQty && grnQty === invoiceQty) return 'Matched';
  if (grnQty === 0 && invoiceQty === 0) return 'Pending';
  return 'Mismatch';
}
