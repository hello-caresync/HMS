/**
 * Nexora Doctor — development authentication (client-side).
 * Replace this module with Supabase Auth in production without changing UI shells.
 */

export const DEV_SESSION_STORAGE_KEY = 'nexora_doctor_dev_session';

export const DEV_HOSPITAL_ID = '00000000-0000-4000-a000-000000000001';

export type DevDoctorAccount = {
  id: string;
  userId: string;
  hospitalId: string;
  email: string;
  password: string;
  fullName: string;
  specialization: string;
  role: string;
  licenseNumber: string;
};

export type DevDoctorSession = {
  doctorId: string;
  userId: string;
  hospitalId: string;
  email: string;
  fullName: string;
  specialization: string;
  role: string;
  licenseNumber: string;
  rememberMe: boolean;
  signedInAt: string;
  accessToken?: string;
};

/** Demo accounts for local development */
export const DEV_DOCTOR_ACCOUNTS: DevDoctorAccount[] = [
  {
    id: '00000000-0000-4000-a000-000000000101',
    userId: 'dev-user-general',
    hospitalId: DEV_HOSPITAL_ID,
    email: 'hospital@curasync.com',
    password: '123456',
    fullName: 'Dr. Aishwarya D S',
    specialization: 'Internal Medicine · General Physician',
    role: 'CONSULTANT',
    licenseNumber: 'REG_NEX_MD_9021',
  },
  {
    id: '00000000-0000-4000-a000-000000000102',
    userId: 'dev-user-cardio',
    hospitalId: DEV_HOSPITAL_ID,
    email: 'doctor@nexora.com',
    password: 'doctor123',
    fullName: 'Dr. Rajesh Kumar',
    specialization: 'Cardiology · Interventional',
    role: 'CONSULTANT',
    licenseNumber: 'REG-NEX-CARD-002',
  },
  {
    id: '00000000-0000-4000-a000-000000000103',
    userId: 'dev-user-ortho',
    hospitalId: DEV_HOSPITAL_ID,
    email: 'ortho@nexora.com',
    password: 'doctor123',
    fullName: 'Dr. Meera Iyer',
    specialization: 'Orthopedic Surgery · Trauma',
    role: 'SURGEON',
    licenseNumber: 'REG-NEX-ORT-003',
  },
  {
    id: '00000000-0000-4000-a000-000000000104',
    userId: 'dev-user-peds',
    hospitalId: DEV_HOSPITAL_ID,
    email: 'pediatric@nexora.com',
    password: 'doctor123',
    fullName: 'Dr. Priya Menon',
    specialization: 'Pediatrics · Neonatology',
    role: 'CONSULTANT',
    licenseNumber: 'REG-NEX-PED-004',
  },
];

export const DEV_DEMO_ACCOUNT_LABELS = [
  { key: 'general', label: 'Doctor', account: DEV_DOCTOR_ACCOUNTS[0] },
  { key: 'cardio', label: 'Cardiologist', account: DEV_DOCTOR_ACCOUNTS[1] },
  { key: 'ortho', label: 'Orthopedic', account: DEV_DOCTOR_ACCOUNTS[2] },
  { key: 'pediatric', label: 'Pediatrician', account: DEV_DOCTOR_ACCOUNTS[3] },
] as const;

export function findDevAccount(email: string, password: string): DevDoctorAccount | null {
  const normalized = email.trim().toLowerCase();
  return (
    DEV_DOCTOR_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === normalized && a.password === password,
    ) ?? null
  );
}

export function findDevAccountById(doctorId: string): DevDoctorAccount | null {
  return DEV_DOCTOR_ACCOUNTS.find((a) => a.id === doctorId) ?? null;
}

export function accountToSession(account: DevDoctorAccount, rememberMe: boolean): DevDoctorSession {
  return {
    doctorId: account.id,
    userId: account.userId,
    hospitalId: account.hospitalId,
    email: account.email,
    fullName: account.fullName,
    specialization: account.specialization,
    role: account.role,
    licenseNumber: account.licenseNumber,
    rememberMe,
    signedInAt: new Date().toISOString(),
  };
}

function readRawSession(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem(DEV_SESSION_STORAGE_KEY) ??
    sessionStorage.getItem(DEV_SESSION_STORAGE_KEY)
  );
}

export function getDevSession(): DevDoctorSession | null {
  const raw = readRawSession();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DevDoctorSession;
    if (!parsed?.doctorId || !findDevAccountById(parsed.doctorId)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDevSession(session: DevDoctorSession): void {
  if (typeof window === 'undefined') return;
  const storage = session.rememberMe ? localStorage : sessionStorage;
  storage.setItem(DEV_SESSION_STORAGE_KEY, JSON.stringify(session));
  if (session.rememberMe) {
    sessionStorage.removeItem(DEV_SESSION_STORAGE_KEY);
  } else {
    localStorage.removeItem(DEV_SESSION_STORAGE_KEY);
  }
}

export function clearDevSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DEV_SESSION_STORAGE_KEY);
  sessionStorage.removeItem(DEV_SESSION_STORAGE_KEY);
}

export function devLogin(
  email: string,
  password: string,
  rememberMe: boolean,
): { ok: true; session: DevDoctorSession } | { ok: false; error: string } {
  const account = findDevAccount(email, password);
  if (!account) {
    return { ok: false, error: 'Invalid email or password.' };
  }
  const session = accountToSession(account, rememberMe);
  saveDevSession(session);
  return { ok: true, session };
}

/** JWT-backed login via API — preferred for production */
export async function apiLogin(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<{ ok: true; session: DevDoctorSession } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/doctor/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json()) as {
      success: boolean;
      accessToken?: string;
      user?: {
        doctorId: string;
        userId: string;
        hospitalId: string;
        email: string;
        fullName: string;
        specialization: string;
        role: string;
        licenseNumber: string;
      };
      error?: string;
    };

    if (!res.ok || !data.success || !data.user || !data.accessToken) {
      return { ok: false, error: data.error ?? 'Invalid email or password.' };
    }

    const session: DevDoctorSession = {
      ...data.user,
      rememberMe,
      signedInAt: new Date().toISOString(),
      accessToken: data.accessToken,
    };
    saveDevSession(session);
    return { ok: true, session };
  } catch {
    return devLogin(email, password, rememberMe);
  }
}

export function getDevSessionHeaders(): Record<string, string> {
  const session = getDevSession();
  if (!session) return {};
  const headers: Record<string, string> = {
    'x-doctor-id': session.doctorId,
    'x-doctor-email': session.email,
  };
  if (session.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return headers;
}
