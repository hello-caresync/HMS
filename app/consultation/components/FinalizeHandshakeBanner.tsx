'use client';

import { CheckCircle2, CreditCard, Pill, X } from 'lucide-react';

import { CLINICAL } from '../lib/theme';
import type { FinalizeHandshake } from '../types';

type FinalizeHandshakeBannerProps = {
  handshake: FinalizeHandshake;
  onDismiss: () => void;
};

export default function FinalizeHandshakeBanner({
  handshake,
  onDismiss,
}: FinalizeHandshakeBannerProps) {
  const signedTime = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(handshake.signedAt));

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#2c3e50]/30 backdrop-blur-[2px]" onClick={onDismiss} aria-hidden />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 animate-fadeIn rounded-2xl border p-5 shadow-2xl"
        style={{ borderColor: '#c8ebe0', backgroundColor: CLINICAL.panel }}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: CLINICAL.mintLight }}
            >
              <CheckCircle2 className="h-5 w-5" style={{ color: CLINICAL.mint }} />
            </span>
            <div>
              <h2 className="text-base font-bold" style={{ color: CLINICAL.text }}>
                Consultation Finalized
              </h2>
              <p className="text-[11px]" style={{ color: CLINICAL.textSubtle }}>
                Signed at {signedTime}
              </p>
            </div>
          </div>
          <button type="button" onClick={onDismiss} className="rounded-lg p-1 text-slate-800 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-sm leading-relaxed" style={{ color: CLINICAL.charcoal }}>
          {handshake.message}
        </p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div
            className="rounded-xl border px-3 py-2.5"
            style={{ borderColor: '#c8ebe0', backgroundColor: CLINICAL.mintSoft }}
          >
            <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase" style={{ color: CLINICAL.mint }}>
              <Pill className="h-3 w-3" />
              Pharmacy Sub-system
            </p>
            <p className="font-mono text-xs font-bold" style={{ color: CLINICAL.text }}>
              {handshake.pharmacyLogId}
            </p>
            <p className="text-[10px]" style={{ color: CLINICAL.textSubtle }}>
              {handshake.prescriptionCount} Rx line(s) locked & routed
            </p>
          </div>
          <div
            className="rounded-xl border px-3 py-2.5"
            style={{ borderColor: '#cce8f0', backgroundColor: '#e8f6fa' }}
          >
            <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase text-[#2c6e82]">
              <CreditCard className="h-3 w-3" />
              OPD Billing Ledger
            </p>
            <p className="font-mono text-xs font-bold text-[#2c3e50]">
              {handshake.billingLedgerId}
            </p>
            <p className="text-[10px] text-[#6a9aad]">
              Auto-synced to central billing integration
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: CLINICAL.mint }}
        >
          Acknowledge & Close
        </button>
      </div>
    </>
  );
}
