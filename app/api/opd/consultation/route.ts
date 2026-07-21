export const runtime = 'edge';

import { NextResponse } from 'next/server';

import { AppointmentStatus, EncounterStatus } from '@/lib/doctor/clinical-enums';

import { apiError, resolveDoctorId } from '@/lib/doctor/server/api-helpers';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const prisma = await getPrisma();
    const doctorId = await resolveDoctorId(request);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: { gte: start, lt: end },
        status: { in: [AppointmentStatus.CHECKED_IN, AppointmentStatus.IN_CONSULT, AppointmentStatus.SCHEDULED] },
      },
      include: { patient: true },
      orderBy: { scheduledAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      queue: appointments.map((a, index) => ({
        id: a.id,
        token: `OPD-${100 + index}`,
        patientId: a.patientId,
        patientName: a.patient.fullName,
        chiefComplaint: 'Scheduled consultation',
        priority: a.appointmentType === 'FOLLOWUP' ? 'Follow-up' : 'Routine',
        waitMinutes: Math.max(0, Math.floor((Date.now() - a.scheduledAt.getTime()) / 60000)),
        appointmentStatus: a.status,
      })),
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'NO_DOCTOR') {
      return apiError('No doctor profile configured', 503);
    }
    console.error(e);
    return apiError('Failed to load OPD queue');
  }
}

export async function POST(request: Request) {
  try {
    const prisma = await getPrisma();
    const doctorId = await resolveDoctorId(request);
    const body = await request.json();
    const {
      appointmentId,
      patientId,
      chiefComplaint,
      hpi,
      diagnosisIcd10,
      physicalExam,
      treatmentPlan,
      soapNotes,
    } = body;

    if (!patientId) {
      return apiError('patientId required', 400);
    }

    const encounter = await prisma.$transaction(async (tx) => {
      const created = await tx.encounter.create({
        data: {
          appointmentId: appointmentId ?? null,
          doctorId,
          patientId,
          chiefComplaint: chiefComplaint ?? '',
          hpi: hpi ?? '',
          diagnosisIcd10Json: diagnosisIcd10 ?? [],
          physicalExamJson: physicalExam ?? {},
          soapNotesJson: soapNotes ?? { treatmentPlan: treatmentPlan ?? '' },
          status: EncounterStatus.COMPLETED,
        },
      });

      if (appointmentId) {
        await tx.appointment.update({
          where: { id: appointmentId },
          data: { status: AppointmentStatus.COMPLETED },
        });
      }

      return created;
    });

    return NextResponse.json({ success: true, encounter }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === 'NO_DOCTOR') {
      return apiError('No doctor profile configured', 503);
    }
    console.error(e);
    return apiError('Failed to save consultation');
  }
}
