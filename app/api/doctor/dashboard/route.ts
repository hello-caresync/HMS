import {
  getDashboardStats,
  getOpdQueue,
  listEmergencyCases,
  listIpdAdmissions,
  listNotifications,
} from '@/lib/doctor/server/clinical-service';
import { withDoctorHandler } from '@/lib/doctor/server/route-handler';

export const GET = withDoctorHandler(async (session, request) => {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get('section');

  if (section === 'stats') return getDashboardStats(session);
  if (section === 'queue') return getOpdQueue(session);
  if (section === 'ipd') return listIpdAdmissions(session);
  if (section === 'emergency') return listEmergencyCases(session);
  if (section === 'notifications') return listNotifications(session);

  const [stats, queue, ipd, emergency, notifications] = await Promise.all([
    getDashboardStats(session),
    getOpdQueue(session),
    listIpdAdmissions(session),
    listEmergencyCases(session),
    listNotifications(session),
  ]);

  return { ...stats, ...queue, ...ipd, ...emergency, ...notifications };
});
