import { VENDOR_PORTAL_ROUTES } from '@/lib/vendor/navigation';

export type LifecycleStage =
  | 'ALL'
  | 'ISSUED'
  | 'ACCEPTED'
  | 'DISPATCHED'
  | 'GOODS_RECEIPT'
  | 'INVOICED'
  | 'PAID';

export type LifecycleCounts = Partial<Record<Exclude<LifecycleStage, 'ALL'>, number>>;

export const LIFECYCLE_STAGES: { key: Exclude<LifecycleStage, 'ALL'>; label: string }[] = [
  { key: 'ISSUED', label: 'Issued' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'DISPATCHED', label: 'Dispatched' },
  { key: 'GOODS_RECEIPT', label: 'Goods Receipt' },
  { key: 'INVOICED', label: 'Invoiced' },
  { key: 'PAID', label: 'Paid' },
];

export function lifecycleRouteForStage(stage: LifecycleStage): string | null {
  if (stage === 'ALL') return null;
  if (stage === 'INVOICED' || stage === 'PAID') return VENDOR_PORTAL_ROUTES.billing;
  if (stage === 'DISPATCHED' || stage === 'GOODS_RECEIPT') return VENDOR_PORTAL_ROUTES.deliveries;
  return VENDOR_PORTAL_ROUTES.purchaseOrders;
}

export function matchesPurchaseOrderLifecycle(stage: LifecycleStage, status: string): boolean {
  if (stage === 'ALL') return true;
  const normalized = status.toUpperCase();
  if (stage === 'INVOICED') return normalized === 'INVOICED';
  if (stage === 'PAID') return normalized === 'PAID';
  return normalized === stage;
}

export function matchesShipmentLifecycle(
  stage: LifecycleStage,
  shipmentStatus: string,
  poStatus?: string,
): boolean {
  if (stage === 'ALL') return true;

  const shipment = shipmentStatus.toUpperCase();
  const po = poStatus?.toUpperCase();

  if (stage === 'DISPATCHED') return shipment === 'IN_TRANSIT' || po === 'DISPATCHED';
  if (stage === 'GOODS_RECEIPT') return shipment === 'DELIVERED' || po === 'GOODS_RECEIPT';
  if (stage === 'INVOICED') return po === 'INVOICED';
  if (stage === 'PAID') return po === 'PAID';
  if (stage === 'ISSUED' || stage === 'ACCEPTED') return false;

  return po === stage;
}

export function matchesInvoiceLifecycle(stage: LifecycleStage, invoiceStatus: string): boolean {
  if (stage === 'ALL') return true;
  const normalized = invoiceStatus.toUpperCase();
  if (stage === 'INVOICED') return normalized === 'SUBMITTED';
  if (stage === 'PAID') return normalized === 'PAID';
  return false;
}
