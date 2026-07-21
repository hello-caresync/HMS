export const runtime = 'edge';

import { NextResponse } from 'next/server';

import { MOCK_AI_DIFFERENTIALS } from '@/lib/doctor/static/clinical-mocks';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const boosted = MOCK_AI_DIFFERENTIALS.map((d, i) => ({
      ...d,
      confidence: Math.min(
        0.95,
        d.confidence + (body.complaint?.includes('chest') ? 0.05 : 0) - i * 0.02,
      ),
    }));
    return NextResponse.json({ success: true, results: boosted });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
