import { isDemoMode } from '@/lib/shared/demo-mode';
import { DEFAULT_VENDOR_ID } from '@/lib/vendor-supabase/constants';
import type { PurchaseOrderRow } from '@/lib/vendor-supabase/types';

/** Demo KPIs when Supabase counts return zero — production returns 0 */
export const DEFAULT_KPI_FALLBACK = {
  pendingPos: 6,
  activeDeliveries: 2,
  pendingInvoices: 3,
  openTickets: 1,
  upcomingPayments: 2,
} as const;

export function kpiWithFallback(count: number, key: keyof typeof DEFAULT_KPI_FALLBACK): number {
  if (count > 0) return count;
  return isDemoMode() ? DEFAULT_KPI_FALLBACK[key] : 0;
}

export const FALLBACK_PENDING_POS: PurchaseOrderRow[] = [
  {
    id: 'fallback-po-4401',
    po_number: 'NX-PO-2026-4401',
    vendor_id: DEFAULT_VENDOR_ID,
    hospital_name: 'Nexora City Hospital',
    status: 'ISSUED',
    total_amount: 284000,
    delivery_deadline: '2026-07-22',
    created_at: '2026-07-18T08:00:00Z',
  },
  {
    id: 'fallback-po-4398',
    po_number: 'NX-PO-2026-4398',
    vendor_id: DEFAULT_VENDOR_ID,
    hospital_name: 'Nexora Heart Institute',
    status: 'ISSUED',
    total_amount: 1250000,
    delivery_deadline: '2026-07-24',
    created_at: '2026-07-15T10:30:00Z',
  },
  {
    id: 'fallback-po-4392',
    po_number: 'NX-PO-2026-4392',
    vendor_id: DEFAULT_VENDOR_ID,
    hospital_name: 'Nexora Diagnostics Network',
    status: 'ISSUED',
    total_amount: 96000,
    delivery_deadline: '2026-07-20',
    created_at: '2026-07-14T14:00:00Z',
  },
];

export function getFallbackPendingPos(): PurchaseOrderRow[] {
  return isDemoMode() ? FALLBACK_PENDING_POS : [];
}

export type FsrTicketOption = {
  id: string;
  equipment_name: string;
  status: string;
};

export const FSR_FALLBACK_TICKETS: FsrTicketOption[] = [
  { id: 'ST-2026-881', equipment_name: 'Ventilator Calibration', status: 'OPEN' },
  { id: 'ST-2026-902', equipment_name: 'Cath Lab Repair', status: 'OPEN' },
];

export function isDemoTicketId(id: string) {
  return id.startsWith('ST-2026-');
}
