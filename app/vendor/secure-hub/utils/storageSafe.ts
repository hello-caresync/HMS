import {
  ChatMessage,
  EnterprisePO,
  GeneratedInvoice,
  POExtendedStatus,
  ReturnRequest,
  VendorPOItem,
} from '../types';

const DEFAULT_PO_STATUS: POExtendedStatus = 'New';

const VALID_PO_STATUSES = new Set<POExtendedStatus>([
  'New',
  'Accepted',
  'Processing',
  'Packed',
  'Dispatched',
  'In Transit',
  'Delivered',
  'Rejected',
]);

function normalizeStatus(raw: unknown): POExtendedStatus {
  if (typeof raw !== 'string') return DEFAULT_PO_STATUS;
  if (raw === 'Created' || raw === 'Sent') return 'New';
  if (VALID_PO_STATUSES.has(raw as POExtendedStatus)) {
    return raw as POExtendedStatus;
  }
  return DEFAULT_PO_STATUS;
}

function normalizePoItem(raw: unknown, index: number): VendorPOItem {
  const item = (raw ?? {}) as Partial<VendorPOItem>;
  return {
    name: item.name ?? `Item Cargo Manifest ${index + 1}`,
    quantityRequested: Number(item.quantityRequested) || 0,
    quantityDelivered:
      item.quantityDelivered != null
        ? Number(item.quantityDelivered) || 0
        : undefined,
    unitPrice: Number(item.unitPrice) || 0,
  };
}

export function normalizePurchaseOrder(raw: unknown, index: number): EnterprisePO {
  const po = (raw ?? {}) as Partial<EnterprisePO>;
  const itemsSource = Array.isArray(po.items) ? po.items : [];

  return {
    id: po.id ?? `PO-SYNC-${index + 1}`,
    hospitalName: po.hospitalName ?? 'Unknown Hospital',
    items:
      itemsSource.length > 0
        ? itemsSource.map(normalizePoItem)
        : [normalizePoItem(undefined, 0)],
    deliveryLocation: po.deliveryLocation ?? 'Delivery location pending',
    urgency:
      po.urgency === 'Urgent' || po.urgency === 'Critical'
        ? po.urgency
        : 'Normal',
    expectedDeliveryDate: po.expectedDeliveryDate ?? '—',
    status: normalizeStatus(po.status),
    dateReceived: po.dateReceived ?? new Date().toISOString().split('T')[0],
    courierTrackingId: po.courierTrackingId,
    receiverName: po.receiverName,
    creditTermsDays: Number(po.creditTermsDays) || 30,
  };
}

export function normalizePurchaseOrders(raw: unknown): EnterprisePO[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry) => entry != null)
    .map((entry, index) => normalizePurchaseOrder(entry, index));
}

export function normalizeInvoice(raw: unknown, index: number): GeneratedInvoice {
  const inv = (raw ?? {}) as Partial<GeneratedInvoice>;
  const baseAmount = Number(inv.baseAmount) || 0;
  const gstAmount = Number(inv.gstAmount) || 0;
  const totalAmount = Number(inv.totalAmount) || baseAmount + gstAmount;

  return {
    id: inv.id ?? `INV-SYNC-${index + 1}`,
    poReferenceId: inv.poReferenceId ?? '—',
    hospitalName: inv.hospitalName ?? 'Unknown Hospital',
    baseAmount,
    gstAmount,
    totalAmount,
    status: inv.status ?? 'Submitted',
    dateCreated: inv.dateCreated ?? new Date().toISOString().split('T')[0],
  };
}

export function normalizeInvoices(raw: unknown): GeneratedInvoice[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry) => entry != null)
    .map((entry, index) => normalizeInvoice(entry, index));
}

export function normalizeChatMessage(raw: unknown, index: number): ChatMessage {
  const msg = (raw ?? {}) as Partial<ChatMessage>;
  return {
    id: msg.id ?? `MSG-SYNC-${index + 1}`,
    sender: msg.sender === 'Hospital' ? 'Hospital' : 'Vendor',
    text: msg.text ?? '',
    timestamp: msg.timestamp ?? '—',
  };
}

export function normalizeChatThreads(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry) => entry != null)
    .map((entry, index) => normalizeChatMessage(entry, index));
}

export function normalizeReturnRequest(raw: unknown, index: number): ReturnRequest {
  const ret = (raw ?? {}) as Partial<ReturnRequest>;
  return {
    id: ret.id ?? `RET-SYNC-${index + 1}`,
    poReferenceId: ret.poReferenceId ?? '—',
    hospitalName: ret.hospitalName ?? 'Unknown Hospital',
    itemName: ret.itemName ?? 'Item Cargo Manifest',
    quantityToReturn: Number(ret.quantityToReturn) || 0,
    reason: ret.reason ?? 'No reason provided',
    status: ret.status ?? 'Pending Pickup',
  };
}

export function normalizeReturnsList(raw: unknown): ReturnRequest[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry) => entry != null)
    .map((entry, index) => normalizeReturnRequest(entry, index));
}

export function parseStorageArray<T>(
  raw: string | null,
  normalize: (data: unknown) => T[],
): T[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return normalize(parsed);
  } catch {
    return [];
  }
}

export function computePoLineTotal(po: EnterprisePO | null | undefined): number {
  return (
    po?.items?.reduce(
      (sum, item) =>
        sum + (Number(item?.quantityRequested) || 0) * (Number(item?.unitPrice) || 0),
      0,
    ) ?? 0
  );
}

export function getPrimaryLineItem(po: EnterprisePO | null | undefined): VendorPOItem {
  return (
    po?.items?.[0] ?? {
      name: 'Item Cargo Manifest',
      quantityRequested: 0,
      unitPrice: 0,
    }
  );
}
