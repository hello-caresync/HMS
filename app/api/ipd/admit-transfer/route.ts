import { NextResponse } from 'next/server';

import { admitOrTransferPatient } from '@/lib/hospital/operations/ipd';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      bedId?: string;
      patientName?: string;
      patientId?: string;
      action?: 'admit' | 'transfer' | 'discharge';
      fromBedId?: string;
    };

    if (!body.bedId || !body.action) {
      return NextResponse.json({ error: 'bedId and action are required' }, { status: 400 });
    }

    if (body.action !== 'discharge' && !body.patientName?.trim()) {
      return NextResponse.json({ error: 'patientName is required for admit/transfer' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const result = await admitOrTransferPatient(supabase, {
      bedId: body.bedId,
      patientName: body.patientName?.trim() ?? '',
      patientId: body.patientId,
      action: body.action,
      fromBedId: body.fromBedId,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'IPD action failed';
    console.error('[api/ipd/admit-transfer]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
