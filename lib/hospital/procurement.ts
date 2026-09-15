import type { SupabaseClient } from '@supabase/supabase-js';

import {
  buildHospitalDirectoryOrFilter,
  hospitalDirectoryFilterIds,
  hospitalIdQueryValues,
  isUuidColumnError,
  isUuidValue,
} from '@/lib/hospital/hospital-node';
import {
  isHospitalCode,
  isHospitalUuid,
  resolveHospitalUuid,
} from '@/lib/hospital/resolve-hospital-context';
import { HOSPITAL_USER_CREDENTIALS_TABLE } from '@/lib/auth/hospitalAuth';
import { REGAL_FACILITY_CODE, REGAL_HOSPITAL_CODE, REGAL_HOSPITAL_NAME } from '@/lib/regal/constants';

/** Placeholder when GSTIN is not supplied — satisfies NOT NULL on public.vendors.gstin. */
export const VENDOR_GSTIN_FALLBACK = 'NOT_PROVIDED';

export const PO_CATEGORIES = [
  'Pharmaceuticals',
  'Surgical Supplies',
  'Diagnostic Reagents',
  'PPE & Disposables',
] as const;

export const DELIVERY_WINDOWS = ['24h Emergency', '3-5 Days Standard', 'Weekly Restock'] as const;

export type PurchaseOrderStatus = 'Issued' | 'Delivered' | 'Cancelled' | 'Accepted' | 'Rejected';

/** Allowed values on public.purchase_orders.status (check constraint). */
export const PO_DB_STATUSES = [
  'PENDING DISPATCH',
  'ISSUED',
  'ACCEPTED',
  'INVOICED',
  'DELIVERED',
  'DISPATCHED',
  'CANCELLED',
] as const;

export type PurchaseOrderDbStatus = (typeof PO_DB_STATUSES)[number];

export const PO_DEFAULT_STATUS: PurchaseOrderDbStatus = 'PENDING DISPATCH';

/** Single source of truth for live hospital ↔ vendor PO sync. */
export const PROCUREMENT_PO_TABLE = 'purchase_orders' as const;

export type PurchaseOrderRow = {
  id: string;
  po_number: string;
  vendor_id?: string;
  vendor_name: string;
  vendor_email: string;
  category: string;
  item_description: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  delivery_window: string;
  status: string;
  created_at?: string;
};

export type PurchaseOrderDraft = {
  vendorName: string;
  vendorId?: string;
  vendorEmail?: string;
  category: string;
  itemName: string;
  skuDescription: string;
  quantity: number;
  unitPrice: number;
  deliveryWindow: string;
  status?: PurchaseOrderDbStatus;
  /** Optional pre-allocated PO number from the client (retried on duplicate). */
  poNumber?: string;
};

/** Row shape for `public.vendors` (id, company_name, gstin, email, phone, contact_person, address, hospital_id). */
export type HospitalVendor = {
  id: string;
  hospital_id: string;
  company_name: string;
  gstin?: string;
  email: string;
  phone?: string;
  contact_person?: string;
  address?: string;
  created_at?: string;
};

const VENDOR_SELECT_COLUMNS =
  'id, company_name, gstin, email, phone, contact_person, address, hospital_id, created_at';

const PO_TABLES = ['purchase_orders', 'hospital_supply_orders'] as const;
const LIVE_PO_TABLE = PROCUREMENT_PO_TABLE;
const STOCK_TABLES = ['hospital_medicines', 'hospital_pharmacy_inventory', 'inventory_items'] as const;

/** Legacy seed/demo PO numbers that must never appear in the hospital supply UI. */
const SEEDED_MOCK_PO_NUMBERS = new Set([
  'RH-PO-2026-2002',
  'RH-PO-2026-9894',
  'RH-PO-2026-5374',
]);

const SEEDED_MOCK_VENDOR_NAMES = new Set([
  'MedSupply Dispatch Pvt Ltd',
  'Apex Pharma Distributors',
]);

export function isSeededMockPurchaseOrder(row: Record<string, unknown>): boolean {
  const poNumber = String(row.po_number ?? '').toUpperCase();
  if (SEEDED_MOCK_PO_NUMBERS.has(poNumber)) return true;
  const vendorName = String(row.vendor_name ?? row.vendor ?? '').trim();
  return SEEDED_MOCK_VENDOR_NAMES.has(vendorName);
}

function missingColumn(message: string | null | undefined): string | null {
  const text = String(message ?? '');
  return (
    text.match(/Could not find the '([^']+)' column/i)?.[1] ??
    text.match(/column (?:[\w]+\.)?([a-zA-Z0-9_]+) does not exist/i)?.[1] ??
    null
  );
}

/** Postgres 428C9 — generated or DEFAULT-only columns cannot receive explicit inserts. */
function protectedInsertColumn(message: string | null | undefined): string | null {
  const text = String(message ?? '');
  const quoted = text.match(/cannot insert a non-DEFAULT value into column "([^"]+)"/i)?.[1];
  if (quoted) return quoted;
  if (/428C9|generated column|non-DEFAULT value/i.test(text)) {
    const named = text.match(/column "([^"]+)"/i)?.[1];
    if (named) return named;
    if (/total_amount/i.test(text)) return 'total_amount';
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function normalizePoStatusKey(raw?: string | null): string {
  return String(raw ?? PO_DEFAULT_STATUS)
    .trim()
    .toUpperCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ');
}

/** Map any stored/legacy status to a canonical DB label for display and writes. */
export function formatPurchaseOrderStatus(raw?: string | null): PurchaseOrderDbStatus | string {
  const key = normalizePoStatusKey(raw);
  const labels: Record<string, PurchaseOrderDbStatus> = {
    'PENDING DISPATCH': 'PENDING DISPATCH',
    PENDING: 'PENDING DISPATCH',
    OPEN: 'PENDING DISPATCH',
    ISSUED: 'ISSUED',
    ACCEPTED: 'ACCEPTED',
    INVOICED: 'INVOICED',
    DISPATCHED: 'DISPATCHED',
    'IN TRANSIT': 'DISPATCHED',
    SHIPPED: 'DISPATCHED',
    DELIVERED: 'DELIVERED',
    COMPLETE: 'DELIVERED',
    COMPLETED: 'DELIVERED',
    RECEIVED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
    CANCELED: 'CANCELLED',
    REJECTED: 'CANCELLED',
  };
  if (labels[key]) return labels[key];
  if (key.includes('DELIVER')) return 'DELIVERED';
  if (key.includes('CANCEL') || key.includes('REJECT')) return 'CANCELLED';
  if (key.includes('INVOIC')) return 'INVOICED';
  if (key.includes('DISPATCH') && !key.includes('PENDING')) return 'DISPATCHED';
  if (key.includes('ACCEPT')) return 'ACCEPTED';
  if (key.includes('ISSUE')) return 'ISSUED';
  if (key === 'PAID' || key.includes('SETTLED')) return 'PAID';
  if (PO_DB_STATUSES.includes(key as PurchaseOrderDbStatus)) return key as PurchaseOrderDbStatus;
  return PO_DEFAULT_STATUS;
}

export function toPurchaseOrderDbStatus(raw: string): PurchaseOrderDbStatus {
  const formatted = formatPurchaseOrderStatus(raw);
  if (PO_DB_STATUSES.includes(formatted as PurchaseOrderDbStatus)) {
    return formatted as PurchaseOrderDbStatus;
  }
  return PO_DEFAULT_STATUS;
}

