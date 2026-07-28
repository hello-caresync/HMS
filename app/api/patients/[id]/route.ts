export const runtime = 'edge';

import { getPatientById } from '@/lib/doctor/server/clinical-service';
import { withDoctorHandler } from '@/lib/doctor/server/route-handler';

export const GET = withDoctorHandler(async (session, _request, ctx) => {
  const params = await ctx.params;
  const id = params?.id;
  if (!id) throw new Error('NOT_FOUND');
  return getPatientById(session, id);
});
