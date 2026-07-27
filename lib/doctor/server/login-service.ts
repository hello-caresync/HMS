import { findDevAccount } from '@/lib/doctor/auth/dev-auth';
import { signAccessToken } from '@/lib/auth/jwt';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { getPrisma } from '@/lib/prisma';

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

  try {
    const prisma = await getPrisma();

    const [doctor, admin] = await Promise.all([
      prisma.doctor.findFirst({ where: { email: normalized, deletedAt: null } }),
      prisma.systemAdmin.findFirst({ where: { email: normalized, deletedAt: null } }),
    ]);

    if (!doctor && admin?.passwordHash) {
      const adminValid = await verifyPassword(password, admin.passwordHash);
      if (adminValid) {
        return {
          ok: false,
          error: { code: 'NO_DOCTOR_PRIVILEGES', message: NO_DOCTOR_MSG },
        };
      }
    }

    if (!doctor?.passwordHash) {
      return {
        ok: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      };
    }

    const valid = await verifyPassword(password, doctor.passwordHash);
    if (!valid) {
      return {
        ok: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      };
    }

    const accessToken = await signAccessToken({
      sub: doctor.id,
      email: doctor.email,
      role: 'DOCTOR',
      hospitalId: doctor.hospitalId,
      fullName: doctor.fullName,
    });

    return {
      ok: true,
      accessToken,
      user: {
        doctorId: doctor.id,
        userId: doctor.userId,
        hospitalId: doctor.hospitalId,
        email: doctor.email,
        fullName: doctor.fullName,
        specialization: doctor.specialization,
        role: doctor.role,
        licenseNumber: doctor.licenseNumber,
      },
    };
  } catch {
    return {
      ok: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
    };
  }
}

export async function authenticateAdmin(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const devPassword = process.env.ADMIN_DEV_PASSWORD ?? '123456';
  const devEmail = process.env.ADMIN_DEV_EMAIL ?? 'admin@curasync.com';

  try {
    const prisma = await getPrisma();
    const admin = await prisma.systemAdmin.findFirst({
      where: { email: normalized, deletedAt: null },
    });

    if (admin) {
      const valid = await verifyPassword(password, admin.passwordHash);
      if (!valid) return null;
      const accessToken = await signAccessToken({
        sub: admin.id,
        email: admin.email,
        role: 'ADMIN',
        hospitalId: admin.hospitalId ?? undefined,
        fullName: admin.fullName,
      });
      return {
        accessToken,
        user: {
          adminId: admin.id,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
          hospitalId: admin.hospitalId ?? undefined,
        },
      };
    }

    if (normalized === devEmail.toLowerCase() && password === devPassword) {
      const accessToken = await signAccessToken({
        sub: 'dev-admin',
        email: devEmail,
        role: 'ADMIN',
        fullName: 'Platform Administrator',
      });
      return {
        accessToken,
        user: {
          adminId: 'dev-admin',
          email: devEmail,
          fullName: 'Platform Administrator',
          role: 'ENTREPRENEUR',
        },
      };
    }
  } catch {
    if (normalized === devEmail.toLowerCase() && password === devPassword) {
      const accessToken = await signAccessToken({
        sub: 'dev-admin',
        email: devEmail,
        role: 'ADMIN',
        fullName: 'Platform Administrator',
      });
      return {
        accessToken,
        user: {
          adminId: 'dev-admin',
          email: devEmail,
          fullName: 'Platform Administrator',
          role: 'ENTREPRENEUR',
        },
      };
    }
  }

  return null;
}

export async function hashDoctorPassword(plain: string) {
  return hashPassword(plain);
}
