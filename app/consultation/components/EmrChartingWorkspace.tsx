'use client';

import { useState } from 'react';
import { FileText, Microscope, Pill } from 'lucide-react';

import DiagnosticEngine from './DiagnosticEngine';
import OrdersPrescriptionPanel from './OrdersPrescriptionPanel';
import SoapNotesSection from './SoapNotesSection';
import { CLINICAL } from '../lib/theme';

type EmrTab = 'notes' | 'diagnosis' | 'orders';

const TABS: { id: EmrTab; label: string; icon: typeof FileText }[] = [
  { id: 'notes', label: 'Clinical Notes', icon: FileText },
  { id: 'diagnosis', label: 'Diagnostic Engine', icon: Microscope },
  { id: 'orders', label: 'Orders & Rx', icon: Pill },
];

export default function EmrChartingWorkspace() {
  const [tab, setTab] = useState<EmrTab>('notes');

  return (
    <section
      className="flex min-h-0 flex-1 flex-col rounded-xl border shadow-sm"
      style={{ borderColor: CLINICAL.border, backgroundColor: CLINICAL.panel }}
    >
      <header
        className="flex flex-wrap items-center gap-1 border-b p-1.5"
        style={{ borderColor: CLINICAL.borderLight, backgroundColor: CLINICAL.header }}
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition ${
              tab === id
                ? 'bg-white shadow-sm'
                : 'hover:bg-white/60'
            }`}
            style={{ color: tab === id ? CLINICAL.mint : CLINICAL.textMuted }}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </header>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-3">
        {tab === 'notes' && <SoapNotesSection />}
        {tab === 'diagnosis' && <DiagnosticEngine />}
        {tab === 'orders' && <OrdersPrescriptionPanel />}
      </div>
    </section>
  );
}
