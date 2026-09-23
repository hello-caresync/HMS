import { NextResponse } from 'next/server';

import { dispensePrescription } from '@/lib/hospital/operations/pharmacy';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      prescriptionId?: string;
      inventoryItemId?: string;
      quantity?: number;
      dispensedBy?: string;
    };

    if (!body.prescriptionId || !body.inventoryItemId || !body.quantity) {
      return NextResponse.json(
        { error: 'prescriptionId, inventoryItemId, and quantity are required' },
        { status: 400 },
      );
    }

    const supabase = createServerSupabase();
    const result = await dispensePrescription(supabase, {
      prescriptionId: body.prescriptionId,
      inventoryItemId: body.inventoryItemId,
      quantity: body.quantity,
      dispensedBy: body.dispensedBy,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Dispense failed';
    console.error('[api/pharmacy/dispense]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
