import { approveIpdDischarge } from '@/lib/doctor/server/care-center-service';
import { withDoctorHandler } from '@/lib/doctor/server/route-handler';

export const POST = withDoctorHandler(async (session, request) => {
  const body = (await request.json()) as {
    admissionId: string;
    patientId: string;
    summary: string;
    followUp?: string;
  };
  return approveIpdDischarge(session, body);
});
