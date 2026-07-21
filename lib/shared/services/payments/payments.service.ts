import { SUPABASE_TABLES } from '../../client/supabase';
import type { NexoraServiceContext } from '../../types/context';
import type { SharedPaymentRecord } from '../../types/transaction';
import type { ServiceResult } from '../../types/common';
import { fail, ok } from '../../types/common';

export interface ProcessPaymentInput {
  invoiceId: string;
  amount: number;
  method: NonNullable<import('../../types/transaction').SharedTransactionInput['paymentMethod']>;
}

/** packages/shared/services/payments — mock capture with optional Supabase persistence */
export async function processPayment(
  input: ProcessPaymentInput,
  ctx: NexoraServiceContext,
): Promise<ServiceResult<SharedPaymentRecord>> {
  if (input.amount <= 0) {
    return fail('Payment amount must be positive', 'PAY_INVALID_AMOUNT');
  }

  const payment: SharedPaymentRecord = {
    paymentId: `PAY-${ctx.correlationId}`,
    status: 'captured',
    amount: input.amount,
    method: input.method,
    capturedAt: new Date().toISOString(),
  };

  if (ctx.supabase) {
    const { error } = await ctx.supabase.from(SUPABASE_TABLES.payments).insert({
      id: payment.paymentId,
      invoice_id: input.invoiceId,
      amount: input.amount,
      method: input.method,
      status: payment.status,
      tenant_id: ctx.tenantId,
      correlation_id: ctx.correlationId,
    });
    if (error) {
      return fail(error.message, 'PAY_DB_ERROR');
    }
  }

  return ok(payment);
}
