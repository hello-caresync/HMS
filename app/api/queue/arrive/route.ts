import { NextResponse } from 'next/server';

import { verifyAppointmentArrival } from '@/lib/queue/arrival-verification';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      appointmentId?: string;
      currentTimeStr?: string;
    };

    if (!body.appointmentId?.trim()) {
      return NextResponse.json({ error: 'appointmentId is required' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const result = await verifyAppointmentArrival(supabase, {
      appointmentId: body.appointmentId.trim(),
      currentTimeStr: body.currentTimeStr,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'Arrival verification failed' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Arrival verification failed';
    console.error('[api/queue/arrive]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
