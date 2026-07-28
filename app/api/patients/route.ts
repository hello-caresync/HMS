import { listPatients } from '@/lib/doctor/server/clinical-service';
import { withDoctorHandler } from '@/lib/doctor/server/route-handler';

export const GET = withDoctorHandler(async (session, request) => {
  const { searchParams } = new URL(request.url);
  return listPatients(session, {
    search: searchParams.get('search') ?? undefined,
    page: parseInt(searchParams.get('page') ?? '1', 10),
    limit: parseInt(searchParams.get('limit') ?? '20', 10),
    favorites: searchParams.get('favorites') === 'true',
  });
});
