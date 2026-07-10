/** Phase 6 — Supply Chain workflow types (Modules 17–19) */

export type InventoryCategoryTag = 'Critical Medication' | 'Surgical Consumable';

export interface WarehouseStockItem {
  sku: string;
  itemName: string;
  category: InventoryCategoryTag;
  warehouseLocation: string;
  batchNumber: string;
  barcode: string;
  availableStock: number;
  minimumThreshold: number;
  expiryDate: string;
}

export type PurchasePipelineStage =
  | 'Draft'
  | 'RFQ Broadcast'
  | 'Quotations Under Review'
  | 'PO Dispatched';

export interface PurchaseRequestRow {
  requestId: string;
  title: string;
  vendorRef: string;
  estimatedValue: number;
  stage: PurchasePipelineStage;
  createdAt: string;
}

export interface PurchaseOrderLineItem {
  sku: string;
  description: string;
  quantityOrdered: number;
  unitPrice: number;
  gstPercent: number;
}

export interface PurchaseOrderBundle {
  poReferenceId: string;
  vendorTrackingRef: string;
  vendorName: string;
  lineItems: PurchaseOrderLineItem[];
  corporateTaxAmount: number;
  deliveryFulfillmentPercent: number;
  subtotal: number;
  grandTotal: number;
}

export type VendorInvoicePaymentStatus =
  | 'Pending'
  | 'Partially Paid'
  | 'Settled'
  | 'Overdue';

export interface VendorAgreementProfile {
  vendorId: string;
  supplierName: string;
  contactEmail: string;
  contractStart: string;
  contractEnd: string;
  activeContract: boolean;
  pendingInvoiceStatus: VendorInvoicePaymentStatus;
  outstandingAmount: number;
}

export type GoodsVerificationStatus = 'Pass' | 'Fail';

export interface GoodsReceiptValidationDraft {
  poReferenceId: string;
  itemsReceived: string;
  quantityReceived: number;
  verificationStatus: GoodsVerificationStatus;
}

export const PIPELINE_STAGES: PurchasePipelineStage[] = [
  'Draft',
  'RFQ Broadcast',
  'Quotations Under Review',
  'PO Dispatched',
];

export const WAREHOUSE_LOCATIONS = [
  'Central Store · Block A',
  'Pharmacy Vault · Floor 2',
  'OT Sterile Supply · Block C',
  'Emergency Crash Cart · ED',
  'ICU Consumables · Floor 4',
];

export const CATEGORY_STYLES: Record<InventoryCategoryTag, string> = {
  'Critical Medication': 'bg-rose-100 text-rose-950 border border-rose-400 font-bold',
  'Surgical Consumable': 'bg-sky-100 text-sky-950 border border-sky-400 font-bold',
};

export const PIPELINE_STAGE_STYLES: Record<PurchasePipelineStage, string> = {
  Draft: 'bg-slate-100 text-slate-950 border border-slate-400 font-bold',
  'RFQ Broadcast': 'bg-sky-100 text-sky-950 border border-sky-400 font-bold',
  'Quotations Under Review': 'bg-amber-100 text-amber-950 border border-amber-400 font-bold',
  'PO Dispatched': 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold',
};

export const VENDOR_PAYMENT_STATUS_STYLES: Record<VendorInvoicePaymentStatus, string> = {
  Pending: 'bg-amber-100 text-amber-950 border border-amber-400 font-bold',
  'Partially Paid': 'bg-sky-100 text-sky-950 border border-sky-400 font-bold',
  Settled: 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold',
  Overdue: 'bg-rose-100 text-rose-950 border border-rose-400 font-bold',
};
