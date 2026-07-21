import { buildInvoice } from '../services/billing/billing.service';
import { applyInventoryUpdates } from '../services/inventory/inventory.service';
import { processPayment } from '../services/payments/payments.service';
import { writeAuditLog } from '../services/audit/audit.service';
import type { NexoraServiceContext } from '../types/context';
import { generateCorrelationId } from '../types/common';
import type {
  SharedTransactionInput,
  SharedTransactionResult,
} from '../types/transaction';

/**
 * Decoupled automation pipeline — orchestrates billing → payment → inventory → audit.
 * Consumable from any Nexora app API route / Server Action without UI coupling.
 */
export async function processSharedTransaction(
  input: SharedTransactionInput,
  ctx: NexoraServiceContext,
): Promise<SharedTransactionResult> {
  const transactionId = `TXN-${ctx.correlationId}`;
  const correlationId = ctx.correlationId || generateCorrelationId('txn');

  const billingResult = buildInvoice({ items: input.billingItems }, {
    ...ctx,
    correlationId,
  });

  if (!billingResult.ok) {
    return {
      success: false,
      transactionId,
      correlationId,
      stage: 'billing',
      errors: [billingResult.error],
    };
  }

  const invoice = billingResult.data;
  const paymentAmount = input.paymentAmount ?? invoice.grandTotal;
  const paymentMethod = input.paymentMethod ?? 'cash';

  const paymentResult = await processPayment(
    {
      invoiceId: invoice.invoiceId,
      amount: paymentAmount,
      method: paymentMethod,
    },
    { ...ctx, correlationId },
  );

  if (!paymentResult.ok) {
    return {
      success: false,
      transactionId,
      correlationId,
      stage: 'payment',
      errors: [paymentResult.error],
      partial: {
        invoice: {
          invoiceId: invoice.invoiceId,
          grandTotal: invoice.grandTotal,
          lineCount: invoice.lineItems.length,
        },
      },
    };
  }

  const inventoryUpdates = input.inventoryUpdates ?? [];
  const inventoryResult = await applyInventoryUpdates(
    { updates: inventoryUpdates },
    { ...ctx, correlationId },
  );

  if (!inventoryResult.ok) {
    return {
      success: false,
      transactionId,
      correlationId,
      stage: 'inventory',
      errors: [inventoryResult.error],
      partial: {
        invoice: {
          invoiceId: invoice.invoiceId,
          grandTotal: invoice.grandTotal,
          lineCount: invoice.lineItems.length,
        },
        payment: paymentResult.data,
      },
    };
  }

  const auditResult = await writeAuditLog(
    {
      action: 'SHARED_TRANSACTION_COMPLETED',
      component: input.originatingModule,
      impactValue: invoice.grandTotal,
      payload: {
        transactionId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        patientId: input.patientId,
        invoiceId: invoice.invoiceId,
        paymentId: paymentResult.data.paymentId,
        inventoryApplied: inventoryResult.data.length,
      },
    },
    { ...ctx, correlationId },
  );

  if (!auditResult.ok) {
    return {
      success: false,
      transactionId,
      correlationId,
      stage: 'audit',
      errors: [auditResult.error],
      partial: {
        invoice: {
          invoiceId: invoice.invoiceId,
          grandTotal: invoice.grandTotal,
          lineCount: invoice.lineItems.length,
        },
        payment: paymentResult.data,
        inventory: {
          applied: inventoryResult.data.length,
          results: inventoryResult.data.map((r) => ({
            sku: r.sku,
            batch: r.batch,
            newQuantity: r.newQuantity,
          })),
        },
      },
    };
  }

  return {
    success: true,
    transactionId,
    correlationId,
    invoice: {
      invoiceId: invoice.invoiceId,
      grandTotal: invoice.grandTotal,
      lineCount: invoice.lineItems.length,
    },
    payment: paymentResult.data,
    inventory: {
      applied: inventoryResult.data.length,
      results: inventoryResult.data.map((r) => ({
        sku: r.sku,
        batch: r.batch,
        newQuantity: r.newQuantity,
      })),
    },
    audit: auditResult.data,
  };
}
