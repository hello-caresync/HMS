import {
  approveIpdDischarge,
  completeOpdConsultation,
  getCareCenterInsights,
  getIpdCareCenter,
  getOpdCareCenter,
  requestAdmissionFromOpd,
  saveIpdProgressNote,
  startOpdConsultation,
} from '@/lib/doctor/server/care-center-service';
import { withDoctorHandler } from '@/lib/doctor/server/route-handler';

export const GET = withDoctorHandler(async (session) => getOpdCareCenter(session));
