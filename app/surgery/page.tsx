'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  CheckSquare,
  ClipboardList,
  Clock,
  Printer,
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

type PreOpVitals = {
  bp: string;
  hr: string;
  spo2: string;
  temp: string;
};

type ClearanceFlags = {
  cardiology: boolean;
  npo: boolean;
  consent: boolean;
  allergyBand: boolean;
};

type PreOpMedRow = {
  drug: string;
  dose: string;
  route: string;
  administeredAt: string;
};

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

const WHO_CHECKLIST: ChecklistItem[] = [
  { id: 'cl-1', label: 'Patient identity confirmed (sign-in)', checked: true },
  { id: 'cl-2', label: 'Site marked & procedure verified', checked: true },
  { id: 'cl-3', label: 'Anesthesia safety check complete', checked: false },
  { id: 'cl-4', label: 'Antibiotic prophylaxis given', checked: false },
  { id: 'cl-5', label: 'Equipment & implant count verified', checked: false },
  { id: 'cl-6', label: 'Timeout completed before incision', checked: false },
];

const STAGE_TABS: { key: DocTab; label: string; stage: SurgicalStage }[] = [
  { key: 'pre-op', label: 'Pre-Op', stage: 'Pre-Op Assessment' },
  { key: 'operative', label: 'Intra-Op / Surgical Notes', stage: 'Intra-Op Log' },
  { key: 'post-op', label: 'Post-Op / PACU Recovery', stage: 'Post-Op Recovery Plan' },
];

const OT_STATUS_STYLES: Record<OtStatus, string> = {
  Scheduled: 'bg-slate-100 text-slate-800 ring-1 ring-slate-300',
  'In Progress': 'bg-amber-100 text-amber-900 ring-1 ring-amber-400',
  Completed: 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-400',
  Delayed: 'bg-rose-100 text-rose-900 ring-1 ring-rose-400',
};

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-950 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200';

function isVitalAbnormal(v: PreOpVitals): Record<keyof PreOpVitals, boolean> {
  const hr = parseInt(v.hr, 10);
  const spo2 = parseInt(v.spo2, 10);
  const temp = parseFloat(v.temp);
  const bpParts = v.bp.split('/').map((n) => parseInt(n.trim(), 10));
  const sys = bpParts[0];
  const dia = bpParts[1];
  return {
    bp: (sys && (sys > 140 || sys < 90)) || (dia && dia > 90) || false,
    hr: !Number.isNaN(hr) && (hr > 100 || hr < 50),
    spo2: !Number.isNaN(spo2) && spo2 < 95,
    temp: !Number.isNaN(temp) && (temp > 37.5 || temp < 36),
  };
}

function OtScheduleRow({
  entry,
  selected,
  onSelect,
}: {
  entry: OtScheduleEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-3 text-left transition-all ${
        selected ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900 ring-offset-1' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs font-bold text-slate-600">{entry.otRoom}</p>
          <p className="mt-0.5 text-sm font-bold text-slate-950">{entry.patientName}</p>
        </div>
        <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${OT_STATUS_STYLES[entry.status]}`}>
          {entry.status}
        </span>
      </div>
      <p className="mt-2 text-xs font-medium leading-snug text-slate-700">{entry.procedure}</p>
      <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-slate-500">
        <Clock className="h-3 w-3" aria-hidden />
        {entry.scheduledStart}
      </p>
    </button>
  );
}

function ClearanceToggle({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
        checked
          ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
      }`}
    >
      {checked ? '✓' : '○'} {label}
    </button>
  );
}

function RichTextOperativeEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const wrap = (prefix: string, suffix: string) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + prefix + selected + suffix + value.slice(end);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
        {[
          { label: 'Bold', action: () => wrap('**', '**') },
          { label: 'Italic', action: () => wrap('_', '_') },
          { label: 'Bullet', action: () => wrap('\n• ', '') },
        ].map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={t.action}
            className="rounded px-2 py-1 text-xs font-bold text-slate-700 hover:bg-white"
          >
            {t.label}
          </button>
        ))}
      </div>
      <textarea
        ref={ref}
        className={`${INPUT_CLASS} min-h-[160px] resize-y font-normal leading-relaxed`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Operative findings · technique · complications · hemostasis…"
      />
    </div>
  );
}

