export const runtime = 'edge';

import { NextResponse } from 'next/server';

import { STATIC_FORMULARY_DRUGS } from '@/lib/doctor/static/formulary';

export async function GET() {
  return NextResponse.json({
    success: true,
    drugs: STATIC_FORMULARY_DRUGS,
  });
}
