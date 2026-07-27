export const runtime = 'edge';

import { createIpdAdmission, listIpdAdmissions } from '@/lib/doctor/server/clinical-service';
import { ipdAdmissionSchema } from '@/lib/doctor/validation/schemas';
import { requireDoctorSession } from '@/lib/doctor/server/auth';
import { apiError } from '@/lib/doctor/server/api-http';
import { withDoctorHandler } from '@/lib/doctor/server/route-handler';
import { NextResponse } from 'next/server';

export const GET = withDoctorHandler(async (session) => listIpdAdmissions(session));

export async function POST(request: Request) {
  try {
    const session = await requireDoctorSession(request);
    const body = await request.json();
    const parsed = ipdAdmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const result = await createIpdAdmission(session, parsed.data);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError(msg, 500);
  }
}
