'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  BedDouble,
  FileClock,
  Search,
  ShieldAlert,
  Users,
} from 'lucide-react';

type RosterTab = 'assigned' | 'recent' | 'followup' | 'admitted';

type PatientRecord = {
  id: string;
  name: string;
  ageGender: string;
  uhid: string;
  roster: RosterTab;
  wingRoom?: string;
  lastSeen?: string;
  followUpDue?: string;
};

type HighRiskPatient = {
  id: string;
  name: string;
  uhid: string;
  flag: string;
  priority: 'Critical' | 'Elevated';
};

type TimelineEvent = {
  id: string;
  date: string;
  category: 'Admission' | 'Consultation' | 'Prescription' | 'Diagnostic';
  detail: string;
};

const PANEL_CLASS = 'rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm';

const INPUT_CLASS =
  'w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 pl-10 text-xs font-medium text-slate-950 shadow-sm placeholder:text-slate-400 focus:border-[#008588] focus:outline-none';

const HIGH_RISK_CARD_CLASS =
  'flex animate-pulse items-center justify-between rounded-xl border border-rose-500/20 border-l-4 border-l-rose-600 bg-rose-500/10 p-4 text-xs font-bold text-rose-700 shadow-sm';

const TAB_LABELS: Record<RosterTab, string> = {
  assigned: 'Assigned Patients',
  recent: 'Recently Consulted',
  followup: 'Follow-up Patients',
  admitted: 'Admitted Patients',
};

const PATIENT_ROSTER: PatientRecord[] = [
  {
    id: 'p-1',
    name: 'Aishwarya D S',
    ageGender: '34 · F',
    uhid: 'UHID-NEX-9021',
    roster: 'assigned',
    lastSeen: '14 Jul 2026',
  },
  {
    id: 'p-2',
    name: 'R. Srinivasan',
    ageGender: '38 · M',
    uhid: 'UHID-NEX-9022',
    roster: 'assigned',
    lastSeen: '12 Jul 2026',
  },
  {
    id: 'p-3',
    name: 'K. Venkatesh',
    ageGender: '58 · M',
    uhid: 'UHID-NEX-9028',
    roster: 'recent',
    lastSeen: '14 Jul 2026',
  },
  {
    id: 'p-4',
    name: 'P. Nandini',
    ageGender: '45 · F',
    uhid: 'UHID-NEX-8841',
    roster: 'recent',
    lastSeen: '13 Jul 2026',
  },
  {
    id: 'p-5',
    name: 'S. Lakshmi',
    ageGender: '62 · F',
    uhid: 'UHID-NEX-9018',
    roster: 'followup',
    followUpDue: '15 Jul 2026',
  },
  {
    id: 'p-6',
    name: 'A. Arjun',
    ageGender: '9 · M',
    uhid: 'UHID-NEX-9041',
    roster: 'followup',
    followUpDue: '22 Jul 2026',
  },
  {
    id: 'p-7',
    name: 'Room 402 · IPD',
    ageGender: '54 · M',
    uhid: 'UHID-NEX-4398',
    roster: 'admitted',
    wingRoom: 'Wing B · Room 402',
  },
  {
    id: 'p-8',
    name: 'M. Joseph',
    ageGender: '52 · M',
    uhid: 'UHID-NEX-9102',
    roster: 'admitted',
    wingRoom: 'Wing A · Room 218',
  },
  {
    id: 'p-9',
    name: 'L. Iyer',
    ageGender: '71 · F',
    uhid: 'UHID-NEX-8877',
    roster: 'assigned',
    lastSeen: '08 Jul 2026',
  },
];

const HIGH_RISK_REGISTRY: HighRiskPatient[] = [
  {
    id: 'hr-1',
    name: 'K. Venkatesh',
    uhid: 'UHID-NEX-9028',
    flag: 'Uncontrolled hypertensive profile · BP 198/112 · stat review',
    priority: 'Critical',
  },
  {
    id: 'hr-2',
    name: 'P. Nandini',
    uhid: 'UHID-NEX-8841',
    flag: 'Post-op instability · Day 7 laparoscopic · wound dehiscence watch',
    priority: 'Critical',
  },
  {
    id: 'hr-3',
    name: 'Room 402 · IPD',
    uhid: 'UHID-NEX-4398',
    flag: 'Hb panic 6.2 g/dL · transfusion protocol active',
    priority: 'Critical',
  },
  {
    id: 'hr-4',
    name: 'S. Lakshmi',
    uhid: 'UHID-NEX-9018',
    flag: 'Uncontrolled diabetic profile · HbA1c 9.4% · renal monitoring',
    priority: 'Elevated',
  },
];

