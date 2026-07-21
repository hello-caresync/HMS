export const runtime = 'edge';

import { NextResponse } from 'next/server';

import { ClinicalOrderStatus } from '@prisma/client';

import { apiError, resolveDoctorId } from '@/lib/doctor/server/api-helpers';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const doctorId = await resolveDoctorId(request);
    const body = await request.json();
    const { encounterId, patientId, medicines, digitalSignature, digitalSignatureApplied } = body;

    if (!encounterId || !patientId || !medicines?.length) {
      return apiError('Invalid prescription payload', 400);
    }

    const signature =
      digitalSignatureApplied || digitalSignature ? digitalSignature ?? 'VERIFIED' : null;

    const rx = await prisma.prescription.create({
      data: {
        encounterId,
        doctorId,
        patientId,
        medicinesJson: medicines,
        digitalSignature: signature,
        status: ClinicalOrderStatus.SENT_TO_PHARMACY,
      },
    });

    return NextResponse.json({
      success: true,
      id: rx.id,
      status: rx.status,
      digitalSignatureApplied: !!signature,
      message: 'Prescription dispatched to Pharmacy',
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'NO_DOCTOR') {
      return apiError('No doctor profile configured', 503);
    }
    console.error(e);
    return apiError('Failed to submit prescription');
  }
}
