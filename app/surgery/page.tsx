'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  CheckSquare,
  ClipboardList,
  Clock,
  ShieldCheck,
  Square,
} from 'lucide-react';

type SurgicalStage = 'Pre-Op Assessment' | 'Intra-Op Log' | 'Post-Op Recovery Plan';

type OtStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Delayed';

type OtScheduleEntry = {
  id: string;
  otRoom: string;
  patientName: string;
  procedure: string;
  scheduledStart: string;
  status: OtStatus;
};

type ChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
};

type DocTab = 'pre-op' | 'operative' | 'post-op';

const TRACKING_SUMMARY =
  'Standalone OT suite · active room tracking · procedural documentation · safety checklist · 13 Jul 2026';

const TODAY_OT_SCHEDULE: OtScheduleEntry[] = [
  {
    id: 'ot-1',
    otRoom: 'OT-03',
    patientName: 'P.N.',
    procedure: 'Laparoscopic Cholecystectomy',
    scheduledStart: '08:30',
    status: 'In Progress',
  },
  {
    id: 'ot-2',
    otRoom: 'OT-01',
    patientName: 'K.V.',
    procedure: 'Total Knee Replacement · Right',
    scheduledStart: '11:00',
    status: 'Scheduled',
  },
  {
    id: 'ot-3',
    otRoom: 'OT-02',
    patientName: 'R.S.',
    procedure: 'Inguinal Hernia Repair · Mesh',
    scheduledStart: '13:45',
    status: 'Scheduled',
  },
  {
    id: 'ot-4',
    otRoom: 'OT-04',
    patientName: 'M.A.',
    procedure: 'Cataract Extraction · Phaco',
    scheduledStart: '07:15',
    status: 'Completed',
  },
];

const UPCOMING_SURGERIES: OtScheduleEntry[] = [
  {
    id: 'up-1',
    otRoom: 'OT-02',
    patientName: 'S.D.',
    procedure: 'Appendectomy · Laparoscopic',
    scheduledStart: '2026-07-14 · 09:00',
    status: 'Scheduled',
  },
  {
    id: 'up-2',
    otRoom: 'OT-03',
    patientName: 'A.J.',
    procedure: 'Thyroidectomy · Partial',
    scheduledStart: '2026-07-14 · 14:30',
    status: 'Scheduled',
  },
];

const INITIAL_CHECKLIST: ChecklistItem[] = [
  { id: 'cl-1', label: 'Patient Identity Confirmed', checked: true },
  { id: 'cl-2', label: 'Site Marked & Verified', checked: true },
  { id: 'cl-3', label: 'Anesthesia Safety Check Complete', checked: false },
  { id: 'cl-4', label: 'Antibiotic Prophylaxis Given', checked: false },
  { id: 'cl-5', label: 'Equipment & Implant Count Verified', checked: false },
  { id: 'cl-6', label: 'Timeout Completed Before Incision', checked: false },
];

const STAGE_TABS: { key: DocTab; label: string; stage: SurgicalStage }[] = [
  { key: 'pre-op', label: 'Pre-operative Assessment', stage: 'Pre-Op Assessment' },
  { key: 'operative', label: 'Operative Notes', stage: 'Intra-Op Log' },
  { key: 'post-op', label: 'Post-operative Notes', stage: 'Post-Op Recovery Plan' },
];

const OT_STATUS_STYLES: Record<OtStatus, string> = {
  Scheduled: 'bg-slate-200 text-slate-950 border border-slate-400 font-black',
  'In Progress': 'bg-amber-200 text-amber-950 border border-amber-500 font-black',
  Completed: 'bg-emerald-200 text-emerald-950 border border-emerald-500 font-black',
  Delayed: 'bg-rose-200 text-rose-950 border border-rose-500 font-black',
};

const INPUT_CLASS =
  'w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200';

const TEXTAREA_CLASS = `${INPUT_CLASS} min-h-[120px] resize-y`;

function OtCard({ entry }: { entry: OtScheduleEntry }) {
  return (
    <article className="rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs font-black text-slate-950">{entry.otRoom}</p>
          <p className="mt-1 text-sm font-black text-slate-950">{entry.patientName}</p>
        </div>
        <span
          className={`inline-flex rounded-md px-2 py-0.5 text-[10px] uppercase ${OT_STATUS_STYLES[entry.status]}`}
        >
          {entry.status}
        </span>
      </div>
      <p className="mt-2 text-xs font-bold leading-snug text-slate-800">{entry.procedure}</p>
      <p className="mt-2 flex items-center gap-1 text-[10px] font-black text-slate-950">
        <Clock className="h-3 w-3" aria-hidden />
        {entry.scheduledStart}
      </p>
    </article>
  );
}

