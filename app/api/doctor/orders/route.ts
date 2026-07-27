export const runtime = 'edge';

import { listClinicalOrders } from '@/lib/doctor/server/clinical-service';
import { withDoctorHandler } from '@/lib/doctor/server/route-handler';

export const GET = withDoctorHandler(async (session) => listClinicalOrders(session));
