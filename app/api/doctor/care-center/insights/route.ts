export const runtime = 'edge';

import { getCareCenterInsights } from '@/lib/doctor/server/care-center-service';
import { withDoctorHandler } from '@/lib/doctor/server/route-handler';

export const GET = withDoctorHandler(async (session) => getCareCenterInsights(session));
