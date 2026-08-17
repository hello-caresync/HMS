import { NextResponse } from 'next/server';

import { checkInAppointment, transitionAppointmentStatus } from '@/lib/hospital/operations/opd';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      appointmentId?: string;
      status?: 'checked_in' | 'in_consultation' | 'completed';
    };

    if (!body.appointmentId) {
      return NextResponse.json({ error: 'appointmentId is required' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const result = body.status && body.status !== 'checked_in'
      ? await transitionAppointmentStatus(supabase, {
          appointmentId: body.appointmentId,
          status: body.status,
        })
      : await checkInAppointment(supabase, { appointmentId: body.appointmentId });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Check-in failed';
    console.error('[api/appointments/check-in]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
