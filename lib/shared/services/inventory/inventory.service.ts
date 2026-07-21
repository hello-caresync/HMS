import { SUPABASE_TABLES } from '../../client/supabase';
import type { NexoraServiceContext } from '../../types/context';
import type {
  SharedInventoryApplyResult,
  SharedInventoryUpdate,
} from '../../types/inventory';
import type { ServiceResult } from '../../types/common';
import { fail, ok } from '../../types/common';

/** In-memory mock ledger for pipeline runs without Supabase schema. */
const mockStockLedger = new Map<string, number>();

function stockKey(sku: string, batch: string): string {
  return `${sku}::${batch}`;
}

export interface ApplyInventoryInput {
  updates: SharedInventoryUpdate[];
}

/** packages/shared/services/inventory */
export async function applyInventoryUpdates(
  input: ApplyInventoryInput,
  ctx: NexoraServiceContext,
): Promise<ServiceResult<SharedInventoryApplyResult[]>> {
  if (!input.updates.length) {
    return ok([]);
  }

  const results: SharedInventoryApplyResult[] = [];

  for (const update of input.updates) {
    if (update.quantityChange === 0) {
      return fail(`Zero quantity change for SKU ${update.sku}`, 'INV_ZERO_DELTA');
    }

    const key = stockKey(update.sku, update.batch);
    const previousQuantity = mockStockLedger.get(key) ?? 100;
    const newQuantity = previousQuantity + update.quantityChange;

    if (newQuantity < 0) {
      return fail(
        `Insufficient stock for SKU ${update.sku} batch ${update.batch}`,
        'INV_INSUFFICIENT',
      );
    }

    mockStockLedger.set(key, newQuantity);
    results.push({
      sku: update.sku,
      batch: update.batch,
      previousQuantity,
      newQuantity,
      appliedChange: update.quantityChange,
    });

    if (ctx.supabase) {
      await ctx.supabase.from(SUPABASE_TABLES.inventoryLedger).insert({
        sku: update.sku,
        batch: update.batch,
        quantity_change: update.quantityChange,
        triggering_module: update.triggeringModule,
        reference_id: update.referenceId,
        tenant_id: ctx.tenantId,
        correlation_id: ctx.correlationId,
      });
    }
  }

  return ok(results);
}

/** Reset mock ledger — test helper only */
export function __resetMockInventoryLedger(): void {
  mockStockLedger.clear();
}
