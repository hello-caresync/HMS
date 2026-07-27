export const runtime = 'edge';

import { getDashboardStats } from '@/lib/doctor/server/clinical-service';
import { withDoctorHandler } from '@/lib/doctor/server/route-handler';

export const GET = withDoctorHandler(async (session) => getDashboardStats(session));
