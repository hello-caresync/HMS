'use client';

import { Check, ClipboardList, Clock, FileText, Pill, UtensilsCrossed } from 'lucide-react';

import { useIPD } from '../context/IPDProvider';
import type { IPDAdmission } from '../types';

export default function ClinicalShiftConsole() {
  const { selectedAdmissionId, getAdmission, logMarAdministration } = useIPD();
  const admission = selectedAdmissionId ? getAdmission(selectedAdmissionId) : undefined;

  if (!admission) {
    return (
      <section className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
        <ClipboardList className="mx-auto mb-2 h-8 w-8 text-slate-900" />
        <p className="text-sm font-medium text-slate-800">Select an occupied bed to open Clinical Shift Console</p>
        <p className="mt-1 text-xs text-slate-800">Progress notes, care plans, diet orders & MAR ledger</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b-2 border-slate-200 bg-slate-50/80 px-4 py-2.5">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Clinical Shift Console</h2>
          <p className="text-[11px] text-slate-800">
            {admission.patientName} · {admission.uhid} · {admission.admittingDoctor}
          </p>
        </div>
        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-indigo-800">
          {admission.status}
        </span>
      </header>

      <div className="grid grid-cols-1 divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <ClinicalTimeline admission={admission} />
        <MarLedger
          admission={admission}
          onLog={(marId, time) => logMarAdministration(admission.id, marId, time)}
        />
      </div>
    </section>
  );
}

function ClinicalTimeline({ admission }: { admission: IPDAdmission }) {
  const { progressNotes, carePlans, dietOrders } = admission.clinical;

  return (
    <div className="custom-scrollbar max-h-[380px] overflow-y-auto p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-800">
        <FileText className="h-3.5 w-3.5" />
        Care Timeline
      </h3>

      {/* Diet orders */}
      <div className="mb-4">
        <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700">
          <UtensilsCrossed className="h-3 w-3" />
          Diet Orders
        </p>
        <ul className="space-y-1.5">
          {dietOrders.map((d) => (
            <li key={d.id} className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2">
              <p className="text-xs font-semibold text-emerald-900">{d.order}</p>
              {d.restrictions && (
                <p className="text-[10px] text-emerald-700">{d.restrictions}</p>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Care plans */}
      <div className="mb-4">
        <p className="mb-1.5 text-[10px] font-bold uppercase text-violet-700">Active Care Plans</p>
        <ul className="space-y-1.5">
          {carePlans.map((cp) => (
            <li key={cp.id} className="rounded-lg border border-violet-100 bg-violet-50/50 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-violet-900">{cp.title}</p>
                <span className="rounded bg-violet-200 px-1.5 py-0.5 text-[8px] font-bold uppercase text-violet-800">
                  {cp.status}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] leading-snug text-violet-700">{cp.details}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Progress notes */}
      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase text-slate-800">Daily Progress Notes</p>
        <ol className="relative space-y-3 border-l-2 border-slate-200 pl-4">
          {progressNotes.map((note) => (
            <li key={note.id} className="relative">
              <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-400 ring-2 ring-white" />
              <p className="text-[10px] font-semibold text-slate-800">
                {new Intl.DateTimeFormat('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(note.timestamp))}
                {' · '}
                {note.author}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-900">{note.note}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function MarLedger({
  admission,
  onLog,
}: {
  admission: IPDAdmission;
  onLog: (marEntryId: string, time: string) => void;
}) {
  const locked = admission.recordLocked;

  return (
    <div className="custom-scrollbar max-h-[380px] overflow-y-auto p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-800">
        <Pill className="h-3.5 w-3.5" />
        Medication Administration Record (MAR)
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b-2 border-slate-200 text-[9px] font-black uppercase tracking-wider text-slate-800">
              <th className="px-2 py-2">Drug & Dose</th>
              <th className="px-2 py-2 text-center">08:00</th>
              <th className="px-2 py-2 text-center">14:00</th>
              <th className="px-2 py-2 text-center">20:00</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {admission.clinical.marEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-100/50">
                <td className="px-2 py-2.5">
                  <p className="font-semibold text-slate-900">{entry.drugName}</p>
                  <p className="font-mono text-[10px] text-indigo-700">{entry.dose}</p>
                  <p className="text-[9px] text-slate-800">{entry.route}</p>
                </td>
                {entry.schedules.map((slot) => (
                  <td key={slot.time} className="px-2 py-2.5 text-center align-middle">
                    {slot.administered ? (
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                        <span className="text-[8px] text-slate-800">
                          {slot.administeredAt &&
                            new Intl.DateTimeFormat('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            }).format(new Date(slot.administeredAt))}
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={locked}
                        onClick={() => onLog(entry.id, slot.time)}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md border-2 border-dashed border-slate-300 text-slate-800 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40"
                        title={`Log ${slot.time} administration`}
                      >
                        <Clock className="h-3 w-3" />
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[10px] text-slate-800">
        Tap unchecked slots to verify administration · timestamp auto-recorded
      </p>
    </div>
  );
}
