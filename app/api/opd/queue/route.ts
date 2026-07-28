import { updateAppointmentStatus } from '@/lib/doctor/server/clinical-service';
import { appointmentUpdateSchema } from '@/lib/doctor/validation/schemas';
import { requireDoctorSession } from '@/lib/doctor/server/auth';
import { getOpdQueue } from '@/lib/doctor/server/clinical-service';
import { apiError } from '@/lib/doctor/server/api-http';
import { withDoctorHandler } from '@/lib/doctor/server/route-handler';
import { NextResponse } from 'next/server';

export const GET = withDoctorHandler(async (session) => getOpdQueue(session));

export async function PATCH(request: Request) {
  try {
    const session = await requireDoctorSession(request);
    const body = await request.json();
    const appointmentId = body?.appointmentId as string | undefined;
    if (!appointmentId) return apiError('appointmentId required', 400);

    const parsed = appointmentUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const result = await updateAppointmentStatus(session, appointmentId, parsed.data.status);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError(msg, 500);
  }
}
