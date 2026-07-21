export const runtime = 'edge';

import { NextResponse } from 'next/server';

import { ClinicalOrderStatus, LabUrgency } from '@prisma/client';

import { apiError, resolveDoctorId } from '@/lib/doctor/server/api-helpers';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    if (!patientId) {
      return apiError('patientId query required', 400);
    }

    const orders = await prisma.labOrder.findMany({
      where: { patientId },
      orderBy: { id: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, orders });
  } catch (e) {
    console.error(e);
    return apiError('Failed to fetch lab orders');
  }
}

export async function POST(request: Request) {
  try {
    const doctorId = await resolveDoctorId(request);
    const body = await request.json();
    const { encounterId, patientId, tests, urgency } = body;

    if (!encounterId || !patientId) {
      return apiError('encounterId and patientId required', 400);
    }

    const order = await prisma.labOrder.create({
      data: {
        encounterId,
        patientId,
        doctorId,
        testCodesJson: tests ?? [],
        urgency: urgency === 'STAT' ? LabUrgency.STAT : LabUrgency.NORMAL,
        status: ClinicalOrderStatus.ORDERED,
      },
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === 'NO_DOCTOR') {
      return apiError('No doctor profile configured', 503);
    }
    console.error(e);
    return apiError('Failed to create lab order');
  }
}
