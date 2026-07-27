import { NextResponse } from 'next/server';

import { acknowledgeNotification, listNotifications } from '@/lib/doctor/server/clinical-service';
import { requireDoctorSession } from '@/lib/doctor/server/auth';
import { apiError } from '@/lib/doctor/server/api-http';
import { withDoctorHandler } from '@/lib/doctor/server/route-handler';

export const GET = withDoctorHandler(async (session) => listNotifications(session));

export async function POST(request: Request) {
  try {
    const session = await requireDoctorSession(request);
    const body = await request.json();
    const id = body?.id as string | undefined;
    if (!id) return apiError('id required', 400);
    const result = await acknowledgeNotification(session, id);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError(msg, 500);
  }
}