export function normalizePoStatus(raw?: string | null): PurchaseOrderStatus {
  const formatted = formatPurchaseOrderStatus(raw);
  if (formatted === 'DELIVERED') return 'Delivered';
  if (formatted === 'CANCELLED') return 'Cancelled';
  if (formatted === 'ACCEPTED') return 'Accepted';
  if (formatted === 'ISSUED') return 'Issued';
  return 'Issued';
}

/** POs awaiting vendor accept/reject on the vendor portal. */
export function isVendorActionablePurchaseOrder(status?: string | null): boolean {
  const formatted = formatPurchaseOrderStatus(status);
  return formatted === 'PENDING DISPATCH' || formatted === 'ISSUED';
}

/** POs in the initial dispatch queue (metric card + mark-delivered eligibility). */
export function isPendingPurchaseOrder(status?: string | null): boolean {
  return isVendorActionablePurchaseOrder(status);
}

/** Open POs on the hospital supply desk (not yet delivered or cancelled). */
export function isOpenPurchaseOrder(status?: string | null): boolean {
  const formatted = formatPurchaseOrderStatus(status);
  return ['PENDING DISPATCH', 'ISSUED', 'ACCEPTED', 'INVOICED', 'DISPATCHED'].includes(formatted);
}

export function canMarkPurchaseOrderDelivered(status?: string | null): boolean {
  return isOpenPurchaseOrder(status);
}

export function getPurchaseOrderStatusBadgeClass(status?: string | null): string {
  const label = formatPurchaseOrderStatus(status);
  if (label === 'PENDING DISPATCH' || label === 'ISSUED') {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
  }
  if (label === 'ACCEPTED') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
  }
  if (label === 'INVOICED' || label === 'DISPATCHED') {
    return 'border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300';
  }
  if (label === 'DELIVERED') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
  }
  if (label === 'CANCELLED') {
    return 'border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
  }
  if (label === 'PAID') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
  }
  return 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
}

export function resolvePurchaseOrderTotal(row: Record<string, unknown>): number {
  const quantity = Math.max(1, Number(row.quantity ?? row.quantity_ordered ?? 1) || 1);
  const unitPrice = Math.max(0, Number(row.unit_price ?? row.unit_cost ?? row.price ?? 0) || 0);
  const explicit = Number(
    row.total_amount ?? row.amount ?? row.line_total ?? row.order_total ?? row.grand_total ?? NaN,
  );
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  return roundCurrency(unitPrice * quantity);
}

