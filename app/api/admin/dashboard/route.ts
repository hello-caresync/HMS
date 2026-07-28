export const runtime = 'edge';

import { NextResponse } from 'next/server';

import { getEntrepreneurDashboard } from '@/lib/admin/server/admin-service';
import { requireAdminSession } from '@/lib/doctor/server/auth';
import { apiError } from '@/lib/doctor/server/api-http';

export async function GET(request: Request) {
  try {
    const session = await requireAdminSession(request);
    const result = await getEntrepreneurDashboard(session);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError(msg, 500);
  }
}