export default function SurgeryWorkspacePage() {
  const [activeStage, setActiveStage] = useState<SurgicalStage>('Pre-Op Assessment');
  const [activeTab, setActiveTab] = useState<DocTab>('pre-op');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);
  const [selectedOtId, setSelectedOtId] = useState<string>(TODAY_OT_SCHEDULE[0].id);
  const [actionNote, setActionNote] = useState<string | null>(null);

  const [preOpVitals, setPreOpVitals] = useState(
    'BP 122/78 · HR 76 · SpO₂ 99% · Temp 36.8°C · sandbox baseline',
  );
  const [clearanceFlags, setClearanceFlags] = useState(
    'Cardiology clearance · NPO since 22:00 · consent signed · allergy band verified',
  );
  const [preMedication, setPreMedication] = useState(
    'Cefazolin 2g IV · Ondansetron 4mg IV · Midazolam 2mg IV per anesthesia protocol',
  );

  const [operativeFindings, setOperativeFindings] = useState('');
  const [incisionDetails, setIncisionDetails] = useState('');
  const [closureNotes, setClosureNotes] = useState('');
  const [implantTracking, setImplantTracking] = useState('');

  const [recoveryDirections, setRecoveryDirections] = useState('');
  const [painManagement, setPainManagement] = useState('');
  const [followUpPlan, setFollowUpPlan] = useState('');

  const showNotice = useCallback((message: string) => {
    setActionNote(message);
    window.setTimeout(() => setActionNote(null), 4500);
  }, []);

  const selectedOt = useMemo(
    () => TODAY_OT_SCHEDULE.find((e) => e.id === selectedOtId) ?? TODAY_OT_SCHEDULE[0],
    [selectedOtId],
  );

  const checklistComplete = useMemo(
    () => checklist.every((item) => item.checked),
    [checklist],
  );

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    );
  };

  const handleTabChange = (tab: DocTab) => {
    setActiveTab(tab);
    const stage = STAGE_TABS.find((t) => t.key === tab)?.stage;
    if (stage) setActiveStage(stage);
  };

  const handleFinalize = () => {
    if (!checklistComplete) {
      showNotice('Cannot finalize · complete all surgical checklist items first');
      return;
    }
    showNotice(
      `Operative record finalized · ${selectedOt.otRoom} · ${selectedOt.patientName} · ${activeStage} · sandbox only`,
    );
  };

  return (
    <div className="min-h-screen w-full font-sans text-slate-950 selection:bg-slate-200">
      <div className="w-full space-y-5 p-4 sm:p-6 lg:p-8">
        {/* Procedural header */}
        <header className="flex w-full flex-col gap-4 border-b-2 border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Surgical Suite &amp; Operative Documentation Engine
            </h1>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-slate-800">
              {TRACKING_SUMMARY}
            </p>
            <p className="mt-2 font-mono text-xs font-black text-slate-950">
              Active stage · {activeStage} · {TODAY_OT_SCHEDULE.length} rooms today · checklist{' '}
              {checklist.filter((c) => c.checked).length}/{checklist.length}
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-950 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-700" aria-hidden />
            <span>OT_SUITE_SAFEGUARD_ACTIVE</span>
          </div>
        </header>

        {actionNote && (
          <p
            role="status"
            className="w-full rounded-lg border-2 border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-950"
          >
            {actionNote}
          </p>
        )}

        {/* Split viewport */}
        <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-[35%_65%]">
          {/* Left — OT tracker */}
          <aside className="w-full space-y-5">
            <section
              aria-label="Today's OT schedule"
              className="w-full space-y-3 rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4"
            >
              <h2 className="text-sm font-black text-slate-950">Today&apos;s OT Schedule</h2>
              <div className="space-y-3">
                {TODAY_OT_SCHEDULE.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedOtId(entry.id)}
                    className={`block w-full text-left transition-all ${
                      selectedOtId === entry.id
                        ? 'ring-2 ring-slate-900 ring-offset-2 rounded-xl'
                        : ''
                    }`}
                  >
                    <OtCard entry={entry} />
                  </button>
                ))}
              </div>
            </section>

            <section
              aria-label="Upcoming surgeries"
              className="w-full space-y-3 rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4"
            >
              <h2 className="text-sm font-black text-slate-950">Upcoming Surgeries</h2>
              <div className="space-y-3">
                {UPCOMING_SURGERIES.map((entry) => (
                  <OtCard key={entry.id} entry={entry} />
                ))}
              </div>
            </section>

            <section
              aria-label="Surgical checklist"
              className="w-full space-y-3 rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-black text-slate-950">Surgical Checklist</h2>
                <span
                  className={`text-[10px] font-black uppercase ${
                    checklistComplete ? 'text-emerald-800' : 'text-amber-800'
                  }`}
                >
                  {checklistComplete ? 'All signed' : 'Pending items'}
                </span>
              </div>
              <ul className="space-y-2">
                {checklist.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggleChecklistItem(item.id)}
                      className="flex w-full items-start gap-3 rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition-colors hover:bg-white"
                    >
                      {item.checked ? (
                        <CheckSquare
                          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800"
                          aria-hidden
                        />
                      ) : (
                        <Square className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                      )}
                      <span
                        className={`text-xs font-bold ${
                          item.checked ? 'text-slate-950 line-through decoration-slate-400' : 'text-slate-950'
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </aside>

          {/* Right — documentation canvas */}
          <section
            aria-label="Operative documentation canvas"
            className="w-full space-y-4 rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4 shadow-sm sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-950">
                  {selectedOt.patientName} · {selectedOt.procedure}
                </h2>
                <p className="text-xs font-bold text-slate-800">
                  {selectedOt.otRoom} · start {selectedOt.scheduledStart} · {activeStage}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {STAGE_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleTabChange(key)}
                  className={`rounded-lg border-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${
                    activeTab === key
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-950 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'pre-op' && (
              <div className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-black uppercase text-slate-950">
                    Baseline Vitals
                  </span>
                  <textarea
                    className={TEXTAREA_CLASS}
                    value={preOpVitals}
                    onChange={(e) => setPreOpVitals(e.target.value)}
                    rows={3}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-black uppercase text-slate-950">
                    Clearance Flags
                  </span>
                  <textarea
                    className={TEXTAREA_CLASS}
                    value={clearanceFlags}
                    onChange={(e) => setClearanceFlags(e.target.value)}
                    rows={3}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-black uppercase text-slate-950">
                    Pre-medication Instructions
                  </span>
                  <textarea
                    className={TEXTAREA_CLASS}
                    value={preMedication}
                    onChange={(e) => setPreMedication(e.target.value)}
                    rows={3}
                  />
                </label>
              </div>
            )}

            {activeTab === 'operative' && (
              <div className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-black uppercase text-slate-950">
                    Surgical Findings
                  </span>
                  <textarea
                    className={TEXTAREA_CLASS}
                    value={operativeFindings}
                    onChange={(e) => setOperativeFindings(e.target.value)}
                    placeholder="Document operative findings · sandbox narrative"
                    rows={4}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-black uppercase text-slate-950">
                    Incision Details
                  </span>
                  <textarea
                    className={TEXTAREA_CLASS}
                    value={incisionDetails}
                    onChange={(e) => setIncisionDetails(e.target.value)}
                    placeholder="Port placement · incision length · approach"
                    rows={3}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-black uppercase text-slate-950">
                    Closure Notes
                  </span>
                  <textarea
                    className={TEXTAREA_CLASS}
                    value={closureNotes}
                    onChange={(e) => setClosureNotes(e.target.value)}
                    placeholder="Layer-by-layer closure · drain placement"
                    rows={3}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-black uppercase text-slate-950">
                    Implant Tracking Markers
                  </span>
                  <textarea
                    className={TEXTAREA_CLASS}
                    value={implantTracking}
                    onChange={(e) => setImplantTracking(e.target.value)}
                    placeholder="Implant lot numbers · UDI · count sheets"
                    rows={3}
                  />
                </label>
              </div>
            )}

            {activeTab === 'post-op' && (
              <div className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-black uppercase text-slate-950">
                    Immediate Recovery Directions
                  </span>
                  <textarea
                    className={TEXTAREA_CLASS}
                    value={recoveryDirections}
                    onChange={(e) => setRecoveryDirections(e.target.value)}
                    placeholder="PACU orders · mobilization · diet advancement"
                    rows={4}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-black uppercase text-slate-950">
                    Pain Management Lines
                  </span>
                  <textarea
                    className={TEXTAREA_CLASS}
                    value={painManagement}
                    onChange={(e) => setPainManagement(e.target.value)}
                    placeholder="Analgesic protocol · PRN orders"
                    rows={3}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-black uppercase text-slate-950">
                    Follow-up &amp; Stitch Removal Timeline
                  </span>
                  <textarea
                    className={TEXTAREA_CLASS}
                    value={followUpPlan}
                    onChange={(e) => setFollowUpPlan(e.target.value)}
                    placeholder="OPD review date · suture removal day 10–14"
                    rows={3}
                  />
                </label>
              </div>
            )}

            <button
              type="button"
              onClick={handleFinalize}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-slate-900 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition-colors hover:bg-slate-800 sm:w-auto"
            >
              <ClipboardList className="h-4 w-4" aria-hidden />
              Finalize Operative Record
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
