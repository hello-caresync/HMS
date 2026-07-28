import { getEmrTimeline } from '@/lib/doctor/server/clinical-service';
import { withDoctorHandler } from '@/lib/doctor/server/route-handler';

export const GET = withDoctorHandler(async (session, request) => {
  const patientId = new URL(request.url).searchParams.get('patientId');
  if (!patientId) throw new Error('NOT_FOUND');
  return getEmrTimeline(session, patientId);
});
