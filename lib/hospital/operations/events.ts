import type { SupabaseClient } from '@supabase/supabase-js';

import { emitEcosystemSystemEvent } from '@/lib/ecosystem/messaging-service';

import type { SystemEventType } from './types';

export async function emitSystemEvent(
  supabase: SupabaseClient,
  eventType: SystemEventType,
  payload: Record<string, unknown>,
  options?: { severity?: 'info' | 'warning' | 'critical'; targetRoles?: string[] },
) {
  await emitEcosystemSystemEvent(supabase, {
    event_type: eventType,
    source_app: 'hospital',
    payload,
    severity: options?.severity ?? 'info',
    target_roles: options?.targetRoles ?? ['hospital', 'doctor', 'patient', 'vendor'],
  });

  await supabase.from('ecosystem_activity').insert({
    event_type: eventType.toLowerCase().replace(/_/g, '.'),
    actor_role: 'hospital',
    message: String(payload.message ?? eventType),
    related_id: payload.relatedId ? String(payload.relatedId) : null,
    metadata: payload,
  }).then(({ error: actErr }) => {
    if (actErr) console.warn('[ecosystem_activity]', actErr.message);
  });
}
