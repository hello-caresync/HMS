export const runtime = 'edge';

import { NextResponse } from 'next/server';

import { apiError, resolveDoctorId } from '@/lib/doctor/server/api-helpers';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const prisma = await getPrisma();
    const doctorId = await resolveDoctorId(request);
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const end = new Date();
    end.setDate(end.getDate() + 14);

    const [appointments, surgeries] = await Promise.all([
      prisma.appointment.findMany({
        where: { doctorId, scheduledAt: { gte: start, lte: end } },
        include: { patient: true },
      }),
      prisma.surgery.findMany({
        where: { surgeonDoctorId: doctorId, scheduledTime: { gte: start, lte: end } },
        include: { patient: true },
      }),
    ]);

    const events = [
      ...appointments.map((a) => ({
        id: a.id,
        title:
          a.appointmentType === 'TELEMEDICINE'
            ? `Tele · ${a.patient.fullName}`
            : a.appointmentType === 'FOLLOWUP'
              ? `Follow-up · ${a.patient.fullName}`
              : `OPD · ${a.patient.fullName}`,
        type: a.appointmentType === 'TELEMEDICINE' ? ('TELE' as const) : ('OPD' as const),
        start: a.scheduledAt.toISOString(),
        end: new Date(a.scheduledAt.getTime() + 30 * 60000).toISOString(),
        location: a.appointmentType === 'TELEMEDICINE' ? 'Virtual' : 'Clinic 2',
      })),
      ...surgeries.map((s) => ({
        id: s.id,
        title: s.procedureName,
        type: 'OT' as const,
        start: s.scheduledTime.toISOString(),
        end: new Date(s.scheduledTime.getTime() + 2 * 3600000).toISOString(),
        location: s.otRoom,
      })),
    ];

    return NextResponse.json({ success: true, events });
  } catch (e) {
    if (e instanceof Error && e.message === 'NO_DOCTOR') {
      return apiError('No doctor profile configured', 503);
    }
    console.error(e);
    return apiError('Failed to load calendar');
  }
}
