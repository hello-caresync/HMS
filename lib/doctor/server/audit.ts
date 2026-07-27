import type { Prisma } from '@prisma/client';

import { getPrisma } from '@/lib/prisma';

import type { DoctorSession } from './auth';

export async function writeAuditLog(input: {
  session: DoctorSession;
  entityType: string;
  entityId: string;
  action: string;
  payload?: Record<string, unknown>;
  ipAddress?: string;
}) {
  const prisma = await getPrisma();
  await prisma.auditLog.create({
    data: {
      doctorId: input.session.doctorId,
      hospitalId: input.session.hospitalId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      payloadJson: (input.payload ?? {}) as Prisma.InputJsonValue,
      ipAddress: input.ipAddress,
    },
  });
}

export function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string');
  }
  return [];
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
