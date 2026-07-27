export const runtime = 'edge';

import { getPrisma } from '@/lib/prisma';
import { withDoctorHandler } from '@/lib/doctor/server/route-handler';

export const GET = withDoctorHandler(async (session) => {
  const prisma = await getPrisma();
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const appt = await prisma.appointment.findFirst({
    where: {
      doctorId: session.doctorId,
      appointmentType: 'TELEMEDICINE',
      scheduledAt: { gte: start },
      deletedAt: null,
    },
    include: { patient: true, telemedicineSessions: true },
    orderBy: { scheduledAt: 'asc' },
  });

  if (!appt) {
    return { session: null };
  }

  const tele = appt.telemedicineSessions[0];
  return {
    session: {
      appointmentId: appt.id,
      roomId: tele?.roomId ?? `TELE-${appt.patient.mrn}`,
      patient: {
        id: appt.patient.id,
        mrn: appt.patient.mrn,
        fullName: appt.patient.fullName,
        age: appt.patient.age,
        gender: appt.patient.gender,
        bloodGroup: appt.patient.bloodGroup,
        allergies: appt.patient.allergiesJson,
        chronicConditions: appt.patient.chronicConditionsJson,
      },
      transcript: tele?.chatTranscriptJson ?? [],
      status: tele?.status ?? 'PENDING',
    },
  };
});
