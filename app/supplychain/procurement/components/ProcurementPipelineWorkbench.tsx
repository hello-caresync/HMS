'use client';

import { useCallback, useState } from 'react';
import { ShoppingCart } from 'lucide-react';

import {
  SEED_PURCHASE_ORDER,
  SEED_PURCHASE_REQUESTS,
  advancePipelineStage,
  type PurchaseRequestRow,
} from '../../../lib/supplychain';
import GoodsReceiptValidationSheet from './GoodsReceiptValidationSheet';
import PurchaseRequestGrid from './PurchaseRequestGrid';

export default function ProcurementPipelineWorkbench() {
  const [requests, setRequests] = useState<PurchaseRequestRow[]>(SEED_PURCHASE_REQUESTS);
  const [verificationComplete, setVerificationComplete] = useState(false);

  const handleAdvanceStage = useCallback((requestId: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.requestId === requestId ? { ...r, stage: advancePipelineStage(r.stage) } : r,
      ),
    );
  }, []);

  const handleVerificationComplete = useCallback(() => {
    setVerificationComplete(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        'curasync:grn-finance-handoff',
        JSON.stringify({
          poReferenceId: SEED_PURCHASE_ORDER.poReferenceId,
          amount: SEED_PURCHASE_ORDER.grandTotal,
          passedAt: new Date().toISOString(),
        }),
      );
    }
    window.setTimeout(() => setVerificationComplete(false), 5000);
  }, []);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="border-b-2 border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-sky-700" />
          <div>
            <h1 className="text-lg font-black text-slate-900">Procurement Order Pipeline</h1>
            <p className="text-xs text-slate-800">
              Phase 6 · Module 18 · Purchase requests &amp; goods receipt validation
            </p>
          </div>
        </div>
      </header>

      <PurchaseRequestGrid requests={requests} onAdvanceStage={handleAdvanceStage} />

      <GoodsReceiptValidationSheet
        purchaseOrder={SEED_PURCHASE_ORDER}
        onComplete={handleVerificationComplete}
        completed={verificationComplete}
      />
    </div>
  );
}
