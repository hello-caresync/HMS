import { describe, expect, it } from 'vitest';

import { signAccessToken, verifyAccessToken } from '@/lib/auth/jwt';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { mapCalendarEventsToSessions } from '@/lib/doctor/schedule-utils';

describe('JWT auth', () => {
  it('signs and verifies doctor tokens', async () => {
    const token = await signAccessToken({
      sub: 'doc-1',
      email: 'doctor@test.com',
      role: 'DOCTOR',
      hospitalId: 'hosp-1',
      fullName: 'Dr Test',
    });
    const payload = await verifyAccessToken(token);
    expect(payload?.sub).toBe('doc-1');
    expect(payload?.role).toBe('DOCTOR');
  });
});

describe('Password hashing', () => {
  it('hashes and verifies passwords', async () => {
    const hash = await hashPassword('nexora123');
    expect(await verifyPassword('nexora123', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});

describe('Schedule mapping', () => {
  it('maps calendar API events to clinical sessions', () => {
    const weekStart = new Date('2026-07-27T00:00:00');
    const sessions = mapCalendarEventsToSessions(
      [
        {
          id: 'a1',
          title: 'OPD · Patient',
          type: 'OPD',
          start: '2026-07-27T09:00:00.000Z',
          end: '2026-07-27T09:30:00.000Z',
          location: 'Clinic',
          status: 'SCHEDULED',
        },
      ],
      weekStart,
    );
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions[0].category).toBe('opd');
  });
});
