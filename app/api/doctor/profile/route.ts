export const runtime = 'edge';

import { getDoctorProfile, updateDoctorProfile } from '@/lib/doctor/server/clinical-service';
import { withDoctorHandler } from '@/lib/doctor/server/route-handler';
import { requireDoctorSession } from '@/lib/doctor/server/auth';
import { apiError } from '@/lib/doctor/server/api-http';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const GET = withDoctorHandler(async (session) => getDoctorProfile(session));

export async function PUT(request: Request) {
  try {
    const session = await requireDoctorSession(request);
    const body = await request.json();
    const schema = z.object({
      specialization: z.string().optional(),
      consultationFees: z.number().optional(),
      workingHoursJson: z.record(z.string(), z.string()).optional(),
      notificationPrefs: z.record(z.string(), z.boolean()).optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const result = await updateDoctorProfile(session, parsed.data);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError(msg, 500);
  }
}
