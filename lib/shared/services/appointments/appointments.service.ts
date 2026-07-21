import type { NexoraServiceContext } from '../../types/context';
import type { ServiceResult } from '../../types/common';
import { ok } from '../../types/common';

export interface AppointmentChargeContext {
  appointmentId: string;
  doctorId: string;
  department: string;
  scheduledAt: string;
}

/** packages/shared/services/appointments */
export async function resolveAppointmentBillingContext(
  appointmentId: string,
  ctx: NexoraServiceContext,
): Promise<ServiceResult<AppointmentChargeContext>> {
  return ok({
    appointmentId,
    doctorId: 'DOC-PLACEHOLDER',
    department: 'General Medicine',
    scheduledAt: new Date().toISOString(),
  });
}
