export const runtime = 'edge';

import { getCalendarEvents } from '@/lib/doctor/server/clinical-service';
import { withDoctorHandler } from '@/lib/doctor/server/route-handler';

export const GET = withDoctorHandler(async (session) => getCalendarEvents(session));
