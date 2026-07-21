/**
 * Cross-app invoice line model — consumed by Admin, Hospital, Patient, and Operations apps.
 * UI-specific invoice views map from this canonical shape.
 */
export interface SharedBillingItem {
  /** Human-readable charge description (procedure, drug, consultation, etc.) */
  itemDescription: string;
  /** Pre-tax unit or line base cost in INR */
  baseCost: number;
  /** Applicable GST percentage (0–100) */
  gstPercent: number;
  /** Computed line total including tax (base × qty + GST) */
  total: number;
  /** Optional stable line identifier for idempotent replays */
  lineId?: string;
  /** Quantity multiplier; defaults to 1 in billing service calculations */
  quantity?: number;
}

/** Input shape before billing service computes totals. */
export type SharedBillingItemInput = Omit<SharedBillingItem, 'total'> & {
  quantity?: number;
};

export interface SharedInvoiceSummary {
  invoiceId: string;
  lineItems: SharedBillingItem[];
  subtotal: number;
  totalGst: number;
  grandTotal: number;
  currency: 'INR';
}
