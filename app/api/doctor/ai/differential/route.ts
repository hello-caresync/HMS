export const runtime = 'edge';

import { NextResponse } from 'next/server';

import { requireDoctorSession } from '@/lib/doctor/server/auth';
import { MOCK_AI_DIFFERENTIALS, MOCK_PATIENTS } from '@/lib/mock-data';

export async function POST(request: Request) {
  try {
    await requireDoctorSession(request);
    const body = await request.json();
    const complaint = String(body.complaint ?? '');

    const patientId = body.patientId as string | undefined;
    let contextBoost = 0;
    if (patientId) {
      const patient = MOCK_PATIENTS.find((p) => p.id === patientId);
      if (patient?.chronicConditions.length) contextBoost = 0.03;
    }

    const results = MOCK_AI_DIFFERENTIALS.map((d, i) => ({
      ...d,
      confidence: Math.min(
        0.95,
        d.confidence + (complaint.toLowerCase().includes('chest') ? 0.05 : 0) + contextBoost - i * 0.02,
      ),
    }));

    return NextResponse.json({ success: true, results });
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
}
