import type { NexoraServiceContext } from '../../types/context';
import type { ServiceResult } from '../../types/common';
import { ok } from '../../types/common';

export interface PurchaseOrderRef {
  poId: string;
  vendorId: string;
  totalAmount: number;
}

/** packages/shared/services/procurement */
export async function validatePurchaseOrder(
  poId: string,
  ctx: NexoraServiceContext,
): Promise<ServiceResult<PurchaseOrderRef>> {
  return ok({ poId, vendorId: 'VND-PLACEHOLDER', totalAmount: 0 });
}
