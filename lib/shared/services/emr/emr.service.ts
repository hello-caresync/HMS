import type { NexoraServiceContext } from '../../types/context';
import type { ServiceResult } from '../../types/common';
import { ok } from '../../types/common';

export interface EmrRecordRef {
  patientId: string;
  encounterId: string;
  recordType: 'soap' | 'prescription' | 'diagnosis';
}

/** packages/shared/services/emr */
export async function linkEncounterToTransaction(
  ref: EmrRecordRef,
  transactionId: string,
  ctx: NexoraServiceContext,
): Promise<ServiceResult<{ linked: true }>> {
  return ok({ linked: true });
}
