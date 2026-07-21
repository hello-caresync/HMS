import { NextResponse } from 'next/server';

import { apiError, resolveDoctorId } from '@/lib/doctor/server/api-helpers';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    await resolveDoctorId(request);

    const [alerts, statLabs] = await Promise.all([
      prisma.emergencyAlert.findMany({ orderBy: { createdAt: 'desc' }, take: 30 }),
      prisma.labOrder.findMany({
        where: { urgency: 'STAT' },
        orderBy: { id: 'desc' },
        take: 20,
        include: { patient: true },
      }),
    ]);

    const feed = [
      ...alerts.map((a) => ({
        id: a.id,
        category: 'EMERGENCY' as const,
        title: a.title,
        body: a.body,
        at: a.createdAt.toISOString(),
        patientId: a.patientId ?? undefined,
        acknowledged: a.acknowledged,
      })),
      ...statLabs.map((l) => ({
        id: l.id,
        category: 'CRITICAL_LAB' as const,
        title: 'STAT lab order',
        body: `Tests ordered for ${l.patient.fullName}`,
        at: new Date().toISOString(),
        patientId: l.patientId,
        acknowledged: false,
      })),
    ].sort((a, b) => (a.at < b.at ? 1 : -1));

    return NextResponse.json({ success: true, notifications: feed });
  } catch (e) {
    if (e instanceof Error && e.message === 'NO_DOCTOR') {
      return apiError('No doctor profile configured', 503);
    }
    console.error(e);
    return apiError('Failed to load notifications');
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, acknowledged } = await request.json();
    if (!id) return apiError('id required', 400);

    await prisma.emergencyAlert.updateMany({
      where: { id },
      data: { acknowledged: !!acknowledged },
    });

    return NextResponse.json({ success: true, id, acknowledged });
  } catch (e) {
    console.error(e);
    return apiError('Failed to update notification');
  }
}
