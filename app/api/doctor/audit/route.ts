export const runtime = 'edge';

import { getAuditLogs } from '@/lib/doctor/server/clinical-service';
import { withDoctorHandler } from '@/lib/doctor/server/route-handler';

export const GET = withDoctorHandler(async (session, request) => {
  const limit = parseInt(new URL(request.url).searchParams.get('limit') ?? '50', 10);
  return getAuditLogs(session, limit);
});
