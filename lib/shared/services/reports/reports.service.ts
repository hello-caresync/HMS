import type { NexoraServiceContext } from '../../types/context';
import type { ServiceResult } from '../../types/common';
import { ok } from '../../types/common';

export interface ReportSnapshotRef {
  snapshotId: string;
  dimension: string;
  generatedAt: string;
}

/** packages/shared/services/reports */
export async function enqueueReportSnapshot(
  dimension: string,
  ctx: NexoraServiceContext,
): Promise<ServiceResult<ReportSnapshotRef>> {
  return ok({
    snapshotId: `RPT-${ctx.correlationId}`,
    dimension,
    generatedAt: new Date().toISOString(),
  });
}
