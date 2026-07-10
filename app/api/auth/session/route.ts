import { NextResponse } from 'next/server';

import { IDLE_THRESHOLD_MS } from '../../../lib/security/constants';
import {
  registerServerSession,
  resolveServerSession,
  revokeServerSession,
  touchServerSession,
} from '../../../lib/security/server/sessionRegistry';
import type { SessionPingRequest, SessionPingResponse } from '../../../lib/security/types';

function isExpired(expiresAt: string): boolean {
  return Date.now() >= new Date(expiresAt).getTime();
}

function isIdle(lastActivityAt: string): boolean {
  return Date.now() - new Date(lastActivityAt).getTime() > IDLE_THRESHOLD_MS;
}

export async function GET(request: Request): Promise<NextResponse<SessionPingResponse>> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return NextResponse.json(
      { valid: false, reason: 'NOT_FOUND', serverTime: new Date().toISOString() },
      { status: 401 },
    );
  }

  const session = resolveServerSession(token);
  if (!session) {
    return NextResponse.json(
      { valid: false, reason: 'INVALID_TOKEN', serverTime: new Date().toISOString() },
      { status: 401 },
    );
  }

  if (isExpired(session.expiresAt)) {
    revokeServerSession(token);
    return NextResponse.json(
      { valid: false, reason: 'EXPIRED', serverTime: new Date().toISOString() },
      { status: 401 },
    );
  }

  if (isIdle(session.lastActivityAt)) {
    revokeServerSession(token);
    return NextResponse.json(
      { valid: false, reason: 'IDLE_TIMEOUT', serverTime: new Date().toISOString() },
      { status: 401 },
    );
  }

  const remainingMs = new Date(session.expiresAt).getTime() - Date.now();
  return NextResponse.json({
    valid: true,
    expiresAt: session.expiresAt,
    serverTime: new Date().toISOString(),
    remainingMs,
    idleBreached: false,
  });
}

export async function POST(request: Request): Promise<NextResponse<SessionPingResponse>> {
  let body: SessionPingRequest;

  try {
    body = (await request.json()) as SessionPingRequest;
  } catch {
    return NextResponse.json(
      { valid: false, reason: 'NOT_FOUND', serverTime: new Date().toISOString() },
      { status: 400 },
    );
  }

  const { activeToken, employeeId, lastActivityAt } = body;

  if (!activeToken || !employeeId) {
    return NextResponse.json(
      { valid: false, reason: 'NOT_FOUND', serverTime: new Date().toISOString() },
      { status: 400 },
    );
  }

  let session = resolveServerSession(activeToken);

  if (!session) {
    registerServerSession(
      {
        employeeId,
        activeToken,
        assignedRole: body.assignedRole ?? 'hospital_admin',
        expiresAt: body.expiresAt ?? new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      },
      lastActivityAt,
    );
    session = resolveServerSession(activeToken);
  } else {
    session = touchServerSession(activeToken, lastActivityAt);
  }

  if (!session) {
    return NextResponse.json(
      { valid: false, reason: 'INVALID_TOKEN', serverTime: new Date().toISOString() },
      { status: 401 },
    );
  }

  if (session.employeeId !== employeeId) {
    return NextResponse.json(
      { valid: false, reason: 'INVALID_TOKEN', serverTime: new Date().toISOString() },
      { status: 401 },
    );
  }

  if (isExpired(session.expiresAt)) {
    revokeServerSession(activeToken);
    return NextResponse.json(
      { valid: false, reason: 'EXPIRED', serverTime: new Date().toISOString() },
      { status: 401 },
    );
  }

  if (isIdle(lastActivityAt)) {
    revokeServerSession(activeToken);
    return NextResponse.json(
      { valid: false, reason: 'IDLE_TIMEOUT', serverTime: new Date().toISOString() },
      { status: 401 },
    );
  }

  const remainingMs = new Date(session.expiresAt).getTime() - Date.now();
  return NextResponse.json({
    valid: true,
    expiresAt: session.expiresAt,
    serverTime: new Date().toISOString(),
    remainingMs,
    idleBreached: false,
  });
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
  if (token) revokeServerSession(token);
  return NextResponse.json({ ok: true });
}
