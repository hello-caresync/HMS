export const runtime = 'edge';

import { requestAdmissionFromOpd } from '@/lib/doctor/server/care-center-service';
import { withDoctorHandler } from '@/lib/doctor/server/route-handler';

export const POST = withDoctorHandler(async (session, request) => {
  const body = (await request.json()) as {
    patientId: string;
    wardName: string;
    bedNumber: string;
    reason: string;
  };
  return requestAdmissionFromOpd(session, body);
});
