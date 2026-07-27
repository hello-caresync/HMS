import {
  DEV_DOCTOR_ACCOUNTS,
  findDevAccountById,
  type DevDoctorAccount,
} from '@/lib/doctor/auth/dev-auth';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getPrisma } from '@/lib/prisma';

export type DoctorSession = {
  doctorId: string;
  userId: string;
  hospitalId: string;
  email: string;
  fullName: string;
  role: string;
};

export type AdminSession = {
  adminId: string;
  email: string;
  fullName: string;
  role: string;
  hospitalId?: string;
};

function devAccountToSession(account: DevDoctorAccount): DoctorSession {
  return {
    doctorId: account.id,
    userId: account.userId,
    hospitalId: account.hospitalId,
    email: account.email,
    fullName: account.fullName,
    role: account.role,
  };
}

function bearerToken(request?: Request): string | null {
  const header = request?.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

async function sessionFromJwt(token: string): Promise<DoctorSession | null> {
  const payload = await verifyAccessToken(token);
  if (!payload || payload.role !== 'DOCTOR') return null;

  const dev = findDevAccountById(payload.sub);
  if (dev) return devAccountToSession(dev);

  try {
    const prisma = await getPrisma();
    const doctor = await prisma.doctor.findFirst({
      where: { id: payload.sub, deletedAt: null },
    });
    if (!doctor) return null;
    return {
      doctorId: doctor.id,
      userId: doctor.userId,
      hospitalId: doctor.hospitalId,
      email: doctor.email,
      fullName: doctor.fullName,
      role: doctor.role,
    };
  } catch {
    return null;
  }
}

export async function getDoctorSession(request?: Request): Promise<DoctorSession | null> {
  const token = bearerToken(request);
  if (token) {
    const jwtSession = await sessionFromJwt(token);
    if (jwtSession) return jwtSession;
  }

  const doctorId = request?.headers.get('x-doctor-id');
  const email = request?.headers.get('x-doctor-email')?.toLowerCase().trim();

  if (doctorId) {
    const dev = findDevAccountById(doctorId);
    if (dev) return devAccountToSession(dev);
  }

  if (email) {
    const dev = DEV_DOCTOR_ACCOUNTS.find((a) => a.email.toLowerCase() === email);
    if (dev) return devAccountToSession(dev);

    try {
      const prisma = await getPrisma();
      const doctor = await prisma.doctor.findFirst({
        where: { email, deletedAt: null },
      });
      if (doctor) {
        return {
          doctorId: doctor.id,
          userId: doctor.userId,
          hospitalId: doctor.hospitalId,
          email: doctor.email,
          fullName: doctor.fullName,
          role: doctor.role,
        };
      }
    } catch {
      // DB unavailable — dev map already tried above
    }
  }

  return null;
}

export async function requireDoctorSession(request?: Request): Promise<DoctorSession> {
  const session = await getDoctorSession(request);
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

export async function getAdminSession(request?: Request): Promise<AdminSession | null> {
  const token = bearerToken(request);
  if (!token) return null;

  const payload = await verifyAccessToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;

  if (payload.sub === 'dev-admin') {
    return {
      adminId: 'dev-admin',
      email: payload.email,
      fullName: payload.fullName,
      role: 'ENTREPRENEUR',
    };
  }

  try {
    const prisma = await getPrisma();
    const admin = await prisma.systemAdmin.findFirst({
      where: { id: payload.sub, deletedAt: null },
    });
    if (!admin) return null;
    return {
      adminId: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      hospitalId: admin.hospitalId ?? undefined,
    };
  } catch {
    return null;
  }
}

export async function requireAdminSession(request?: Request): Promise<AdminSession> {
  const session = await getAdminSession(request);
  if (!session) throw new Error('UNAUTHORIZED');
  return session;
}
