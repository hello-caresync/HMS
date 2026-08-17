import { NextResponse } from 'next/server';

import { registerEmergencyTriage } from '@/lib/hospital/operations/emergency';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      patientName?: string;
      patientId?: string;
      chiefComplaint?: string;
      priority?: 'P1' | 'P2' | 'P3';
      vitals?: Record<string, unknown>;
    };

    if (!body.patientName?.trim() || !body.chiefComplaint?.trim() || !body.priority) {
      return NextResponse.json(
        { error: 'patientName, chiefComplaint, and priority (P1|P2|P3) are required' },
        { status: 400 },
      );
    }

    const supabase = createServerSupabase();
    const result = await registerEmergencyTriage(supabase, {
      patientName: body.patientName.trim(),
      patientId: body.patientId,
      chiefComplaint: body.chiefComplaint.trim(),
      priority: body.priority,
      vitals: body.vitals,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Triage registration failed';
    console.error('[api/emergency/triage]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
