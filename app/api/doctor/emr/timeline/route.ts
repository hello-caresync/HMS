import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    if (!patientId) {
      return NextResponse.json({ success: false, error: 'patientId required' }, { status: 400 });
    }

    const encounters = await prisma.encounter.findMany({
      where: { patientId },
      orderBy: { id: 'desc' },
      take: 30,
    });

    const events = encounters.map((e) => ({
      id: e.id,
      patientId: e.patientId,
      at: new Date().toISOString(),
      category: 'Encounter',
      title: e.chiefComplaint || 'Clinical encounter',
      summary: e.hpi?.slice(0, 120) ?? '',
    }));

    return NextResponse.json({ success: true, events });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: 'Failed to load timeline' }, { status: 500 });
  }
}
