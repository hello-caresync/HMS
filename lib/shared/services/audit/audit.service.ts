import { createHash } from 'crypto';

import { SUPABASE_TABLES } from '../../client/supabase';
import type { NexoraServiceContext } from '../../types/context';
import type { SharedAuditFootprint } from '../../types/transaction';
import type { ServiceResult } from '../../types/common';
import { fail, ok } from '../../types/common';

export interface WriteAuditLogInput {
  action: string;
  component: string;
  impactValue?: number;
  payload: Record<string, unknown>;
}

function computeImmutableHash(payload: Record<string, unknown>, recordedAt: string): string {
  return createHash('sha256')
    .update(JSON.stringify({ ...payload, recordedAt }))
    .digest('hex')
    .slice(0, 16);
}

/** packages/shared/services/audit — append-only immutable footprint */
export async function writeAuditLog(
  input: WriteAuditLogInput,
  ctx: NexoraServiceContext,
): Promise<ServiceResult<SharedAuditFootprint>> {
  const recordedAt = new Date().toISOString();
  const auditId = `AUD-${ctx.correlationId}`;
  const immutableHash = computeImmutableHash(
    {
      ...input.payload,
      action: input.action,
      component: input.component,
      actorUserId: ctx.actorUserId,
      tenantId: ctx.tenantId,
      sourceApp: ctx.sourceApp,
    },
    recordedAt,
  );

  const footprint: SharedAuditFootprint = {
    auditId,
    immutableHash,
    recordedAt,
    action: input.action,
    payloadSummary: `${input.component} · ${input.action}`,
  };

  if (ctx.supabase) {
    const { error } = await ctx.supabase.from(SUPABASE_TABLES.auditLogs).insert({
      id: auditId,
      user_id: ctx.actorUserId,
      tenant_id: ctx.tenantId,
      source_app: ctx.sourceApp,
      component: input.component,
      action: input.action,
      impact_value: input.impactValue ?? 0,
      payload: input.payload,
      immutable_hash: immutableHash,
      correlation_id: ctx.correlationId,
      recorded_at: recordedAt,
    });
    if (error) {
      return fail(error.message, 'AUDIT_DB_ERROR');
    }
  }

  return ok(footprint);
}
