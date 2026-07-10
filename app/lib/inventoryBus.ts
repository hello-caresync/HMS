import type { StockItem } from '../hospital/types/procurement';
import type { CatalogProduct } from '../vendor/secure-hub/types';

export const INVENTORY_STORAGE_KEY = 'curasync_shared_inventory';
export const INVENTORY_UPDATE_EVENT = 'curasync-inventory-update';

export interface InventoryLedgerEntry {
  ledgerId: string;
  vendorProductId: string | null;
  hospitalSku: string;
  name: string;
  unitsAvailable: number;
  department: string;
  reorderThreshold: number;
  unit: string;
  lastRestocked: string;
  price: number;
  hsnCode: string;
  expiryBatch?: string;
}

export const SEED_INVENTORY_LEDGER: InventoryLedgerEntry[] = [
  {
    ledgerId: 'TELM40',
    vendorProductId: 'PROD-TELM40',
    hospitalSku: 'STK-TELM40',
    name: 'Telmisartan 40mg Baseline Tablets',
    unitsAvailable: 84500,
    department: 'Central Pharmacy',
    reorderThreshold: 1200,
    unit: 'units',
    lastRestocked: '2026-06-28',
    price: 7.1,
    hsnCode: '30049099',
    expiryBatch: 'B-TEL26 / Exp: May 2028',
  },
  {
    ledgerId: 'PANT40',
    vendorProductId: 'PROD-PANT40',
    hospitalSku: 'STK-PANT40',
    name: 'Pantocid 40mg Gastro Capsules',
    unitsAvailable: 42000,
    department: 'Central Pharmacy',
    reorderThreshold: 900,
    unit: 'units',
    lastRestocked: '2026-07-01',
    price: 9.3,
    hsnCode: '30049034',
    expiryBatch: 'B-PAN26 / Exp: Dec 2027',
  },
  {
    ledgerId: 'GLUCSTR',
    vendorProductId: null,
    hospitalSku: 'STK-GLUCSTR',
    name: 'Accu-Chek Glucose Test Strips',
    unitsAvailable: 180,
    department: 'Diagnostics Wing',
    reorderThreshold: 250,
    unit: 'strips',
    lastRestocked: '2026-06-20',
    price: 0,
    hsnCode: '',
  },
];

function normalizeEntry(raw: Record<string, unknown>): InventoryLedgerEntry | null {
  const ledgerId = String(raw.ledgerId ?? '');
  const hospitalSku = String(raw.hospitalSku ?? '');
  if (!ledgerId || !hospitalSku) return null;

  return {
    ledgerId,
    vendorProductId:
      raw.vendorProductId === null || raw.vendorProductId === undefined
        ? null
        : String(raw.vendorProductId),
    hospitalSku,
    name: String(raw.name ?? 'Unknown item'),
    unitsAvailable: Math.max(0, Number(raw.unitsAvailable ?? 0)),
    department: String(raw.department ?? 'Central Pharmacy'),
    reorderThreshold: Number(raw.reorderThreshold ?? 0),
    unit: String(raw.unit ?? 'units'),
    lastRestocked: String(raw.lastRestocked ?? ''),
    price: Number(raw.price ?? 0),
    hsnCode: String(raw.hsnCode ?? ''),
    expiryBatch: raw.expiryBatch ? String(raw.expiryBatch) : undefined,
  };
}

export function normalizeInventoryLedger(raw: unknown): InventoryLedgerEntry[] {
  if (!Array.isArray(raw)) return [];

  const normalized = raw
    .map((entry) =>
      entry && typeof entry === 'object'
        ? normalizeEntry(entry as Record<string, unknown>)
        : null,
    )
    .filter((entry): entry is InventoryLedgerEntry => entry !== null);

  return normalized.length > 0 ? normalized : SEED_INVENTORY_LEDGER;
}

export function readInventoryLedger(): InventoryLedgerEntry[] {
  if (typeof window === 'undefined') return SEED_INVENTORY_LEDGER;

  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!raw) return ensureInventorySeed();

    return normalizeInventoryLedger(JSON.parse(raw));
  } catch {
    return ensureInventorySeed();
  }
}

export function writeInventoryLedger(entries: InventoryLedgerEntry[]): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent(INVENTORY_UPDATE_EVENT));
}

export function ensureInventorySeed(): InventoryLedgerEntry[] {
  writeInventoryLedger(SEED_INVENTORY_LEDGER);
  return SEED_INVENTORY_LEDGER;
}

export function toHospitalStockItems(entries: InventoryLedgerEntry[]): StockItem[] {
  return entries.map((entry) => ({
    sku: entry.hospitalSku,
    name: entry.name,
    department: entry.department,
    currentLevel: entry.unitsAvailable,
    reorderThreshold: entry.reorderThreshold,
    unit: entry.unit,
    lastRestocked: entry.lastRestocked,
  }));
}

export function toVendorCatalogProducts(
  entries: InventoryLedgerEntry[],
): CatalogProduct[] {
  return entries
    .filter((entry): entry is InventoryLedgerEntry & { vendorProductId: string } =>
      Boolean(entry.vendorProductId),
    )
    .map((entry) => ({
      id: entry.vendorProductId,
      name: entry.name,
      price: entry.price,
      hsnCode: entry.hsnCode,
      stockAvailable: entry.unitsAvailable,
      expiryBatch: entry.expiryBatch,
    }));
}

export function getPrescribableProducts(
  entries: InventoryLedgerEntry[],
): InventoryLedgerEntry[] {
  return entries.filter((entry) => entry.vendorProductId !== null);
}

export type PrescriptionResult =
  | { ok: true; entry: InventoryLedgerEntry; remaining: number }
  | { ok: false; reason: 'not_found' | 'invalid_qty' | 'insufficient_stock' };

export function dispensePrescription(
  ledgerId: string,
  quantity: number,
): PrescriptionResult {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { ok: false, reason: 'invalid_qty' };
  }

  const entries = readInventoryLedger();
  const index = entries.findIndex((entry) => entry.ledgerId === ledgerId);
  if (index === -1) return { ok: false, reason: 'not_found' };

  const current = entries[index];
  if (current.unitsAvailable < quantity) {
    return { ok: false, reason: 'insufficient_stock' };
  }

  const updated: InventoryLedgerEntry = {
    ...current,
    unitsAvailable: current.unitsAvailable - quantity,
  };

  const nextLedger = [...entries];
  nextLedger[index] = updated;
  writeInventoryLedger(nextLedger);

  return {
    ok: true,
    entry: updated,
    remaining: updated.unitsAvailable,
  };
}

export function getVendorProductIdForHospitalSku(hospitalSku: string): string | null {
  const match = readInventoryLedger().find((entry) => entry.hospitalSku === hospitalSku);
  return match?.vendorProductId ?? null;
}
