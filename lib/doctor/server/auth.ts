import {
  DEV_DOCTOR_ACCOUNTS,
  findDevAccountById,
  type DevDoctorAccount,
} from '@/lib/doctor/auth/dev-auth';
import { verifyAccessToken } from '@/lib/auth/jwt';

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

  return {
    doctorId: payload.sub,
    userId: payload.sub,
    hospitalId: payload.hospitalId ?? DEV_DOCTOR_ACCOUNTS[0].hospitalId,
    email: payload.email,
    fullName: payload.fullName,
    role: 'CONSULTANT',
  };
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
  }

  return DEV_DOCTOR_ACCOUNTS[0] ? devAccountToSession(DEV_DOCTOR_ACCOUNTS[0]) : null;
}

export async function requireDoctorSession(request?: Request): Promise<DoctorSession> {
  const session = await getDoctorSession(request);
  if (!session) throw new Error('UNAUTHORIZED');
  return session;
}

export async function getAdminSession(request?: Request): Promise<AdminSession | null> {
  const token = bearerToken(request);
  if (!token) return null;

  const payload = await verifyAccessToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;

  return {
    adminId: payload.sub,
    email: payload.email,
    fullName: payload.fullName,
    role: payload.sub === 'dev-admin' ? 'ENTREPRENEUR' : 'ADMIN',
    hospitalId: payload.hospitalId,
  };
}

export async function requireAdminSession(request?: Request): Promise<AdminSession> {
  const session = await getAdminSession(request);
  if (!session) throw new Error('UNAUTHORIZED');
  return session;
}
