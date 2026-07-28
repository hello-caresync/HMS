import { NextResponse } from 'next/server';

import { requireDoctorSession } from '@/lib/doctor/server/auth';
import { apiError } from '@/lib/doctor/server/api-http';

type RouteContext = { params?: Promise<Record<string, string>> };

export function withDoctorHandler<T extends Record<string, unknown>>(
  handler: (
    session: Awaited<ReturnType<typeof requireDoctorSession>>,
    request: Request,
    ctx: RouteContext,
  ) => Promise<T>,
) {
  return async (request: Request, ctx: RouteContext) => {
    try {
      const session = await requireDoctorSession(request);
      const result = await handler(session, request, ctx);
      return NextResponse.json({ success: true, ...result });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Internal error';
      if (msg === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
      if (msg === 'FORBIDDEN') return apiError('Forbidden', 403);
      if (msg === 'NOT_FOUND') return apiError('Not found', 404);
      console.error('[doctor-api]', msg);
      return apiError(msg, 500);
    }
  };
}
