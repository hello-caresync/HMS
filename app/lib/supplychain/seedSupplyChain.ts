import type {
  PurchaseOrderBundle,
  PurchaseRequestRow,
  VendorAgreementProfile,
  WarehouseStockItem,
} from './types';

export const EXPIRY_WARNING_DAYS = 90;

export function isLowStock(item: WarehouseStockItem): boolean {
  return item.availableStock < item.minimumThreshold;
}

export function getExpiryStatus(expiryDate: string): 'expired' | 'warning' | 'ok' {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= EXPIRY_WARNING_DAYS) return 'warning';
  return 'ok';
}

export const SEED_WAREHOUSE_STOCK: WarehouseStockItem[] = [
  {
    sku: 'MED-INS-GLR-100',
    itemName: 'Insulin Glargine 100 IU/mL',
    category: 'Critical Medication',
    warehouseLocation: 'Pharmacy Vault · Floor 2',
    batchNumber: 'BT-INS-26Z',
    barcode: '8901234567890',
    availableStock: 12,
    minimumThreshold: 20,
    expiryDate: '2026-09-30',
  },
  {
    sku: 'MED-CEFT-1G-V',
    itemName: 'Ceftriaxone 1g Injection',
    category: 'Critical Medication',
    warehouseLocation: 'Central Store · Block A',
    batchNumber: 'BT-CEFT-26B',
    barcode: '8901234567891',
    availableStock: 86,
    minimumThreshold: 40,
    expiryDate: '2027-02-09',
  },
  {
    sku: 'SUR-GLOV-NRL-L',
    itemName: 'Surgical Gloves · Nitrile · Size L',
    category: 'Surgical Consumable',
    warehouseLocation: 'OT Sterile Supply · Block C',
    batchNumber: 'BT-GLV-26A',
    barcode: '8901234567892',
    availableStock: 240,
    minimumThreshold: 100,
    expiryDate: '2028-06-15',
  },
  {
    sku: 'SUR-SUT-VOIC-2',
    itemName: 'Vicryl Suture 2-0 · Absorbable',
    category: 'Surgical Consumable',
    warehouseLocation: 'OT Sterile Supply · Block C',
    batchNumber: 'BT-SUT-25X',
    barcode: '8901234567893',
    availableStock: 18,
    minimumThreshold: 25,
    expiryDate: '2026-08-14',
  },
  {
    sku: 'MED-ADRN-1ML',
    itemName: 'Adrenaline 1:1000 Ampoule',
    category: 'Critical Medication',
    warehouseLocation: 'Emergency Crash Cart · ED',
    batchNumber: 'BT-ADR-26C',
    barcode: '8901234567894',
    availableStock: 45,
    minimumThreshold: 30,
    expiryDate: '2026-07-20',
  },
  {
    sku: 'SUR-IVC-18G',
    itemName: 'IV Cannula 18G · Pink',
    category: 'Surgical Consumable',
    warehouseLocation: 'ICU Consumables · Floor 4',
    batchNumber: 'BT-IVC-26D',
    barcode: '8901234567895',
    availableStock: 320,
    minimumThreshold: 150,
    expiryDate: '2029-01-10',
  },
];

export const SEED_PURCHASE_REQUESTS: PurchaseRequestRow[] = [
  {
    requestId: 'PR-2026-441',
    title: 'Critical medication replenishment · Q3',
    vendorRef: 'VND-SANOFI-001',
    estimatedValue: 285000,
    stage: 'Quotations Under Review',
    createdAt: '2026-07-05T08:00:00Z',
  },
  {
    requestId: 'PR-2026-448',
    title: 'OT consumables · sutures & drapes',
    vendorRef: 'VND-JNJ-014',
    estimatedValue: 92000,
    stage: 'RFQ Broadcast',
    createdAt: '2026-07-08T10:30:00Z',
  },
  {
    requestId: 'PR-2026-452',
    title: 'Emergency crash cart restock',
    vendorRef: 'VND-ALKEM-008',
    estimatedValue: 45000,
    stage: 'Draft',
    createdAt: '2026-07-10T07:15:00Z',
  },
  {
    requestId: 'PR-2026-439',
    title: 'IV fluids & infusion sets bulk',
    vendorRef: 'VND-BAXTER-002',
    estimatedValue: 156000,
    stage: 'PO Dispatched',
    createdAt: '2026-07-01T09:00:00Z',
  },
];

export const SEED_PURCHASE_ORDER: PurchaseOrderBundle = {
  poReferenceId: 'PO-NEX-2026-8834',
  vendorTrackingRef: 'VTR-BAXTER-77291',
  vendorName: 'Baxter India Pvt. Ltd.',
  lineItems: [
    { sku: 'FLD-NS-500', description: 'Normal Saline 500 mL · Box of 20', quantityOrdered: 50, unitPrice: 850, gstPercent: 5 },
    { sku: 'SUR-IVS-SET', description: 'IV Infusion Set · Standard', quantityOrdered: 200, unitPrice: 42, gstPercent: 12 },
  ],
  corporateTaxAmount: 3124,
  deliveryFulfillmentPercent: 85,
  subtotal: 50900,
  grandTotal: 54024,
};

export const SEED_VENDOR_PROFILES: VendorAgreementProfile[] = [
  {
    vendorId: 'VND-BAXTER-002',
    supplierName: 'Baxter India Pvt. Ltd.',
    contactEmail: 'supply@baxter.in',
    contractStart: '2025-04-01',
    contractEnd: '2027-03-31',
    activeContract: true,
    pendingInvoiceStatus: 'Partially Paid',
    outstandingAmount: 54024,
  },
  {
    vendorId: 'VND-SANOFI-001',
    supplierName: 'Sanofi India Ltd.',
    contactEmail: 'hospital@sanofi.com',
    contractStart: '2024-01-15',
    contractEnd: '2026-12-31',
    activeContract: true,
    pendingInvoiceStatus: 'Pending',
    outstandingAmount: 128400,
  },
  {
    vendorId: 'VND-JNJ-014',
    supplierName: 'Johnson & Johnson Medical',
    contactEmail: 'procurement@jnj.in',
    contractStart: '2023-06-01',
    contractEnd: '2025-05-31',
    activeContract: false,
    pendingInvoiceStatus: 'Overdue',
    outstandingAmount: 67200,
  },
  {
    vendorId: 'VND-ALKEM-008',
    supplierName: 'Alkem Laboratories Ltd.',
    contactEmail: 'accounts@alkem.com',
    contractStart: '2025-09-01',
    contractEnd: '2028-08-31',
    activeContract: true,
    pendingInvoiceStatus: 'Settled',
    outstandingAmount: 0,
  },
];

export function advancePipelineStage(current: PurchaseRequestRow['stage']): PurchaseRequestRow['stage'] {
  const stages = ['Draft', 'RFQ Broadcast', 'Quotations Under Review', 'PO Dispatched'] as const;
  const idx = stages.indexOf(current);
  return stages[Math.min(idx + 1, stages.length - 1)] ?? current;
}
