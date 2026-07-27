export const runtime = 'edge';

import { listMessageChannels } from '@/lib/doctor/server/clinical-service';
import { withDoctorHandler } from '@/lib/doctor/server/route-handler';

export const GET = withDoctorHandler(async (session) => listMessageChannels(session));
