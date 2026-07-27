import { startOpdConsultation } from '@/lib/doctor/server/care-center-service';
import { withDoctorHandler } from '@/lib/doctor/server/route-handler';

export const POST = withDoctorHandler(async (session, request) => {
  const body = (await request.json()) as { appointmentId: string };
  return startOpdConsultation(session, body.appointmentId);
});
