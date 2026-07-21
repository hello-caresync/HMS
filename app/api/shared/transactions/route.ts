export const runtime = 'edge';

import { NextResponse } from 'next/server';

import type { SharedTransactionInput } from '@/lib/shared/types/transaction';

/**
 * POST /api/shared/transactions
 * Headless entry point for the cross-app automation pipeline.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SharedTransactionInput & {
      actorUserId: string;
      tenantId: string;
      sourceApp: 'admin' | 'hospital' | 'vendor' | 'patient' | 'operations';
    };

    const { actorUserId, tenantId, sourceApp, ...transactionInput } = body;

    if (!actorUserId || !tenantId || !sourceApp) {
      return NextResponse.json(
        { success: false, errors: ['actorUserId, tenantId, and sourceApp are required'] },
        { status: 400 },
      );
    }

    const [{ processSharedTransaction }, { createServiceContext }, { createNextServerSupabaseClient }] =
      await Promise.all([
        import('@/lib/shared/pipeline/processSharedTransaction'),
        import('@/lib/shared/types/context'),
        import('@/lib/shared/client/next-server'),
      ]);

    let supabase;
    try {
      supabase = await createNextServerSupabaseClient();
    } catch {
      supabase = undefined;
    }

    const ctx = createServiceContext({
      actorUserId,
      tenantId,
      sourceApp,
      supabase,
    });

    const result = await processSharedTransaction(transactionInput, ctx);

    return NextResponse.json(result, { status: result.success ? 200 : 422 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, errors: [message] }, { status: 500 });
  }
}
