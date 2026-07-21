import type { NexoraServiceContext } from '../../types/context';
import type { ServiceResult } from '../../types/common';
import { ok } from '../../types/common';

export interface AuthSession {
  userId: string;
  role: string;
  tenantId: string;
}

/** packages/shared/services/auth — headless identity verification */
export async function verifyActorSession(
  ctx: NexoraServiceContext,
): Promise<ServiceResult<AuthSession>> {
  if (!ctx.actorUserId) {
    return { ok: false, error: 'Missing actorUserId', code: 'AUTH_ACTOR_REQUIRED' };
  }

  if (ctx.supabase) {
    const { data, error } = await ctx.supabase.auth.getUser();
    if (error || !data.user) {
      return { ok: false, error: error?.message ?? 'Unauthenticated', code: 'AUTH_INVALID' };
    }
    return ok({
      userId: data.user.id,
      role: (data.user.app_metadata?.role as string) ?? 'unknown',
      tenantId: ctx.tenantId,
    });
  }

  return ok({ userId: ctx.actorUserId, role: 'system', tenantId: ctx.tenantId });
}