const TIMELINE_BY_PATIENT: Record<string, TimelineEvent[]> = {
  'p-1': [
    {
      id: 't-1',
      date: '14 Jul 2026',
      category: 'Consultation',
      detail: 'Intake teleconsult · lipid panel review · Dr. Aishwarya D S',
    },
    {
      id: 't-2',
      date: '12 Jul 2026',
      category: 'Diagnostic',
      detail: 'HbA1c 6.8% · within target · lab verified',
    },
    {
      id: 't-3',
      date: '05 Jul 2026',
      category: 'Prescription',
      detail: 'Metformin 500 mg BID · e-prescribe released',
    },
    {
      id: 't-4',
      date: '02 Jul 2026',
      category: 'Consultation',
      detail: 'General medicine OPD · vitals stable',
    },
  ],
  'p-3': [
    {
      id: 't-5',
      date: '14 Jul 2026',
      category: 'Diagnostic',
      detail: 'ECG · orthostatic vitals · hypertensive crisis flagged',
    },
    {
      id: 't-6',
      date: '10 Jul 2026',
      category: 'Admission',
      detail: 'ED observation · chest pain protocol · Bay 3',
    },
    {
      id: 't-7',
      date: '08 Jul 2026',
      category: 'Consultation',
      detail: 'Cardiology referral · syncope workup initiated',
    },
  ],
  'p-4': [
    {
      id: 't-8',
      date: '13 Jul 2026',
      category: 'Consultation',
      detail: 'Post-operative wound check · suture integrity OK',
    },
    {
      id: 't-9',
      date: '06 Jul 2026',
      category: 'Admission',
      detail: 'Laparoscopic cholecystectomy · OT-2 · discharge Day 7',
    },
    {
      id: 't-10',
      date: '05 Jul 2026',
      category: 'Prescription',
      detail: 'Analgesic protocol · antibiotic course released',
    },
  ],
  'p-7': [
    {
      id: 't-11',
      date: '13 Jul 2026',
      category: 'Admission',
      detail: 'IPD admission · Wing B · Room 402 · anemia protocol',
    },
    {
      id: 't-12',
      date: '13 Jul 2026',
      category: 'Diagnostic',
      detail: 'Hb 6.2 g/dL panic value · transfusion consent pending',
    },
    {
      id: 't-13',
      date: '12 Jul 2026',
      category: 'Consultation',
      detail: 'Hematology consult · iron studies ordered',
    },
  ],
};

const DEFAULT_TIMELINE: TimelineEvent[] = [
  {
    id: 't-default',
    date: '—',
    category: 'Consultation',
    detail: 'Select a patient to load longitudinal chart timeline',
  },
];

const CATEGORY_STYLES: Record<TimelineEvent['category'], string> = {
  Admission: 'border border-[#00758C]/20 bg-[#00758C]/5 text-[#00758C]',
  Consultation: 'border border-[#008588]/20 bg-[#008588]/5 text-[#008588]',
  Prescription: 'border border-[#5EC283]/30 bg-[#5EC283]/10 text-[#00758C]',
  Diagnostic: 'border border-[#00A481]/20 bg-[#00A481]/10 text-[#00A481]',
};

