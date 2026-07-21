import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export async function resolveDoctorId(request: Request): Promise<string> {
  const header = request.headers.get('x-doctor-id');
  if (header) return header;

  if (process.env.DEFAULT_DOCTOR_ID) {
    return process.env.DEFAULT_DOCTOR_ID;
  }

  const doctor = await prisma.doctor.findFirst({ select: { id: true } });
  if (!doctor) {
    throw new Error('NO_DOCTOR');
  }
  return doctor.id;
}

export function apiError(message: string, status = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string');
  }
  return [];
}
