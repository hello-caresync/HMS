import type {
  AdjustmentReason,
  AiSuggestionStatus,
  AuditStatus,
  BarcodeStatus,
  CriticalityLevel,
  EquipmentStatus,
  GrnQcStatus,
  ItemCategory,
  PoWorkflowStatus,
  RequestPriority,
  StockStatus,
  StorageType,
  StoreLocation,
} from '../inventoryNav.types';
import { advancePoStatus } from '../inventoryNav.types';

export type PurchaseRequestOrder = {
  id: string;
  prNumber: string;
  department: string;
  items: string;
  priority: RequestPriority;
  status: PoWorkflowStatus;
  requestedBy: string;
  vendor?: string;
  value: number;
  requestedAt: string;
};

export type GrnIntakeRecord = {
  id: string;
  grnNumber: string;
  poReference: string;
  vendor: string;
  itemName: string;
  quantityOrdered: number;
  quantityReceived: number;
  batchNumber: string;
  expiryDate: string;
  qcStatus: GrnQcStatus;
  receivedBy: string;
  receivedAt: string;
  identityVerified: boolean;
};

export type ItemMasterRecord = {
  id: string;
  itemCode: string;
  itemName: string;
  category: ItemCategory;
  barcodeStatus: BarcodeStatus;
  storage: StorageType;
  criticality: CriticalityLevel;
  unit: string;
  reorderLevel: number;
  currentStock: number;
  status: StockStatus;
};

export type StoreAllocation = {
  id: string;
  store: StoreLocation;
  itemName: string;
  itemCode: string;
  available: number;
  reserved: number;
  unit: string;
  inTransit: number;
};

export type BatchExpiryRecord = {
  id: string;
  itemName: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  daysToExpiry: number;
  fefoRank: number;
  store: StoreLocation;
  recallActive: boolean;
};

export type RecallImpactRecord = {
  id: string;
  batchNumber: string;
  itemName: string;
  department: string;
  quantityIssued: number;
  issuedDate: string;
  patientRef: string;
};

export type AuditRecord = {
  id: string;
  auditId: string;
  store: StoreLocation;
  scheduledDate: string;
  status: AuditStatus;
  systemCount: number;
  actualCount: number;
  variance: number;
  auditor: string;
};

export type StockAdjustment = {
  id: string;
  itemName: string;
  batchNumber: string;
  reason: AdjustmentReason;
  quantity: number;
  loggedBy: string;
  timestamp: string;
};

export type BiomedicalAsset = {
  id: string;
  assetName: string;
  category: string;
  serialNumber: string;
  location: string;
  warrantyExpiry: string;
  amcVendor: string;
  amcExpiry: string;
  lastMaintenance: string;
  nextCalibration: string;
  status: EquipmentStatus;
};

export type AiForecastSuggestion = {
  id: string;
  insight: string;
  itemName: string;
  currentStock: number;
  suggestedQty: number;
  changePct: number;
  confidence: number;
  status: AiSuggestionStatus;
  rationale: string;
};

export const INVENTORY_CENSUS = {
  totalInventoryValue: 42850000,
  totalItemsCount: 3842,
  availableStock: 35680,
  lowStockItems: 47,
  expiredNearExpiry: 31,
  pendingPurchaseRequests: 12,
  pendingGrn: 5,
  todayConsumption: 284000,
  monthlyConsumption: 8420000,
};

