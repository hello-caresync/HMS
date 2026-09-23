import { NextResponse } from 'next/server';

import { callNextInterleavedPatient, previewNextInterleavedPatient } from '@/lib/queue/call-next';
import { currentTimeHHmm } from '@/lib/queue/interleavingEngine';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const doctorId = url.searchParams.get('doctorId') || undefined;
    const hospitalId = url.searchParams.get('hospitalId') || undefined;
    const supabase = createServerSupabase();

    let query = supabase.from('appointments').select('*').order('created_at', { ascending: true });
    if (hospitalId) query = query.eq('hospital_id', hospitalId);
    const { data } = await query;

    const preview = previewNextInterleavedPatient(
      (data ?? []) as Record<string, unknown>[],
      currentTimeHHmm(),
    );

    return NextResponse.json({
      ...preview,
      doctorId: doctorId || null,
      hospitalId: hospitalId || null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to preview next patient';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      doctorId?: string;
      hospitalId?: string;
      currentTimeStr?: string;
      lastServedType?: 'appointment' | 'walk_in';
    };

    const supabase = createServerSupabase();
    const result = await callNextInterleavedPatient(supabase, {
      doctorId: body.doctorId,
      hospitalId: body.hospitalId,
      currentTimeStr: body.currentTimeStr,
      lastServedType: body.lastServedType,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'Failed to call next patient' }, { status: 400 });
    }

    if (!result.nextPatient) {
      return NextResponse.json({ ...result, message: 'No arrived patients are ready to call' });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to call next patient';
    console.error('[api/queue/next]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
