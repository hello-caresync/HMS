import { DEFAULT_REGAL_DOCTOR, type RegalDoctor } from './regal-doctors';
import { DOCTOR_STORAGE_KEYS, readJsonStorage, writeJsonStorage } from './storage-keys';

export type DoctorSession = {
  employeeId: string;
  fullName: string;
  doctor_name: string;
  department: string;
  loginIdentifier?: string;
  email?: string;
  specialization?: string;
  qualification?: string;
  opdRoom?: string;
  consultationFee?: number;
  fee: number;
  hospitalId?: string;
  hospitalName: string;
  signedInAt: string;
};

export const REGAL_HOSPITAL_ID = 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
export const DOCTOR_SESSION_CHANGED_EVENT = 'nexora:doctor-session-changed';

export function doctorToSession(doctor: RegalDoctor, email?: string): DoctorSession {
  return {
    employeeId: doctor.employeeId,
    fullName: doctor.name,
    doctor_name: doctor.name,
    department: doctor.department,
    email,
    specialization: doctor.specialization,
    qualification: doctor.specialization,
    consultationFee: doctor.fee,
    fee: doctor.fee,
    hospitalId: REGAL_HOSPITAL_ID,
    hospitalName: 'Regal Hospital',
    signedInAt: new Date().toISOString(),
  };
}

export function getActiveDoctorSession(): DoctorSession | null {
  if (typeof window === 'undefined') return null;

  const active = readJsonStorage<DoctorSession | null>(DOCTOR_STORAGE_KEYS.doctorSession, null);
  if (active) {
    return {
      ...active,
      doctor_name: active.doctor_name ?? active.fullName,
      hospitalName: active.hospitalName ?? 'Regal Hospital',
      signedInAt: active.signedInAt ?? new Date().toISOString(),
      fee: active.fee ?? active.consultationFee ?? 0,
      qualification: active.qualification ?? active.specialization,
    };
  }

  const legacy = readJsonStorage<DoctorSession | null>(
    DOCTOR_STORAGE_KEYS.legacyDoctorSession,
    null,
  );
  if (legacy) {
    const migrated = {
      ...legacy,
      doctor_name: legacy.doctor_name ?? legacy.fullName,
      hospitalName: legacy.hospitalName ?? 'Regal Hospital',
      signedInAt: legacy.signedInAt ?? new Date().toISOString(),
      fee: legacy.fee ?? legacy.consultationFee ?? 0,
      qualification: legacy.qualification ?? legacy.specialization,
    };
    writeJsonStorage(DOCTOR_STORAGE_KEYS.doctorSession, migrated);
    return migrated;
  }

  return null;
}

export function getDoctorSession(): DoctorSession {
  return getActiveDoctorSession() ?? doctorToSession(DEFAULT_REGAL_DOCTOR);
}

export function setDoctorSession(session: DoctorSession): void {
  writeJsonStorage(DOCTOR_STORAGE_KEYS.doctorSession, session);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DOCTOR_SESSION_CHANGED_EVENT, { detail: session }));
  }
}

export function clearDoctorSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DOCTOR_STORAGE_KEYS.doctorSession);
  localStorage.removeItem(DOCTOR_STORAGE_KEYS.activeDoctor);
  localStorage.removeItem(DOCTOR_STORAGE_KEYS.legacyDoctorSession);
  window.dispatchEvent(new CustomEvent(DOCTOR_SESSION_CHANGED_EVENT, { detail: null }));
}