function formatSyncTimestamp(): string {
  return new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ClientMounted({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return fallback;
  return children;
}

function RegistryLoadingShell() {
  return (
    <div className="min-h-screen w-full space-y-6 bg-slate-50/50 p-6 font-sans text-slate-950">
      <h1 className="text-2xl font-black text-[#00758C]">
        Electronic Medical Registry &amp; Patient Roster
      </h1>
      <p className="text-sm font-medium text-slate-600">Loading patient index…</p>
      <div className="h-32 animate-pulse rounded-xl border border-slate-200/60 bg-white shadow-sm" />
    </div>
  );
}

function PatientRegistryContent() {
  const [searchName, setSearchName] = useState('');
  const [searchUhid, setSearchUhid] = useState('');
  const [activeTab, setActiveTab] = useState<RosterTab>('assigned');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('p-1');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [syncTimestamp, setSyncTimestamp] = useState('Syncing registry index…');

  useEffect(() => {
    setSyncTimestamp(formatSyncTimestamp());
  }, []);

  const filteredRoster = useMemo(() => {
    const nameQuery = searchName.trim().toLowerCase();
    const uhidQuery = searchUhid.trim().toLowerCase();

    return PATIENT_ROSTER.filter((patient) => {
      if (patient.roster !== activeTab) return false;
      if (nameQuery && !patient.name.toLowerCase().includes(nameQuery)) return false;
      if (uhidQuery && !patient.uhid.toLowerCase().includes(uhidQuery)) return false;
      return true;
    });
  }, [activeTab, searchName, searchUhid]);

  const selectedPatient = useMemo(
    () => PATIENT_ROSTER.find((p) => p.id === selectedPatientId) ?? PATIENT_ROSTER[0],
    [selectedPatientId],
  );

  const activeTimeline = useMemo(
    () => TIMELINE_BY_PATIENT[selectedPatientId] ?? DEFAULT_TIMELINE,
    [selectedPatientId],
  );

  const tabCounts = useMemo(() => {
    const counts: Record<RosterTab, number> = {
      assigned: 0,
      recent: 0,
      followup: 0,
      admitted: 0,
    };
    PATIENT_ROSTER.forEach((p) => {
      counts[p.roster] += 1;
    });
    return counts;
  }, []);

  const showNotice = useCallback((message: string) => {
    setActionNotice(message);
    window.setTimeout(() => setActionNotice(null), 4000);
  }, []);

  const handleOpenTimeline = useCallback(
    (patient: PatientRecord) => {
      setSelectedPatientId(patient.id);
      showNotice(`Chart timeline loaded · ${patient.name} · ${patient.uhid}`);
    },
    [showNotice],
  );

  return (
    <div className="min-h-screen w-full space-y-6 bg-slate-50/50 p-6 font-sans text-slate-950">
      {/* Command center header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#00758C]">
            Electronic Medical Registry &amp; Patient Roster
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Continuous EMR sync · last update {syncTimestamp} · {PATIENT_ROSTER.length} indexed
            records · Dr. Aishwarya D S, MD
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-[#00A481]/20 bg-[#00A481]/10 px-4 py-2 text-xs font-bold text-[#00A481]">
          <Activity className="h-4 w-4" aria-hidden />
          LIVE_INDEX_SYNC
        </div>
      </header>

      {actionNotice ? (
        <p className="rounded-xl border border-[#008588]/20 bg-[#008588]/5 px-4 py-2 text-sm font-bold text-[#008588]">
          {actionNotice}
        </p>
      ) : null}

      {/* Dual-vector search panel */}
      <section aria-label="Patient search toolbar" className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label htmlFor="search-name" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Search by Patient Name / Keyword
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#008588]"
              aria-hidden
            />
            <input
              id="search-name"
              type="search"
              value={searchName}
              onChange={(event) => setSearchName(event.target.value)}
              placeholder="Enter patient name or clinical keyword…"
              aria-label="Search by patient name or keyword"
              className={INPUT_CLASS}
            />
          </div>
        </div>
        <div>
          <label htmlFor="search-uhid" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Search by UHID Token
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#008588]"
              aria-hidden
            />
            <input
              id="search-uhid"
              type="search"
              value={searchUhid}
              onChange={(event) => setSearchUhid(event.target.value)}
              placeholder="UHID-NEX-XXXX"
              aria-label="Search by UHID token"
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </section>

      {/* High-risk urgency dashboard */}
      <section aria-label="High-risk monitoring deck" className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-rose-600" aria-hidden />
          <h2 className="text-sm font-black uppercase tracking-wider text-rose-700">
            High-Risk Urgency Dashboard
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-4">
          {HIGH_RISK_REGISTRY.map((entry) => (
            <div key={entry.id} className={HIGH_RISK_CARD_CLASS}>
              <div>
                <p className="text-sm font-black">{entry.name}</p>
                <p className="font-mono text-[10px]">{entry.uhid}</p>
                <p className="mt-1 font-medium leading-snug">{entry.flag}</p>
              </div>
              <span className="shrink-0 rounded-md border border-rose-500/30 bg-rose-500/20 px-2 py-0.5 text-[10px] font-black uppercase">
                {entry.priority}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Patient workspace grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,60fr)_minmax(0,40fr)]">
        {/* Left — segmented roster (60%) */}
        <section aria-label="Segmented medical roster" className={PANEL_CLASS}>
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#008588]" aria-hidden />
            <h2 className="text-lg font-black text-[#00758C]">Segmented Medical Roster</h2>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {(Object.keys(TAB_LABELS) as RosterTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTab === tab
                    ? 'border-[#00758C] bg-[#00758C] text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-[#008588]/30 hover:text-[#00758C]'
                }`}
              >
                {TAB_LABELS[tab]} ({tabCounts[tab]})
              </button>
            ))}
          </div>

          <ul className="space-y-3">
            {filteredRoster.length === 0 ? (
              <li className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-6 text-center text-sm font-medium text-slate-600">
                No patients match the active filter or search criteria.
              </li>
            ) : (
              filteredRoster.map((patient) => {
                const isSelected = patient.id === selectedPatientId;
                return (
                  <li
                    key={patient.id}
                    className={`rounded-xl border p-4 transition-all ${
                      isSelected
                        ? 'border-[#008588]/40 bg-[#008588]/5 ring-1 ring-[#008588]/20'
                        : 'border-slate-200/60 bg-white'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-[#00758C]">{patient.name}</p>
                        <p className="text-xs font-bold text-slate-600">{patient.ageGender}</p>
                        <p className="mt-1 font-mono text-[10px] font-black text-[#008588]">
                          {patient.uhid}
                        </p>
                        {patient.wingRoom ? (
                          <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[#5EC283]">
                            <BedDouble className="h-3 w-3" aria-hidden />
                            {patient.wingRoom}
                          </p>
                        ) : null}
                        {patient.lastSeen ? (
                          <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                            Last consulted {patient.lastSeen}
                          </p>
                        ) : null}
                        {patient.followUpDue ? (
                          <p className="mt-0.5 text-[10px] font-bold text-amber-800">
                            Follow-up due {patient.followUpDue}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenTimeline(patient)}
                        className="cursor-pointer rounded-lg bg-[#00758C] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-colors hover:bg-[#008588]"
                      >
                        Open Chart Timeline
                      </button>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </section>

        {/* Right — longitudinal timeline (40%) */}
        <aside aria-label="Patient chart timeline spine" className={PANEL_CLASS}>
          <div className="mb-4 flex items-center gap-2">
            <FileClock className="h-5 w-5 text-[#008588]" aria-hidden />
            <h2 className="text-base font-black text-[#00758C]">Patient Chart Timeline</h2>
          </div>

          <div className="mb-4 rounded-xl border border-[#008588]/20 bg-[#008588]/5 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#008588]">
              Active Timeline Context
            </p>
            <p className="mt-1 text-sm font-black text-[#00758C]">{selectedPatient.name}</p>
            <p className="font-mono text-[10px] font-bold text-[#008588]">{selectedPatient.uhid}</p>
          </div>

          <div className="relative pl-6">
            <span
              className="absolute left-3 top-2 h-[calc(100%-0.5rem)] border-l-2 border-[#5EC283]/40"
              aria-hidden
            />
            <ul className="space-y-4">
              {activeTimeline.map((event) => (
                <li key={event.id} className="relative">
                  <span
                    className="absolute -left-[15px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#5EC283] bg-white"
                    aria-hidden
                  />
                  <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-black text-[#00758C]">{event.date}</span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${CATEGORY_STYLES[event.category]}`}
                      >
                        {event.category}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium leading-snug text-slate-700">
                      {event.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function PatientRegistryPage() {
  return (
    <ClientMounted fallback={<RegistryLoadingShell />}>
      <PatientRegistryContent />
    </ClientMounted>
  );
}
