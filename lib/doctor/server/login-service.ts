import { findDevAccount } from '@/lib/doctor/auth/dev-auth';
import { signAccessToken } from '@/lib/auth/jwt';
import { hashPassword } from '@/lib/auth/password';

export type DoctorLoginError = {
  code: 'INVALID_CREDENTIALS' | 'NO_DOCTOR_PRIVILEGES';
  message: string;
};

export type LoginResult = {
  accessToken: string;
  user: {
    doctorId: string;
    userId: string;
    hospitalId: string;
    email: string;
    fullName: string;
    specialization: string;
    role: string;
    licenseNumber: string;
  };
};

export type DoctorLoginResponse =
  | { ok: true; accessToken: string; user: LoginResult['user'] }
  | { ok: false; error: DoctorLoginError };

const NO_DOCTOR_MSG = 'Account found, but lacks Doctor privileges.';

const MOCK_ADMIN = {
  email: process.env.ADMIN_DEV_EMAIL ?? 'admin@curasync.com',
  password: process.env.ADMIN_DEV_PASSWORD ?? '123456',
};

export async function authenticateDoctor(email: string, password: string): Promise<DoctorLoginResponse> {
  const normalized = email.trim().toLowerCase();

  const dev = findDevAccount(normalized, password);
  if (dev) {
    const accessToken = await signAccessToken({
      sub: dev.id,
      email: dev.email,
      role: 'DOCTOR',
      hospitalId: dev.hospitalId,
      fullName: dev.fullName,
    });
    return {
      ok: true,
      accessToken,
      user: {
        doctorId: dev.id,
        userId: dev.userId,
        hospitalId: dev.hospitalId,
        email: dev.email,
        fullName: dev.fullName,
        specialization: dev.specialization,
        role: dev.role,
        licenseNumber: dev.licenseNumber,
      },
    };
  }

  if (normalized === MOCK_ADMIN.email.toLowerCase() && password === MOCK_ADMIN.password) {
    return {
      ok: false,
      error: { code: 'NO_DOCTOR_PRIVILEGES', message: NO_DOCTOR_MSG },
    };
  }

  return {
    ok: false,
    error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
  };
}

export async function authenticateAdmin(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const devEmail = MOCK_ADMIN.email.toLowerCase();

  if (normalized === devEmail && password === MOCK_ADMIN.password) {
    const accessToken = await signAccessToken({
      sub: 'dev-admin',
      email: MOCK_ADMIN.email,
      role: 'ADMIN',
      fullName: 'Platform Administrator',
    });
    return {
      accessToken,
      user: {
        adminId: 'dev-admin',
        email: MOCK_ADMIN.email,
        fullName: 'Platform Administrator',
        role: 'ENTREPRENEUR',
      },
    };
  }

  return null;
}

export async function hashDoctorPassword(plain: string) {
  return hashPassword(plain);
}
