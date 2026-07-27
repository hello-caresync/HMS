export const runtime = 'edge';

import { saveIpdProgressNote } from '@/lib/doctor/server/care-center-service';
import { withDoctorHandler } from '@/lib/doctor/server/route-handler';

export const POST = withDoctorHandler(async (session, request) => {
  const body = (await request.json()) as {
    admissionId: string;
    note: { s: string; o: string; a: string; p: string };
  };
  return saveIpdProgressNote(session, body);
});
