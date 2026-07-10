'use client';

import { useMemo, useState } from 'react';
import { Monitor, ScanLine, Search } from 'lucide-react';

import { SEED_RADIOLOGY_SESSIONS, type RadiologyScanSession } from '../../../lib/clinical';

const STATUS_STYLE: Record<RadiologyScanSession['status'], string> = {
  Scheduled: 'bg-sky-50 text-sky-800 ring-sky-200',
  'In Progress': 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  'Report Pending': 'bg-amber-50 text-amber-800 ring-amber-200',
  Completed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
};

export default function RadiologySessionWorkbench() {
  const [sessions, setSessions] = useState(SEED_RADIOLOGY_SESSIONS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<RadiologyScanSession | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter(
      (s) =>
        s.sessionId.toLowerCase().includes(q) ||
        s.patientInitials.toLowerCase().includes(q) ||
        s.studyName.toLowerCase().includes(q) ||
        s.machineRoomLocator.toLowerCase().includes(q),
    );
  }, [sessions, search]);

  const openSession = (session: RadiologyScanSession) => {
    setSelected(session);
    setNotesDraft(session.technicianNotes);
  };

  const saveNotes = () => {
    if (!selected) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.sessionId === selected.sessionId ? { ...s, technicianNotes: notesDraft } : s,
      ),
    );
    setSelected(null);
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="border-b-2 border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <ScanLine className="h-5 w-5 text-sky-700" />
          <div>
            <h1 className="text-lg font-black text-slate-900">Radiology Imaging Sessions</h1>
            <p className="text-xs text-slate-800">
              Phase 3 · Module 9 · Slot routing · image payload · technician notes
            </p>
          </div>
        </div>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-800" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search session, room, study…"
          className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100">
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">Session</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">Slot</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">Room</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">Study</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">Images</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr
                key={s.sessionId}
                onClick={() => openSession(s)}
                className={`cursor-pointer border-b-2 border-slate-200 hover:bg-sky-50/50 ${
                  i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                }`}
              >
                <td className="px-3 py-2 font-mono text-xs font-black">{s.sessionId}</td>
                <td className="px-3 py-2 font-mono text-xs">{s.appointmentSlotNumber}</td>
                <td className="px-3 py-2 text-xs text-slate-950">{s.machineRoomLocator}</td>
                <td className="px-3 py-2 text-xs font-bold">{s.studyName}</td>
                <td className="px-3 py-2 text-xs text-slate-950">{s.imageFileUrls.length} file(s)</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ring-1 ${STATUS_STYLE[s.status]}`}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/30" onClick={() => setSelected(null)} aria-hidden />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-300 bg-white shadow-2xl">
            <div className="border-b-2 border-slate-200 bg-slate-800 px-4 py-3 text-white">
              <p className="text-sm font-black">{selected.studyName}</p>
              <p className="font-mono text-[10px] text-slate-900">{selected.sessionId}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <p className="text-[10px] font-bold uppercase text-slate-800">Image Payload URLs</p>
              <ul className="space-y-1">
                {selected.imageFileUrls.map((url) => (
                  <li key={url} className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-2 py-1.5 font-mono text-[10px]">
                    <Monitor className="h-3 w-3 text-slate-800" />
                    {url}
                  </li>
                ))}
              </ul>
              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-800">Technician Notes</span>
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                />
              </label>
            </div>
            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={saveNotes}
                className="w-full rounded-lg bg-slate-800 py-2.5 text-sm font-bold text-white hover:bg-slate-900"
              >
                Save Session Notes
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
