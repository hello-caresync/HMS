export const runtime = 'edge';

export const dynamic = 'force-static';

import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({ success: true });
}
