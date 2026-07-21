import type { NexoraServiceContext } from '../../types/context';
import type {
  SharedBillingItem,
  SharedBillingItemInput,
  SharedInvoiceSummary,
} from '../../types/billing';
import type { ServiceResult } from '../../types/common';
import { fail, ok } from '../../types/common';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeBillingLine(item: SharedBillingItemInput): SharedBillingItem {
  const qty = item.quantity ?? 1;
  const subtotal = item.baseCost * qty;
  const gstAmount = subtotal * (item.gstPercent / 100);
  return {
    itemDescription: item.itemDescription,
    baseCost: item.baseCost,
    gstPercent: item.gstPercent,
    quantity: qty,
    lineId: item.lineId,
    total: round2(subtotal + gstAmount),
  };
}

export interface BuildInvoiceInput {
  items: SharedBillingItemInput[];
  discount?: number;
}

/** packages/shared/services/billing */
export function buildInvoice(
  input: BuildInvoiceInput,
  ctx: NexoraServiceContext,
): ServiceResult<SharedInvoiceSummary> {
  if (!input.items.length) {
    return fail('At least one billing item is required', 'BILLING_EMPTY');
  }

  const lineItems = input.items.map(computeBillingLine);
  const subtotal = round2(lineItems.reduce((s, l) => s + l.baseCost * (l.quantity ?? 1), 0));
  const totalGst = round2(
    lineItems.reduce((s, l) => {
      const qty = l.quantity ?? 1;
      return s + l.baseCost * qty * (l.gstPercent / 100);
    }, 0),
  );
  const discount = Math.max(0, input.discount ?? 0);
  const grandTotal = round2(subtotal + totalGst - discount);

  return ok({
    invoiceId: `INV-${ctx.correlationId}`,
    lineItems,
    subtotal,
    totalGst,
    grandTotal,
    currency: 'INR',
  });
}
