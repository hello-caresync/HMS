import { getPrisma } from '@/lib/prisma';

export { apiError, parseJsonArray } from './api-http';

export async function resolveDoctorId(request: Request): Promise<string> {
  const header = request.headers.get('x-doctor-id');
  if (header) return header;

  if (process.env.DEFAULT_DOCTOR_ID) {
    return process.env.DEFAULT_DOCTOR_ID;
  }

  const prisma = await getPrisma();
  const doctor = await prisma.doctor.findFirst({ select: { id: true } });
  if (!doctor) {
    throw new Error('NO_DOCTOR');
  }
  return doctor.id;
}
