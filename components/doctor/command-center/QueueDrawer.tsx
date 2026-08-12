'use client';

import Link from 'next/link';
import { X, Clock, Activity } from 'lucide-react';
import { useCommandCenterStore } from '@/lib/doctor/command-center/store';
import type { OpdToken } from '@/lib/doctor/command-center/types';
import { ccClasses } from '@/lib/doctor/command-center/theme';

function statusBadge(status: OpdToken['status']) {
  if (status === 'IN_CONSULTATION') return 'bg-[#2A9D8F]/15 text-[#2A9D8F]';
  if (status === 'CALLED') return 'bg-[#20639B]/15 text-[#20639B]';
  if (status === 'COMPLETED') return 'bg-[#2E8B70]/15 text-[#2E8B70]';
  return 'bg-[#E8F1F8] text-[#173F5F]';
}

export function QueueDrawer({ tokens }: { tokens: OpdToken[] }) {
  const open = useCommandCenterStore((s) => s.queueDrawerOpen);
  const setOpen = useCommandCenterStore((s) => s.setQueueDrawerOpen);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E8F1F8] px-5 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#20639B]" />
            <h2 className="font-black text-[#173F5F]">Live SmartQ Stream</h2>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-[#E8F1F8]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {tokens.length === 0 ? (
            <p className="text-center text-sm font-semibold text-[#5A7A94]">No tokens in queue.</p>
          ) : (
            tokens.map((t) => (
              <div key={t.id} className={`p-4 ${ccClasses.cardSoft}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#20639B]">#{t.token_number}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${statusBadge(t.status)}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="mt-1 font-black text-[#173F5F]">{t.patient_name}</p>
                <p className="text-xs font-semibold text-[#5A7A94]">
                  {t.chief_complaint || 'General consultation'}
                </p>
                {t.status === 'IN_CONSULTATION' && (
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#2A9D8F]">
                    <Activity className="h-3 w-3 animate-pulse" /> On Deck
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-[#E8F1F8] p-4">
          <Link href="/doctor/queue/" className={`${ccClasses.btnPrimary} w-full`}>
            Open SmartQ Engine
          </Link>
        </div>
      </div>
    </div>
  );
}
