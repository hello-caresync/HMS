import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const drugs = await prisma.formularyDrug.findMany({ orderBy: { brand: 'asc' } });
    return NextResponse.json({
      success: true,
      drugs: drugs.map((d) => ({
        id: d.id,
        brand: d.brand,
        generic: d.generic,
        route: d.route,
        interactsWith: Array.isArray(d.interactsWith) ? d.interactsWith : [],
        allergyConflict: Array.isArray(d.allergyConflict) ? d.allergyConflict : [],
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: 'Failed to load formulary' }, { status: 500 });
  }
}
