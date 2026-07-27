export const runtime = 'edge';

import { NextResponse } from 'next/server';

import { getDoctorSession } from '@/lib/doctor/server/auth';
import { findDevAccountById } from '@/lib/doctor/auth/dev-auth';
import { apiError } from '@/lib/doctor/server/api-http';

/** Returns the active dev session profile (from x-doctor-id header). */
export async function GET(request: Request) {
  const session = await getDoctorSession(request);
  if (!session) return apiError('Unauthorized', 401);

  const dev = findDevAccountById(session.doctorId);
  return NextResponse.json({
    success: true,
    session: {
      ...session,
      fullName: dev?.fullName ?? session.fullName,
      specialization: dev?.specialization,
      licenseNumber: dev?.licenseNumber,
    },
  });
}
