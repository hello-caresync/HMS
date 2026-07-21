export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      id: `rad-${Date.now()}`,
      status: 'ORDERED',
      pacs: 'PACS queue · preliminary read ETA 45 min (mock)',
      payload: body,
    });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