export const INITIAL_PURCHASE_ORDERS: PurchaseRequestOrder[] = [
  { id: 'po1', prNumber: 'PR-2026-4401', department: 'ICU', items: 'Norepinephrine 4mg/4mL × 200 amp · IV Sets × 500', priority: 'Emergency', status: 'Sent to Vendor', requestedBy: 'ICU Incharge Dr. Joseph', vendor: 'MedSupply India Pvt Ltd', value: 485000, requestedAt: '2026-07-18T08:00:00' },
  { id: 'po2', prNumber: 'PR-2026-4405', department: 'OT', items: 'Surgical Gloves Size 7 × 2000 pairs · Suture Kit × 150', priority: 'High', status: 'Approved', requestedBy: 'OT Store Manager Anita R.', value: 312000, requestedAt: '2026-07-18T09:30:00' },
  { id: 'po3', prNumber: 'PR-2026-4410', department: 'Pharmacy', items: 'Azithromycin 500mg × 5000 tabs · Insulin Glargine × 50 pens', priority: 'High', status: 'Pending Approval', requestedBy: 'Chief Pharm. Joseph M.', value: 428000, requestedAt: '2026-07-18T10:15:00' },
  { id: 'po4', prNumber: 'PR-2026-4412', department: 'Laboratory', items: 'CBC Reagent Kit × 12 · Troponin-I Reagent × 8', priority: 'Normal', status: 'Draft', requestedBy: 'Lab Manager Lakshmi N.', value: 186000, requestedAt: '2026-07-18T11:00:00' },
  { id: 'po5', prNumber: 'PR-2026-4398', department: 'Emergency', items: 'Adrenaline 1:1000 × 100 amp · Crash Cart Supplies Bundle', priority: 'Emergency', status: 'PO Issued', requestedBy: 'ER Incharge Dr. B. Joseph', vendor: 'Apollo Pharma Distribution', value: 562000, requestedAt: '2026-07-17T14:00:00' },
  { id: 'po6', prNumber: 'PR-2026-4408', department: 'Radiology', items: 'Iohexol 350 mgI/mL × 48 vials · Gadoterate × 20 syringes', priority: 'Normal', status: 'Sent to Vendor', requestedBy: 'Radiology Store Ravi K.', vendor: 'Cipla Healthcare Logistics', value: 298000, requestedAt: '2026-07-18T07:45:00' },
];

export const INITIAL_GRN_RECORDS: GrnIntakeRecord[] = [
  { id: 'gr1', grnNumber: 'GRN-2026-9901', poReference: 'PO-2026-7788', vendor: 'MedSupply India Pvt Ltd', itemName: 'Norepinephrine 4mg/4mL Ampoule', quantityOrdered: 200, quantityReceived: 200, batchNumber: 'NOR-8841-A', expiryDate: '2027-06-15', qcStatus: 'QC Passed', receivedBy: 'Store Incharge Lakshmi N.', receivedAt: '2026-07-18 09:45', identityVerified: true },
  { id: 'gr2', grnNumber: 'GRN-2026-9904', poReference: 'PO-2026-7792', vendor: 'Apollo Pharma Distribution', itemName: 'Surgical Gloves Size 7 (Latex-free)', quantityOrdered: 2000, quantityReceived: 1980, batchNumber: 'GLV-7720-B', expiryDate: '2028-03-01', qcStatus: 'Pending QC', receivedBy: 'QC Tech Joseph M.', receivedAt: '2026-07-18 11:20', identityVerified: true },
  { id: 'gr3', grnNumber: 'GRN-2026-9898', poReference: 'PO-2026-7785', vendor: 'Sun Pharma Wholesale', itemName: 'Ranitidine 150mg Tablet', quantityOrdered: 5000, quantityReceived: 5000, batchNumber: 'RAN-3300-G', expiryDate: '2026-07-20', qcStatus: 'QC Failed', receivedBy: 'QC Tech Anita R.', receivedAt: '2026-07-17 16:30', identityVerified: true },
  { id: 'gr4', grnNumber: 'GRN-2026-9906', poReference: 'PO-2026-7795', vendor: 'Cipla Healthcare Logistics', itemName: 'Hip Implant — Titanium Stem 52mm', quantityOrdered: 4, quantityReceived: 4, batchNumber: 'IMP-5521-C', expiryDate: '2031-12-31', qcStatus: 'Pending QC', receivedBy: 'OT Store Manager Anita R.', receivedAt: '2026-07-18 11:50', identityVerified: true },
];

