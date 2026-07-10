'use client';

import Link from 'next/link';
import { ArrowLeft, ScanLine } from 'lucide-react';

import { APP_ROUTES } from '../../lib/routes';
import RadiologyQueueTable from './RadiologyQueueTable';

export default function RadiologyWorkspace() {
  return (
    <div className="min-h-screen bg-[#e8eaed]">
      {/* Dark workstation header bar */}
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-slate-800 bg-[#0a0e14] px-4">
        <div className="flex items-center gap-3">
          <Link
            href={APP_ROUTES.dashboard}
            className="rounded p-1 text-slate-800 hover:bg-slate-800 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-cyan-500" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-800">
                PACS · Phase 8
              </p>
              <h1 className="text-sm font-bold text-white">Radiology Command Center</h1>
            </div>
          </div>
        </div>
        <span className="hidden rounded bg-cyan-950 px-2 py-0.5 font-mono text-[10px] text-cyan-400 sm:inline">
          NEXORA-RIS v1.0
        </span>
      </header>

      <main className="mx-auto max-w-6xl p-3 sm:p-4">
        <RadiologyQueueTable />
      </main>
    </div>
  );
}
