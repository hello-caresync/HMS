export type InventoryCategory = 'Medicine Stock' | 'Capital Equipment' | 'Clinical Consumables';

export type StockStatus = 'In Stock' | 'Low Stock' | 'Expired';

export type StockUnit = 'Boxes' | 'Pieces' | 'Strips' | 'Units' | 'Vials' | 'Sets';

export type TransferStatus = 'Pending' | 'Completed';

export interface InventoryItem {
  id: string;
  category: InventoryCategory;
  itemName: string;
  sku: string;
  batchNumber?: string;
  location: string;
  department: string;
  quantityOnHand: number;
  unit: StockUnit;
  expiryDate?: string;
  safetyThreshold: number;
  equipmentValue?: number;
}

export interface InternalTransfer {
  id: string;
  itemId: string;
  itemName: string;
  batchNumber: string;
  sourceLocation: string;
  targetDepartment: string;
  quantity: number;
  status: TransferStatus;
  createdAt: string;
}

export interface InventoryMetrics {
  totalSkuCount: number;
  expiringNext30Days: number;
  capitalEquipmentValue: number;
  pendingTransfers: number;
}

export interface AuditRecord {
  itemId: string;
  expectedQuantity: number;
  countedQuantity: number;
  variance: number;
  auditedAt: string;
}

export const INVENTORY_CATEGORIES: InventoryCategory[] = [
  'Medicine Stock',
  'Capital Equipment',
  'Clinical Consumables',
];

export const SOURCE_LOCATIONS = [
  'Central Warehouse',
  'Pharmacy Store',
  'OT Supply Room',
  'Biomedical Engineering',
] as const;

export const TARGET_DEPARTMENTS = [
  'ICU Nursing Station',
  'General Ward — East',
  'Emergency Department',
  'Laboratory',
  'Radiology Suite',
  'OT Complex',
] as const;

export const STATUS_STYLES: Record<StockStatus, string> = {
  'In Stock': 'bg-emerald-100 text-emerald-900 ring-emerald-200',
  'Low Stock': 'bg-amber-100 text-amber-900 ring-amber-200',
  Expired: 'bg-rose-100 text-rose-900 ring-rose-200',
};

export function generateTransferId(): string {
  return `xfer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

export function deriveStockStatus(item: InventoryItem, now = new Date()): StockStatus {
  if (item.expiryDate) {
    const exp = new Date(item.expiryDate.length === 7 ? `${item.expiryDate}-01` : item.expiryDate);
    if (exp < now) return 'Expired';
  }
  if (item.quantityOnHand <= item.safetyThreshold) return 'Low Stock';
  return 'In Stock';
}

export function isExpiringWithinDays(item: InventoryItem, days: number, now = new Date()): boolean {
  if (!item.expiryDate) return false;
  const exp = new Date(item.expiryDate.length === 7 ? `${item.expiryDate}-01` : item.expiryDate);
  const limit = new Date(now);
  limit.setDate(limit.getDate() + days);
  return exp >= now && exp <= limit;
}

export function computeVariance(expected: number, counted: number): number {
  return counted - expected;
}