export function mapPurchaseOrderRow(row: Record<string, unknown>): PurchaseOrderRow {
  const quantity = Math.max(0, Number(row.quantity ?? row.quantity_ordered ?? 0) || 0);
  const unitPrice = Math.max(0, Number(row.unit_price ?? row.unit_cost ?? row.price ?? 0) || 0);
  const total = resolvePurchaseOrderTotal(row);
  return {
    id: String(row.id ?? ''),
    po_number: String(row.po_number ?? row.id ?? 'PO-PENDING'),
    vendor_id: row.vendor_id ? String(row.vendor_id) : undefined,
    vendor_name: String(row.vendor_name ?? row.vendor ?? 'Supplier'),
    vendor_email: String(row.vendor_email ?? row.email ?? row.rep_email ?? ''),
    category: String(row.category ?? row.vendor_category ?? 'Pharmaceuticals'),
    item_description: String(
      row.item_description ?? row.item_name ?? row.item_details ?? row.items ?? 'Medical Supplies',
    ),
    sku: String(row.sku ?? row.sku_description ?? ''),
    quantity: quantity > 0 ? quantity : 1,
    unit_price: unitPrice,
    total_amount: total,
    delivery_window: String(row.delivery_window ?? row.delivery_timeline ?? row.expected_delivery ?? ''),
    status: formatPurchaseOrderStatus(String(row.status ?? PO_DEFAULT_STATUS)),
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

export function logSupabaseQueryError(scope: string, error: unknown): void {
  if (!error || typeof error !== 'object') {
    console.error(`[${scope}]`, error);
    return;
  }
  const record = error as { message?: string; details?: string; hint?: string; code?: string };
  console.error(`[${scope}] Supabase query error:`, {
    message: record.message,
    details: record.details,
    hint: record.hint,
    code: record.code,
  });
}

/** PostgREST errors are plain objects — not instanceof Error. */
export function extractSupabaseErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (error && typeof error === 'object') {
    const record = error as { message?: unknown; details?: unknown };
    const message = String(record.message ?? '').trim();
    if (message) return message;
    const details = String(record.details ?? '').trim();
    if (details) return details;
  }
  return fallback;
}

export const VENDOR_PORTAL_PO_SELECT =
  'id, po_number, item_description, quantity, total_amount, status, created_at, vendor_id, vendor_name, hospital_id';

function purchaseOrderMatchesVendor(
  row: Record<string, unknown>,
  vendor: { id?: string; email?: string; company_name?: string },
): boolean {
  const vendorUuid = resolvePoVendorId(vendor.id);
  const rowVendorId = String(row.vendor_id ?? '').trim();
  if (vendorUuid && rowVendorId === vendorUuid) return true;

  const vendorIdRaw = String(vendor.id ?? '').trim();
  if (vendorIdRaw && rowVendorId === vendorIdRaw) return true;

  const companyName = String(vendor.company_name ?? '').trim().toLowerCase();
  const rowVendorName = String(row.vendor_name ?? row.vendor ?? '').trim().toLowerCase();
  if (companyName && rowVendorName && rowVendorName === companyName) return true;

  const email = String(vendor.email ?? '').trim().toLowerCase();
  if (email) {
    for (const key of ['vendor_email', 'email', 'rep_email'] as const) {
      const candidate = String(row[key] ?? '').trim().toLowerCase();
      if (candidate && candidate === email) return true;
    }
  }

  return false;
}

async function fetchAllPurchaseOrderRows(supabase: SupabaseClient): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from(LIVE_PO_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (!error && Array.isArray(data)) {
    return data as Record<string, unknown>[];
  }

  logSupabaseQueryError('fetchAllPurchaseOrderRows', error);
  return [];
}

export function mapHospitalVendor(row: Record<string, unknown>): HospitalVendor {
  return {
    id: String(row.id ?? ''),
    hospital_id: String(row.hospital_id ?? ''),
    company_name: String(row.company_name ?? '').trim(),
    gstin: row.gstin ? String(row.gstin).trim() : undefined,
    email: String(row.email ?? '').trim().toLowerCase(),
    phone: row.phone ? String(row.phone).trim() : undefined,
    contact_person: row.contact_person ? String(row.contact_person).trim() : undefined,
    address: row.address ? String(row.address) : undefined,
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

export function isEligibleHospitalVendor(vendor: HospitalVendor): boolean {
  return Boolean(vendor.company_name.trim() && vendor.email.trim());
}

export function formatVendorOptionLabel(vendor: HospitalVendor): string {
  const name = vendor.company_name.trim();
  const gstin = vendor.gstin?.trim();
  if (gstin && gstin !== VENDOR_GSTIN_FALLBACK) {
    return `${name} (${gstin})`;
  }
  return name;
}

function stripNonUuidIdFields(row: Record<string, unknown>): boolean {
  let changed = false;
  for (const key of Object.keys(row)) {
    if (key === 'hospital_id') continue;
    const value = row[key];
    if (typeof value === 'string' && value.length > 0 && !isUuidValue(value) && /(^id$|_id$)/i.test(key)) {
      delete row[key];
      changed = true;
    }
  }
  return changed;
}

async function insertWithColumnRetry(
  supabase: SupabaseClient,
  table: string,
  payload: Record<string, unknown>,
): Promise<{ data: Record<string, unknown> | null; errorMessage: string | null }> {
  const row = { ...payload };
  let { data, error } = await supabase.from(table).insert([row]).select('*').maybeSingle();
  let attempts = 0;
  while (error && attempts < 14) {
    const column = missingColumn(error.message);
    const protectedColumn = protectedInsertColumn(error.message);
    if (column && column in row) {
      delete row[column];
    } else if (protectedColumn && protectedColumn in row) {
      delete row[protectedColumn];
    } else if (isUuidColumnError(error.message) && stripNonUuidIdFields(row)) {
      // HOSP-01 must never be written into UUID columns such as vendor_id.
    } else {
      break;
    }
    attempts += 1;
    const retry = await supabase.from(table).insert([row]).select('*').maybeSingle();
    data = retry.data;
    error = retry.error;
  }
  if (error) return { data: null, errorMessage: error.message };
  return { data: data ? asRecord(data) : row, errorMessage: null };
}

async function selectHospitalRows(
  supabase: SupabaseClient,
  table: string,
  hospitalId: string,
): Promise<Record<string, unknown>[]> {
  const aliasIds = hospitalIdQueryValues(hospitalId);

  const queryByHospitalIds = async (
    ids: string[],
  ): Promise<{ error: string | null; rows: Record<string, unknown>[] }> => {
    if (ids.length === 0) return { error: null, rows: [] };
    const result = await supabase
      .from(table)
      .select('*')
      .in('hospital_id', ids)
      .order('created_at', { ascending: false });
    if (result.error) {
      return { error: result.error.message, rows: [] };
    }
    return { error: null, rows: (result.data ?? []) as Record<string, unknown>[] };
  };

  let { error, rows } = await queryByHospitalIds(aliasIds);

  if (error && isUuidColumnError(error)) {
    const uuidIds = aliasIds.filter(isUuidValue);
    ({ error, rows } = await queryByHospitalIds(uuidIds));
  }

  if (!error && rows.length > 0) {
    return rows;
  }

  // Legacy single-id fallback for schemas that reject `.in()` on mixed types.
  if (error || rows.length === 0) {
    for (const id of aliasIds) {
      const single = await supabase
        .from(table)
        .select('*')
        .eq('hospital_id', id)
        .order('created_at', { ascending: false });
      if (!single.error && Array.isArray(single.data) && single.data.length > 0) {
        const merged = [...rows];
        const seen = new Set(rows.map((row) => String(row.id ?? '')));
        for (const row of single.data as Record<string, unknown>[]) {
          const key = String(row.id ?? '');
          if (key && seen.has(key)) continue;
          if (key) seen.add(key);
          merged.push(row);
        }
        rows = merged;
      }
    }
  }

  return rows;
}

const PO_NUMBER_PATTERN = /^PO-(\d{4})-(\d+)$/i;

/** High-entropy PO number — timestamp tail + random suffix to avoid collisions. */
export function generateEntropyPoNumber(): string {
  const year = new Date().getFullYear();
  const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
  return `PO-${year}-${uniqueSuffix}`;
}

function isDuplicatePoNumberError(message: string | null | undefined): boolean {
  const text = String(message ?? '');
  return /duplicate|unique|po_number/i.test(text);
}

async function collectExistingPoSequenceMax(
  supabase: SupabaseClient,
  year: number,
): Promise<number> {
  const prefix = `PO-${year}-`;
  const pattern = new RegExp(`^PO-${year}-(\\d+)$`, 'i');
  let highest = 0;

  for (const table of PO_TABLES) {
    const { data, error } = await supabase
      .from(table)
      .select('po_number')
      .ilike('po_number', `${prefix}%`);

    if (error || !Array.isArray(data)) continue;

    for (const row of data) {
      const match = String(row.po_number ?? '').match(pattern);
      if (match) highest = Math.max(highest, Number(match[1]));
    }
  }

  return highest;
}

/** Next sequential PO number scoped globally (po_number is unique across all hospitals). */
export async function nextPurchaseOrderNumber(
  supabase: SupabaseClient,
  _hospitalId?: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const highest = await collectExistingPoSequenceMax(supabase, year);
  return `PO-${year}-${String(highest + 1).padStart(4, '0')}`;
}

export async function allocatePurchaseOrderNumber(
  supabase: SupabaseClient,
  hospitalId?: string,
  preferred?: string,
): Promise<string> {
  const trimmed = preferred?.trim();
  if (trimmed && PO_NUMBER_PATTERN.test(trimmed)) return trimmed.toUpperCase();
  return nextPurchaseOrderNumber(supabase, hospitalId);
}

function derivedVendorEmail(vendorName: string, explicit?: string): string {
  if (explicit?.trim()) return explicit.trim().toLowerCase();
  const slug = vendorName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '') || 'vendor';
  return `${slug}@supplier.com`;
}

function roundCurrency(value: number): number {
  return parseFloat(value.toFixed(2));
}

function parsePoQuantity(value: unknown): number {
  return Math.max(1, parseInt(String(value ?? '').trim(), 10) || 1);
}

function parsePoUnitPrice(value: unknown): number {
  return Math.max(0, parseFloat(String(value ?? '').trim()) || 0);
}

/** FK-safe vendor_id: valid UUID or null — never empty string or tenant codes. */
export function resolvePoVendorId(vendorId?: string | null): string | null {
  const value = String(vendorId ?? '').trim();
  return isUuidValue(value) ? value : null;
}

function sanitizeVendorForeignKeys(payload: Record<string, unknown>): void {
  payload.vendor_id = resolvePoVendorId(
    typeof payload.vendor_id === 'string' ? payload.vendor_id : null,
  );
}

export async function createPurchaseOrder(
  supabase: SupabaseClient,
  hospitalId: string,
  hospitalName: string,
  draft: PurchaseOrderDraft,
): Promise<{ ok: boolean; order?: PurchaseOrderRow; error?: string }> {
  const quantity = parsePoQuantity(draft.quantity);
  const unitPrice = parsePoUnitPrice(draft.unitPrice);
  if (!draft.vendorName.trim() || !draft.itemName.trim()) {
    return { ok: false, error: 'Vendor and item name are required' };
  }
  if (quantity < 1) return { ok: false, error: 'Quantity must be at least 1' };
  if (unitPrice <= 0) return { ok: false, error: 'Unit price must be greater than 0' };

  const resolvedHospitalId =
    (await resolveVendorHospitalId(supabase, hospitalId)) ||
    (isUuidValue(hospitalId) ? hospitalId.trim() : null);
  const hospitalIdForWrite = resolvedHospitalId ?? (hospitalId.trim() || REGAL_HOSPITAL_CODE);

  const total = roundCurrency(unitPrice * quantity);
  const itemDescription = draft.itemName.trim();
  const skuDescription = draft.skuDescription.trim();
  const vendorEmail = draft.vendorEmail?.trim().toLowerCase() || derivedVendorEmail(draft.vendorName, draft.vendorEmail);
  const rawVendorId = String(draft.vendorId ?? '').trim();
  const vendorId = resolvePoVendorId(rawVendorId);

  const payload: Record<string, unknown> = {
    hospital_id: hospitalIdForWrite,
    hospital_name: hospitalName,
    hospital_code: REGAL_HOSPITAL_CODE,
    facility_code: REGAL_FACILITY_CODE,
    vendor_id: vendorId,
    vendor_name: draft.vendorName.trim(),
    vendor_email: vendorEmail,
    vendor_category: draft.category || 'General Supplies',
    category: draft.category || 'General Supplies',
    item_description: itemDescription,
    item_name: itemDescription,
    quantity,
    unit_price: unitPrice,
    total_amount: total,
    delivery_timeline: draft.deliveryWindow || '3-5 Days Standard',
    status: draft.status ?? PO_DEFAULT_STATUS,
  };
  if (skuDescription) {
    payload.sku = skuDescription;
    payload.sku_description = skuDescription;
    payload.item_details = `${itemDescription} — ${skuDescription}`;
  }
  sanitizeVendorForeignKeys(payload);

  let primary: { data: Record<string, unknown> | null; errorMessage: string | null } | null = null;
  let allocatedPoNumber = await allocatePurchaseOrderNumber(
    supabase,
    hospitalIdForWrite,
    draft.poNumber,
  );

  for (let attempt = 0; attempt < 8; attempt += 1) {
    payload.po_number = allocatedPoNumber;
    primary = await insertWithColumnRetry(supabase, PROCUREMENT_PO_TABLE, payload);
    if (!primary.errorMessage) break;

    if (!isDuplicatePoNumberError(primary.errorMessage)) {
      return { ok: false, error: primary.errorMessage };
    }

    allocatedPoNumber =
      attempt === 0
        ? await nextPurchaseOrderNumber(supabase, hospitalIdForWrite)
        : generateEntropyPoNumber();
  }

  if (!primary || primary.errorMessage) {
    return {
      ok: false,
      error: primary?.errorMessage ?? 'Could not allocate a unique purchase order number.',
    };
  }

  const saved = primary.data ?? { ...payload, po_number: allocatedPoNumber };
  if (saved.total_amount == null && saved.unit_price != null && saved.quantity != null) {
    saved.total_amount = roundCurrency(Number(saved.unit_price) * Number(saved.quantity));
  }
  return { ok: true, order: mapPurchaseOrderRow(saved) };
}

function buildHospitalScopeOrFilter(ids: string[]): string {
  const parts = ids.filter(Boolean).map((id) => `hospital_id.eq.${id}`);
  parts.push('hospital_id.is.null');
  return parts.join(',');
}

async function resolveVendorQueryHospitalIds(
  supabase: SupabaseClient,
  hospitalId: string,
): Promise<string[]> {
  const values = new Set<string>();
  const trimmed = hospitalId.trim();
  if (trimmed) values.add(trimmed);
  values.add(REGAL_HOSPITAL_CODE);
  values.add('HOSP-01');
  values.add('ROOT-HQ');

  const resolved = await resolveVendorHospitalId(supabase, hospitalId);
  if (resolved) values.add(resolved);

  return Array.from(values);
}

/** Governance vault + procurement vendor directory rows (no joins). */
export async function fetchGovernanceVendorRows(
  supabase: SupabaseClient,
  hospitalId: string,
): Promise<Record<string, unknown>[]> {
  return fetchVendorDirectoryRows(supabase, hospitalId);
}

async function fetchVendorDirectoryRows(
  supabase: SupabaseClient,
  hospitalId: string,
): Promise<Record<string, unknown>[]> {
  const tenantCode = hospitalId.trim() || REGAL_HOSPITAL_CODE;
  const scopeFilter = `hospital_id.eq.${tenantCode},hospital_id.eq.HOSP-01,hospital_id.is.null`;

  const scoped = await supabase
    .from('vendors')
    .select(VENDOR_SELECT_COLUMNS)
    .or(scopeFilter)
    .order('created_at', { ascending: false });

  if (!scoped.error && Array.isArray(scoped.data)) {
    return scoped.data as Record<string, unknown>[];
  }

  const fallback = await supabase
    .from('vendors')
    .select(VENDOR_SELECT_COLUMNS)
    .order('created_at', { ascending: false });

  if (fallback.error) {
    console.error('Vendor directory fetch error:', fallback.error.message);
    return [];
  }

  return (fallback.data ?? []) as Record<string, unknown>[];
}

/** Fetch registered suppliers for procurement dropdowns (flexible hospital_id matching). */
export async function fetchRegisteredVendors(
  supabase: SupabaseClient,
  hospitalId: string,
): Promise<HospitalVendor[]> {
  const rows = await fetchVendorDirectoryRows(supabase, hospitalId);

  const seen = new Set<string>();
  const vendors: HospitalVendor[] = [];

  for (const row of rows) {
    const mapped = mapHospitalVendor(row);
    const key = mapped.id || `${mapped.company_name}:${mapped.email}`;
    if (!isEligibleHospitalVendor(mapped) || !key || seen.has(key)) continue;
    seen.add(key);
    vendors.push(mapped);
  }

  return vendors;
}

export async function fetchHospitalVendors(
  supabase: SupabaseClient,
  hospitalId: string,
): Promise<HospitalVendor[]> {
  return fetchRegisteredVendors(supabase, hospitalId);
}

export type HospitalVendorDraft = {
  company_name: string;
  email: string;
  gstin?: string;
  contact_person?: string;
  phone?: string;
  address?: string;
  passcode?: string;
  portal_pin?: string;
  /** Legacy form alias */
  vendor_email?: string;
  representative_name?: string;
};

export type HospitalVendorRegistrationDraft = HospitalVendorDraft;

function sanitizeVendorPhone(raw?: string | null): string | null {
  const digits = String(raw ?? '').replace(/\D/g, '').slice(0, 10);
  return digits.length > 0 ? digits : null;
}

function resolveVendorGstin(raw?: string | null): string {
  const trimmed = String(raw ?? '').trim();
  return trimmed || VENDOR_GSTIN_FALLBACK;
}

function buildVendorRegistrationPayload(
  hospitalId: string,
  draft: HospitalVendorRegistrationDraft,
): {
  vendorsPayload: Record<string, unknown>;
} | { error: string } {
  const company = draft.company_name.trim() || 'Vendor Partner';
  const email = (draft.email ?? draft.vendor_email ?? '').trim().toLowerCase();
  const repName = (draft.contact_person ?? draft.representative_name ?? '').trim() || null;
  const phone = sanitizeVendorPhone(draft.phone);
  const gstin = resolveVendorGstin(draft.gstin);
  const address = draft.address?.trim() || null;

  if (!email) return { error: 'Official email is required.' };

  const vendorsPayload: Record<string, unknown> = {
    hospital_id: hospitalId,
    company_name: company,
    email,
    gstin,
    contact_person: repName,
    phone,
  };
  if (address) vendorsPayload.address = address;

  return { vendorsPayload };
}

export function resolveVendorPasscode(draft: HospitalVendorRegistrationDraft): string {
  return (draft.passcode ?? draft.portal_pin ?? '').trim();
}

export function isVendorCredentialRole(raw?: string | null): boolean {
  const value = String(raw ?? '')
    .trim()
    .toLowerCase();
  return value === 'vendor' || value.includes('supplier');
}

export function readStoredCredentialPasscode(row: Record<string, unknown>): string {
  for (const key of ['passcode', 'temporary_passcode', 'passcode_key', 'portal_pin', 'pin'] as const) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

/** Governance vault vendor code — never surface GSTIN fallback placeholders as ID. */
export function formatVendorDirectoryCode(
  vendorRow?: Record<string, unknown> | null,
  credentialRow?: Record<string, unknown> | null,
): string {
  const employeeId = String(credentialRow?.employee_id ?? '').trim();
  if (employeeId) return employeeId;

  const vendorId = String(vendorRow?.id ?? credentialRow?.id ?? '').trim();
  if (vendorId) {
    return `VND-${vendorId.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
  }

  return 'VND-PENDING';
}

async function syncVendorPortalCredential(
  supabase: SupabaseClient,
  hospitalId: string,
  draft: HospitalVendorRegistrationDraft,
  vendorRow?: Record<string, unknown> | null,
): Promise<{ ok: boolean; error?: string }> {
  const email = (draft.email ?? draft.vendor_email ?? '').trim().toLowerCase();
  const company = draft.company_name.trim() || 'Vendor Partner';
  const contact = (draft.contact_person ?? draft.representative_name ?? '').trim();
  const passcode = resolveVendorPasscode(draft);

  if (!email) return { ok: false, error: 'Vendor email is required for portal credentials.' };
  if (!passcode) return { ok: false, error: 'Vendor portal passcode is required.' };

  const vendorId = String(vendorRow?.id ?? '').trim();
  const employeeId = vendorId
    ? `VND-${vendorId.replace(/-/g, '').slice(0, 6).toUpperCase()}`
    : `VND-${Math.floor(100000 + Math.random() * 900000)}`;

  const payload: Record<string, unknown> = {
    hospital_id: hospitalId.trim() || REGAL_HOSPITAL_CODE,
    hospital_name: REGAL_HOSPITAL_NAME,
    employee_id: employeeId,
    email,
    full_name: contact ? `${contact} (${company})` : company,
    role: 'vendor',
    department: 'Supplies & Procurement',
    passcode,
    passcode_key: passcode,
    temporary_passcode: passcode,
    phone: sanitizeVendorPhone(draft.phone),
    portal_access: '/vendor/portal/dashboard',
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const existingCredential = await supabase
    .from(HOSPITAL_USER_CREDENTIALS_TABLE)
    .select('id, employee_id')
    .eq('email', email)
    .maybeSingle();

  if (!existingCredential.error && existingCredential.data?.employee_id) {
    payload.employee_id = String(existingCredential.data.employee_id);
  }

  let { data, error } = await supabase
    .from(HOSPITAL_USER_CREDENTIALS_TABLE)
    .upsert(payload, { onConflict: 'email' })
    .select('*')
    .maybeSingle();

  if (error && /employee_id|unique|duplicate/i.test(error.message)) {
    delete payload.employee_id;
    const retry = await supabase
      .from(HOSPITAL_USER_CREDENTIALS_TABLE)
      .upsert(payload, { onConflict: 'email' })
      .select('*')
      .maybeSingle();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error('Vendor credential sync error:', error.message);
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: 'Vendor credential sync completed without a persisted row.' };
  }

  return { ok: true };
}

async function upsertVendorProfile(
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
): Promise<{ data: Record<string, unknown> | null; errorMessage: string | null }> {
  const email = String(payload.email ?? '')
    .trim()
    .toLowerCase();

  const upsertResult = await supabase
    .from('vendors')
    .upsert(payload, { onConflict: 'email' })
    .select('*')
    .maybeSingle();

  if (!upsertResult.error && upsertResult.data) {
    return { data: asRecord(upsertResult.data), errorMessage: null };
  }

  if (email) {
    const existing = await supabase.from('vendors').select('id').eq('email', email).maybeSingle();
    if (!existing.error && existing.data?.id) {
      const updated = await supabase
        .from('vendors')
        .update(payload)
        .eq('id', existing.data.id)
        .select('*')
        .maybeSingle();
      if (!updated.error && updated.data) {
        return { data: asRecord(updated.data), errorMessage: null };
      }
      if (updated.error) {
        return { data: null, errorMessage: updated.error.message };
      }
    }
  }

  return insertWithColumnRetry(supabase, 'vendors', payload);
}

function duplicateVendorMessage(message: string): boolean {
  return /duplicate|unique|already exists/i.test(message);
}

/** Resolve tenant code (HOSP-01) or UUID to a hospital_id suitable for vendor writes. */
async function resolveVendorHospitalId(
  supabase: SupabaseClient,
  hospitalId: string,
): Promise<string | null> {
  const trimmed = hospitalId.trim();
  if (!trimmed) return resolveHospitalUuid(supabase, REGAL_HOSPITAL_CODE);

  if (isHospitalUuid(trimmed)) return trimmed;

  const fromContext = await resolveHospitalUuid(supabase, trimmed);
  if (fromContext) return fromContext;

  const filters = [`hospital_code.eq.${trimmed}`, `id.eq.${trimmed}`];
  if (isHospitalCode(trimmed) || trimmed === REGAL_HOSPITAL_CODE) {
    filters.push(`hospital_code.eq.${REGAL_HOSPITAL_CODE}`);
  }

  const { data: hospitalRow, error } = await supabase
    .from('hospitals')
    .select('id')
    .or(filters.join(','))
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!error && hospitalRow?.id) {
    const resolved = String(hospitalRow.id);
    if (isHospitalUuid(resolved)) return resolved;
  }

  const tenantLookup = await supabase
    .from('hospital_tenants')
    .select('hospital_id')
    .or(`hospital_id.eq.${trimmed},hospital_code.eq.${trimmed}`)
    .limit(1)
    .maybeSingle();

  const tenantHospitalId = tenantLookup.data?.hospital_id;
  if (tenantHospitalId && isHospitalUuid(String(tenantHospitalId))) {
    return String(tenantHospitalId);
  }

  return resolveHospitalUuid(supabase, REGAL_HOSPITAL_CODE);
}

/** Registers a vendor in public.vendors and syncs hospital_user_credentials (role=vendor). */
export async function saveHospitalVendorRecord(
  supabase: SupabaseClient,
  hospitalId: string,
  draft: HospitalVendorRegistrationDraft,
): Promise<{ ok: boolean; error?: string; data?: Record<string, unknown> }> {
  const hospitalIdForWrite = hospitalId.trim() || REGAL_HOSPITAL_CODE;
  const passcode = resolveVendorPasscode(draft);
  if (!passcode) {
    return { ok: false, error: 'Vendor portal passcode is required.' };
  }

  const built = buildVendorRegistrationPayload(hospitalIdForWrite, draft);
  if ('error' in built) return { ok: false, error: built.error };

  const { vendorsPayload } = built;

  const vendorsResult = await upsertVendorProfile(supabase, vendorsPayload);
  if (vendorsResult.errorMessage) {
    const vendorsErr = vendorsResult.errorMessage;
    console.error('Supabase vendor insert error (vendors):', vendorsErr);

    if (duplicateVendorMessage(vendorsErr)) {
      return { ok: false, error: 'A supplier with this email already exists.' };
    }

    return { ok: false, error: vendorsErr };
  }

  const savedVendor = vendorsResult.data ?? vendorsPayload;
  const credentialSync = await syncVendorPortalCredential(
    supabase,
    hospitalIdForWrite,
    draft,
    savedVendor,
  );

  if (!credentialSync.ok) {
    return {
      ok: false,
      error:
        credentialSync.error ??
        'Vendor saved, but portal login credential could not be synchronized.',
      data: savedVendor,
    };
  }

  return {
    ok: true,
    data: savedVendor,
  };
}

export async function createHospitalVendor(
  supabase: SupabaseClient,
  hospitalId: string,
  draft: HospitalVendorDraft,
): Promise<{ ok: boolean; vendor?: HospitalVendor; error?: string }> {
  const result = await saveHospitalVendorRecord(supabase, hospitalId, draft);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return {
    ok: true,
    vendor: mapHospitalVendor(result.data ?? {}),
  };
}

export async function fetchPurchaseOrders(
  supabase: SupabaseClient,
  hospitalId: string,
  options?: { vendorId?: string | null },
): Promise<PurchaseOrderRow[]> {
  const filterIds = await resolveVendorQueryHospitalIds(supabase, hospitalId);
  let rows: Record<string, unknown>[] = [];

  const scoped = await supabase
    .from(LIVE_PO_TABLE)
    .select('*')
    .or(buildHospitalScopeOrFilter(filterIds))
    .order('created_at', { ascending: false });

  if (!scoped.error && Array.isArray(scoped.data)) {
    rows = scoped.data as Record<string, unknown>[];
  } else if (scoped.error && isUuidColumnError(scoped.error.message)) {
    const uuidOnly = filterIds.filter(isUuidValue);
    if (uuidOnly.length > 0) {
      const uuidScoped = await supabase
        .from(LIVE_PO_TABLE)
        .select('*')
        .in('hospital_id', uuidOnly)
        .order('created_at', { ascending: false });
      if (!uuidScoped.error && Array.isArray(uuidScoped.data)) {
        rows = uuidScoped.data as Record<string, unknown>[];
      }
    }
  }

  if (rows.length === 0) {
    const fallback = await supabase
      .from(LIVE_PO_TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    if (!fallback.error && Array.isArray(fallback.data)) {
      rows = fallback.data as Record<string, unknown>[];
    }
  }

  const vendorUuid = resolvePoVendorId(options?.vendorId);
  const vendorIdRaw = String(options?.vendorId ?? '').trim();

  return rows
    .filter((row) => !isSeededMockPurchaseOrder(row))
    .filter((row) => {
      if (!vendorUuid && !vendorIdRaw) return true;
      if (vendorUuid && String(row.vendor_id ?? '') === vendorUuid) return true;
      return vendorIdRaw ? String(row.vendor_id ?? '') === vendorIdRaw : false;
    })
    .map((row) => mapPurchaseOrderRow(row))
    .filter((order) => order.po_number)
    .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')));
}

export function vendorPurchaseOrderActionStatus(action: 'accept' | 'reject'): PurchaseOrderDbStatus {
  return action === 'accept' ? 'ACCEPTED' : 'CANCELLED';
}

export async function applyVendorPurchaseOrderAction(
  supabase: SupabaseClient,
  orderId: string,
  action: 'accept' | 'reject',
): Promise<{ ok: boolean; order?: PurchaseOrderRow; error?: string }> {
  return updatePurchaseOrderStatus(supabase, orderId, vendorPurchaseOrderActionStatus(action));
}

export async function updatePurchaseOrderStatus(
  supabase: SupabaseClient,
  orderId: string,
  newStatus: string,
): Promise<{ ok: boolean; order?: PurchaseOrderRow; error?: string }> {
  if (!orderId) return { ok: false, error: 'Missing purchase order id' };

  const dbStatus = toPurchaseOrderDbStatus(newStatus);
  let { data, error } = await supabase
    .from(PROCUREMENT_PO_TABLE)
    .update({
      status: dbStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select('*')
    .maybeSingle();

  if (error && /updated_at|column/i.test(error.message)) {
    const retry = await supabase
      .from(PROCUREMENT_PO_TABLE)
      .update({ status: dbStatus })
      .eq('id', orderId)
      .select('*')
      .maybeSingle();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error(`Failed to update ${PROCUREMENT_PO_TABLE} status:`, error);
    return { ok: false, error: error.message };
  }

  const row = data ? asRecord(data) : { id: orderId, status: dbStatus };
  return { ok: true, order: mapPurchaseOrderRow(row) };
}

export async function fetchVendorPurchaseOrders(
  supabase: SupabaseClient,
  vendor: { id?: string; email?: string; company_name?: string },
): Promise<PurchaseOrderRow[]> {
  const hasIdentity = Boolean(
    String(vendor.id ?? '').trim() ||
      String(vendor.email ?? '').trim() ||
      String(vendor.company_name ?? '').trim(),
  );
  if (!hasIdentity) return [];

  const seen = new Set<string>();
  const orders: PurchaseOrderRow[] = [];

  const ingest = (rows: Record<string, unknown>[]) => {
    for (const row of rows) {
      if (isSeededMockPurchaseOrder(row)) continue;
      if (hasIdentity && !purchaseOrderMatchesVendor(row, vendor)) continue;
      const mapped = mapPurchaseOrderRow(row);
      const key = mapped.id || mapped.po_number;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      orders.push(mapped);
    }
  };

  if (vendor.id && isUuidValue(vendor.id)) {
    const byId = await supabase
      .from(LIVE_PO_TABLE)
      .select('*')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false });
    if (!byId.error && Array.isArray(byId.data)) {
      ingest(byId.data as Record<string, unknown>[]);
    } else if (byId.error) {
      logSupabaseQueryError('fetchVendorPurchaseOrders.vendor_id', byId.error);
    }
  }

  if (vendor.company_name) {
    const byName = await supabase
      .from(LIVE_PO_TABLE)
      .select('*')
      .eq('vendor_name', vendor.company_name.trim())
      .order('created_at', { ascending: false });
    if (!byName.error && Array.isArray(byName.data)) {
      ingest(byName.data as Record<string, unknown>[]);
    } else if (byName.error) {
      logSupabaseQueryError('fetchVendorPurchaseOrders.vendor_name', byName.error);
    }
  }

  if (orders.length === 0) {
    const allRows = await fetchAllPurchaseOrderRows(supabase);
    ingest(allRows);
  }

  return orders.sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')));
}

export async function provisionHospitalVendor(
  supabase: SupabaseClient,
  hospitalId: string,
  input: { company: string; email: string; contact_person?: string; phone?: string; gstin?: string },
): Promise<{ ok: boolean; vendor?: HospitalVendor; error?: string }> {
  return createHospitalVendor(supabase, hospitalId, {
    company_name: input.company,
    email: input.email,
    contact_person: input.contact_person,
    phone: input.phone,
    gstin: input.gstin,
  });
}

export async function toggleHospitalVendorStatus(
  _supabase: SupabaseClient,
  _vendorId: string,
  _currentStatus: string,
): Promise<{ ok: boolean; error?: string }> {
  return { ok: false, error: 'Vendor suspend/resume is not supported on public.vendors.' };
}

async function incrementStockRow(
  supabase: SupabaseClient,
  table: string,
  hospitalId: string,
  itemName: string,
  sku: string,
  quantity: number,
): Promise<boolean> {
  const matchers: Array<{ column: string; value: string }> = [];
  if (sku) matchers.push({ column: 'sku', value: sku });
  if (itemName) {
    matchers.push({ column: 'name', value: itemName });
    matchers.push({ column: 'item_name', value: itemName });
  }

  for (const matcher of matchers) {
    const existing = await supabase
      .from(table)
      .select('*')
      .eq('hospital_id', hospitalId)
      .ilike(matcher.column, matcher.value)
      .limit(1)
      .maybeSingle();
    if (existing.error || !existing.data) continue;

    const row = asRecord(existing.data);
    const current = Number(row.current_stock ?? row.stock ?? row.quantity_in_stock ?? 0);
    const nextStock = current + quantity;
    const patch: Record<string, unknown> = {
      current_stock: nextStock,
      stock: nextStock,
      quantity_in_stock: nextStock,
      status: nextStock > 0 ? 'In Stock' : 'Out of Stock',
    };
    const updated = await supabase.from(table).update(patch).eq('id', row.id);
    if (!updated.error) return true;
    const column = missingColumn(updated.error.message);
    if (column && column in patch) {
      delete patch[column];
      const retry = await supabase.from(table).update(patch).eq('id', row.id);
      if (!retry.error) return true;
    }
  }

  const insertPayload: Record<string, unknown> = {
    hospital_id: hospitalId,
    name: itemName,
    item_name: itemName,
    sku: sku || `SKU-${itemName.slice(0, 8).toUpperCase().replace(/\s+/g, '')}`,
    category: 'Pharmaceuticals',
    current_stock: quantity,
    stock: quantity,
    quantity_in_stock: quantity,
    reorder_level: 10,
    status: 'In Stock',
  };
  const inserted = await insertWithColumnRetry(supabase, table, insertPayload);
  return !inserted.errorMessage;
}

function isMissingColumnError(message: string | null | undefined): boolean {
  const text = String(message ?? '');
  return Boolean(missingColumn(text)) || /schema cache|could not find the/i.test(text);
}

async function updateDeliveredPurchaseOrderRow(
  client: SupabaseClient,
  table: string,
  filters: { id?: string; po_number?: string; hospital_id?: string },
): Promise<{ ok: boolean; error?: string }> {
  const timestamp = new Date().toISOString();
  const payload: Record<string, string> = {
    status: 'DELIVERED',
    delivered_at: timestamp,
    updated_at: timestamp,
  };

  const runUpdate = async (patch: Record<string, string>) => {
    let query = client.from(table).update(patch);
    if (filters.id) {
      query = query.eq('id', filters.id);
    } else if (filters.po_number && filters.hospital_id) {
      query = query.eq('po_number', filters.po_number).eq('hospital_id', filters.hospital_id);
    } else {
      return { error: { message: 'Missing purchase order match keys' } };
    }
    return query;
  };

  let result = await runUpdate(payload);
  let guard = 0;

  while (result.error && guard < 4) {
    guard += 1;
    if (!isMissingColumnError(result.error.message)) {
      return { ok: false, error: result.error.message };
    }

    const column = missingColumn(result.error.message);
    if (column && column in payload) {
      delete payload[column];
    } else if ('delivered_at' in payload) {
      delete payload.delivered_at;
    } else if ('updated_at' in payload) {
      delete payload.updated_at;
    } else {
      return { ok: false, error: result.error.message };
    }

    payload.status = 'DELIVERED';
    result = await runUpdate(payload);
  }

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  return { ok: true };
}

export async function markPurchaseOrderDelivered(
  supabase: SupabaseClient,
  hospitalId: string,
  order: PurchaseOrderRow,
): Promise<{ ok: boolean; error?: string }> {
  let updated = false;
  let lastError = 'Could not mark purchase order delivered';

  for (const table of PO_TABLES) {
    const byId = await updateDeliveredPurchaseOrderRow(supabase, table, { id: order.id });
    if (byId.ok) {
      updated = true;
      break;
    }
    lastError = byId.error ?? lastError;

    if (order.po_number) {
      const byNumber = await updateDeliveredPurchaseOrderRow(supabase, table, {
        po_number: order.po_number,
        hospital_id: hospitalId,
      });
      if (byNumber.ok) {
        updated = true;
        break;
      }
      lastError = byNumber.error ?? lastError;
    }
  }

  if (!updated) return { ok: false, error: lastError };

  const itemName = order.item_description.split(' — ')[0]?.trim() || order.item_description;
  let stocked = false;
  for (const table of STOCK_TABLES) {
    stocked = await incrementStockRow(supabase, table, hospitalId, itemName, order.sku, order.quantity);
    if (stocked) break;
  }

  if (!stocked) {
    return { ok: true, error: 'PO marked delivered, but pharmacy stock could not be incremented' };
  }

  return { ok: true };
}

const HOSPITAL_VENDOR_INVOICE_TABLES = ['vendor_invoices', 'invoices'] as const;

export type HospitalVendorInvoiceRow = {
  id: string;
  invoice_number: string;
  po_id: string;
  po_number: string;
  hospital_id?: string;
  hospital_name?: string;
  vendor_id?: string;
  vendor_name: string;
  vendor_email: string;
  item_description?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_status: string;
  payment_reference?: string;
  payment_method?: string;
  settled_at?: string;
  created_at: string;
};

export type SettleHospitalInvoiceInput = {
  invoiceId: string;
  payment_reference: string;
  payment_method: string;
};

export const HOSPITAL_SETTLEMENT_PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash (Direct Counter Payment)' },
  { value: 'NEFT/RTGS', label: 'NEFT / RTGS (Direct Bank Transfer)' },
  { value: 'IMPS', label: 'IMPS Immediate Transfer' },
  { value: 'Corporate NetBanking', label: 'Corporate NetBanking' },
  { value: 'UPI Corporate', label: 'Corporate UPI' },
] as const;

export function isCashSettlementMethod(method?: string | null): boolean {
  return String(method ?? '')
    .trim()
    .toLowerCase() === 'cash';
}

export function resolveSettlementPaymentReference(
  method: string,
  rawReference?: string | null,
): string {
  const trimmed = String(rawReference ?? '').trim();
  if (isCashSettlementMethod(method)) {
    return trimmed || `CASH-REC-${Date.now().toString().slice(-6)}`;
  }
  return trimmed;
}

export function buildSettlementSuccessMessage(
  paymentMethod: string,
  paymentReference: string,
  invoiceNumber?: string,
): string {
  if (isCashSettlementMethod(paymentMethod)) {
    return `Payment recorded successfully via Cash (Receipt: ${paymentReference})`;
  }
  if (invoiceNumber) {
    return `Invoice ${invoiceNumber} successfully settled and recorded`;
  }
  return `Payment recorded successfully (Reference: ${paymentReference})`;
}

export function normalizeHospitalPaymentStatus(raw?: string | null): 'AWAITING_SETTLEMENT' | 'PAID' {
  const value = String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/_/g, ' ');
  if (value === 'PAID' || value === 'SETTLED') return 'PAID';
  return 'AWAITING_SETTLEMENT';
}

export function getHospitalInvoicePaymentBadgeClass(raw?: string | null): string {
  return normalizeHospitalPaymentStatus(raw) === 'PAID'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
    : 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
}

export function formatHospitalInvoicePaymentStatus(raw?: string | null): string {
  return normalizeHospitalPaymentStatus(raw) === 'PAID' ? 'PAID' : 'AWAITING SETTLEMENT';
}

function mapHospitalVendorInvoiceRow(row: Record<string, unknown>): HospitalVendorInvoiceRow {
  return {
    id: String(row.id ?? ''),
    invoice_number: String(row.invoice_number ?? row.invoice_code ?? 'INV-PENDING'),
    po_id: String(row.po_id ?? row.purchase_order_id ?? ''),
    po_number: String(row.po_number ?? ''),
    hospital_id: row.hospital_id ? String(row.hospital_id) : undefined,
    hospital_name: row.hospital_name ? String(row.hospital_name) : undefined,
    vendor_id: row.vendor_id ? String(row.vendor_id) : undefined,
    vendor_name: String(row.vendor_name ?? row.company_name ?? 'Vendor'),
    vendor_email: String(row.vendor_email ?? row.email ?? ''),
    item_description: row.item_description ? String(row.item_description) : undefined,
    subtotal: Number(row.subtotal ?? row.base_amount ?? 0),
    tax_amount: Number(row.tax_amount ?? row.gst_amount ?? 0),
    total_amount: Number(row.total_amount ?? row.gross_amount ?? 0),
    payment_status: normalizeHospitalPaymentStatus(
      String(row.payment_status ?? row.status ?? 'AWAITING_SETTLEMENT'),
    ),
    payment_reference: row.payment_reference ? String(row.payment_reference) : undefined,
    payment_method: row.payment_method ? String(row.payment_method) : undefined,
    settled_at: row.settled_at ? String(row.settled_at) : undefined,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function invoiceMatchesHospitalNode(
  invoice: HospitalVendorInvoiceRow,
  hospitalFilterIds: string[],
): boolean {
  const hospitalId = String(invoice.hospital_id ?? '').trim();
  if (!hospitalId) return true;
  const normalized = hospitalId.toLowerCase();
  return hospitalFilterIds.some((id) => id.trim().toLowerCase() === normalized);
}

async function updateRowWithOptionalColumns(
  client: SupabaseClient,
  table: string,
  id: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  const patch = { ...payload };
  let result = await client.from(table).update(patch).eq('id', id);

  let guard = 0;
  while (result.error && guard < 8) {
    guard += 1;
    if (!isMissingColumnError(result.error.message)) {
      return { ok: false, error: result.error.message };
    }
    const column = missingColumn(result.error.message);
    if (column && column in patch) {
      delete patch[column];
    } else {
      return { ok: false, error: result.error.message };
    }
    result = await client.from(table).update(patch).eq('id', id);
  }

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  return { ok: true };
}

export async function fetchHospitalVendorInvoices(
  client: SupabaseClient,
  hospitalId: string,
): Promise<HospitalVendorInvoiceRow[]> {
  const hospitalFilterIds = hospitalDirectoryFilterIds(hospitalId);
  const orFilter = buildHospitalDirectoryOrFilter(hospitalFilterIds);
  let rows: Record<string, unknown>[] = [];

  for (const table of HOSPITAL_VENDOR_INVOICE_TABLES) {
    let result = await client
      .from(table)
      .select('*')
      .or(orFilter)
      .order('created_at', { ascending: false });

    if (result.error) {
      result = await client.from(table).select('*').order('created_at', { ascending: false });
    }

    console.log('Hospital fetched invoices:', result.data, result.error);

    if (!result.error && Array.isArray(result.data)) {
      rows = result.data as Record<string, unknown>[];
      break;
    }
    if (result.error && !/relation|does not exist|schema cache/i.test(result.error.message)) {
      logSupabaseQueryError('fetchHospitalVendorInvoices', result.error);
      return [];
    }
  }

  const vendorIds = Array.from(
    new Set(rows.map((row) => String(row.vendor_id ?? '').trim()).filter(Boolean)),
  );
  const vendorLookup = new Map<string, { name: string; email: string }>();

  if (vendorIds.length > 0) {
    const vendorsResult = await client
      .from('vendors')
      .select('id, company_name, email')
      .in('id', vendorIds);
    if (!vendorsResult.error && Array.isArray(vendorsResult.data)) {
      for (const vendor of vendorsResult.data as Record<string, unknown>[]) {
        const id = String(vendor.id ?? '');
        if (!id) continue;
        vendorLookup.set(id, {
          name: String(vendor.company_name ?? 'Vendor'),
          email: String(vendor.email ?? ''),
        });
      }
    }
  }

  const mapped = rows.map((row) => {
    const invoice = mapHospitalVendorInvoiceRow(row);
    const vendorMeta = invoice.vendor_id ? vendorLookup.get(invoice.vendor_id) : undefined;
    if (vendorMeta) {
      invoice.vendor_name = vendorMeta.name;
      invoice.vendor_email = vendorMeta.email || invoice.vendor_email;
    }
    return invoice;
  });

  const scoped = mapped.filter((invoice) => invoiceMatchesHospitalNode(invoice, hospitalFilterIds));
  const invoices = scoped.length > 0 || mapped.length === 0 ? scoped : mapped;

  return invoices.sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')));
}

export async function settleHospitalVendorInvoice(
  client: SupabaseClient,
  hospitalId: string,
  input: SettleHospitalInvoiceInput,
): Promise<{ ok: boolean; invoice?: HospitalVendorInvoiceRow; error?: string }> {
  if (!input.invoiceId) {
    return { ok: false, error: 'Missing invoice id' };
  }

  const invoices = await fetchHospitalVendorInvoices(client, hospitalId);
  const invoice = invoices.find((row) => row.id === input.invoiceId);
  if (!invoice) {
    return { ok: false, error: 'Invoice not found for this hospital node' };
  }

  if (normalizeHospitalPaymentStatus(invoice.payment_status) === 'PAID') {
    return { ok: true, invoice };
  }

  const timestamp = new Date().toISOString();
  const invoicePatch: Record<string, unknown> = {
    payment_status: 'PAID',
    status: 'PAID',
    settled_at: timestamp,
    payment_reference: input.payment_reference.trim(),
    payment_method: input.payment_method,
    updated_at: timestamp,
  };

  let invoiceUpdated = false;
  let lastError = 'Could not update vendor invoice';

  for (const table of HOSPITAL_VENDOR_INVOICE_TABLES) {
    const result = await updateRowWithOptionalColumns(client, table, invoice.id, invoicePatch);
    if (result.ok) {
      invoiceUpdated = true;
      break;
    }
    lastError = result.error ?? lastError;
  }

  if (!invoiceUpdated) {
    return { ok: false, error: lastError };
  }

  if (invoice.po_id) {
    const poPatch: Record<string, unknown> = {
      status: 'PAID',
      updated_at: timestamp,
    };
    await updateRowWithOptionalColumns(client, PROCUREMENT_PO_TABLE, invoice.po_id, poPatch);

    if (invoice.po_number) {
      for (const table of PO_TABLES) {
        await client
          .from(table)
          .update({ status: 'PAID', updated_at: timestamp })
          .eq('po_number', invoice.po_number);
      }
    }
  }

  return {
    ok: true,
    invoice: {
      ...invoice,
      payment_status: 'PAID',
      payment_reference: input.payment_reference.trim(),
      payment_method: input.payment_method,
      settled_at: timestamp,
    },
  };
}
