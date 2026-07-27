export const runtime = 'edge';

import { completeOpdConsultation } from '@/lib/doctor/server/care-center-service';
import { withDoctorHandler } from '@/lib/doctor/server/route-handler';

export const POST = withDoctorHandler(async (session, request) => {
  const body = (await request.json()) as {
    appointmentId: string;
    patientId: string;
    chiefComplaint: string;
    soapNotes?: Record<string, unknown>;
    diagnosisIcd10?: unknown[];
    sendPrescription?: boolean;
  };
  return completeOpdConsultation(session, body);
});
