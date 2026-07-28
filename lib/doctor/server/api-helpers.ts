import { DEV_DOCTOR_ACCOUNTS } from '@/lib/doctor/auth/dev-auth';

export { apiError, parseJsonArray } from './api-http';

export async function resolveDoctorId(request: Request): Promise<string> {
  const header = request.headers.get('x-doctor-id');
  if (header) return header;

  if (process.env.DEFAULT_DOCTOR_ID) {
    return process.env.DEFAULT_DOCTOR_ID;
  }

  return DEV_DOCTOR_ACCOUNTS[0]?.id ?? '00000000-0000-4000-a000-000000000101';
}
