import type { NexoraModule } from './common';
import type { SharedBillingItemInput } from './billing';
import type { SharedInventoryUpdate } from './inventory';

export type SharedTransactionSourceType = 'appointment' | 'order';

/** Headless input to the automation pipeline — no UI references. */
export interface SharedTransactionInput {
  sourceType: SharedTransactionSourceType;
  sourceId: string;
  patientId?: string;
  originatingModule: NexoraModule;
  billingItems: SharedBillingItemInput[];
  inventoryUpdates?: SharedInventoryUpdate[];
  paymentMethod?: 'cash' | 'upi' | 'card' | 'insurance' | 'corporate';
  /** When omitted, pipeline uses computed invoice grand total */
  paymentAmount?: number;
}

export interface SharedPaymentRecord {
  paymentId: string;
  status: 'captured' | 'failed' | 'pending';
  amount: number;
  method: NonNullable<SharedTransactionInput['paymentMethod']>;
  capturedAt: string;
}

export interface SharedAuditFootprint {
  auditId: string;
  immutableHash: string;
  recordedAt: string;
  action: string;
  payloadSummary: string;
}

export interface SharedTransactionSuccess {
  success: true;
  transactionId: string;
  correlationId: string;
  invoice: {
    invoiceId: string;
    grandTotal: number;
    lineCount: number;
  };
  payment: SharedPaymentRecord;
  inventory: {
    applied: number;
    results: { sku: string; batch: string; newQuantity: number }[];
  };
  audit: SharedAuditFootprint;
}

export interface SharedTransactionFailure {
  success: false;
  transactionId: string;
  correlationId: string;
  stage: 'billing' | 'payment' | 'inventory' | 'audit';
  errors: string[];
  partial?: Partial<Omit<SharedTransactionSuccess, 'success'>>;
}

export type SharedTransactionResult = SharedTransactionSuccess | SharedTransactionFailure;
