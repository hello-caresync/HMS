import type { NexoraModule } from './common';

/**
 * Cross-app stock mutation model — emitted by Pharmacy, Procurement, Laboratory, etc.
 * Inventory service applies these without knowledge of the originating UI.
 */
export interface SharedInventoryUpdate {
  /** Stock keeping unit code */
  sku: string;
  /** Lot / batch identifier for traceability */
  batch: string;
  /** Signed delta: negative deducts, positive replenishes */
  quantityChange: number;
  /** Module that initiated the stock movement */
  triggeringModule: NexoraModule;
  /** Optional business reference (order id, dispense id, PO id) */
  referenceId?: string;
  /** Free-text reason for audit correlation */
  reason?: string;
}

export interface SharedInventoryApplyResult {
  sku: string;
  batch: string;
  previousQuantity: number;
  newQuantity: number;
  appliedChange: number;
}