export const MOCK_ITEM_MASTER: ItemMasterRecord[] = [
  { id: 'im1', itemCode: 'MED-AMX-500', itemName: 'Amoxicillin 500mg Capsule', category: 'Medicine', barcodeStatus: 'Scanned', storage: 'Ambient', criticality: 'High', unit: 'caps', reorderLevel: 500, currentStock: 2400, status: 'Available' },
  { id: 'im2', itemCode: 'SUR-GLV-07', itemName: 'Surgical Gloves Size 7 (Latex-free)', category: 'Surgical Consumable', barcodeStatus: 'Printed', storage: 'Ambient', criticality: 'Critical', unit: 'pairs', reorderLevel: 500, currentStock: 820, status: 'Low Stock' },
  { id: 'im3', itemCode: 'IMP-HIP-52', itemName: 'Hip Implant — Titanium Stem 52mm', category: 'Implant', barcodeStatus: 'Scanned', storage: 'Controlled Room', criticality: 'Critical', unit: 'units', reorderLevel: 2, currentStock: 6, status: 'Available' },
  { id: 'im4', itemCode: 'EQP-VT-001', itemName: 'Hamilton C6 Ventilator', category: 'Medical Equipment', barcodeStatus: 'Scanned', storage: 'Ambient', criticality: 'Critical', unit: 'units', reorderLevel: 1, currentStock: 8, status: 'Available' },
  { id: 'im5', itemCode: 'MED-INS-GLR', itemName: 'Insulin Glargine 100IU/mL Pen', category: 'Medicine', barcodeStatus: 'Pending', storage: 'Cold Chain 2-8°C', criticality: 'High', unit: 'pens', reorderLevel: 30, currentStock: 18, status: 'Low Stock' },
  { id: 'im6', itemCode: 'MED-AZI-500', itemName: 'Azithromycin 500mg Tablet', category: 'Medicine', barcodeStatus: 'Pending', storage: 'Ambient', criticality: 'Standard', unit: 'tabs', reorderLevel: 200, currentStock: 0, status: 'Out of Stock' },
  { id: 'im7', itemCode: 'SUR-SUT-3-0', itemName: 'Ethicon Vicryl Suture 3-0', category: 'Surgical Consumable', barcodeStatus: 'Scanned', storage: 'Ambient', criticality: 'High', unit: 'packs', reorderLevel: 50, currentStock: 124, status: 'Available' },
  { id: 'im8', itemCode: 'LAB-TROP-RG', itemName: 'Troponin-I Reagent Kit', category: 'Surgical Consumable', barcodeStatus: 'Printed', storage: 'Cold Chain 2-8°C', criticality: 'Critical', unit: 'kits', reorderLevel: 5, currentStock: 8, status: 'Available' },
];

export const MOCK_STORE_ALLOCATIONS: StoreAllocation[] = [
  { id: 'sa1', store: 'Main Store', itemName: 'Amoxicillin 500mg Capsule', itemCode: 'MED-AMX-500', available: 1800, reserved: 200, unit: 'caps', inTransit: 0 },
  { id: 'sa2', store: 'Pharmacy Store', itemName: 'Amoxicillin 500mg Capsule', itemCode: 'MED-AMX-500', available: 400, reserved: 0, unit: 'caps', inTransit: 200 },
  { id: 'sa3', store: 'ICU Store', itemName: 'Norepinephrine 4mg/4mL Ampoule', itemCode: 'MED-NOR-004', available: 48, reserved: 12, unit: 'amp', inTransit: 0 },
  { id: 'sa4', store: 'OT Store', itemName: 'Ethicon Vicryl Suture 3-0', itemCode: 'SUR-SUT-3-0', available: 86, reserved: 24, unit: 'packs', inTransit: 14 },
  { id: 'sa5', store: 'Emergency Store', itemName: 'Adrenaline 1:1000 Ampoule', itemCode: 'MED-ADR-001', available: 32, reserved: 8, unit: 'amp', inTransit: 0 },
  { id: 'sa6', store: 'Laboratory Store', itemName: 'Troponin-I Reagent Kit', itemCode: 'LAB-TROP-RG', available: 8, reserved: 2, unit: 'kits', inTransit: 0 },
  { id: 'sa7', store: 'Departmental', itemName: 'Surgical Gloves Size 7', itemCode: 'SUR-GLV-07', available: 420, reserved: 0, unit: 'pairs', inTransit: 1980 },
];

