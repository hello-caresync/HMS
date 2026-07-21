import type { NexoraServiceContext } from '../../types/context';
import type { ServiceResult } from '../../types/common';
import { ok } from '../../types/common';

export interface DispatchNotificationInput {
  channel: 'email' | 'sms' | 'in_app';
  templateId: string;
  recipientId: string;
  payload: Record<string, unknown>;
}

export interface NotificationDispatchResult {
  notificationId: string;
  queuedAt: string;
  channel: DispatchNotificationInput['channel'];
}

/** packages/shared/services/notifications */
export async function dispatchNotification(
  input: DispatchNotificationInput,
  ctx: NexoraServiceContext,
): Promise<ServiceResult<NotificationDispatchResult>> {
  return ok({
    notificationId: `ntf-${ctx.correlationId}`,
    queuedAt: new Date().toISOString(),
    channel: input.channel,
  });
}
