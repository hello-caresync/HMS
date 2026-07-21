export const runtime = 'edge';

import { NextResponse } from 'next/server';

import { DischargeStatus } from '@prisma/client';

import { apiError, resolveDoctorId } from '@/lib/doctor/server/api-helpers';
import prisma from '@/lib/prisma';

type SoapNote = { at: string; author: string; s: string; o: string; a: string; p: string };

export async function GET(request: Request) {
  try {
    const doctorId = await resolveDoctorId(request);
    const admissions = await prisma.ipdAdmission.findMany({
      where: { doctorId, status: DischargeStatus.ADMITTED },
      include: { patient: true },
      orderBy: { wardName: 'asc' },
    });
    return NextResponse.json({ success: true, admissions });
  } catch (e) {
    if (e instanceof Error && e.message === 'NO_DOCTOR') {
      return apiError('No doctor profile configured', 503);
    }
    console.error(e);
    return apiError('Failed to fetch IPD admissions');
  }
}

export async function POST(request: Request) {
  try {
    const doctorId = await resolveDoctorId(request);
    const body = await request.json();
    const { admissionId, soap } = body as { admissionId: string; soap: Partial<SoapNote> };

    if (!admissionId || !soap) {
      return apiError('admissionId and soap required', 400);
    }

    const admission = await prisma.ipdAdmission.findFirst({
      where: { id: admissionId, doctorId },
    });
    if (!admission) {
      return apiError('Admission not found', 404);
    }

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    const notes = Array.isArray(admission.dailyProgressNotesJson)
      ? (admission.dailyProgressNotesJson as SoapNote[])
      : [];

    const entry: SoapNote = {
      at: new Date().toISOString(),
      author: doctor?.fullName ?? 'Attending',
      s: soap.s ?? '',
      o: soap.o ?? '',
      a: soap.a ?? '',
      p: soap.p ?? '',
    };

    const updated = await prisma.ipdAdmission.update({
      where: { id: admissionId },
      data: { dailyProgressNotesJson: [entry, ...notes] },
    });

    return NextResponse.json({
      success: true,
      message: 'SOAP Note saved!',
      admission: updated,
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'NO_DOCTOR') {
      return apiError('No doctor profile configured', 503);
    }
    console.error(e);
    return apiError('Failed to save SOAP note');
  }
}

export async function PUT(request: Request) {
  try {
    const doctorId = await resolveDoctorId(request);
    const body = await request.json();
    const { admissionId, status, wardName, bedNumber } = body;

    if (!admissionId) {
      return apiError('admissionId required', 400);
    }

    const updated = await prisma.ipdAdmission.update({
      where: { id: admissionId, doctorId },
      data: {
        ...(status ? { status: status as DischargeStatus } : {}),
        ...(wardName ? { wardName } : {}),
        ...(bedNumber ? { bedNumber } : {}),
      },
    });

    return NextResponse.json({ success: true, admission: updated });
  } catch (e) {
    if (e instanceof Error && e.message === 'NO_DOCTOR') {
      return apiError('No doctor profile configured', 503);
    }
    console.error(e);
    return apiError('Failed to update admission');
  }
}