export const MOCK_BATCH_EXPIRY: BatchExpiryRecord[] = [
  { id: 'be1', itemName: 'Ranitidine 150mg Tablet', batchNumber: 'RAN-3300-G', quantity: 5000, expiryDate: '2026-07-20', daysToExpiry: 2, fefoRank: 1, store: 'Main Store', recallActive: true },
  { id: 'be2', itemName: 'Insulin Glargine 100IU Pen', batchNumber: 'INS-5521-E', quantity: 18, expiryDate: '2026-07-28', daysToExpiry: 10, fefoRank: 1, store: 'Pharmacy Store', recallActive: false },
  { id: 'be3', itemName: 'Paracetamol 650mg Tablet', batchNumber: 'PCM-4410-F', quantity: 8600, expiryDate: '2027-01-10', daysToExpiry: 176, fefoRank: 3, store: 'Main Store', recallActive: false },
  { id: 'be4', itemName: 'Iohexol 350 mgI/mL', batchNumber: 'IOH-8841-A', quantity: 48, expiryDate: '2026-09-15', daysToExpiry: 59, fefoRank: 2, store: 'Main Store', recallActive: false },
  { id: 'be5', itemName: 'Barium Sulfate Suspension', batchNumber: 'BAR-9012-C', quantity: 6, expiryDate: '2026-08-01', daysToExpiry: 14, fefoRank: 1, store: 'Departmental', recallActive: false },
];

export const MOCK_RECALL_IMPACTS: RecallImpactRecord[] = [
  { id: 'ri1', batchNumber: 'RAN-3300-G', itemName: 'Ranitidine 150mg Tablet', department: 'IPD Ward 3B', quantityIssued: 120, issuedDate: '2026-07-10', patientRef: '[Identity Verification Checked/Masked for Security]' },
  { id: 'ri2', batchNumber: 'RAN-3300-G', itemName: 'Ranitidine 150mg Tablet', department: 'OPD Pharmacy', quantityIssued: 450, issuedDate: '2026-07-05', patientRef: '[Identity Verification Checked/Masked for Security]' },
  { id: 'ri3', batchNumber: 'RAN-3300-G', itemName: 'Ranitidine 150mg Tablet', department: 'Emergency', quantityIssued: 30, issuedDate: '2026-07-14', patientRef: '[Identity Verification Checked/Masked for Security]' },
];

export const MOCK_AUDITS: AuditRecord[] = [
  { id: 'au1', auditId: 'AUD-2026-881', store: 'Main Store', scheduledDate: '2026-07-18', status: 'In Progress', systemCount: 1240, actualCount: 1236, variance: -4, auditor: 'Audit Team — Ravi K.' },
  { id: 'au2', auditId: 'AUD-2026-878', store: 'ICU Store', scheduledDate: '2026-07-17', status: 'Variance Reported', systemCount: 186, actualCount: 182, variance: -4, auditor: 'Audit Team — Anita R.' },
  { id: 'au3', auditId: 'AUD-2026-875', store: 'OT Store', scheduledDate: '2026-07-20', status: 'Scheduled', systemCount: 420, actualCount: 0, variance: 0, auditor: 'Audit Team — Joseph M.' },
  { id: 'au4', auditId: 'AUD-2026-872', store: 'Pharmacy Store', scheduledDate: '2026-07-15', status: 'Completed', systemCount: 890, actualCount: 890, variance: 0, auditor: 'Audit Team — Lakshmi N.' },
];

export const MOCK_ADJUSTMENTS: StockAdjustment[] = [
  { id: 'adj1', itemName: 'Ranitidine 150mg Tablet', batchNumber: 'RAN-3300-G', reason: 'Expiry', quantity: -5000, loggedBy: 'Store Incharge Lakshmi N.', timestamp: '2026-07-18 10:00' },
  { id: 'adj2', itemName: 'Surgical Gloves Size 7', batchNumber: 'GLV-6610-A', reason: 'Damage', quantity: -20, loggedBy: 'OT Store Anita R.', timestamp: '2026-07-17 15:30' },
  { id: 'adj3', itemName: 'Amoxicillin 500mg Capsule', batchNumber: 'AMX-8841-A', reason: 'Correction', quantity: +15, loggedBy: 'Store Incharge Lakshmi N.', timestamp: '2026-07-16 09:15' },
  { id: 'adj4', itemName: 'Insulin Glargine Pen', batchNumber: 'INS-5521-E', reason: 'Theft', quantity: -2, loggedBy: 'Chief Pharm. Joseph M.', timestamp: '2026-07-14 18:00' },
];

