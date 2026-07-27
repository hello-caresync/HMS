export const runtime = 'edge';

import { saveEncounter } from '@/lib/doctor/server/clinical-service';
import { saveEncounterSchema } from '@/lib/doctor/validation/schemas';
import { requireDoctorSession } from '@/lib/doctor/server/auth';
import { apiError } from '@/lib/doctor/server/api-http';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await requireDoctorSession(request);
    const body = await request.json();
    const parsed = saveEncounterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const result = await saveEncounter(session, parsed.data);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    if (msg === 'FORBIDDEN') return apiError('Forbidden', 403);
    return apiError(msg, 500);
  }
}
