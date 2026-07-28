import {
  createAppointmentSlot,
  getDoctorProfile,
  getDoctorSchedule,
  updateDoctorProfile,
} from '@/lib/doctor/server/clinical-service';
import { withDoctorHandler } from '@/lib/doctor/server/route-handler';
import { requireDoctorSession } from '@/lib/doctor/server/auth';
import { apiError } from '@/lib/doctor/server/api-http';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const GET = withDoctorHandler(async (session, request) => {
  const url = new URL(request.url);
  const from = url.searchParams.get('from') ?? undefined;
  const to = url.searchParams.get('to') ?? undefined;
  return getDoctorSchedule(session, from, to);
});

export async function POST(request: Request) {
  try {
    const session = await requireDoctorSession(request);
    const body = await request.json();
    const schema = z.object({
      patientId: z.string().uuid(),
      scheduledAt: z.string().datetime(),
      appointmentType: z.enum(['OPD', 'TELEMEDICINE', 'FOLLOWUP', 'WALK_IN']),
      chiefComplaint: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const result = await createAppointmentSlot(session, parsed.data);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    if (msg === 'SCHEDULE_CONFLICT') return apiError('Schedule conflict detected', 409);
    return apiError(msg, 500);
  }
}