export const MOCK_BIOMEDICAL_ASSETS: BiomedicalAsset[] = [
  { id: 'ba1', assetName: 'Hamilton C6 Ventilator', category: 'Life Support', serialNumber: 'HAM-C6-2024-8841', location: 'ICU Bay 4', warrantyExpiry: '2027-06-30', amcVendor: 'Hamilton Medical India', amcExpiry: '2027-06-30', lastMaintenance: '2026-07-01', nextCalibration: '2026-08-15', status: 'Operational' },
  { id: 'ba2', assetName: 'Philips Ingenia 1.5T MRI', category: 'Diagnostic Imaging', serialNumber: 'PHI-ING-2019-5521', location: 'MRI Suite 1', warrantyExpiry: '2026-12-31', amcVendor: 'Philips Healthcare', amcExpiry: '2027-12-31', lastMaintenance: '2026-06-28', nextCalibration: '2026-07-25', status: 'Calibration Due' },
  { id: 'ba3', assetName: 'GE MAC 5500 HD ECG', category: 'Diagnostic', serialNumber: 'GE-MAC-2023-7720', location: 'Cardiology OPD', warrantyExpiry: '2026-09-30', amcVendor: 'GE Healthcare India', amcExpiry: '2026-09-30', lastMaintenance: '2026-07-10', nextCalibration: '2026-10-01', status: 'Operational' },
  { id: 'ba4', assetName: 'Siemens SOMATOM go.Top CT', category: 'Diagnostic Imaging', serialNumber: 'SIE-SOM-2022-6633', location: 'CT Suite 2', warrantyExpiry: '2027-03-15', amcVendor: 'Siemens Healthineers', amcExpiry: '2027-03-15', lastMaintenance: '2026-07-01', nextCalibration: '2026-07-22', status: 'Operational' },
  { id: 'ba5', assetName: 'Drager Fabius Plus Anesthesia', category: 'OT Equipment', serialNumber: 'DRG-FAB-2021-9012', location: 'OT-3', warrantyExpiry: '2026-05-31', amcVendor: 'Drager India', amcExpiry: '2026-11-30', lastMaintenance: '2026-07-18', nextCalibration: '2026-08-01', status: 'Under Maintenance' },
];

export const INITIAL_AI_SUGGESTIONS: AiForecastSuggestion[] = [
  { id: 'ai1', insight: 'Monsoon Surge Forecast', itemName: 'Dengue NS1 Antigen Kit', currentStock: 48, suggestedQty: 60, changePct: 25, confidence: 92, status: 'Pending Review', rationale: 'Historical monsoon pattern — dengue cases ↑ 28% YoY in Jul-Aug' },
  { id: 'ai2', insight: 'ICU Consumption Spike', itemName: 'Norepinephrine 4mg/4mL Ampoule', currentStock: 48, suggestedQty: 80, changePct: 67, confidence: 88, status: 'Accepted', rationale: 'ICU census at 94% — vasopressor usage trending +40% over 7 days' },
  { id: 'ai3', insight: 'Overstock Risk', itemName: 'Surgical Masks N95', currentStock: 12000, suggestedQty: 8000, changePct: -33, confidence: 85, status: 'Pending Review', rationale: 'Consumption rate declining — 45 days supply vs optimal 21 days' },
  { id: 'ai4', insight: 'Seasonal Antibiotic Demand', itemName: 'Azithromycin 500mg Tablet', currentStock: 0, suggestedQty: 5000, changePct: 100, confidence: 94, status: 'Pending Review', rationale: 'Out-of-stock + respiratory OPD volume ↑ 18% — auto-reorder triggered' },
  { id: 'ai5', insight: 'Wastage Prevention', itemName: 'Insulin Glargine 100IU Pen', currentStock: 18, suggestedQty: 12, changePct: -33, confidence: 79, status: 'Rejected', rationale: 'Near-expiry batch INS-5521-E — reduce reorder until FEFO clearance' },
];

export const CONSUMPTION_TREND = [
  { day: 'Mon', value: 268000 },
  { day: 'Tue', value: 275000 },
  { day: 'Wed', value: 290000 },
  { day: 'Thu', value: 284000 },
  { day: 'Fri', value: 302000 },
  { day: 'Sat', value: 198000 },
  { day: 'Sun', value: 172000 },
];

export function searchInventory(query: string, orders: PurchaseRequestOrder[]): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  return orders.filter(
    (o) =>
      o.prNumber.toLowerCase().includes(q) ||
      o.department.toLowerCase().includes(q) ||
      o.items.toLowerCase().includes(q) ||
      (o.vendor?.toLowerCase().includes(q) ?? false),
  ).length;
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export { advancePoStatus };
