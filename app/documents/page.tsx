'use client';

import { useState } from 'react';
import { FileText, FolderOpen, ShieldCheck } from 'lucide-react';

type DocTemplate = {
  id: string;
  title: string;
  description: string;
};

const TEMPLATES: DocTemplate[] = [
  { id: 'ref', title: 'Referral Letters', description: 'Specialist referral with clinical summary' },
  { id: 'med', title: 'Medical Certificates', description: 'Sick leave · fitness for duty' },
  { id: 'fit', title: 'Fitness Certificates', description: 'Pre-employment · sports clearance' },
  { id: 'consent', title: 'Procedure Consent Forms', description: 'Informed consent · risks · witnesses' },
];

export default function DocumentsPage() {
  const [selected, setSelected] = useState<DocTemplate | null>(null);

  return (
    <div className="min-h-screen w-full font-sans text-slate-950">
      <div className="w-full space-y-5 p-4 sm:p-6 lg:p-8">
        <header className="flex w-full flex-col gap-4 border-b-2 border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Document Hub</h1>
            <p className="mt-1 text-sm font-medium text-slate-800">
              Printable templates · referral · certificates · consent · sandbox · 13 Jul 2026
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase text-slate-950">
            <ShieldCheck className="h-4 w-4 text-emerald-700" aria-hidden />
            <span>DOC_VAULT_READY</span>
          </div>
        </header>

        <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelected(tpl)}
                className={`rounded-xl border-2 p-4 text-left transition-all hover:scale-[1.02] ${
                  selected?.id === tpl.id
                    ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900 ring-offset-2'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <FolderOpen className="h-5 w-5 text-slate-950" aria-hidden />
                <p className="mt-2 text-sm font-black text-slate-950">{tpl.title}</p>
                <p className="mt-1 text-xs font-bold text-slate-800">{tpl.description}</p>
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-5">
            <h2 className="text-sm font-black text-slate-950">Document Preview</h2>
            {selected ? (
              <article className="mt-4 space-y-3 rounded-lg border-2 border-slate-200 bg-slate-50 p-4">
                <p className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-800">
                  <FileText className="h-4 w-4" aria-hidden />
                  Nexora Clinical · Sandbox
                </p>
                <p className="text-lg font-black text-slate-950">{selected.title}</p>
                <p className="text-sm font-bold text-slate-950">Patient · P.N. · UHID NX-2026-301882</p>
                <p className="text-xs font-bold leading-relaxed text-slate-800">
                  {selected.description}. Generated 13 Jul 2026 · authorized signatory Dr. Aishwarya D S, MD.
                </p>
              </article>
            ) : (
              <p className="mt-4 text-sm font-bold text-slate-800">Select a template to preview.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
