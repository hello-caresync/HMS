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

async function hashData(data: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function computeImmutableHash(
  payload: Record<string, unknown>,
  recordedAt: string,
): Promise<string> {
  const full = await hashData(JSON.stringify({ ...payload, recordedAt }));
  return full.slice(0, 16);
}

/** packages/shared/services/audit — append-only immutable footprint */
export async function writeAuditLog(
  input: WriteAuditLogInput,
  ctx: NexoraServiceContext,
): Promise<ServiceResult<SharedAuditFootprint>> {
  const recordedAt = new Date().toISOString();
  const auditId = `AUD-${ctx.correlationId}`;
  const immutableHash = await computeImmutableHash(
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
