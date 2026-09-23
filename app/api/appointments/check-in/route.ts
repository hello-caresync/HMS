import { NextResponse } from 'next/server';

import { checkInAppointment, transitionAppointmentStatus } from '@/lib/hospital/operations/opd';
import { verifyAppointmentArrival } from '@/lib/queue/arrival-verification';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      appointmentId?: string;
      status?: 'checked_in' | 'in_consultation' | 'completed';
      currentTimeStr?: string;
    };

    if (!body.appointmentId) {
      return NextResponse.json({ error: 'appointmentId is required' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    if (!body.status || body.status === 'checked_in') {
      const arrival = await verifyAppointmentArrival(supabase, {
        appointmentId: body.appointmentId,
        currentTimeStr: body.currentTimeStr,
      });
      if (!arrival.ok) {
        const fallback = await checkInAppointment(supabase, { appointmentId: body.appointmentId });
        return NextResponse.json({ ...fallback, arrival });
      }
      return NextResponse.json(arrival);
    }

    const result = await transitionAppointmentStatus(supabase, {
      appointmentId: body.appointmentId,
      status: body.status,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Check-in failed';
    console.error('[api/appointments/check-in]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
