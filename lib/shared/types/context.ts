import type { SupabaseClient } from '@supabase/supabase-js';

import type { NexoraAppId } from './common';
import { generateCorrelationId } from './common';

/**
 * Cross-app service context template — inject at API route, Server Action, or edge handler.
 * Keeps headless services decoupled from React view layers.
 */
export interface NexoraServiceContext {
  /** Authenticated operator or system actor (USR-* / service account) */
  actorUserId: string;
  /** Hospital / tenant scope for RLS and multi-site deployments */
  tenantId: string;
  /** Which standalone Nexora app initiated the call */
  sourceApp: NexoraAppId;
  /** Trace id propagated across billing → payment → inventory → audit */
  correlationId: string;
  /** Optional Supabase client — browser, server, or service-role */
  supabase?: SupabaseClient;
}

export type NexoraServiceContextInput = Pick<
  NexoraServiceContext,
  'actorUserId' | 'tenantId' | 'sourceApp'
> &
  Partial<Pick<NexoraServiceContext, 'correlationId' | 'supabase'>>;

/** Factory template for consistent context construction across all five apps. */
export function createServiceContext(input: NexoraServiceContextInput): NexoraServiceContext {
  return {
    actorUserId: input.actorUserId,
    tenantId: input.tenantId,
    sourceApp: input.sourceApp,
    correlationId: input.correlationId ?? generateCorrelationId(),
    supabase: input.supabase,
  };
}
