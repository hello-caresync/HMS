import { NextResponse } from 'next/server';

import { AppointmentType } from '@prisma/client';

import { apiError, parseJsonArray, resolveDoctorId } from '@/lib/doctor/server/api-helpers';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const doctorId = await resolveDoctorId(request);
    const appointment = await prisma.appointment.findFirst({
      where: {
        doctorId,
        appointmentType: AppointmentType.TELEMEDICINE,
        scheduledAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      include: {
        patient: true,
        telemedicineSessions: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    if (!appointment) {
      return NextResponse.json({ success: true, session: null });
    }

    const transcript =
      appointment.telemedicineSessions[0]?.chatTranscriptJson ?? [];

    return NextResponse.json({
      success: true,
      session: {
        appointmentId: appointment.id,
        patient: {
          id: appointment.patient.id,
          fullName: appointment.patient.fullName,
          mrn: appointment.patient.mrn,
          age: appointment.patient.age,
          gender: appointment.patient.gender,
          bloodGroup: appointment.patient.bloodGroup,
          allergies: parseJsonArray(appointment.patient.allergiesJson),
          chronicConditions: parseJsonArray(appointment.patient.chronicConditionsJson),
        },
        roomId: appointment.telemedicineSessions[0]?.roomId ?? `TELE-${appointment.patient.mrn}`,
        transcript,
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'NO_DOCTOR') {
      return apiError('No doctor profile configured', 503);
    }
    console.error(e);
    return apiError('Failed to load telemedicine session');
  }
}