export default function SurgeryWorkspacePage() {
  const [activeStage, setActiveStage] = useState<SurgicalStage>('Pre-Op Assessment');
  const [activeTab, setActiveTab] = useState<DocTab>('pre-op');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(WHO_CHECKLIST);
  const [selectedOtId, setSelectedOtId] = useState<string>(TODAY_OT_SCHEDULE[0].id);
  const [actionNote, setActionNote] = useState<string | null>(null);

  const [vitals, setVitals] = useState<PreOpVitals>({
    bp: '122/78',
    hr: '76',
    spo2: '99',
    temp: '36.8',
  });
  const [clearance, setClearance] = useState<ClearanceFlags>({
    cardiology: true,
    npo: true,
    consent: true,
    allergyBand: true,
  });
  const [preMeds, setPreMeds] = useState<PreOpMedRow[]>([
    { drug: 'Cefazolin', dose: '2g', route: 'IV', administeredAt: '08:15' },
    { drug: 'Ondansetron', dose: '4mg', route: 'IV', administeredAt: '08:18' },
    { drug: 'Midazolam', dose: '2mg', route: 'IV', administeredAt: '08:20' },
  ]);

  const [intraOp, setIntraOp] = useState({
    surgeon: 'Dr. Rajesh Kumar',
    anesthetist: 'Dr. Anita Roy',
    scrubNurse: 'Sister Meera I.',
    incisionTime: '08:42',
    closureTime: '10:05',
    ebl: '120 mL',
    specimens: 'Gallbladder → Pathology · routine histology',
    operativeFindings: '',
  });

  const [postOp, setPostOp] = useState({
    recoveryDirections: 'PACU · monitor vitals q15min · oral fluids when awake',
    painManagement: 'Paracetamol 1g IV q6h PRN · avoid NSAIDs if renal concern',
    followUpPlan: 'Surgical OPD day 7 · suture/staple review day 10–14',
  });

  const showNotice = useCallback((message: string) => {
    setActionNote(message);
    window.setTimeout(() => setActionNote(null), 4500);
  }, []);

  const selectedOt = useMemo(
    () => TODAY_OT_SCHEDULE.find((e) => e.id === selectedOtId) ?? TODAY_OT_SCHEDULE[0],
    [selectedOtId],
  );

  const checklistDone = checklist.filter((c) => c.checked).length;
  const checklistComplete = checklistDone === checklist.length;
  const vitalFlags = useMemo(() => isVitalAbnormal(vitals), [vitals]);

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  };

  const handleTabChange = (tab: DocTab) => {
    setActiveTab(tab);
    const stage = STAGE_TABS.find((t) => t.key === tab)?.stage;
    if (stage) setActiveStage(stage);
  };

  const handleFinalize = () => {
    if (!checklistComplete) {
      showNotice('Cannot finalize · complete WHO surgical safety checklist first');
      return;
    }
    showNotice(
      `Operative record finalized · ${selectedOt.otRoom} · ${selectedOt.patientName} · ${activeStage} · sandbox only`,
    );
  };

  const handlePrint = () => {
    showNotice(`OT summary sent to print queue · ${selectedOt.procedure}`);
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <div className="min-h-screen w-full font-sans text-slate-950 selection:bg-slate-200">
      <div className="w-full space-y-5 p-4 sm:p-6 lg:p-8">
        <header className="flex w-full flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Surgical Suite &amp; Operative Documentation Engine
            </h1>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-slate-600">{TRACKING_SUMMARY}</p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-800 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-700" aria-hidden />
            <span>OT_SUITE_SAFEGUARD_ACTIVE</span>
          </div>
        </header>

        {actionNote && (
          <p role="status" className="w-full rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-950">
            {actionNote}
          </p>
        )}

        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="space-y-5 lg:col-span-4">
            <section
              aria-label="Today's OT schedule"
              className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h2 className="text-sm font-black text-slate-950">Today&apos;s OT schedule</h2>
              <div className="space-y-2">
                {TODAY_OT_SCHEDULE.map((entry) => (
                  <OtScheduleRow
                    key={entry.id}
                    entry={entry}
                    selected={selectedOtId === entry.id}
                    onSelect={() => setSelectedOtId(entry.id)}
                  />
                ))}
              </div>
            </section>

            <section
              aria-label="WHO surgical safety checklist"
              className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-black text-slate-950">WHO surgical safety checklist</h2>
                <span className="text-xs font-bold text-slate-600">
                  Checklist {checklistDone}/{checklist.length} completed
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${(checklistDone / checklist.length) * 100}%` }}
                />
              </div>
              <ul className="space-y-2">
                {checklist.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggleChecklistItem(item.id)}
                      className="flex w-full items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-left hover:bg-white"
                    >
                      {item.checked ? (
                        <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
                      ) : (
                        <Square className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                      )}
                      <span className={`text-xs font-semibold ${item.checked ? 'text-slate-600 line-through' : 'text-slate-900'}`}>
                        {item.label}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </aside>

          <section
            aria-label="Operative documentation panel"
            className="flex min-h-[640px] flex-col rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-8"
          >
            <div className="sticky top-0 z-10 rounded-t-xl border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-slate-950">{selectedOt.patientName}</p>
                  <p className="text-sm font-medium text-slate-700">{selectedOt.procedure}</p>
                </div>
                <span className="rounded-lg bg-slate-900 px-3 py-1 font-mono text-xs font-bold uppercase text-white">
                  {selectedOt.otRoom}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {STAGE_TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleTabChange(key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                      activeTab === key
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
              {activeTab === 'pre-op' && (
                <>
                  <div>
                    <p className="mb-2 text-xs font-black uppercase text-slate-500">Pre-op vitals</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {(
                        [
                          { key: 'bp' as const, label: 'BP', unit: 'mmHg' },
                          { key: 'hr' as const, label: 'HR', unit: 'bpm' },
                          { key: 'spo2' as const, label: 'SpO₂', unit: '%' },
                          { key: 'temp' as const, label: 'Temp', unit: '°C' },
                        ] as const
                      ).map(({ key, label, unit }) => (
                        <label
                          key={key}
                          className={`rounded-xl border p-3 ${
                            vitalFlags[key] ? 'border-rose-300 bg-rose-50' : 'border-emerald-200 bg-emerald-50/40'
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase text-slate-500">{label}</span>
                          <input
                            className="mt-1 w-full border-0 bg-transparent p-0 text-lg font-bold tabular-nums text-slate-950 focus:outline-none focus:ring-0"
                            value={vitals[key]}
                            onChange={(e) => setVitals((v) => ({ ...v, [key]: e.target.value }))}
                          />
                          <span className="text-[10px] font-medium text-slate-500">{unit}</span>
                          <p className={`mt-1 text-[10px] font-bold ${vitalFlags[key] ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {vitalFlags[key] ? 'Review' : 'Normal'}
                          </p>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-black uppercase text-slate-500">Clearance checklist</p>
                    <div className="flex flex-wrap gap-2">
                      <ClearanceToggle
                        label="Cardiology Clearance"
                        checked={clearance.cardiology}
                        onToggle={() => setClearance((c) => ({ ...c, cardiology: !c.cardiology }))}
                      />
                      <ClearanceToggle
                        label="NPO Status Verified"
                        checked={clearance.npo}
                        onToggle={() => setClearance((c) => ({ ...c, npo: !c.npo }))}
                      />
                      <ClearanceToggle
                        label="Surgical Consent Signed"
                        checked={clearance.consent}
                        onToggle={() => setClearance((c) => ({ ...c, consent: !c.consent }))}
                      />
                      <ClearanceToggle
                        label="Allergy Band Checked"
                        checked={clearance.allergyBand}
                        onToggle={() => setClearance((c) => ({ ...c, allergyBand: !c.allergyBand }))}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-black uppercase text-slate-500">Pre-op medication</p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full min-w-[480px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                            {['Drug name', 'Dose', 'Route', 'Administered time'].map((h) => (
                              <th key={h} className="px-3 py-2 font-bold">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preMeds.map((row, i) => (
                            <tr key={i} className="border-b border-slate-50">
                              {(['drug', 'dose', 'route', 'administeredAt'] as const).map((field) => (
                                <td key={field} className="px-3 py-2">
                                  <input
                                    className="w-full rounded border border-slate-100 px-2 py-1 text-xs"
                                    value={row[field]}
                                    onChange={(e) =>
                                      setPreMeds((rows) =>
                                        rows.map((r, idx) => (idx === i ? { ...r, [field]: e.target.value } : r)),
                                      )
                                    }
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'operative' && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(
                      [
                        { key: 'surgeon', label: 'Surgeon name' },
                        { key: 'anesthetist', label: 'Anesthetist name' },
                        { key: 'scrubNurse', label: 'Scrub nurse' },
                        { key: 'incisionTime', label: 'Incision time' },
                        { key: 'closureTime', label: 'Closure time' },
                        { key: 'ebl', label: 'Estimated blood loss (EBL)' },
                      ] as const
                    ).map(({ key, label }) => (
                      <label key={key} className="block">
                        <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
                        <input
                          className={`${INPUT_CLASS} mt-1`}
                          value={intraOp[key]}
                          onChange={(e) => setIntraOp((s) => ({ ...s, [key]: e.target.value }))}
                        />
                      </label>
                    ))}
                  </div>
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-500">Specimens sent to pathology</span>
                    <input
                      className={`${INPUT_CLASS} mt-1`}
                      value={intraOp.specimens}
                      onChange={(e) => setIntraOp((s) => ({ ...s, specimens: e.target.value }))}
                    />
                  </label>
                  <div>
                    <span className="text-xs font-bold uppercase text-slate-500">Operative findings &amp; technique</span>
                    <div className="mt-1">
                      <RichTextOperativeEditor
                        value={intraOp.operativeFindings}
                        onChange={(operativeFindings) => setIntraOp((s) => ({ ...s, operativeFindings }))}
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'post-op' && (
                <div className="grid gap-4">
                  {(
                    [
                      { key: 'recoveryDirections', label: 'PACU recovery directions' },
                      { key: 'painManagement', label: 'Pain management protocol' },
                      { key: 'followUpPlan', label: 'Follow-up & stitch removal' },
                    ] as const
                  ).map(({ key, label }) => (
                    <label key={key} className="block">
                      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
                      <textarea
                        className={`${INPUT_CLASS} mt-1 min-h-[72px] resize-y`}
                        value={postOp[key]}
                        onChange={(e) => setPostOp((s) => ({ ...s, [key]: e.target.value }))}
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 rounded-b-xl border-t border-slate-200 bg-white p-4">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-800 hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" aria-hidden />
                Print OT Summary
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-black uppercase tracking-wide text-white hover:bg-slate-800"
              >
                <ClipboardList className="h-4 w-4" aria-hidden />
                Finalize Operative Record
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
