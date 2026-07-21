import { NextResponse } from 'next/server';

import { ClinicalOrderStatus, EncounterStatus, LabUrgency } from '@prisma/client';

import { apiError, resolveDoctorId } from '@/lib/doctor/server/api-helpers';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const doctorId = await resolveDoctorId(request);
    const alerts = await prisma.emergencyAlert.findMany({
      where: { OR: [{ doctorId }, { doctorId: null }] },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { patient: true },
    });

    return NextResponse.json({
      success: true,
      cases: alerts.map((a) => ({
        id: a.id,
        patientId: a.patientId,
        esiLevel: a.esiLevel,
        patientName: a.patient?.fullName ?? a.title,
        mrn: a.patient?.mrn ?? '—',
        presentation: a.body,
        bay: a.bay ?? 'ER',
        statOrdersPending: a.esiLevel <= 2 ? 2 : 0,
        vitals: { bp: '—', hr: '—', gcs: '15' },
        acknowledged: a.acknowledged,
      })),
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'NO_DOCTOR') {
      return apiError('No doctor profile configured', 503);
    }
    console.error(e);
    return apiError('Failed to load emergency cases');
  }
}

export async function POST(request: Request) {
  try {
    const doctorId = await resolveDoctorId(request);
    const body = await request.json();
    const {
      patientId,
      esiLevel,
      title,
      body: alertBody,
      bay,
      statLabTests,
      statRadiology,
      traumaNotes,
    } = body;

    let encounterId = body.encounterId as string | undefined;

    if (!encounterId && patientId) {
      const enc = await prisma.encounter.create({
        data: {
          doctorId,
          patientId,
          chiefComplaint: title ?? 'Emergency presentation',
          hpi: traumaNotes ?? '',
          diagnosisIcd10Json: [],
          physicalExamJson: {},
          soapNotesJson: { trauma: traumaNotes ?? '' },
          status: EncounterStatus.IN_PROGRESS,
        },
      });
      encounterId = enc.id;
    }

    const alert = await prisma.emergencyAlert.create({
      data: {
        doctorId,
        patientId: patientId ?? null,
        esiLevel: esiLevel ?? 2,
        title: title ?? 'Emergency assessment',
        body: alertBody ?? traumaNotes ?? 'STAT workflow triggered',
        bay: bay ?? 'Trauma Bay',
      },
    });

    let labOrder = null;
    let radiologyOrder = null;

    if (encounterId && patientId) {
      if (statLabTests?.length) {
        labOrder = await prisma.labOrder.create({
          data: {
            encounterId,
            patientId,
            doctorId,
            testCodesJson: statLabTests,
            urgency: LabUrgency.STAT,
            status: ClinicalOrderStatus.ORDERED,
          },
        });
      }
      if (statRadiology) {
        radiologyOrder = await prisma.radiologyOrder.create({
          data: {
            encounterId,
            patientId,
            doctorId,
            modality: statRadiology.modality ?? 'CT',
            bodyPart: statRadiology.bodyPart ?? 'Chest',
            urgency: LabUrgency.STAT,
            imageUrlsJson: [],
            status: ClinicalOrderStatus.ORDERED,
          },
        });
      }
    }

    return NextResponse.json(
      { success: true, alert, labOrder, radiologyOrder },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof Error && e.message === 'NO_DOCTOR') {
      return apiError('No doctor profile configured', 503);
    }
    console.error(e);
    return apiError('Failed to process emergency request');
  }
}
