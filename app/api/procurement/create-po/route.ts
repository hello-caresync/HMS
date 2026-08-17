import { NextResponse } from 'next/server';

import { createPurchaseOrder, scanLowStockAndCreatePo, verifyGoodsReceipt } from '@/lib/hospital/operations/procurement';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: 'create_po' | 'auto_reorder' | 'verify_grn';
      vendorId?: string;
      vendorName?: string;
      itemDetails?: string;
      totalCost?: number;
      inventoryItemId?: string;
      quantityOrdered?: number;
      purchaseOrderId?: string;
      quantityReceived?: number;
      verifiedBy?: string;
    };

    const supabase = createServerSupabase();

    if (body.action === 'verify_grn') {
      if (!body.purchaseOrderId || !body.inventoryItemId || !body.quantityReceived) {
        return NextResponse.json(
          { error: 'purchaseOrderId, inventoryItemId, quantityReceived required for GRN' },
          { status: 400 },
        );
      }
      const result = await verifyGoodsReceipt(supabase, {
        purchaseOrderId: body.purchaseOrderId,
        inventoryItemId: body.inventoryItemId,
        quantityReceived: body.quantityReceived,
        verifiedBy: body.verifiedBy,
      });
      return NextResponse.json(result);
    }

    if (body.action === 'auto_reorder') {
      const result = await scanLowStockAndCreatePo(
        supabase,
        body.vendorId,
        body.vendorName,
      );
      return NextResponse.json(result);
    }

    if (!body.vendorId || !body.vendorName || !body.itemDetails || body.totalCost == null) {
      return NextResponse.json(
        { error: 'vendorId, vendorName, itemDetails, totalCost required' },
        { status: 400 },
      );
    }

    const result = await createPurchaseOrder(supabase, {
      vendorId: body.vendorId,
      vendorName: body.vendorName,
      itemDetails: body.itemDetails,
      totalCost: body.totalCost,
      inventoryItemId: body.inventoryItemId,
      quantityOrdered: body.quantityOrdered,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Procurement action failed';
    console.error('[api/procurement/create-po]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
